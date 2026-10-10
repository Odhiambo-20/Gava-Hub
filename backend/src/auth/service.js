import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, newId, now } from '../database/index.js';
import { securityConfig } from '../config/security.js';
import { AppError, assert } from '../utils/errors.js';
import { expiresAtFromTtl } from '../utils/time.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const rolesForAccountType = () => ['ROLE_USER'];

async function withRoles(user, client = db) {
  if (!user) return null;
  const { rows } = await client.raw('SELECT role FROM gavahub.user_role WHERE user_id = $1 ORDER BY role', [user.id]);
  return { ...user, roles: rows.map((row) => row.role) };
}

export function issueTokenResponse(user) {
  const accessToken = jwt.sign({ sub: user.id, email: user.email, roles: user.roles || ['ROLE_USER'] }, securityConfig.effectiveSecret, { expiresIn: securityConfig.jwtTtl, issuer: securityConfig.jwtIssuer });
  return { accessToken, tokenType: 'Bearer', expiresAt: expiresAtFromTtl(securityConfig.jwtTtl), userId: user.id, roles: user.roles || ['ROLE_USER'] };
}

export async function registerUser(body = {}) {
  const email = normalizeEmail(body.email);
  const password = body.password;
  const displayName = String(body.displayName || '').trim();
  const phoneNumber = body.phoneNumber ? String(body.phoneNumber).trim() : null;
  const accountType = String(body.accountType || '').toUpperCase();
  const violations = {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) violations.email = 'A valid email is required';
  if (!password || String(password).length < 10) violations.password = 'Password must be at least 10 characters';
  if (!displayName || displayName.length < 2) violations.displayName = 'Display name is required';
  if (!['CANDIDATE', 'EMPLOYER', 'INSTITUTION'].includes(accountType)) violations.accountType = 'accountType must be CANDIDATE, EMPLOYER or INSTITUTION';
  if (Object.keys(violations).length) throw new AppError(Object.values(violations)[0], 400, violations);

  const user = { id: newId(), email, displayName, phoneNumber, passwordHash: await bcrypt.hash(String(password), securityConfig.bcryptRounds), status: 'ACTIVE', accountType, createdAt: now(), updatedAt: now() };
  let result;
  try {
    result = await db.transaction(async (tx) => {
    if (await tx.find('users', 'email', email)) throw new AppError('Email already exists', 409);
    const created = await tx.insert('users', user);
    for (const role of rolesForAccountType(accountType)) await tx.raw('INSERT INTO gavahub.user_role (user_id, role) VALUES ($1, $2)', [created.id, role]);
    if (accountType === 'CANDIDATE') {
      const parts = displayName.split(/\s+/);
      await tx.insert('candidates', { id: newId(), userId: created.id, givenName: parts[0] || displayName, familyName: parts.slice(1).join(' ') || displayName, headline: null, profileStatus: 'DRAFT', createdAt: now(), updatedAt: now() });
    } else {
      const orgId = newId();
      await tx.insert('organizations', { id: orgId, legalName: displayName, tradingName: null, organizationType: accountType, status: 'ACTIVE', ownerUserId: created.id, createdAt: now(), updatedAt: now() });
      await tx.insert('organizationMembers', { organizationId: orgId, userId: created.id, email, displayName, memberRole: 'OWNER', status: 'ACTIVE', joinedAt: now() });
    }
    return created;
    });
  } catch (error) {
    if (error.code === '23505') throw new AppError('Email already exists', 409);
    throw error;
  }
  return withRoles(result);
}

export async function authenticateUser({ email, password } = {}) {
  const user = await withRoles(await db.find('users', 'email', normalizeEmail(email)));
  const ok = user && user.status === 'ACTIVE' && await bcrypt.compare(String(password || ''), user.passwordHash || '');
  if (!ok) throw new AppError('Invalid email or password', 401);
  return user;
}

export function publicUser(user) {
  return { id: user.id, email: user.email, displayName: user.displayName, status: user.status, createdAt: user.createdAt };
}

export async function getUserById(id) { return withRoles(await db.find('users', 'id', id)); }

export async function grantRole(userId, role) {
  const allowed = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_VERIFIER'];
  assert(allowed.includes(role), `role must be one of ${allowed.join(', ')}`, 400);
  return db.transaction(async (tx) => {
    const user = await tx.find('users', 'id', userId);
    assert(user, 'User not found', 404);
    await tx.raw('INSERT INTO gavahub.user_role (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, role]);
    await tx.update('users', userId, { updatedAt: now() });
    return withRoles(await tx.find('users', 'id', userId), tx);
  });
}

export async function revokeRole(userId, role) {
  return db.transaction(async (tx) => {
    const user = await tx.find('users', 'id', userId);
    assert(user, 'User not found', 404);
    await tx.raw('DELETE FROM gavahub.user_role WHERE user_id = $1 AND role = $2', [userId, role]);
    const { rows } = await tx.raw('SELECT count(*)::int AS n FROM gavahub.user_role WHERE user_id = $1', [userId]);
    if (rows[0].n === 0) await tx.raw('INSERT INTO gavahub.user_role (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, 'ROLE_USER']);
    await tx.update('users', userId, { updatedAt: now() });
    return withRoles(await tx.find('users', 'id', userId), tx);
  });
}

export async function updateUser(userId, { displayName, status } = {}) {
  const user = await getUserById(userId);
  assert(user, 'User not found', 404);
  const patch = { updatedAt: now() };
  if (displayName !== undefined) { assert(String(displayName).trim().length >= 2, 'Display name is required', 400); patch.displayName = String(displayName).trim(); }
  if (status !== undefined) { assert(['ACTIVE', 'SUSPENDED', 'DISABLED'].includes(status), 'Invalid status', 400); patch.status = status; }
  return withRoles(await db.update('users', userId, patch));
}

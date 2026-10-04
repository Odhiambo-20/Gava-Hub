import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { stores, newId, now } from '../database/index.js';
import { securityConfig } from '../config/security.js';
import { AppError, assert } from '../utils/errors.js';
import { expiresAtFromTtl } from '../utils/time.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

/** Map registration accountType → initial JWT roles (FE Role union). */
function rolesForAccountType(accountType) {
  const roles = ['ROLE_USER'];
  // Account type is stored on the user; roles stay within FE Role union.
  // Admins/verifiers are granted later via /users/:id/roles.
  void accountType;
  return roles;
}

export function issueTokenResponse(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles || ['ROLE_USER'],
    },
    securityConfig.effectiveSecret,
    {
      expiresIn: securityConfig.jwtTtl,
      issuer: securityConfig.jwtIssuer,
    },
  );
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresAt: expiresAtFromTtl(securityConfig.jwtTtl),
    userId: user.id,
    roles: user.roles || ['ROLE_USER'],
  };
}

export async function registerUser(body = {}) {
  const email = normalizeEmail(body.email);
  const password = body.password;
  const displayName = String(body.displayName || '').trim();
  const phoneNumber = body.phoneNumber ? String(body.phoneNumber).trim() : null;
  const accountType = String(body.accountType || '').toUpperCase();

  const violations = {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) violations.email = 'A valid email is required';
  if (!password || String(password).length < 10)
    violations.password = 'Password must be at least 10 characters';
  if (!displayName || displayName.length < 2) violations.displayName = 'Display name is required';
  if (!['CANDIDATE', 'EMPLOYER', 'INSTITUTION'].includes(accountType)) {
    violations.accountType = 'accountType must be CANDIDATE, EMPLOYER or INSTITUTION';
  }
  if (Object.keys(violations).length) {
    throw new AppError(Object.values(violations)[0], 400, violations);
  }
  if (stores.users.some((u) => u.email === email)) {
    throw new AppError('Email already exists', 409);
  }

  const user = {
    id: newId(),
    email,
    displayName,
    phoneNumber,
    passwordHash: await bcrypt.hash(String(password), securityConfig.bcryptRounds),
    roles: rolesForAccountType(accountType),
    status: 'ACTIVE',
    accountType,
    createdAt: now(),
    updatedAt: now(),
  };
  stores.users.push(user);

  if (accountType === 'CANDIDATE') {
    const parts = displayName.split(/\s+/);
    stores.candidates.push({
      id: newId(),
      userId: user.id,
      givenName: parts[0] || displayName,
      familyName: parts.slice(1).join(' ') || displayName,
      headline: null,
      profileStatus: 'DRAFT',
      createdAt: now(),
      updatedAt: now(),
    });
  }

  if (accountType === 'EMPLOYER' || accountType === 'INSTITUTION') {
    const orgId = newId();
    stores.organizations.push({
      id: orgId,
      legalName: displayName,
      tradingName: null,
      organizationType: accountType,
      status: 'ACTIVE',
      ownerUserId: user.id,
      createdAt: now(),
      updatedAt: now(),
    });
    stores.organizationMembers.push({
      organizationId: orgId,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      memberRole: 'OWNER',
      status: 'ACTIVE',
      joinedAt: now(),
    });
  }

  return user;
}

export async function authenticateUser({ email, password } = {}) {
  const user = stores.users.find((u) => u.email === normalizeEmail(email));
  const ok =
    user &&
    user.status === 'ACTIVE' &&
    (await bcrypt.compare(String(password || ''), user.passwordHash || ''));
  if (!ok) throw new AppError('Invalid email or password', 401);
  return user;
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export function getUserById(id) {
  return stores.users.find((u) => u.id === id) || null;
}

export function grantRole(userId, role) {
  const allowed = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_VERIFIER'];
  assert(allowed.includes(role), `role must be one of ${allowed.join(', ')}`, 400);
  const user = getUserById(userId);
  assert(user, 'User not found', 404);
  if (!user.roles.includes(role)) {
    user.roles = [...user.roles, role];
    user.updatedAt = now();
  }
  return user;
}

export function revokeRole(userId, role) {
  const user = getUserById(userId);
  assert(user, 'User not found', 404);
  user.roles = (user.roles || []).filter((r) => r !== role);
  if (!user.roles.length) user.roles = ['ROLE_USER'];
  user.updatedAt = now();
  return user;
}

export function updateUser(userId, { displayName, status } = {}) {
  const user = getUserById(userId);
  assert(user, 'User not found', 404);
  if (displayName !== undefined) {
    assert(String(displayName).trim().length >= 2, 'Display name is required', 400);
    user.displayName = String(displayName).trim();
  }
  if (status !== undefined) {
    assert(['ACTIVE', 'SUSPENDED', 'DISABLED'].includes(status), 'Invalid status', 400);
    user.status = status;
  }
  user.updatedAt = now();
  return user;
}

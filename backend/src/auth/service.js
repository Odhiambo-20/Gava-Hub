import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { stores, newId, now } from '../database/index.js';
import { securityConfig } from '../config/security.js';

const secret = () => securityConfig.jwtSecret || 'local-development-secret-change-me';
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, roles: user.roles || ['USER'] }, secret(), { expiresIn: securityConfig.jwtTtl, issuer: securityConfig.jwtIssuer });
}

export async function registerUser({ email, password, displayName, phone, role = 'USER' }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !/^\\S+@\\S+\\.\\S+$/.test(normalized)) throw new Error('A valid email is required');
  if (!password || String(password).length < 10) throw new Error('Password must be at least 10 characters');
  if (!displayName || String(displayName).trim().length < 2) throw new Error('Display name is required');
  if (stores.users.some((user) => user.email === normalized)) { const error = new Error('Email already exists'); error.status = 409; throw error; }
  const user = { id: newId(), email: normalized, displayName: String(displayName).trim(), phone: phone || null, passwordHash: await bcrypt.hash(password, 12), roles: [role], status: 'ACTIVE', createdAt: now(), updatedAt: now() };
  stores.users.push(user);
  return user;
}

export async function authenticateUser({ email, password }) {
  const user = stores.users.find((entry) => entry.email === normalizeEmail(email));
  if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(String(password || ''), user.passwordHash || ''))) { const error = new Error('Invalid email or password'); error.status = 401; throw error; }
  return user;
}

export const publicUser = (user) => ({ id: user.id, userId: user.id, email: user.email, displayName: user.displayName, phone: user.phone, status: user.status, roles: user.roles, createdAt: user.createdAt });

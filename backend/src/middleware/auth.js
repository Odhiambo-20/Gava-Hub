import jwt from 'jsonwebtoken';
import { securityConfig } from '../config/security.js';
import { AppError } from '../utils/errors.js';
import { stores } from '../database/index.js';

export function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  try {
    const payload = jwt.verify(header.slice(7), securityConfig.effectiveSecret, {
      issuer: securityConfig.jwtIssuer,
    });
    const user = stores.users.find((u) => u.id === payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      return next(new AppError('Invalid or expired token', 401));
    }
    req.user = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
      displayName: user.displayName,
    };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

/** Optional auth — attaches user if token present, never fails. */
export function optionalAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), securityConfig.effectiveSecret, {
      issuer: securityConfig.jwtIssuer,
    });
    const user = stores.users.find((u) => u.id === payload.sub && u.status === 'ACTIVE');
    if (user) {
      req.user = {
        sub: user.id,
        email: user.email,
        roles: user.roles || [],
        displayName: user.displayName,
      };
    }
  } catch {
    // ignore
  }
  next();
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    const userRoles = req.user.roles || [];
    if (!roles.some((r) => userRoles.includes(r))) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

export const isAdmin = (user) => (user?.roles || []).includes('ROLE_ADMIN');
export const isVerifier = (user) =>
  (user?.roles || []).some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_VERIFIER');

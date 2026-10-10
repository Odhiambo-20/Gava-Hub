import jwt from 'jsonwebtoken';
import { securityConfig } from '../config/security.js';
import { AppError } from '../utils/errors.js';
import { db } from '../database/index.js';

export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  try {
    const payload = jwt.verify(header.slice(7), securityConfig.effectiveSecret, {
      issuer: securityConfig.jwtIssuer,
    });
    const user = await db.find('users', 'id', payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      return next(new AppError('Invalid or expired token', 401));
    }
    const { rows } = await db.raw('SELECT role FROM gavahub.user_role WHERE user_id = $1 ORDER BY role', [user.id]);
    req.user = {
      sub: user.id,
      email: user.email,
      roles: rows.map((row) => row.role),
      displayName: user.displayName,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return next(new AppError('Invalid or expired token', 401));
    next(error);
  }
}

/** Optional auth — attaches user if token present, never fails. */
export async function optionalAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), securityConfig.effectiveSecret, {
      issuer: securityConfig.jwtIssuer,
    });
    const user = await db.find('users', 'id', payload.sub);
    const { rows } = user?.status === 'ACTIVE' ? await db.raw('SELECT role FROM gavahub.user_role WHERE user_id = $1 ORDER BY role', [user.id]) : { rows: [] };
    if (user) {
      req.user = {
        sub: user.id,
        email: user.email,
        roles: rows.map((row) => row.role),
        displayName: user.displayName,
      };
    }
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') return next(error);
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

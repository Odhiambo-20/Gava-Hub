import { requireAuth, requireRoles, isAdmin } from '../middleware/auth.js';
import {
  publicUser,
  getUserById,
  updateUser,
  grantRole,
  revokeRole,
} from '../auth/service.js';
import { db } from '../database/index.js';
import { AppError } from '../utils/errors.js';

export function registerUsers(app, prefix) {
  // Admin: list all users
  app.get(`${prefix}/users`, requireAuth, requireRoles('ROLE_ADMIN'), async (_req, res, next) => {
    try { res.json((await db.list('users', { orderBy: 'createdAt', desc: true })).map(publicUser)); } catch (e) { next(e); }
  });

  // Get one user (self or admin)
  app.get(`${prefix}/users/:id`, requireAuth, async (req, res, next) => {
    try {
      if (req.params.id !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const user = await getUserById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      res.json(publicUser(user));
    } catch (e) {
      next(e);
    }
  });

  // Update profile (self or admin)
  app.put(`${prefix}/users/:id`, requireAuth, async (req, res, next) => {
    try {
      if (req.params.id !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const user = await updateUser(req.params.id, req.body || {});
      res.json(publicUser(user));
    } catch (e) {
      next(e);
    }
  });

  // Roles
  app.get(`${prefix}/users/:id/roles`, requireAuth, async (req, res, next) => {
    try {
      if (req.params.id !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const user = await getUserById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      res.json(user.roles || []);
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/users/:id/roles`, requireAuth, requireRoles('ROLE_ADMIN'), async (req, res, next) => {
    try {
      const role = req.body?.role;
      if (!role) throw new AppError('role is required', 400);
      const user = await grantRole(req.params.id, role);
      res.json(publicUser(user));
    } catch (e) {
      next(e);
    }
  });

  app.delete(
    `${prefix}/users/:id/roles/:role`,
    requireAuth,
    requireRoles('ROLE_ADMIN'),
    async (req, res, next) => {
      try {
        await revokeRole(req.params.id, req.params.role);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },
  );
}

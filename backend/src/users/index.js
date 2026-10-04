import { requireAuth, requireRoles, isAdmin } from '../middleware/auth.js';
import {
  publicUser,
  getUserById,
  updateUser,
  grantRole,
  revokeRole,
} from '../auth/service.js';
import { stores } from '../database/index.js';
import { AppError } from '../utils/errors.js';

export function registerUsers(app, prefix) {
  // Admin: list all users
  app.get(`${prefix}/users`, requireAuth, requireRoles('ROLE_ADMIN'), (_req, res) => {
    res.json(stores.users.map(publicUser));
  });

  // Get one user (self or admin)
  app.get(`${prefix}/users/:id`, requireAuth, (req, res, next) => {
    try {
      if (req.params.id !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const user = getUserById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      res.json(publicUser(user));
    } catch (e) {
      next(e);
    }
  });

  // Update profile (self or admin)
  app.put(`${prefix}/users/:id`, requireAuth, (req, res, next) => {
    try {
      if (req.params.id !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const user = updateUser(req.params.id, req.body || {});
      res.json(publicUser(user));
    } catch (e) {
      next(e);
    }
  });

  // Roles
  app.get(`${prefix}/users/:id/roles`, requireAuth, (req, res, next) => {
    try {
      if (req.params.id !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const user = getUserById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      res.json(user.roles || []);
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/users/:id/roles`, requireAuth, requireRoles('ROLE_ADMIN'), (req, res, next) => {
    try {
      const role = req.body?.role;
      if (!role) throw new AppError('role is required', 400);
      const user = grantRole(req.params.id, role);
      res.json(publicUser(user));
    } catch (e) {
      next(e);
    }
  });

  app.delete(
    `${prefix}/users/:id/roles/:role`,
    requireAuth,
    requireRoles('ROLE_ADMIN'),
    (req, res, next) => {
      try {
        revokeRole(req.params.id, req.params.role);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },
  );
}

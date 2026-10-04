import { requireAuth, isAdmin } from '../middleware/auth.js';
import { stores, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toCandidate(c) {
  return {
    id: c.id,
    userId: c.userId,
    givenName: c.givenName,
    familyName: c.familyName,
    headline: c.headline || undefined,
    profileStatus: c.profileStatus,
    createdAt: c.createdAt,
  };
}

export function registerCandidates(app, prefix) {
  app.get(`${prefix}/candidates`, requireAuth, (req, res) => {
    let list = stores.candidates;
    if (req.query.userId) {
      // Users may only query their own unless admin
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      list = list.filter((c) => c.userId === req.query.userId);
    } else if (!isAdmin(req.user) && !req.user.roles.includes('ROLE_VERIFIER')) {
      list = list.filter((c) => c.userId === req.user.sub);
    }
    res.json(list.map(toCandidate));
  });

  app.get(`${prefix}/candidates/:id`, requireAuth, (req, res, next) => {
    try {
      const c = stores.candidates.find((x) => x.id === req.params.id);
      if (!c) throw new AppError('Candidate not found', 404);
      if (c.userId !== req.user.sub && !isAdmin(req.user) && !req.user.roles.includes('ROLE_VERIFIER')) {
        throw new AppError('Insufficient permissions', 403);
      }
      res.json(toCandidate(c));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/candidates`, requireAuth, (req, res, next) => {
    try {
      const body = req.body || {};
      const userId = body.userId || req.user.sub;
      if (userId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      assert(body.givenName && body.familyName, 'givenName and familyName are required');
      const candidate = {
        id: newId(),
        userId,
        givenName: String(body.givenName).trim(),
        familyName: String(body.familyName).trim(),
        headline: body.headline ? String(body.headline).trim() : null,
        profileStatus: body.profileStatus || 'DRAFT',
        createdAt: now(),
        updatedAt: now(),
      };
      stores.candidates.push(candidate);
      res.status(201).json(toCandidate(candidate));
    } catch (e) {
      next(e);
    }
  });

  app.put(`${prefix}/candidates/:id`, requireAuth, (req, res, next) => {
    try {
      const c = stores.candidates.find((x) => x.id === req.params.id);
      if (!c) throw new AppError('Candidate not found', 404);
      if (c.userId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      if (body.givenName !== undefined) c.givenName = String(body.givenName).trim();
      if (body.familyName !== undefined) c.familyName = String(body.familyName).trim();
      if (body.headline !== undefined) c.headline = body.headline ? String(body.headline).trim() : null;
      if (body.profileStatus !== undefined) c.profileStatus = body.profileStatus;
      c.updatedAt = now();
      res.json(toCandidate(c));
    } catch (e) {
      next(e);
    }
  });
}

import { requireAuth, isAdmin } from '../middleware/auth.js';
import { stores, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';
import { getUserById } from '../auth/service.js';

function toOrg(o) {
  return {
    id: o.id,
    legalName: o.legalName,
    tradingName: o.tradingName || undefined,
    organizationType: o.organizationType,
    status: o.status,
    createdAt: o.createdAt,
  };
}

function memberOf(orgId, userId) {
  return stores.organizationMembers.some(
    (m) => m.organizationId === orgId && m.userId === userId && m.status === 'ACTIVE',
  );
}

function toMember(m) {
  return {
    organizationId: m.organizationId,
    userId: m.userId,
    email: m.email,
    displayName: m.displayName,
    memberRole: m.memberRole,
    status: m.status,
    joinedAt: m.joinedAt || undefined,
  };
}

export function registerOrganizations(app, prefix) {
  app.get(`${prefix}/organizations`, requireAuth, (req, res) => {
    let list = stores.organizations;
    if (req.query.userId) {
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      const orgIds = new Set(
        stores.organizationMembers
          .filter((m) => m.userId === req.query.userId && m.status === 'ACTIVE')
          .map((m) => m.organizationId),
      );
      list = list.filter((o) => orgIds.has(o.id) || o.ownerUserId === req.query.userId);
    } else if (!isAdmin(req.user)) {
      const orgIds = new Set(
        stores.organizationMembers
          .filter((m) => m.userId === req.user.sub && m.status === 'ACTIVE')
          .map((m) => m.organizationId),
      );
      list = list.filter((o) => orgIds.has(o.id) || o.ownerUserId === req.user.sub);
    }
    res.json(list.map(toOrg));
  });

  app.get(`${prefix}/organizations/:id`, requireAuth, (req, res, next) => {
    try {
      const o = stores.organizations.find((x) => x.id === req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && !memberOf(o.id, req.user.sub) && o.ownerUserId !== req.user.sub) {
        throw new AppError('Insufficient permissions', 403);
      }
      res.json(toOrg(o));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/organizations`, requireAuth, (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.legalName, 'legalName is required');
      const org = {
        id: newId(),
        legalName: String(body.legalName).trim(),
        tradingName: body.tradingName ? String(body.tradingName).trim() : null,
        organizationType: body.organizationType || 'EMPLOYER',
        status: 'ACTIVE',
        ownerUserId: req.user.sub,
        createdAt: now(),
        updatedAt: now(),
      };
      stores.organizations.push(org);
      stores.organizationMembers.push({
        organizationId: org.id,
        userId: req.user.sub,
        email: req.user.email,
        displayName: req.user.displayName,
        memberRole: 'OWNER',
        status: 'ACTIVE',
        joinedAt: now(),
      });
      res.status(201).json(toOrg(org));
    } catch (e) {
      next(e);
    }
  });

  app.put(`${prefix}/organizations/:id`, requireAuth, (req, res, next) => {
    try {
      const o = stores.organizations.find((x) => x.id === req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && o.ownerUserId !== req.user.sub && !memberOf(o.id, req.user.sub)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      if (body.legalName !== undefined) o.legalName = String(body.legalName).trim();
      if (body.tradingName !== undefined)
        o.tradingName = body.tradingName ? String(body.tradingName).trim() : null;
      if (body.organizationType !== undefined) o.organizationType = body.organizationType;
      if (body.status !== undefined) o.status = body.status;
      o.updatedAt = now();
      res.json(toOrg(o));
    } catch (e) {
      next(e);
    }
  });

  app.get(`${prefix}/organizations/:id/members`, requireAuth, (req, res, next) => {
    try {
      const o = stores.organizations.find((x) => x.id === req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && !memberOf(o.id, req.user.sub) && o.ownerUserId !== req.user.sub) {
        throw new AppError('Insufficient permissions', 403);
      }
      const members = stores.organizationMembers.filter((m) => m.organizationId === o.id);
      res.json(members.map(toMember));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/organizations/:id/members`, requireAuth, (req, res, next) => {
    try {
      const o = stores.organizations.find((x) => x.id === req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && o.ownerUserId !== req.user.sub) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      assert(body.userId || body.email, 'userId or email is required');
      let target = body.userId ? getUserById(body.userId) : null;
      if (!target && body.email) {
        target = stores.users.find((u) => u.email === String(body.email).trim().toLowerCase());
      }
      assert(target, 'User not found', 404);

      const existing = stores.organizationMembers.find(
        (m) => m.organizationId === o.id && m.userId === target.id,
      );
      if (existing) {
        existing.status = 'ACTIVE';
        existing.memberRole = body.memberRole || existing.memberRole || 'MEMBER';
      } else {
        stores.organizationMembers.push({
          organizationId: o.id,
          userId: target.id,
          email: target.email,
          displayName: target.displayName,
          memberRole: body.memberRole || 'MEMBER',
          status: 'ACTIVE',
          joinedAt: now(),
        });
      }
      const members = stores.organizationMembers.filter((m) => m.organizationId === o.id);
      res.status(201).json(members.map(toMember));
    } catch (e) {
      next(e);
    }
  });
}

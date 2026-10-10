import { requireAuth, isAdmin } from '../middleware/auth.js';
import { db, newId, now } from '../database/index.js';
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

async function memberOf(orgId, userId) {
  const { rows } = await db.raw('SELECT 1 FROM gavahub.organization_member WHERE organization_id = $1 AND user_id = $2 AND status = \'ACTIVE\' LIMIT 1', [orgId, userId]);
  return rows.length > 0;
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
  app.get(`${prefix}/organizations`, requireAuth, async (req, res, next) => {
    try {
    let list;
    if (req.query.userId) {
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      const { rows } = await db.raw('SELECT o.* FROM gavahub.organization o LEFT JOIN gavahub.organization_member m ON m.organization_id=o.id AND m.user_id=$1 AND m.status=\'ACTIVE\' WHERE m.user_id IS NOT NULL OR o.owner_user_id=$1 ORDER BY o.created_at DESC', [req.query.userId]);
      list = rows.map((row) => Object.fromEntries(Object.entries(row).map(([k,v]) => [k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v])));
    } else if (!isAdmin(req.user)) {
      const { rows } = await db.raw('SELECT DISTINCT o.* FROM gavahub.organization o LEFT JOIN gavahub.organization_member m ON m.organization_id=o.id AND m.user_id=$1 AND m.status=\'ACTIVE\' WHERE m.user_id IS NOT NULL OR o.owner_user_id=$1 ORDER BY o.created_at DESC', [req.user.sub]);
      list = rows.map((row) => Object.fromEntries(Object.entries(row).map(([k,v]) => [k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v])));
    }
    if (!list) list = await db.list('organizations', { orderBy: 'createdAt', desc: true });
    res.json(list.map(toOrg));
    } catch(e) { next(e); }
  });

  app.get(`${prefix}/organizations/:id`, requireAuth, async (req, res, next) => {
    try {
      const o = await db.find('organizations', 'id', req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && !await memberOf(o.id, req.user.sub) && o.ownerUserId !== req.user.sub) {
        throw new AppError('Insufficient permissions', 403);
      }
      res.json(toOrg(o));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/organizations`, requireAuth, async (req, res, next) => {
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
      await db.transaction(async (tx) => {
      await tx.insert('organizations', org);
      await tx.insert('organizationMembers', {
        organizationId: org.id,
        userId: req.user.sub,
        email: req.user.email,
        displayName: req.user.displayName,
        memberRole: 'OWNER',
        status: 'ACTIVE',
        joinedAt: now(),
      });
      });
      res.status(201).json(toOrg(org));
    } catch (e) {
      next(e);
    }
  });

  app.put(`${prefix}/organizations/:id`, requireAuth, async (req, res, next) => {
    try {
      const o = await db.find('organizations', 'id', req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && o.ownerUserId !== req.user.sub && !await memberOf(o.id, req.user.sub)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      const patch = { updatedAt: now() };
      if (body.legalName !== undefined) patch.legalName = String(body.legalName).trim();
      if (body.tradingName !== undefined) patch.tradingName = body.tradingName ? String(body.tradingName).trim() : null;
      if (body.organizationType !== undefined) patch.organizationType = body.organizationType;
      if (body.status !== undefined) patch.status = body.status;
      res.json(toOrg(await db.update('organizations', o.id, patch)));
    } catch (e) {
      next(e);
    }
  });

  app.get(`${prefix}/organizations/:id/members`, requireAuth, async (req, res, next) => {
    try {
      const o = await db.find('organizations', 'id', req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && !await memberOf(o.id, req.user.sub) && o.ownerUserId !== req.user.sub) {
        throw new AppError('Insufficient permissions', 403);
      }
      const members = await db.list('organizationMembers', { where: { organizationId: o.id } });
      res.json(members.map(toMember));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/organizations/:id/members`, requireAuth, async (req, res, next) => {
    try {
      const o = await db.find('organizations', 'id', req.params.id);
      if (!o) throw new AppError('Organization not found', 404);
      if (!isAdmin(req.user) && o.ownerUserId !== req.user.sub) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      assert(body.userId || body.email, 'userId or email is required');
      let target = body.userId ? await getUserById(body.userId) : null;
      if (!target && body.email) {
        target = await db.find('users', 'email', String(body.email).trim().toLowerCase());
      }
      assert(target, 'User not found', 404);

      const { rows: matches } = await db.raw('SELECT * FROM gavahub.organization_member WHERE organization_id=$1 AND user_id=$2', [o.id, target.id]);
      const found = matches[0];
      if (found) {
        await db.raw('UPDATE gavahub.organization_member SET status=$3, member_role=$4 WHERE organization_id=$1 AND user_id=$2', [o.id, target.id, 'ACTIVE', body.memberRole || found.member_role || 'MEMBER']);
      } else {
        await db.insert('organizationMembers', {
          organizationId: o.id,
          userId: target.id,
          email: target.email,
          displayName: target.displayName,
          memberRole: body.memberRole || 'MEMBER',
          status: 'ACTIVE',
          joinedAt: now(),
        });
      }
      const members = await db.list('organizationMembers', { where: { organizationId: o.id } });
      res.status(201).json(members.map(toMember));
    } catch (e) {
      next(e);
    }
  });
}

import { requireAuth, requireRoles } from '../middleware/auth.js';
import { db, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toAudit(e) {
  return {
    id: e.id,
    actorUserId: e.actorUserId || undefined,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId || undefined,
    outcome: e.outcome,
    requestId: e.requestId || undefined,
    occurredAt: e.occurredAt,
  };
}

export async function recordAudit(event) {
  assert(event.action, 'action is required');
  assert(event.resourceType, 'resourceType is required');
  const value = {
    id: newId(),
    actorUserId: event.actorUserId || null,
    actorOrganizationId: event.actorOrganizationId || null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId || null,
    outcome: event.outcome || 'SUCCESS',
    requestId: event.requestId || null,
    eventData: event.eventData || {},
    occurredAt: event.occurredAt || now(),
  };
  return db.insert('audit', value);
}

export function registerAudit(app, prefix) {
  app.get(`${prefix}/audit`, requireAuth, requireRoles('ROLE_ADMIN'), async (req, res, next) => {
    try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const clauses = [];
    const values = [];
    if (req.query.action) { values.push(req.query.action); clauses.push(`action=$${values.length}`); }
    if (req.query.resourceType) { values.push(req.query.resourceType); clauses.push(`resource_type=$${values.length}`); }
    values.push(limit);
    const { rows } = await db.raw(`SELECT * FROM gavahub.audit_event${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY occurred_at DESC LIMIT $${values.length}`, values);
    const list = rows.map((row) => Object.fromEntries(Object.entries(row).map(([k,v]) => [k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v])));
    res.json(list.map(toAudit));
    } catch(e) { next(e); }
  });

  app.post(`${prefix}/audit`, requireAuth, requireRoles('ROLE_ADMIN'), async (req, res, next) => {
    try {
      const event = await recordAudit({
        ...req.body,
        actorUserId: req.user?.sub || req.body?.actorUserId,
        requestId: req.id,
      });
      res.status(201).json(toAudit(event));
    } catch (e) {
      next(e);
    }
  });
}

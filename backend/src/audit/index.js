import { requireAuth, requireRoles } from '../middleware/auth.js';
import { stores, newId, now } from '../database/index.js';
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
  stores.audit.push(value);
  return value;
}

export function registerAudit(app, prefix) {
  app.get(`${prefix}/audit`, requireAuth, requireRoles('ROLE_ADMIN'), (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    let list = [...stores.audit];
    if (req.query.action) list = list.filter((e) => e.action === req.query.action);
    if (req.query.resourceType)
      list = list.filter((e) => e.resourceType === req.query.resourceType);
    list.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    res.json(list.slice(0, limit).map(toAudit));
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

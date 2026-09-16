import { pool, stores, newId, now } from '../database/index.js';

export async function recentAudit({ limit = 100, action, resourceType } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  if (pool) {
    const conditions = [];
    const values = [];
    if (action) { values.push(action); conditions.push(`action = $${values.length}`); }
    if (resourceType) { values.push(resourceType); conditions.push(`resource_type = $${values.length}`); }
    values.push(safeLimit);
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    const result = await pool.query(`select id, actor_user_id as "actorUserId", action, resource_type as "resourceType", resource_id as "resourceId", outcome, request_id as "requestId", occurred_at as "occurredAt" from gavahub.audit_event ${where} order by occurred_at desc limit $${values.length}`, values);
    return result.rows;
  }
  return stores.audit
    .filter((event) => (!action || event.action === action) && (!resourceType || event.resourceType === resourceType))
    .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
    .slice(0, safeLimit);
}

export async function recordAudit(event) {
  const value = { id: event.id || newId(), actorUserId: event.actorUserId || null, actorOrganizationId: event.actorOrganizationId || null, action: event.action, resourceType: event.resourceType, resourceId: event.resourceId || null, outcome: event.outcome || 'SUCCESS', requestId: event.requestId || null, eventData: event.eventData || {}, occurredAt: event.occurredAt || now() };
  if (!value.action || !value.resourceType) throw new Error('action and resourceType are required');
  if (pool) {
    await pool.query(`insert into gavahub.audit_event (id, actor_user_id, actor_organization_id, action, resource_type, resource_id, outcome, request_id, event_data, occurred_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`, [value.id, value.actorUserId, value.actorOrganizationId, value.action, value.resourceType, value.resourceId, value.outcome, value.requestId, JSON.stringify(value.eventData), value.occurredAt]);
  } else stores.audit.push(value);
  return value;
}

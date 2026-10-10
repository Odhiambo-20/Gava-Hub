import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

// All identifiers are fixed here; request data is only ever sent as SQL values.
const tables = {
  users: ['app_user', { displayName: 'display_name', phoneNumber: 'phone_number', passwordHash: 'password_hash', accountType: 'account_type', createdAt: 'created_at', updatedAt: 'updated_at' }],
  candidates: ['candidate_profile', { userId: 'user_id', givenName: 'given_name', familyName: 'family_name', dateOfBirth: 'date_of_birth', profileStatus: 'profile_status', createdAt: 'created_at', updatedAt: 'updated_at' }],
  organizations: ['organization', { legalName: 'legal_name', tradingName: 'trading_name', organizationType: 'organization_type', ownerUserId: 'owner_user_id', createdAt: 'created_at', updatedAt: 'updated_at' }],
  organizationMembers: ['organization_member', { organizationId: 'organization_id', userId: 'user_id', displayName: 'display_name', memberRole: 'member_role', joinedAt: 'joined_at' }],
  documents: ['document', { ownerUserId: 'owner_user_id', ownerOrganizationId: 'owner_organization_id', originalFilename: 'original_filename', contentType: 'content_type', sizeBytes: 'size_bytes', malwareScanStatus: 'malware_scan_status', storagePath: 'storage_path', createdAt: 'created_at', updatedAt: 'updated_at' }],
  credentials: ['credential', { candidateId: 'candidate_id', issuingOrganizationId: 'issuing_organization_id', credentialType: 'credential_type', credentialNumber: 'credential_number', issuedOn: 'issued_on', expiresOn: 'expires_on', createdAt: 'created_at', updatedAt: 'updated_at' }],
  verifications: ['verification', { referenceNumber: 'reference_number', candidateId: 'candidate_id', requestingOrganizationId: 'requesting_organization_id', submittedAt: 'submitted_at', completedAt: 'completed_at', createdByUserId: 'created_by_user_id', decisionNotes: 'decision_notes', decidedByUserId: 'decided_by_user_id', createdAt: 'created_at', updatedAt: 'updated_at' }],
  invoices: ['invoice', { invoiceNumber: 'invoice_number', billedUserId: 'billed_user_id', billedOrganizationId: 'billed_organization_id', dueAt: 'due_at', paidAt: 'paid_at', createdAt: 'created_at', updatedAt: 'updated_at' }],
  payments: ['payment', { invoiceId: 'invoice_id', userId: 'user_id', failureReason: 'failure_reason', phoneNumber: 'phone_number', providerRef: 'provider_ref', createdAt: 'created_at', updatedAt: 'updated_at' }],
  notifications: ['notification', { recipientUserId: 'recipient_user_id', templateCode: 'template_code', attemptCount: 'attempt_count', sentAt: 'sent_at', createdAt: 'created_at', updatedAt: 'updated_at' }],
  audit: ['audit_event', { actorUserId: 'actor_user_id', actorOrganizationId: 'actor_organization_id', resourceType: 'resource_type', resourceId: 'resource_id', requestId: 'request_id', eventData: 'event_data', occurredAt: 'occurred_at' }],
  contacts: ['contact_enquiry', { referenceNumber: 'reference_number', fullName: 'full_name', phoneNumber: 'phone_number', requesterType: 'requester_type', createdAt: 'created_at' }],
};

const snakeToCamel = (key) => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const mapRow = (row) => row && Object.fromEntries(Object.entries(row).map(([k, v]) => [snakeToCamel(k), v]));
const tableName = (entity) => {
  if (!tables[entity]) throw new Error(`Unknown database entity: ${entity}`);
  return `gavahub.${tables[entity][0]}`;
};
const columnName = (entity, key) => {
  if (key === 'roles') throw new Error('roles is a relation, not a user table column');
  const mapping = tables[entity][1];
  if (mapping[key]) return mapping[key];
  if (/^[a-z][A-Za-z0-9]*$/.test(key)) return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  throw new Error(`Unknown ${entity} field: ${key}`);
};

function database() {
  if (!pool) throw new Error('DATABASE_URL is required. Configure PostgreSQL before starting the API.');
  return pool;
}

async function queryOn(client, entity, action, args = {}) {
  const table = tableName(entity);
  if (action === 'list') {
    const values = [];
    const where = Object.entries(args.where || {}).map(([key, value]) => {
      values.push(value);
      return `${columnName(entity, key)} = $${values.length}`;
    });
    let sql = `SELECT * FROM ${table}${where.length ? ` WHERE ${where.join(' AND ')}` : ''}`;
    if (args.orderBy) sql += ` ORDER BY ${columnName(entity, args.orderBy)} ${args.desc ? 'DESC' : 'ASC'}`;
    if (args.limit) { values.push(args.limit); sql += ` LIMIT $${values.length}`; }
    const { rows } = await client.query(sql, values);
    return rows.map(mapRow);
  }
  if (action === 'find') {
    const { rows } = await client.query(`SELECT * FROM ${table} WHERE ${columnName(entity, args.key)} = $1 LIMIT 1`, [args.value]);
    return mapRow(rows[0]) || null;
  }
  if (action === 'insert') {
    const entries = Object.entries(args.value);
    const columns = entries.map(([key]) => columnName(entity, key));
    const values = entries.map(([, value]) => value);
    const marks = values.map((_, i) => `$${i + 1}`);
    const { rows } = await client.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${marks.join(', ')}) RETURNING *`, values);
    return mapRow(rows[0]);
  }
  if (action === 'update') {
    const entries = Object.entries(args.patch).filter(([key]) => key !== 'id');
    if (!entries.length) return queryOn(client, entity, 'find', { key: 'id', value: args.id });
    const values = entries.map(([, value]) => value);
    const setters = entries.map(([key], i) => `${columnName(entity, key)} = $${i + 1}`);
    values.push(args.id);
    const { rows } = await client.query(`UPDATE ${table} SET ${setters.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    return mapRow(rows[0]) || null;
  }
  if (action === 'delete') {
    const { rows } = await client.query(`DELETE FROM ${table} WHERE ${columnName(entity, args.key || 'id')} = $1 RETURNING *`, [args.value ?? args.id]);
    return mapRow(rows[0]) || null;
  }
  throw new Error(`Unknown repository action: ${action}`);
}

export const db = {
  raw: (sql, values) => database().query(sql, values),
  query: (entity, action, args) => queryOn(database(), entity, action, args),
  list: (entity, args) => queryOn(database(), entity, 'list', args),
  find: (entity, key, value) => queryOn(database(), entity, 'find', { key, value }),
  insert: (entity, value) => queryOn(database(), entity, 'insert', { value }),
  update: (entity, id, patch) => queryOn(database(), entity, 'update', { id, patch }),
  delete: (entity, id) => queryOn(database(), entity, 'delete', { id }),
  async transaction(work) {
    const client = await database().connect();
    try {
      await client.query('BEGIN');
      const tx = {
        list: (entity, args) => queryOn(client, entity, 'list', args),
        find: (entity, key, value) => queryOn(client, entity, 'find', { key, value }),
        insert: (entity, value) => queryOn(client, entity, 'insert', { value }),
        update: (entity, id, patch) => queryOn(client, entity, 'update', { id, patch }),
        delete: (entity, id) => queryOn(client, entity, 'delete', { id }),
        raw: (sql, values) => client.query(sql, values),
      };
      const result = await work(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  },
};

export const stores = undefined;
export const newId = () => randomUUID();
export const now = () => new Date().toISOString();
export function nextReference(prefix) {
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

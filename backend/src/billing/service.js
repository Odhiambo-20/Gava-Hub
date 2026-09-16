import { pool, stores, newId, now } from '../database/index.js';

const invoiceNumber = () => `WV-INV-${new Date().getUTCFullYear()}-${String(stores.invoices.length + 1).padStart(6, '0')}`;
const normalize = (input) => {
  const total = Number(input.total);
  if (!Number.isFinite(total) || total <= 0) throw new Error('Invoice total must be greater than zero');
  if (!/^[A-Z]{3}$/.test(String(input.currency || 'KES'))) throw new Error('Currency must be a three-letter ISO code');
  return { ...input, total: Math.round(total * 100) / 100, currency: String(input.currency || 'KES').toUpperCase() };
};

export async function listInvoices(userId) {
  if (pool) {
    const result = await pool.query(`select id, invoice_number as "invoiceNumber", billed_user_id as "billedUserId", billed_organization_id as "billedOrganizationId", status, total, currency, due_at as "dueAt", paid_at as "paidAt", created_at as "createdAt" from gavahub.invoice ${userId ? 'where billed_user_id = $1' : ''} order by created_at desc`, userId ? [userId] : []);
    return result.rows;
  }
  return stores.invoices.filter((invoice) => !userId || invoice.billedUserId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createInvoice(input) {
  const value = normalize(input);
  const invoice = { id: newId(), invoiceNumber: value.invoiceNumber || invoiceNumber(), billedUserId: value.billedUserId || null, billedOrganizationId: value.billedOrganizationId || null, status: 'OPEN', total: value.total, currency: value.currency, dueAt: value.dueAt || null, paidAt: null, description: value.description || null, createdAt: now(), updatedAt: now() };
  if (pool) {
    await pool.query(`insert into gavahub.invoice (id, invoice_number, billed_user_id, billed_organization_id, status, total, currency, due_at) values ($1,$2,$3,$4,'OPEN',$5,$6,$7)`, [invoice.id, invoice.invoiceNumber, invoice.billedUserId, invoice.billedOrganizationId, invoice.total, invoice.currency, invoice.dueAt]);
  } else stores.invoices.push(invoice);
  return invoice;
}

export async function getInvoice(id) {
  if (pool) { const result = await pool.query(`select id, invoice_number as "invoiceNumber", billed_user_id as "billedUserId", billed_organization_id as "billedOrganizationId", status, total, currency, due_at as "dueAt", paid_at as "paidAt", created_at as "createdAt" from gavahub.invoice where id = $1`, [id]); return result.rows[0] || null; }
  return stores.invoices.find((invoice) => invoice.id === id) || null;
}

export async function updateInvoice(id, input) {
  const current = await getInvoice(id); if (!current) return null;
  if (['PAID', 'VOID'].includes(current.status)) throw new Error('Paid or void invoices cannot be edited');
  const value = normalize({ ...current, ...input });
  if (pool) { const result = await pool.query(`update gavahub.invoice set total=$1,currency=$2,due_at=$3,status=$4 where id=$5 returning id, invoice_number as "invoiceNumber", billed_user_id as "billedUserId", billed_organization_id as "billedOrganizationId", status, total, currency, due_at as "dueAt", paid_at as "paidAt", created_at as "createdAt"`, [value.total, value.currency, value.dueAt, input.status || current.status, id]); return result.rows[0]; }
  Object.assign(current, value, { updatedAt: now() }); return current;
}

export async function voidInvoice(id) {
  const invoice = await getInvoice(id); if (!invoice) return false;
  if (invoice.status === 'PAID') throw new Error('Paid invoices cannot be voided');
  if (pool) { await pool.query(`update gavahub.invoice set status='VOID' where id=$1`, [id]); } else Object.assign(invoice, { status: 'VOID', updatedAt: now() });
  return true;
}

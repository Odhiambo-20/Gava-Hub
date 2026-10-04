import { randomUUID } from 'node:crypto';

export const stores = {
  users: [],
  candidates: [],
  organizations: [],
  organizationMembers: [],
  documents: [],
  credentials: [],
  verifications: [],
  invoices: [],
  payments: [],
  notifications: [],
  audit: [],
  contacts: [],
  idempotency: new Map(), // key -> response snapshot
};

export const newId = () => randomUUID();
export const now = () => new Date().toISOString();

export function nextReference(prefix) {
  const n = String(Date.now()).slice(-8);
  const r = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${n}-${r}`;
}

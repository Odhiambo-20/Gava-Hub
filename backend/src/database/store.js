import { randomUUID } from 'node:crypto';
export const stores = Object.fromEntries(['users','candidates','organizations','documents','credentials','verifications','invoices','payments','notifications','audit'].map((name) => [name, []]));
export const newId = () => randomUUID();
export const now = () => new Date().toISOString();

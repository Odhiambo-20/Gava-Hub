import { mkdir } from 'node:fs/promises';
import { config } from './index.js';
export const storageConfig = Object.freeze({ ...config.storage });
export const isObjectStorage = () => storageConfig.provider !== 'LOCAL';
export async function ensureStorageRoot() { if (!isObjectStorage()) await mkdir(storageConfig.root, { recursive: true }); return storageConfig.root; }
export function validateStorageConfig() { if (!['LOCAL','S3','OBJECT_STORAGE'].includes(storageConfig.provider)) throw new Error('Unsupported storage provider'); if (isObjectStorage() && !storageConfig.endpoint) throw new Error('Object storage endpoint is required'); }


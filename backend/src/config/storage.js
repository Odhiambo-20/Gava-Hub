import { mkdir } from 'node:fs/promises';
import { config } from './index.js';

export const storageConfig = Object.freeze({ ...config.storage });

export async function ensureStorageRoot() {
  if (storageConfig.provider === 'LOCAL') {
    await mkdir(storageConfig.root, { recursive: true });
  }
  return storageConfig.root;
}

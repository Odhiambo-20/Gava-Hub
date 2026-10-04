import pg from 'pg';
import { config } from './index.js';

const { Pool } = pg;

export const pool = config.database.url
  ? new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export const closeDatabase = async () => {
  if (pool) await pool.end();
};

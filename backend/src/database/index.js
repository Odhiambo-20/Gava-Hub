export { stores, newId, now } from './store.js';
import pg from 'pg';
const { Pool } = pg;
export const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX_SIZE || 20) }) : null;
export const closeDatabase = () => pool?.end();

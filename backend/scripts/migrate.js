import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/database.js';

if (!pool) {
  console.error('DATABASE_URL is required to apply the Gava Hub schema.');
  process.exit(1);
}

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const schemaPath = resolve(scriptDirectory, '../../db/schema/001_gavahub_schema.sql');

try {
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(`BEGIN;\n${sql}\nCOMMIT;`);
  console.log('Applied db/schema/001_gavahub_schema.sql successfully.');
} catch (error) {
  console.error('Failed to apply the Gava Hub schema:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

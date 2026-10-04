import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

import { config, validateProductionConfig } from './config/index.js';
import { validatePaymentConfig } from './config/payments.js';
import { ensureStorageRoot } from './config/storage.js';
import { connectRedis, closeRedis } from './config/redis.js';
import { closeDatabase } from './database/index.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

import { registerAuth } from './auth/index.js';
import { registerUsers } from './users/index.js';
import { registerCandidates } from './candidates/index.js';
import { registerOrganizations } from './organizations/index.js';
import { registerDocuments } from './documents/index.js';
import { registerCredentials } from './credentials/index.js';
import { registerVerifications } from './verifications/index.js';
import { registerBilling } from './billing/index.js';
import { registerPayments } from './payments/index.js';
import { registerNotifications } from './notifications/index.js';
import { registerAudit } from './audit/index.js';
import { registerContact } from './contact.js';

validateProductionConfig();
try {
  validatePaymentConfig();
} catch (e) {
  console.warn('[config] payment config warning:', e.message);
}

const app = express();
const port = config.port;
const api = config.apiPrefix;

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const corsOrigin =
  config.corsOrigins.length === 1 && config.corsOrigins[0] === '*'
    ? true
    : config.corsOrigins;
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-Id'],
  }),
);

app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

app.use(
  pinoHttp({
    genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
    customProps: (req) => ({ requestId: req.id }),
  }),
);

// Attach request id for audit
app.use((req, res, next) => {
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ── Health ──────────────────────────────────────────────────────────
app.get('/actuator/health', (_req, res) => {
  res.json({ status: 'UP' });
});

app.get(`${api}/system/status`, (_req, res) => {
  res.json({
    service: 'wihl-verify-backend',
    status: 'UP',
    time: new Date().toISOString(),
  });
});

// ── Public ──────────────────────────────────────────────────────────
registerContact(app, api);
registerAuth(app, api);

// ── Authenticated domain modules ────────────────────────────────────
registerUsers(app, api);
registerCandidates(app, api);
registerOrganizations(app, api);
registerDocuments(app, api);
registerCredentials(app, api);
registerVerifications(app, api);
registerBilling(app, api);
registerPayments(app, api);
registerNotifications(app, api);
registerAudit(app, api);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await ensureStorageRoot();
  } catch (err) {
    console.warn('[storage]', err.message);
  }
  try {
    await connectRedis();
    if (config.redis.url || config.redis.password) {
      console.log('[redis] connected');
    }
  } catch (err) {
    console.warn('[redis] optional — not connected:', err.message);
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Wihl Verify API listening on http://0.0.0.0:${port}`);
    console.log(`API prefix: ${api}`);
    console.log(`Storage: ${config.database.url ? 'postgres' : 'memory'} | env: ${config.nodeEnv}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received — shutting down`);
    server.close();
    await closeRedis().catch(() => {});
    await closeDatabase().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

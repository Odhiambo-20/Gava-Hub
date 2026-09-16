const value = (name, fallback = '') => process.env[name] ?? fallback;
const integer = (name, fallback) => { const parsed = Number(value(name, fallback)); if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer`); return parsed; };
export const config = Object.freeze({
  nodeEnv: value('NODE_ENV', 'development'), port: integer('PORT', value('SERVER_PORT', 8080)), apiPrefix: '/api/v1',
  corsOrigins: value('CORS_ALLOWED_ORIGINS', '*').split(',').map((origin) => origin.trim()).filter(Boolean),
  database: { url: value('DATABASE_URL'), maxConnections: integer('DATABASE_POOL_MAX_SIZE', 20), ssl: value('DATABASE_SSL') === 'true' },
  redis: { url: value('REDIS_URL'), host: value('REDIS_HOST', 'localhost'), port: integer('REDIS_PORT', 6379), password: value('REDIS_PASSWORD') },
  security: { jwtSecret: value('JWT_SECRET', value('GAVA_HUB_JWT_SECRET')), jwtIssuer: value('JWT_ISSUER', 'wihl-verify'), jwtTtl: value('JWT_TOKEN_TTL', '1h'), bcryptRounds: integer('BCRYPT_ROUNDS', 12) },
  storage: { provider: value('DOCUMENT_STORAGE_PROVIDER', 'LOCAL'), root: value('DOCUMENT_LOCAL_ROOT', './data/documents'), bucket: value('DOCUMENT_BUCKET', 'wihl-verify-documents'), endpoint: value('OBJECT_STORAGE_ENDPOINT'), region: value('OBJECT_STORAGE_REGION', 'af-south-1') },
  mail: { host: value('SMTP_HOST'), port: integer('SMTP_PORT', 587), username: value('SMTP_USERNAME'), password: value('SMTP_PASSWORD'), from: value('NOTIFICATION_FROM_EMAIL', 'info@wihlverify.org'), support: value('CONTACT_SUPPORT_EMAIL', 'info@wihlverify.org') },
  payments: { method: value('PAYMENT_METHOD', 'COOP_PAYBILL'), coopPaybillNumber: value('COOP_PAYBILL_NUMBER', '400200'), coopAccountNumber: value('COOP_ACCOUNT_NUMBER', '1195351'), mpesaEnvironment: value('MPESA_ENVIRONMENT', 'sandbox'), callbackSecret: value('MPESA_CALLBACK_SECRET') },
});
export function validateProductionConfig() { if (config.nodeEnv !== 'production') return; const required = [['DATABASE_URL', config.database.url], ['REDIS_PASSWORD', config.redis.password], ['JWT_SECRET', config.security.jwtSecret], ['SMTP_HOST', config.mail.host]]; const missing = required.filter(([, current]) => !current).map(([name]) => name); if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`); if (config.security.jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters in production'); }

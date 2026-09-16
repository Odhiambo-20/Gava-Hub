import { createClient } from 'redis'; import { config } from './index.js';
export const redis = config.redis.url || config.redis.password ? createClient({ url: config.redis.url || `redis://:${encodeURIComponent(config.redis.password)}@${config.redis.host}:${config.redis.port}` }) : null;
export async function connectRedis() { if (redis && !redis.isOpen) await redis.connect(); return redis; }
export async function closeRedis() { if (redis?.isOpen) await redis.quit(); }

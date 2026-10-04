export const nowIso = () => new Date().toISOString();

/** Parse JWT TTL strings like "1h", "8h", "30m", "3600s", or plain seconds. */
export function ttlToMs(ttl) {
  if (typeof ttl === 'number') return ttl * 1000;
  const m = String(ttl).trim().match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!m) return 3600_000;
  const n = Number(m[1]);
  const unit = (m[2] || 's').toLowerCase();
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[unit] || 1000);
}

export function expiresAtFromTtl(ttl) {
  return new Date(Date.now() + ttlToMs(ttl)).toISOString();
}

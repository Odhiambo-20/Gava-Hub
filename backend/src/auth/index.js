import { stores, newId, now } from '../database/index.js';
export function registerAuth(app, prefix) {
  app.post(`${prefix}/register`, (req, res) => { const { email, displayName, phone } = req.body || {}; if (!email || !displayName) return res.status(400).json({ message: 'email and displayName are required' }); if (stores.users.some((user) => user.email === email)) return res.status(409).json({ message: 'Email already exists' }); const user = { id: newId(), email, displayName, phone, status: 'ACTIVE', createdAt: now() }; stores.users.push(user); res.status(201).json({ userId: user.id, email, displayName, accessToken: null }); });
  app.post(`${prefix}/login`, (_req, res) => res.status(401).json({ message: 'Authentication is not configured yet' }));
}

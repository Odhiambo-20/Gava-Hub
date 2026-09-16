import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || process.env.SERVER_PORT || 8080);
const api = '/api/v1';
const stores = Object.fromEntries(['users', 'candidates', 'organizations', 'documents', 'credentials', 'verifications', 'invoices', 'payments', 'notifications', 'audit'].map((key) => [key, []]));
const id = () => randomUUID();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((value) => value.trim()) : true }));
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '22mb' }));
app.use(pinoHttp());

app.get('/actuator/health', (_req, res) => res.json({ status: 'UP' }));
app.get(`${api}/system/status`, (_req, res) => res.json({ service: 'wihl-verify-backend', status: 'UP', time: new Date().toISOString() }));
app.get(`${api}/payments/configuration`, (_req, res) => res.json({ method: process.env.PAYMENT_METHOD || 'COOP_PAYBILL', available: false, paybillNumber: process.env.COOP_PAYBILL_NUMBER || '400200', accountNumber: process.env.COOP_ACCOUNT_NUMBER || '1195351' }));

app.post(`${api}/auth/register`, (req, res) => {
  const { email, displayName, phone } = req.body || {};
  if (!email || !displayName) return res.status(400).json({ message: 'email and displayName are required' });
  if (stores.users.some((user) => user.email === email)) return res.status(409).json({ message: 'Email already exists' });
  const user = { id: id(), email, displayName, phone, status: 'ACTIVE', createdAt: new Date().toISOString() };
  stores.users.push(user);
  res.status(201).json({ userId: user.id, email: user.email, displayName: user.displayName, accessToken: null });
});
app.post(`${api}/contact`, (req, res) => res.status(202).json({ id: id(), status: 'QUEUED', message: 'Message received' }));

const collection = (name) => {
  app.get(`${api}/${name}`, (req, res) => res.json(stores[name]));
  app.get(`${api}/${name}/:id`, (req, res) => {
    const item = stores[name].find((entry) => entry.id === req.params.id);
    return item ? res.json(item) : res.status(404).json({ message: `${name} record not found` });
  });
  app.post(`${api}/${name}`, (req, res) => {
    const item = { ...req.body, id: id(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    stores[name].push(item);
    res.status(201).json(item);
  });
  app.put(`${api}/${name}/:id`, (req, res) => {
    const index = stores[name].findIndex((entry) => entry.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: `${name} record not found` });
    stores[name][index] = { ...stores[name][index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(stores[name][index]);
  });
  app.delete(`${api}/${name}/:id`, (req, res) => {
    const index = stores[name].findIndex((entry) => entry.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: `${name} record not found` });
    stores[name].splice(index, 1);
    res.status(204).end();
  });
};
for (const name of Object.keys(stores)) collection(name);

app.use((err, _req, res, _next) => res.status(500).json({ message: 'Internal server error' }));
app.listen(port, '0.0.0.0', () => console.log(`Wihl Verify Node backend listening on ${port}`));

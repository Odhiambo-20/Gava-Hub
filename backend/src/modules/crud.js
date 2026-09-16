import { stores, newId, now } from '../database/index.js';
export function registerCrud(app, name, prefix) {
  app.get(prefix, (_req, res) => res.json(stores[name]));
  app.get(`${prefix}/:id`, (req, res) => { const item = stores[name].find((entry) => entry.id === req.params.id); res.status(item ? 200 : 404).json(item || { message: `${name} record not found` }); });
  app.post(prefix, (req, res) => { const item = { ...req.body, id: newId(), createdAt: now(), updatedAt: now() }; stores[name].push(item); res.status(201).json(item); });
  app.put(`${prefix}/:id`, (req, res) => { const index = stores[name].findIndex((entry) => entry.id === req.params.id); if (index < 0) return res.status(404).json({ message: `${name} record not found` }); stores[name][index] = { ...stores[name][index], ...req.body, updatedAt: now() }; res.json(stores[name][index]); });
  app.delete(`${prefix}/:id`, (req, res) => { const index = stores[name].findIndex((entry) => entry.id === req.params.id); if (index < 0) return res.status(404).end(); stores[name].splice(index, 1); res.status(204).end(); });
}

import { archiveCandidate, createCandidate, getCandidate, listCandidates, updateCandidate } from './service.js';

export function registerCandidates(app, prefix) {
  app.get(`${prefix}/candidates`, async (req, res, next) => { try { res.json(await listCandidates(req.query.userId)); } catch (error) { next(error); } });
  app.get(`${prefix}/candidates/:id`, async (req, res, next) => { try { const value = await getCandidate(req.params.id); value ? res.json(value) : res.status(404).json({ message: 'Candidate not found' }); } catch (error) { next(error); } });
  app.post(`${prefix}/candidates`, async (req, res, next) => { try { res.status(201).json(await createCandidate(req.body || {})); } catch (error) { error.status ||= 400; next(error); } });
  app.put(`${prefix}/candidates/:id`, async (req, res, next) => { try { const value = await updateCandidate(req.params.id, req.body || {}); value ? res.json(value) : res.status(404).json({ message: 'Candidate not found' }); } catch (error) { error.status ||= 400; next(error); } });
  app.delete(`${prefix}/candidates/:id`, async (req, res, next) => { try { const changed = await archiveCandidate(req.params.id); changed ? res.status(204).end() : res.status(404).end(); } catch (error) { next(error); } });
}
export { archiveCandidate, createCandidate, getCandidate, listCandidates, updateCandidate };

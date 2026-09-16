import { recentAudit, recordAudit } from './service.js';

export function registerAudit(app, prefix) {
  app.get(`${prefix}/audit`, async (req, res, next) => {
    try { res.json(await recentAudit(req.query)); } catch (error) { next(error); }
  });
  app.post(`${prefix}/audit`, async (req, res, next) => {
    try {
      const event = await recordAudit({ ...req.body, actorUserId: req.user?.sub || req.body.actorUserId, requestId: req.id });
      res.status(201).json(event);
    } catch (error) { next(error); }
  });
}

export { recentAudit, recordAudit };

import { requireAuth, isAdmin } from '../middleware/auth.js';
import { db, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toNotification(n) {
  return {
    id: n.id,
    recipientUserId: n.recipientUserId,
    channel: n.channel,
    templateCode: n.templateCode,
    status: n.status,
    attemptCount: n.attemptCount,
    sentAt: n.sentAt || undefined,
    createdAt: n.createdAt,
  };
}

export function registerNotifications(app, prefix) {
  app.get(`${prefix}/notifications`, requireAuth, async (req, res, next) => {
    try {
    let list;
    if (req.query.userId) {
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      list = await db.list('notifications', { where: { recipientUserId: req.query.userId } });
    } else if (!isAdmin(req.user)) {
      list = await db.list('notifications', { where: { recipientUserId: req.user.sub } });
    }
    if (!list) list = await db.list('notifications', { orderBy: 'createdAt', desc: true });
    res.json(list.map(toNotification));
    } catch(e) { next(e); }
  });

  app.post(`${prefix}/notifications`, requireAuth, async (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.recipientUserId, 'recipientUserId is required');
      assert(body.channel, 'channel is required');
      assert(body.templateCode, 'templateCode is required');
      if (body.recipientUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const n = {
        id: newId(),
        recipientUserId: body.recipientUserId,
        channel: String(body.channel).toUpperCase(),
        templateCode: String(body.templateCode),
        status: 'QUEUED',
        attemptCount: 0,
        payload: body.payload || {},
        sentAt: null,
        createdAt: now(),
        updatedAt: now(),
      };
      res.status(201).json(toNotification(await db.insert('notifications', n)));
    } catch (e) {
      next(e);
    }
  });
}

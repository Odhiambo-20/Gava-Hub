import { requireAuth, isAdmin } from '../middleware/auth.js';
import { stores, newId, now, nextReference } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toInvoice(inv) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    billedUserId: inv.billedUserId || undefined,
    billedOrganizationId: inv.billedOrganizationId || undefined,
    status: inv.status,
    total: inv.total,
    currency: inv.currency,
    dueAt: inv.dueAt || undefined,
    paidAt: inv.paidAt || undefined,
    createdAt: inv.createdAt,
  };
}

export function registerBilling(app, prefix) {
  app.get(`${prefix}/invoices`, requireAuth, (req, res) => {
    let list = stores.invoices;
    if (req.query.userId) {
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      list = list.filter((i) => i.billedUserId === req.query.userId);
    } else if (!isAdmin(req.user)) {
      list = list.filter((i) => i.billedUserId === req.user.sub);
    }
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(list.map(toInvoice));
  });

  app.get(`${prefix}/invoices/:id`, requireAuth, (req, res, next) => {
    try {
      const inv = stores.invoices.find((i) => i.id === req.params.id);
      if (!inv) throw new AppError('Invoice not found', 404);
      if (inv.billedUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      res.json(toInvoice(inv));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/invoices`, requireAuth, (req, res, next) => {
    try {
      const body = req.body || {};
      const total = Number(body.total);
      assert(Number.isFinite(total) && total > 0, 'Invoice total must be greater than zero');
      const currency = String(body.currency || 'KES').toUpperCase();
      assert(/^[A-Z]{3}$/.test(currency), 'Currency must be a three-letter ISO code');
      const inv = {
        id: newId(),
        invoiceNumber: body.invoiceNumber || nextReference('WV-INV'),
        billedUserId: body.billedUserId || req.user.sub,
        billedOrganizationId: body.billedOrganizationId || null,
        status: 'OPEN',
        total: Math.round(total * 100) / 100,
        currency,
        dueAt: body.dueAt || null,
        paidAt: null,
        description: body.description || null,
        createdAt: now(),
        updatedAt: now(),
      };
      stores.invoices.push(inv);
      res.status(201).json(toInvoice(inv));
    } catch (e) {
      next(e);
    }
  });
}

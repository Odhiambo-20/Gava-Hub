import { requireAuth, isAdmin } from '../middleware/auth.js';
import { paymentConfig } from '../config/payments.js';
import { db, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toPayment(p) {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    failureReason: p.failureReason || undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function registerPayments(app, prefix) {
  app.get(`${prefix}/payments/configuration`, requireAuth, (_req, res) => {
    res.json({
      method: paymentConfig.method,
      available: true,
      paybillNumber: paymentConfig.coopPaybillNumber,
      accountNumber: paymentConfig.coopAccountNumber,
    });
  });

  app.get(`${prefix}/payments`, requireAuth, async (req, res, next) => {
    try {
    let list;
    if (req.query.userId) {
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      list = await db.list('payments', { where: { userId: req.query.userId } });
    } else if (!isAdmin(req.user)) {
      list = await db.list('payments', { where: { userId: req.user.sub } });
    }
    if (!list) list = await db.list('payments', { orderBy: 'createdAt', desc: true });
    res.json(list.map(toPayment));
    } catch(e) { next(e); }
  });

  /**
   * M-Pesa STK Push (or Co-op PayBill acknowledgement).
   * Supports Idempotency-Key header as sent by the frontend.
   */
  app.post(`${prefix}/payments/mpesa/stk-push`, requireAuth, async (req, res, next) => {
    try {
      const idemKey = req.get('idempotency-key');
      if (idemKey) {
        const { rows } = await db.raw('SELECT response_status, response_body FROM gavahub.idempotency_record WHERE idempotency_key=$1', [idemKey]);
        if (rows[0]) return res.status(rows[0].response_status).json(rows[0].response_body);
      }

      const body = req.body || {};
      assert(body.invoiceId, 'invoiceId is required');
      const invoice = await db.find('invoices', 'id', body.invoiceId);
      assert(invoice, 'Invoice not found', 404);
      if (invoice.billedUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      if (invoice.status === 'PAID') {
        throw new AppError('Invoice is already paid', 409);
      }
      if (invoice.status === 'VOID') {
        throw new AppError('Invoice is void', 409);
      }

      const phoneNumber = body.phoneNumber || body.phone;
      // For Co-op PayBill we still accept the call and return PENDING instructions
      const payment = {
        id: newId(),
        invoiceId: invoice.id,
        userId: body.userId || req.user.sub,
        amount: invoice.total,
        currency: invoice.currency,
        phoneNumber: phoneNumber || null,
        status: paymentConfig.method === 'DARAJA' ? 'PENDING' : 'AWAITING_PAYBILL',
        failureReason: null,
        provider: paymentConfig.method,
        providerRef: null,
        createdAt: now(),
        updatedAt: now(),
      };
      const saved = await db.transaction(async (tx) => {
        if (idemKey) {
          await tx.raw('SELECT pg_advisory_xact_lock(hashtext($1))', [idemKey]);
          const { rows } = await tx.raw('SELECT response_status, response_body FROM gavahub.idempotency_record WHERE idempotency_key=$1', [idemKey]);
          if (rows[0]) return { cachedStatus: rows[0].response_status, cachedBody: rows[0].response_body };
        }
        const inserted = await tx.insert('payments', payment);
        if (idemKey) await tx.raw('INSERT INTO gavahub.idempotency_record (idempotency_key, response_status, response_body) VALUES ($1, $2, $3::jsonb)', [idemKey, 202, JSON.stringify(toPayment(inserted))]);
        return inserted;
      });

      // In DARAJA mode a real STK request would be sent here.
      // For COOP_PAYBILL the frontend shows paybillNumber/accountNumber from /configuration.

      if (saved.cachedBody) return res.status(saved.cachedStatus).json(saved.cachedBody);
      res.status(202).json(toPayment(saved));
    } catch (e) {
      next(e);
    }
  });

  /** Manual confirmation endpoint for Co-op PayBill bank reference */
  app.post(`${prefix}/payments/confirm`, requireAuth, async (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.invoiceId, 'invoiceId is required');
      assert(body.reference, 'reference is required');
      const invoice = await db.find('invoices', 'id', body.invoiceId);
      assert(invoice, 'Invoice not found', 404);
      if (invoice.billedUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const payment = {
        id: newId(),
        invoiceId: invoice.id,
        userId: req.user.sub,
        amount: Number(body.amount) || invoice.total,
        currency: invoice.currency,
        phoneNumber: null,
        status: 'PENDING_CONFIRMATION',
        failureReason: null,
        provider: 'COOP_PAYBILL',
        providerRef: String(body.reference).trim(),
        createdAt: now(),
        updatedAt: now(),
      };
      res.status(202).json(toPayment(await db.insert('payments', payment)));
    } catch (e) {
      next(e);
    }
  });
}

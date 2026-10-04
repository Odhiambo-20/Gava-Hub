import { requireAuth, isAdmin } from '../middleware/auth.js';
import { paymentConfig } from '../config/payments.js';
import { stores, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toPayment(p) {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    amount: p.amount,
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

  app.get(`${prefix}/payments`, requireAuth, (req, res) => {
    let list = stores.payments;
    if (req.query.userId) {
      if (req.query.userId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      list = list.filter((p) => p.userId === req.query.userId);
    } else if (!isAdmin(req.user)) {
      list = list.filter((p) => p.userId === req.user.sub);
    }
    res.json(list.map(toPayment));
  });

  /**
   * M-Pesa STK Push (or Co-op PayBill acknowledgement).
   * Supports Idempotency-Key header as sent by the frontend.
   */
  app.post(`${prefix}/payments/mpesa/stk-push`, requireAuth, (req, res, next) => {
    try {
      const idemKey = req.get('idempotency-key');
      if (idemKey && stores.idempotency.has(idemKey)) {
        const cached = stores.idempotency.get(idemKey);
        return res.status(cached.statusCode).json(cached.body);
      }

      const body = req.body || {};
      assert(body.invoiceId, 'invoiceId is required');
      const invoice = stores.invoices.find((i) => i.id === body.invoiceId);
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
      stores.payments.push(payment);

      // In DARAJA mode a real STK request would be sent here.
      // For COOP_PAYBILL the frontend shows paybillNumber/accountNumber from /configuration.

      const responseBody = toPayment(payment);
      if (idemKey) {
        stores.idempotency.set(idemKey, { statusCode: 202, body: responseBody });
      }
      res.status(202).json(responseBody);
    } catch (e) {
      next(e);
    }
  });

  /** Manual confirmation endpoint for Co-op PayBill bank reference */
  app.post(`${prefix}/payments/confirm`, requireAuth, (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.invoiceId, 'invoiceId is required');
      assert(body.reference, 'reference is required');
      const invoice = stores.invoices.find((i) => i.id === body.invoiceId);
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
      stores.payments.push(payment);
      res.status(202).json(toPayment(payment));
    } catch (e) {
      next(e);
    }
  });
}

import { stores, newId, now, nextReference } from './database/index.js';
import { AppError } from './utils/errors.js';

const VALID_TYPES = new Set(['CANDIDATE', 'EMPLOYER', 'INSTITUTION', 'OTHER']);

/**
 * Public contact form — matches frontend ContactRequest / ContactResponse.
 */
export function registerContact(app, prefix) {
  app.post(`${prefix}/contact`, (req, res, next) => {
    try {
      const body = req.body || {};
      const fullName = String(body.fullName || '').trim();
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const message = String(body.message || '').trim();
      const requesterType = String(body.requesterType || 'OTHER').toUpperCase();
      const phoneNumber = body.phoneNumber ? String(body.phoneNumber).trim() : null;

      const violations = {};
      if (!fullName || fullName.length < 2) violations.fullName = 'Full name is required';
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) violations.email = 'A valid email is required';
      if (!message || message.length < 5) violations.message = 'Message is required';
      if (!VALID_TYPES.has(requesterType)) {
        violations.requesterType = 'Invalid requesterType';
      }
      if (Object.keys(violations).length) {
        throw new AppError(Object.values(violations)[0], 400, violations);
      }

      const entry = {
        id: newId(),
        referenceNumber: nextReference('WV-CNT'),
        fullName,
        email,
        phoneNumber,
        requesterType,
        message,
        status: 'NEW',
        createdAt: now(),
      };
      stores.contacts.push(entry);

      res.status(201).json({
        id: entry.id,
        referenceNumber: entry.referenceNumber,
        status: 'NEW',
        createdAt: entry.createdAt,
      });
    } catch (e) {
      next(e);
    }
  });
}

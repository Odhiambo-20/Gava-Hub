import { requireAuth, isAdmin, isVerifier } from '../middleware/auth.js';
import { stores, newId, now, nextReference } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toVerification(v) {
  return {
    id: v.id,
    referenceNumber: v.referenceNumber,
    candidateId: v.candidateId,
    requestingOrganizationId: v.requestingOrganizationId || undefined,
    status: v.status,
    purpose: v.purpose,
    submittedAt: v.submittedAt || undefined,
    completedAt: v.completedAt || undefined,
    createdAt: v.createdAt,
  };
}

export function registerVerifications(app, prefix) {
  app.get(`${prefix}/verifications`, requireAuth, (req, res) => {
    let list = stores.verifications;
    if (!isAdmin(req.user) && !isVerifier(req.user)) {
      const myCandidateIds = new Set(
        stores.candidates.filter((c) => c.userId === req.user.sub).map((c) => c.id),
      );
      list = list.filter(
        (v) =>
          myCandidateIds.has(v.candidateId) ||
          v.createdByUserId === req.user.sub,
      );
    }
    res.json(list.map(toVerification));
  });

  app.post(`${prefix}/verifications`, requireAuth, (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.candidateId, 'candidateId is required');
      assert(body.purpose, 'purpose is required');
      const candidate = stores.candidates.find((c) => c.id === body.candidateId);
      assert(candidate, 'Candidate not found', 404);
      const v = {
        id: newId(),
        referenceNumber: nextReference('WV-VER'),
        candidateId: body.candidateId,
        requestingOrganizationId: body.requestingOrganizationId || null,
        status: 'SUBMITTED',
        purpose: String(body.purpose).trim(),
        submittedAt: now(),
        completedAt: null,
        createdByUserId: req.user.sub,
        decision: null,
        createdAt: now(),
        updatedAt: now(),
      };
      stores.verifications.push(v);
      res.status(201).json(toVerification(v));
    } catch (e) {
      next(e);
    }
  });

  app.put(`${prefix}/verifications/:id`, requireAuth, (req, res, next) => {
    try {
      const v = stores.verifications.find((x) => x.id === req.params.id);
      if (!v) throw new AppError('Verification not found', 404);
      if (
        v.createdByUserId !== req.user.sub &&
        !isAdmin(req.user) &&
        !isVerifier(req.user)
      ) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      if (body.purpose !== undefined) v.purpose = String(body.purpose).trim();
      if (body.status !== undefined && (isAdmin(req.user) || isVerifier(req.user))) {
        v.status = body.status;
      }
      if (body.requestingOrganizationId !== undefined) {
        v.requestingOrganizationId = body.requestingOrganizationId;
      }
      v.updatedAt = now();
      res.json(toVerification(v));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/verifications/:id/decisions`, requireAuth, (req, res, next) => {
    try {
      if (!isVerifier(req.user)) throw new AppError('Insufficient permissions', 403);
      const v = stores.verifications.find((x) => x.id === req.params.id);
      if (!v) throw new AppError('Verification not found', 404);
      const body = req.body || {};
      assert(body.decision || body.status, 'decision or status is required');
      const decision = String(body.decision || body.status).toUpperCase();
      assert(
        ['APPROVED', 'REJECTED', 'NEEDS_INFO'].includes(decision),
        'decision must be APPROVED, REJECTED or NEEDS_INFO',
      );
      v.decision = decision;
      v.status = decision === 'NEEDS_INFO' ? 'NEEDS_INFO' : decision;
      v.completedAt = decision === 'NEEDS_INFO' ? null : now();
      v.decisionNotes = body.notes || body.reason || null;
      v.decidedByUserId = req.user.sub;
      v.updatedAt = now();
      res.json(toVerification(v));
    } catch (e) {
      next(e);
    }
  });
}

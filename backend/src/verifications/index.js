import { requireAuth, isAdmin, isVerifier } from '../middleware/auth.js';
import { db, newId, now, nextReference } from '../database/index.js';
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
  app.get(`${prefix}/verifications`, requireAuth, async (req, res, next) => {
    try {
      let list = await db.list('verifications', { orderBy: 'createdAt', desc: true });
      if (!isAdmin(req.user) && !isVerifier(req.user)) {
        const { rows } = await db.raw('SELECT v.* FROM gavahub.verification v LEFT JOIN gavahub.candidate_profile c ON c.id=v.candidate_id WHERE c.user_id=$1 OR v.created_by_user_id=$1 ORDER BY v.created_at DESC', [req.user.sub]);
        list = rows.map((row) => Object.fromEntries(Object.entries(row).map(([k,v]) => [k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v])));
      }
      res.json(list.map(toVerification));
    } catch(e) { next(e); }
  });

  app.post(`${prefix}/verifications`, requireAuth, async (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.candidateId, 'candidateId is required');
      assert(body.purpose, 'purpose is required');
      const candidate = await db.find('candidates', 'id', body.candidateId);
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
      res.status(201).json(toVerification(await db.insert('verifications', v)));
    } catch (e) {
      next(e);
    }
  });

  app.put(`${prefix}/verifications/:id`, requireAuth, async (req, res, next) => {
    try {
      const v = await db.find('verifications', 'id', req.params.id);
      if (!v) throw new AppError('Verification not found', 404);
      if (
        v.createdByUserId !== req.user.sub &&
        !isAdmin(req.user) &&
        !isVerifier(req.user)
      ) {
        throw new AppError('Insufficient permissions', 403);
      }
      const body = req.body || {};
      const patch = { updatedAt: now() };
      if (body.purpose !== undefined) patch.purpose = String(body.purpose).trim();
      if (body.status !== undefined && (isAdmin(req.user) || isVerifier(req.user))) {
        patch.status = body.status;
      }
      if (body.requestingOrganizationId !== undefined) {
        patch.requestingOrganizationId = body.requestingOrganizationId;
      }
      res.json(toVerification(await db.update('verifications', v.id, patch)));
    } catch (e) {
      next(e);
    }
  });

  app.post(`${prefix}/verifications/:id/decisions`, requireAuth, async (req, res, next) => {
    try {
      if (!isVerifier(req.user)) throw new AppError('Insufficient permissions', 403);
      const v = await db.find('verifications', 'id', req.params.id);
      if (!v) throw new AppError('Verification not found', 404);
      const body = req.body || {};
      assert(body.decision || body.status, 'decision or status is required');
      const decision = String(body.decision || body.status).toUpperCase();
      assert(
        ['APPROVED', 'REJECTED', 'NEEDS_INFO'].includes(decision),
        'decision must be APPROVED, REJECTED or NEEDS_INFO',
      );
      const updated = await db.update('verifications', v.id, { decision, status: decision, completedAt: decision === 'NEEDS_INFO' ? null : now(), decisionNotes: body.notes || body.reason || null, decidedByUserId: req.user.sub, updatedAt: now() });
      res.json(toVerification(updated));
    } catch (e) {
      next(e);
    }
  });
}

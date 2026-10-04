import { requireAuth, isAdmin, isVerifier } from '../middleware/auth.js';
import { stores, newId, now } from '../database/index.js';
import { AppError, assert } from '../utils/errors.js';

function toCredential(c) {
  return {
    id: c.id,
    candidateId: c.candidateId,
    issuingOrganizationId: c.issuingOrganizationId || undefined,
    credentialType: c.credentialType,
    title: c.title,
    credentialNumber: c.credentialNumber || undefined,
    issuedOn: c.issuedOn || undefined,
    expiresOn: c.expiresOn || undefined,
    status: c.status,
  };
}

export function registerCredentials(app, prefix) {
  app.get(`${prefix}/credentials`, requireAuth, (req, res) => {
    let list = stores.credentials.filter((c) => c.status !== 'REVOKED' || isAdmin(req.user));
    if (req.query.candidateId) {
      list = list.filter((c) => c.candidateId === req.query.candidateId);
    }
    res.json(list.map(toCredential));
  });

  app.post(`${prefix}/credentials`, requireAuth, (req, res, next) => {
    try {
      const body = req.body || {};
      assert(body.candidateId, 'candidateId is required');
      assert(body.title, 'title is required');
      assert(body.credentialType, 'credentialType is required');
      const candidate = stores.candidates.find((c) => c.id === body.candidateId);
      assert(candidate, 'Candidate not found', 404);
      if (candidate.userId !== req.user.sub && !isAdmin(req.user) && !isVerifier(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const cred = {
        id: newId(),
        candidateId: body.candidateId,
        issuingOrganizationId: body.issuingOrganizationId || null,
        credentialType: String(body.credentialType).trim(),
        title: String(body.title).trim(),
        credentialNumber: body.credentialNumber || null,
        issuedOn: body.issuedOn || null,
        expiresOn: body.expiresOn || null,
        status: 'ACTIVE',
        createdAt: now(),
        updatedAt: now(),
      };
      stores.credentials.push(cred);
      res.status(201).json(toCredential(cred));
    } catch (e) {
      next(e);
    }
  });

  // FE uses DELETE as revoke
  app.delete(`${prefix}/credentials/:id`, requireAuth, (req, res, next) => {
    try {
      const cred = stores.credentials.find((c) => c.id === req.params.id);
      if (!cred) throw new AppError('Credential not found', 404);
      const candidate = stores.candidates.find((c) => c.id === cred.candidateId);
      if (
        candidate &&
        candidate.userId !== req.user.sub &&
        !isAdmin(req.user) &&
        !isVerifier(req.user)
      ) {
        throw new AppError('Insufficient permissions', 403);
      }
      cred.status = 'REVOKED';
      cred.updatedAt = now();
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });
}

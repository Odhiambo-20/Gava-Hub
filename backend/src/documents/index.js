import { createWriteStream } from 'node:fs';
import { mkdir, unlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import multer from 'multer';
import { requireAuth, isAdmin } from '../middleware/auth.js';
import { stores, newId, now } from '../database/index.js';
import { storageConfig } from '../config/storage.js';
import { AppError, assert } from '../utils/errors.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: storageConfig.maxFileBytes },
});

function toDoc(d) {
  return {
    id: d.id,
    ownerUserId: d.ownerUserId || undefined,
    ownerOrganizationId: d.ownerOrganizationId || undefined,
    originalFilename: d.originalFilename,
    contentType: d.contentType,
    sizeBytes: d.sizeBytes,
    malwareScanStatus: d.malwareScanStatus,
    createdAt: d.createdAt,
  };
}

async function saveFile(docId, buffer) {
  const dir = join(storageConfig.root, docId.slice(0, 2));
  await mkdir(dir, { recursive: true });
  const path = join(dir, docId);
  await pipeline(
    async function* () {
      yield buffer;
    },
    createWriteStream(path),
  );
  return path;
}

export function registerDocuments(app, prefix) {
  app.get(`${prefix}/documents`, requireAuth, (req, res) => {
    let list = stores.documents;
    if (req.query.ownerUserId) {
      if (req.query.ownerUserId !== req.user.sub && !isAdmin(req.user)) {
        return res.status(403).json({ status: 403, message: 'Insufficient permissions' });
      }
      list = list.filter((d) => d.ownerUserId === req.query.ownerUserId);
    } else if (!isAdmin(req.user)) {
      list = list.filter((d) => d.ownerUserId === req.user.sub);
    }
    res.json(list.map(toDoc));
  });

  app.post(`${prefix}/documents`, requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      const ownerUserId = req.body?.ownerUserId || req.user.sub;
      if (ownerUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      assert(req.file, 'file is required', 400);
      const id = newId();
      const storagePath = await saveFile(id, req.file.buffer);
      const doc = {
        id,
        ownerUserId,
        ownerOrganizationId: req.body?.ownerOrganizationId || null,
        originalFilename: req.file.originalname,
        contentType: req.file.mimetype || 'application/octet-stream',
        sizeBytes: req.file.size,
        malwareScanStatus: 'PENDING',
        storagePath,
        createdAt: now(),
        updatedAt: now(),
      };
      // Dev: mark clean immediately (production would queue a scanner)
      doc.malwareScanStatus = 'CLEAN';
      stores.documents.push(doc);
      res.status(201).json(toDoc(doc));
    } catch (e) {
      next(e);
    }
  });

  app.get(`${prefix}/documents/:id/content`, requireAuth, async (req, res, next) => {
    try {
      const doc = stores.documents.find((d) => d.id === req.params.id);
      if (!doc) throw new AppError('Document not found', 404);
      if (doc.ownerUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      const data = await readFile(doc.storagePath);
      res.setHeader('Content-Type', doc.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(doc.originalFilename)}"`,
      );
      res.send(data);
    } catch (e) {
      next(e);
    }
  });

  app.delete(`${prefix}/documents/:id`, requireAuth, async (req, res, next) => {
    try {
      const index = stores.documents.findIndex((d) => d.id === req.params.id);
      if (index < 0) throw new AppError('Document not found', 404);
      const doc = stores.documents[index];
      if (doc.ownerUserId !== req.user.sub && !isAdmin(req.user)) {
        throw new AppError('Insufficient permissions', 403);
      }
      stores.documents.splice(index, 1);
      if (doc.storagePath) {
        await unlink(doc.storagePath).catch(() => {});
      }
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });
}

import express from 'express';
import {
  uploadDocument,
  getLocalDocument,
} from '#controllers/document.controller.js';
import {
  authenticateToken,
  requireRole,
} from '#middlewares/auth.middleware.js';
import {
  uploadDocument as uploadMiddleware,
  handleUploadError,
  validateFileContent,
} from '#middlewares/upload.middleware.js';

const router = express.Router();

// POST /documents/upload - Upload verification document (authenticated users only)
router.post(
  '/upload',
  authenticateToken,
  uploadMiddleware,
  handleUploadError,
  validateFileContent,
  uploadDocument
);

// GET /documents/file/:fileName - View a locally stored identity document
// (development without UploadThing). Admins only.
router.get(
  '/file/:fileName',
  authenticateToken,
  requireRole(['admin']),
  getLocalDocument
);

export default router;

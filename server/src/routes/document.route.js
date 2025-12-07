import express from 'express';
import { uploadDocument } from '#controllers/document.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';
import {
  uploadDocument as uploadMiddleware,
  handleUploadError,
} from '#middlewares/upload.middleware.js';

const router = express.Router();

// POST /documents/upload - Upload verification document (authenticated users only)
router.post(
  '/upload',
  authenticateToken,
  uploadMiddleware,
  handleUploadError,
  uploadDocument
);

export default router;

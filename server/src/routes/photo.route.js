import express from 'express';
import {
  uploadPhotoController,
  deletePhotoController,
  getPhotosController,
} from '#controllers/photo.controller.js';
import { authenticateToken, isTripMember } from '#middlewares/auth.middleware.js';
import { uploadPhoto, handleUploadError } from '#middlewares/upload.middleware.js';

const router = express.Router();

// All photo routes require authentication
router.use(authenticateToken);

// Get all photos for a trip (member only)
router.get('/trips/:tripId/photos', isTripMember, getPhotosController);

// Upload a photo to a trip (member only)
router.post(
  '/trips/:tripId/photos',
  isTripMember,
  uploadPhoto,
  handleUploadError,
  uploadPhotoController
);

// Delete a photo (uploader only - enforced in controller)
router.delete('/photos/:photoId', deletePhotoController);

export default router;

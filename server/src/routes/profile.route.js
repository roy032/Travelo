import express from 'express';
import { getProfile, updateUserProfile } from '#controllers/profile.controller.js';
import {
  deleteMyAccount,
  exportMyData,
} from '#controllers/account.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';
import { authRateLimiter } from '#middlewares/rateLimit.middleware.js';

const router = express.Router();

// GET /profile - Get current user's profile
router.get('/', authenticateToken, getProfile);

// PUT /profile - Update current user's profile
router.put('/', authenticateToken, updateUserProfile);

// GET /profile/export - Download all of the user's data as JSON
router.get('/export', authenticateToken, exportMyData);

// DELETE /profile - Delete the account (password required)
router.delete('/', authenticateToken, authRateLimiter, deleteMyAccount);

export default router;

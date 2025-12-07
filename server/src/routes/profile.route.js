import express from 'express';
import { getProfile, updateUserProfile } from '#controllers/profile.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';

const router = express.Router();

// GET /profile - Get current user's profile
router.get('/', authenticateToken, getProfile);

// PUT /profile - Update current user's profile
router.put('/', authenticateToken, updateUserProfile);

export default router;

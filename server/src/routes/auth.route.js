import {
  signup,
  signIn,
  signOut,
  forgotPassword,
  resetPasswordController,
  verifyEmailController,
  resendVerification,
} from '#controllers/auth.controller.js';
import { signOutEverywhere } from '#controllers/account.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';
import {
  authRateLimiter,
  accountRateLimiter,
} from '#middlewares/rateLimit.middleware.js';
import express from 'express';

const router = express.Router();

router.post('/sign-up', authRateLimiter, signup);

router.post('/sign-in', authRateLimiter, accountRateLimiter, signIn);

router.post('/sign-out', signOut);

// Revokes every session of the user, on all devices
router.post('/sign-out-everywhere', authenticateToken, signOutEverywhere);

// Always answers 200 so it can't be used to discover registered emails
router.post(
  '/forgot-password',
  authRateLimiter,
  accountRateLimiter,
  forgotPassword
);

router.post('/reset-password', authRateLimiter, resetPasswordController);

router.post('/verify-email', authRateLimiter, verifyEmailController);

router.post(
  '/resend-verification',
  authenticateToken,
  authRateLimiter,
  resendVerification
);

export default router;

import { signup, signIn, signOut } from '#controllers/auth.controller.js';
import {
  authRateLimiter,
  accountRateLimiter,
} from '#middlewares/rateLimit.middleware.js';
import express from 'express';

const router = express.Router();

router.post('/sign-up', authRateLimiter, signup);

router.post('/sign-in', authRateLimiter, accountRateLimiter, signIn);

router.post('/sign-out', signOut);

export default router;

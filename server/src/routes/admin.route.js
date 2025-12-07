import express from 'express';
import {
  fetchPendingVerifications,
  approveUserVerification,
  rejectUserVerification,
  fetchAllUsers,
  getUserStatistics,
} from '#controllers/admin.controller.js';
import {
  authenticateToken,
  requireRole,
} from '#middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /admin/verifications/pending - Get all pending verifications
router.get('/verifications/pending', fetchPendingVerifications);

// POST /admin/verifications/:userId/approve - Approve a user's verification
router.post('/verifications/:userId/approve', approveUserVerification);

// POST /admin/verifications/:userId/reject - Reject a user's verification
router.post('/verifications/:userId/reject', rejectUserVerification);

// GET /admin/users - Get all users with filtering and search
router.get('/users', fetchAllUsers);

// GET /admin/statistics - Get user statistics
router.get('/statistics', getUserStatistics);

export default router;

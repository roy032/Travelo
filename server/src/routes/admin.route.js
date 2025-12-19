import express from "express";
import {
  fetchPendingVerifications,
  approveUserVerification,
  rejectUserVerification,
  fetchAllUsers,
  getUserStatistics,
  updateUserRole,
  toggleUserBlockStatus,
  deleteUserAccount,
} from "#controllers/admin.controller.js";
import {
  fetchAllReports,
  fetchReportById,
  updateReportStatusHandler,
  fetchReportStatistics,
} from "#controllers/report.controller.js";
import { deleteTripByAdmin } from "#controllers/trip.controller.js";
import {
  authenticateToken,
  requireRole,
} from "#middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(["admin"]));

// GET /admin/verifications/pending - Get all pending verifications
router.get("/verifications/pending", fetchPendingVerifications);

// POST /admin/verifications/:userId/approve - Approve a user's verification
router.post("/verifications/:userId/approve", approveUserVerification);

// POST /admin/verifications/:userId/reject - Reject a user's verification
router.post("/verifications/:userId/reject", rejectUserVerification);

// GET /admin/users - Get all users with filtering and search
router.get("/users", fetchAllUsers);

// GET /admin/statistics - Get user statistics
router.get("/statistics", getUserStatistics);

// PATCH /admin/users/:userId/role - Update user role
router.patch("/users/:userId/role", updateUserRole);

// PATCH /admin/users/:userId/block - Block/unblock user
router.patch("/users/:userId/block", toggleUserBlockStatus);

// DELETE /admin/users/:userId - Delete user account with cascade
router.delete("/users/:userId", deleteUserAccount);

// Report management routes
// GET /admin/reports/statistics - Get report statistics
router.get("/reports/statistics", fetchReportStatistics);

// GET /admin/reports - Get all reports with filtering
router.get("/reports", fetchAllReports);

// GET /admin/reports/:reportId - Get single report details
router.get("/reports/:reportId", fetchReportById);

// PATCH /admin/reports/:reportId - Update report status
router.patch("/reports/:reportId", updateReportStatusHandler);

// DELETE /admin/trips/:tripId - Delete trip (soft delete)
router.delete("/trips/:tripId", deleteTripByAdmin);

export default router;

import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} from "#services/verification.service.js";
import User from "#models/user.model.js";
import { disconnectUserSockets } from "#src/socket/chatSocket.js";
import { deleteAccount } from "#services/accountData.service.js";
import { listAdminActions, logUserAction } from "#services/audit.service.js";
import { ANALYTICS_RANGES, getAnalytics } from "#services/analytics.service.js";

/**
 * Get all users with pending verification status
 * Admin only endpoint
 */
export const fetchPendingVerifications = async (req, res, next) => {
  try {
    const pendingUsers = await getPendingVerifications();

    res.status(200).json({
      message: "Pending verifications retrieved successfully",
      users: pendingUsers,
      count: pendingUsers.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Approve a user's verification document
 * Admin only endpoint
 */
export const approveUserVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { verificationType } = req.body; // 'domestic' or 'international'
    const adminId = req.user.id;

    if (!["domestic", "international"].includes(verificationType)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Verification type must be 'domestic' or 'international'",
      });
    }

    const updatedUser = await approveVerification(
      userId,
      adminId,
      verificationType
    );

    const docType = verificationType === "domestic" ? "NID" : "Passport";
    await logUserAction(req, {
      actionType: "verification_approved",
      targetId: userId,
      message: `Approved ${docType} verification`,
      metadata: { verificationType },
    });
    res.status(200).json({
      message: `${docType} verification approved successfully`,
      user: updatedUser,
    });
  } catch (e) {
    if (e.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    if (e.message.includes("verification is not in pending status")) {
      return res.status(400).json({
        error: "Invalid operation",
        message: e.message,
      });
    }

    next(e);
  }
};

/**
 * Reject a user's verification document
 * Admin only endpoint
 */
export const rejectUserVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { verificationType } = req.body; // 'domestic' or 'international'
    const adminId = req.user.id;

    if (!["domestic", "international"].includes(verificationType)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Verification type must be 'domestic' or 'international'",
      });
    }

    const updatedUser = await rejectVerification(
      userId,
      adminId,
      verificationType
    );

    const docType = verificationType === "domestic" ? "NID" : "Passport";
    await logUserAction(req, {
      actionType: "verification_rejected",
      targetId: userId,
      message: `Rejected ${docType} verification`,
      metadata: { verificationType },
    });
    res.status(200).json({
      message: `${docType} verification rejected`,
      user: updatedUser,
    });
  } catch (e) {
    if (e.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    if (e.message.includes("verification is not in pending status")) {
      return res.status(400).json({
        error: "Invalid operation",
        message: e.message,
      });
    }

    next(e);
  }
};

/**
 * Get all users with filtering and search
 * Admin only endpoint
 */
export const fetchAllUsers = async (req, res, next) => {
  try {
    const { verificationStatus, search } = req.query;
    let { page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};

    // Filter by verification status if provided
    if (
      verificationStatus &&
      ["unverified", "pending", "verified"].includes(verificationStatus)
    ) {
      query.verificationStatus = verificationStatus;
    }

    // Search by name or email if provided
    if (typeof search === "string" && search.trim()) {
      const escaped = search
        .trim()
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    // Calculate pagination (guard against NaN / negative values)
    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // Deleted accounts stay only as anonymous placeholders
    query.deletedAt = null;

    // Get users with pagination
    const users = await User.find(query)
      .select("name email role verificationStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    res.status(200).json({
      message: "Users retrieved successfully",
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalUsers: totalCount,
        usersPerPage: parseInt(limit),
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Get user statistics
 * Admin only endpoint
 */
export const getUserStatistics = async (req, res, next) => {
  try {
    // Get counts for different verification statuses
    const [totalUsers, verifiedUsers, pendingUsers, unverifiedUsers] =
      await Promise.all([
        User.countDocuments({ deletedAt: null }),
        User.countDocuments({ verificationStatus: "verified", deletedAt: null }),
        User.countDocuments({ verificationStatus: "pending", deletedAt: null }),
        User.countDocuments({ verificationStatus: "unverified", deletedAt: null }),
      ]);

    res.status(200).json({
      message: "User statistics retrieved successfully",
      statistics: {
        totalUsers,
        verifiedUsers,
        pendingUsers,
        unverifiedUsers,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Daily sign-ups, active trips and server errors for the admin charts
 * Admin only endpoint
 */
export const fetchAnalytics = async (req, res, next) => {
  try {
    const days = Number.parseInt(req.query.days, 10) || 30;
    if (!ANALYTICS_RANGES.includes(days)) {
      return res.status(400).json({
        error: "Validation failed",
        message: `days must be one of ${ANALYTICS_RANGES.join(", ")}`,
      });
    }

    const analytics = await getAnalytics(days);
    res.status(200).json({
      message: "Analytics retrieved successfully",
      analytics,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Update user role (promote to admin or demote to user)
 * Admin only endpoint
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Role must be 'user' or 'admin'",
      });
    }

    // Prevent self-demotion
    if (userId === req.user.id && role === "user") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Cannot demote yourself from admin role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();
    await logUserAction(req, {
      actionType: "user_role_changed",
      targetId: userId,
      message: `Changed role from ${previousRole} to ${role}`,
      metadata: { previousRole, role },
    });

    res.status(200).json({
      message: `User role updated to ${role} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Block or unblock a user account
 * Admin only endpoint
 */
export const toggleUserBlockStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { blocked } = req.body;

    if (typeof blocked !== "boolean") {
      return res.status(400).json({
        error: "Validation failed",
        message: "Blocked status must be a boolean",
      });
    }

    // Prevent self-blocking
    if (userId === req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Cannot block your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    user.isBlocked = blocked;
    if (blocked) {
      // End the user's existing sessions too, not just future sign-ins
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    await user.save();
    if (blocked) disconnectUserSockets(userId);
    await logUserAction(req, {
      actionType: blocked ? "user_banned" : "user_unbanned",
      targetId: userId,
      message: `${blocked ? "Blocked" : "Unblocked"} ${user.email}`,
    });

    res.status(200).json({
      message: `User ${blocked ? "blocked" : "unblocked"} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete user account with cascade (remove all related data)
 * Admin only endpoint
 */
export const deleteUserAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "The specified user does not exist",
      });
    }

    // Same cleanup as self-service deletion: solo trips are removed, shared
    // trips pass to another member and personal data is wiped
    const { email } = user;
    await deleteAccount(userId);
    await logUserAction(req, {
      actionType: "user_deleted",
      targetId: userId,
      message: `Deleted the account of ${email}`,
    });

    res.status(200).json({
      message: "User account and all associated data deleted successfully",
      userId,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/admin/audit-log - who did what, newest first
 */
export const fetchAuditLog = async (req, res, next) => {
  try {
    res.json(await listAdminActions(req.query));
  } catch (e) {
    next(e);
  }
};

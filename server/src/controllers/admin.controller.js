import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} from "#services/verification.service.js";
import User from "#models/user.model.js";
import Trip from "#models/trip.model.js";
import Activity from "#models/activity.model.js";
import Checklist from "#models/checklist.model.js";
import Expense from "#models/expense.model.js";
import Note from "#models/note.model.js";
import Photo from "#models/photo.model.js";
import Notification from "#models/notification.model.js";
import Invitation from "#models/invitation.model.js";

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
    const { verificationStatus, search, page = 1, limit = 20 } = req.query;

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
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

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
        User.countDocuments(),
        User.countDocuments({ verificationStatus: "verified" }),
        User.countDocuments({ verificationStatus: "pending" }),
        User.countDocuments({ verificationStatus: "unverified" }),
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

    user.role = role;
    await user.save();

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
    await user.save();

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

    // Start cascade deletion
    await Promise.all([
      // Delete trips owned by user
      Trip.deleteMany({ owner: userId }),

      // Remove user from trip members
      Trip.updateMany({ members: userId }, { $pull: { members: userId } }),

      // Delete activities created by user
      Activity.deleteMany({ createdBy: userId }),

      // Delete checklists created by user
      Checklist.deleteMany({ createdBy: userId }),

      // Delete expenses created by user
      Expense.deleteMany({ paidBy: userId }),

      // Delete notes created by user
      Note.deleteMany({ author: userId }),

      // Delete photos uploaded by user
      Photo.deleteMany({ uploader: userId }),

      // Delete messages sent by user

      // Delete notifications for user
      Notification.deleteMany({ user: userId }),

      // Delete invitations sent to or from user
      Invitation.deleteMany({
        $or: [{ invitedUser: userId }, { invitedBy: userId }],
      }),
    ]);

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User account and all associated data deleted successfully",
      userId,
    });
  } catch (e) {
    next(e);
  }
};

import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} from "#services/verification.service.js";
import User from "#models/user.model.js";

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

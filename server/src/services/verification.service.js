import User from "#models/user.model.js";
import { createNotification } from "./notification.service.js";

/**
 * Get all users with pending verification status (domestic or international)
 * @returns {Promise<Array>} Array of users with pending verification
 */
export const getPendingVerifications = async () => {
  try {
    // Find users with pending verification in either domestic or international
    const pendingUsers = await User.find({
      $or: [
        { "domesticVerification.status": "pending" },
        { "internationalVerification.status": "pending" },
        { verificationStatus: "pending" }, // Legacy support
      ],
    })
      .select(
        "name email verificationStatus domesticVerification internationalVerification verificationDocument createdAt"
      )
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    return pendingUsers;
  } catch (e) {
    throw e;
  }
};

/**
 * Approve a user's verification document for specific type
 * @param {string} userId - User ID to approve
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} verificationType - Type of verification ('domestic' or 'international')
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If user not found or not in pending status
 */
export const approveVerification = async (
  userId,
  adminId,
  verificationType = "domestic"
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    let notificationMessage = "";

    if (verificationType === "domestic") {
      if (user.domesticVerification?.status !== "pending") {
        throw new Error("Domestic verification is not in pending status");
      }

      user.domesticVerification.status = "verified";
      user.domesticVerification.document.reviewedAt = new Date();
      user.domesticVerification.document.reviewedBy = adminId;
      notificationMessage =
        "Your NID has been verified. You can now create domestic trips.";

      // Update legacy field for backward compatibility
      user.verificationStatus = "verified";
      if (user.verificationDocument) {
        user.verificationDocument.reviewedAt = new Date();
        user.verificationDocument.reviewedBy = adminId;
      }
    } else if (verificationType === "international") {
      if (user.internationalVerification?.status !== "pending") {
        throw new Error("International verification is not in pending status");
      }

      user.internationalVerification.status = "verified";
      user.internationalVerification.document.reviewedAt = new Date();
      user.internationalVerification.document.reviewedBy = adminId;
      notificationMessage =
        "Your passport has been verified. You can now create international trips.";
    } else {
      throw new Error("Invalid verification type");
    }

    await user.save();

    // Create notification for the user
    await createNotification({
      user: user._id,
      type: "verification_approved",
      title: "Verification Approved",
      message: notificationMessage,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
      verificationDocument: user.verificationDocument, // Legacy
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Reject a user's verification document for specific type
 * @param {string} userId - User ID to reject
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} verificationType - Type of verification ('domestic' or 'international')
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If user not found or not in pending status
 */
export const rejectVerification = async (
  userId,
  adminId,
  verificationType = "domestic"
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    let notificationMessage = "";

    if (verificationType === "domestic") {
      if (user.domesticVerification?.status !== "pending") {
        throw new Error("Domestic verification is not in pending status");
      }

      user.domesticVerification.status = "unverified";
      user.domesticVerification.document.reviewedAt = new Date();
      user.domesticVerification.document.reviewedBy = adminId;
      notificationMessage =
        "Your NID could not be verified. Please upload a valid NID document and try again.";

      // Update legacy field
      user.verificationStatus = "unverified";
      if (user.verificationDocument) {
        user.verificationDocument.reviewedAt = new Date();
        user.verificationDocument.reviewedBy = adminId;
      }
    } else if (verificationType === "international") {
      if (user.internationalVerification?.status !== "pending") {
        throw new Error("International verification is not in pending status");
      }

      user.internationalVerification.status = "unverified";
      user.internationalVerification.document.reviewedAt = new Date();
      user.internationalVerification.document.reviewedBy = adminId;
      notificationMessage =
        "Your passport could not be verified. Please upload a valid passport and try again.";
    } else {
      throw new Error("Invalid verification type");
    }

    await user.save();

    // Create notification for the user
    await createNotification({
      user: user._id,
      type: "verification_rejected",
      title: "Verification Rejected",
      message: notificationMessage,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
      verificationDocument: user.verificationDocument, // Legacy
    };
  } catch (e) {
    throw e;
  }
};

import User from "#models/user.model.js";
import { createNotification } from "./notification.service.js";

/**
 * Upload verification document for a user (NID or Passport)
 * @param {string} userId - User ID
 * @param {Object} fileInfo - File information from UploadThing
 * @param {string} fileInfo.key - UploadThing file key
 * @param {string} fileInfo.url - UploadThing file URL
 * @param {string} fileInfo.name - File name
 * @param {number} fileInfo.size - File size in bytes
 * @param {string} documentType - Type of document ('nid' or 'passport')
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If user not found or invalid document type
 */
export const uploadVerificationDocument = async (
  userId,
  fileInfo,
  documentType
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!["nid", "passport"].includes(documentType)) {
      throw new Error("Invalid document type. Must be 'nid' or 'passport'");
    }

    const documentData = {
      key: fileInfo.key,
      url: fileInfo.url,
      filename: fileInfo.name,
      size: fileInfo.size,
      uploadedAt: new Date(),
    };

    // Update appropriate verification based on document type
    if (documentType === "nid") {
      user.domesticVerification = {
        status: "pending",
        document: documentData,
      };
      // Also update legacy fields for backward compatibility
      user.verificationDocument = documentData;
      user.verificationStatus = "pending";
    } else if (documentType === "passport") {
      user.internationalVerification = {
        status: "pending",
        document: documentData,
      };
    }

    await user.save();

    // Notify all admin users about the document upload
    const adminUsers = await User.find({ role: "admin" });

    const documentTypeName = documentType === "nid" ? "NID" : "Passport";
    const notificationPromises = adminUsers.map((admin) =>
      createNotification({
        user: admin._id,
        type: "document_uploaded",
        title: "New Document Uploaded",
        message: `${user.name} has uploaded a ${documentTypeName} for verification`,
      })
    );

    // Create all notifications in parallel
    await Promise.all(notificationPromises);

    // Return user without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
      verificationDocument: user.verificationDocument, // Legacy field
    };
  } catch (e) {
    throw e;
  }
};

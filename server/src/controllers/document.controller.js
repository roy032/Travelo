import { uploadVerificationDocument } from "#services/document.service.js";
import { utapi } from "#config/uploadthing.config.js";

/**
 * Upload verification document (NID/Passport)
 * Requires authentication
 */
export const uploadDocument = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to upload documents",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "Validation failed",
        message: "No document file provided",
      });
    }

    // Get document type from request body (default to 'nid' for backward compatibility)
    const documentType = req.body.documentType || "nid";

    if (!["nid", "passport"].includes(documentType)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Document type must be 'nid' or 'passport'",
      });
    }

    const userId = req.user.id;

    // Upload file to UploadThing
    const uploadedFile = await utapi.uploadFiles(
      new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      })
    );

    if (!uploadedFile.data) {
      throw new Error("Failed to upload file to UploadThing");
    }

    const fileInfo = {
      key: uploadedFile.data.key,
      url: uploadedFile.data.url,
      name: uploadedFile.data.name,
      size: uploadedFile.data.size,
    };

    const updatedUser = await uploadVerificationDocument(
      userId,
      fileInfo,
      documentType
    );

    const documentTypeName = documentType === "nid" ? "NID" : "Passport";
    res.status(200).json({
      message: `${documentTypeName} uploaded successfully. Verification status set to pending.`,
      user: updatedUser,
      documentType,
    });
  } catch (e) {
    if (e.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }
    if (e.message.includes("Invalid document type")) {
      return res.status(400).json({ error: e.message });
    }
    console.error("Document upload error:", e);
    next(e);
  }
};

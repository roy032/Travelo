import { uploadVerificationDocument } from "#services/document.service.js";
import { storeFile } from "#config/uploadthing.config.js";

/**
 * Upload verification document (NID/Passport)
 * Requires authentication
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "You must be logged in to upload documents",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Validation failed",
        message: "No document file provided",
      });
    }

    const documentType = req.body.documentType || "nid";
    if (!["nid", "passport"].includes(documentType)) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Document type must be 'nid' or 'passport'",
      });
    }

    let fileInfo;
    try {
      fileInfo = await storeFile(req.file, {
        folder: "documents",
        metadata: { userId: req.user.id, documentType },
      });
    } catch (err) {
      console.error("Document upload error:", err);
      return res.status(500).json({
        error: "Upload failed",
        message: "Failed to upload document",
      });
    }

    const updatedUser = await uploadVerificationDocument(
      req.user.id,
      fileInfo,
      documentType
    );

    return res.status(200).json({
      message: `${documentType === "nid" ? "NID" : "Passport"} uploaded successfully. Verification pending.`,
      user: updatedUser,
      documentType,
    });
  } catch (e) {
    console.error("Upload error:", e);
    next(e);
  }
};

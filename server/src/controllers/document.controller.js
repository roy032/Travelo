import { uploadVerificationDocument } from "#services/document.service.js";
import { UTApi } from "uploadthing/server";

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

    const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

    // Convert Buffer → File (proper format for UploadThing)
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    console.log("Uploading:", {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.buffer.length,
    });

    let uploadResult;
    try {
      uploadResult = await utapi.uploadFiles([file], {
        metadata: { userId: req.user.id, documentType },
        contentDisposition: "inline",
      });
      console.log("Upload result:", JSON.stringify(uploadResult, null, 2));
    } catch (err) {
      console.error("UploadThing API error:", err);
      return res.status(500).json({
        error: "Upload failed",
        message: "Failed to upload file to UploadThing",
        details: err.message,
      });
    }

    // UploadThing returns array when passed array, get first result
    const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

    // Check for errors
    if (result?.error || !result?.data) {
      console.error("UploadThing error:", result);
      return res.status(500).json({
        error: "Upload failed",
        message:
          result?.error?.message || "Failed to upload file to UploadThing",
      });
    }

    const fileInfo = {
      key: result.data.key,
      url: result.data.url,
      name: result.data.name,
      size: result.data.size,
    };

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

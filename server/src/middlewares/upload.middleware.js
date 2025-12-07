import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Multer Middleware for File Parsing (Not Storage)
// Files will be uploaded to UploadThing, but we use Multer to parse multipart/form-data
// ============================================================================

// Memory storage for documents - files stored in buffer temporarily
const documentStorage = multer.memoryStorage();

// File filter for document uploads (NID/Passport)
const documentFileFilter = (req, file, cb) => {
  // Accept JPEG, PNG, and PDF formats
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file format. Only JPEG, PNG, and PDF files are allowed."
      ),
      false
    );
  }
};

// Create multer upload middleware for documents (memory storage)
export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("document"); // Expect a single file with field name 'document'

// Memory storage for receipts
const receiptStorage = multer.memoryStorage();

// File filter for receipt uploads
const receiptFileFilter = (req, file, cb) => {
  // Accept JPEG and PNG formats only
  const allowedMimeTypes = ["image/jpeg", "image/png"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file format. Only JPEG and PNG files are allowed."),
      false
    );
  }
};

// Create multer upload middleware for receipts (memory storage)
export const uploadReceipt = multer({
  storage: receiptStorage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("receipt"); // Expect a single file with field name 'receipt'

// Memory storage for photos
const photoStorage = multer.memoryStorage();

// File filter for photo uploads
const photoFileFilter = (req, file, cb) => {
  // Accept JPEG and PNG formats only
  const allowedMimeTypes = ["image/jpeg", "image/png"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file format. Only JPEG and PNG files are allowed."),
      false
    );
  }
};

// Create multer upload middleware for photos (memory storage)
export const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: photoFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("photo"); // Expect a single file with field name 'photo'

// Error handling middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "Upload failed",
        message: "File size exceeds the limit",
      });
    }
    return res.status(400).json({
      error: "Upload failed",
      message: err.message,
    });
  } else if (err) {
    // Handle custom errors from fileFilter
    return res.status(415).json({
      error: "Upload failed",
      message: err.message,
    });
  }
  next();
};

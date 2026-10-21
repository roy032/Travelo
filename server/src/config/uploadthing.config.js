import { UTApi } from "uploadthing/server";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Files go to UploadThing, except in development and tests without a token
// (or with FILE_STORAGE=local), where they are written to src/uploads and
// served from /uploads by app.js. Never used in production by default because
// the container disk is not persistent.
const LOCAL_PREFIX = "local:";
const uploadsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads"
);

export const localDocumentsDir = path.join(uploadsDir, "documents");

export const useLocalStorage = () =>
  process.env.FILE_STORAGE === "local" ||
  (!process.env.UPLOADTHING_TOKEN && process.env.NODE_ENV !== "production");

const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

// Initialize UploadThing API with token from environment
// For Node.js v20+, we use the native File API
export const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

/**
 * Upload a file to UploadThing
 * @param {File|Blob} file - The file to upload
 * @param {string} [fileName] - Optional custom filename
 * @returns {Promise<Object>} Upload result with url, key, and other metadata
 */
export const uploadFile = async (file, fileName) => {
  try {
    const result = await utapi.uploadFiles(file, {
      metadata: {
        fileName: fileName || file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Check for error in response
    if (result?.error || !result?.data) {
      console.error("UploadThing upload error:", result);
      throw new Error(
        result?.error?.message || "Failed to upload file to UploadThing"
      );
    }

    return result;
  } catch (error) {
    console.error("UploadThing upload error:", error);
    throw new Error(error.message || "Failed to upload file to UploadThing");
  }
};

/**
 * Store a file parsed by multer (memory storage)
 * @param {Object} multerFile - req.file from multer
 * @param {Object} [options]
 * @param {string} [options.folder] - Local sub-folder (photos, receipts, documents)
 * @param {Object} [options.metadata] - UploadThing metadata
 * @returns {Promise<{key: string, url: string, name: string, size: number}>}
 */
export const storeFile = async (multerFile, { folder = "files", metadata } = {}) => {
  if (useLocalStorage()) {
    const fileName = `${randomUUID()}${EXTENSIONS[multerFile.mimetype] || ""}`;
    const dir = path.join(uploadsDir, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), multerFile.buffer);
    return {
      key: `${LOCAL_PREFIX}${folder}/${fileName}`,
      // Identity documents are never public; admins view them through the API
      url:
        folder === "documents"
          ? `/api/documents/file/${fileName}`
          : `/uploads/${folder}/${fileName}`,
      name: multerFile.originalname,
      size: multerFile.size,
    };
  }

  const file = new File([multerFile.buffer], multerFile.originalname, {
    type: multerFile.mimetype,
  });
  const uploadResult = await utapi.uploadFiles([file], {
    ...(metadata && { metadata }),
    contentDisposition: "inline",
  });
  // UploadThing returns an array when passed an array
  const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
  if (result?.error || !result?.data) {
    console.error("UploadThing upload error:", result?.error);
    throw new Error(
      result?.error?.message || "Failed to upload file to UploadThing"
    );
  }
  return {
    key: result.data.key,
    url: result.data.ufsUrl || result.data.url,
    name: result.data.name,
    size: result.data.size,
  };
};

/**
 * Delete files from UploadThing
 * @param {string|string[]} fileKeys - File key(s) to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFiles = async (fileKeys) => {
  try {
    const keys = Array.isArray(fileKeys) ? fileKeys : [fileKeys];
    const localKeys = keys.filter((key) => key.startsWith(LOCAL_PREFIX));
    const remoteKeys = keys.filter((key) => !key.startsWith(LOCAL_PREFIX));

    for (const key of localKeys) {
      const filePath = path.resolve(uploadsDir, key.slice(LOCAL_PREFIX.length));
      if (filePath.startsWith(uploadsDir + path.sep)) {
        await unlink(filePath).catch(() => {});
      }
    }

    if (remoteKeys.length === 0) return { success: true };
    return await utapi.deleteFiles(remoteKeys);
  } catch (error) {
    console.error("UploadThing delete error:", error);
    throw new Error("Failed to delete file from UploadThing");
  }
};

/**
 * Get file URLs from UploadThing
 * @param {string|string[]} fileKeys - File key(s)
 * @returns {Promise<Array>} Array of file data with URLs
 */
export const getFileUrls = async (fileKeys) => {
  try {
    const keys = Array.isArray(fileKeys) ? fileKeys : [fileKeys];
    const result = await utapi.getFileUrls(keys);
    return result;
  } catch (error) {
    console.error("UploadThing get URLs error:", error);
    throw new Error("Failed to get file URLs from UploadThing");
  }
};

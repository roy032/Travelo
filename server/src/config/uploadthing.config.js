import { UTApi } from "uploadthing/server";

// Initialize UploadThing API with token from environment
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

    return result;
  } catch (error) {
    console.error("UploadThing upload error:", error);
    throw new Error("Failed to upload file to UploadThing");
  }
};

/**
 * Delete files from UploadThing
 * @param {string|string[]} fileKeys - File key(s) to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFiles = async (fileKeys) => {
  try {
    const keys = Array.isArray(fileKeys) ? fileKeys : [fileKeys];
    const result = await utapi.deleteFiles(keys);
    return result;
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

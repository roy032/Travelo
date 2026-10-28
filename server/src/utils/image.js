import path from "path";
import sharp from "sharp";

// Longest edge of a stored image; larger photos are scaled down
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 80;

/**
 * Shrink an uploaded image before it is sent to cloud storage.
 * Rotates it upright from its EXIF orientation, scales it to fit
 * MAX_DIMENSION, strips metadata (including GPS location) and re-encodes it
 * as WebP. Returns the original file if it cannot be processed or the
 * result would not be smaller.
 *
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file - multer file
 * @returns {Promise<{ buffer: Buffer, filename: string, mimetype: string }>}
 */
export const compressImage = async (file) => {
  const original = {
    buffer: file.buffer,
    filename: file.originalname,
    mimetype: file.mimetype,
  };

  if (!file.mimetype?.startsWith("image/")) return original;

  try {
    const buffer = await sharp(file.buffer, { failOn: "error" })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    if (buffer.length >= file.buffer.length) return original;

    const basename = path.parse(file.originalname).name || "image";
    return { buffer, filename: `${basename}.webp`, mimetype: "image/webp" };
  } catch (error) {
    console.error(
      "Image compression failed, uploading original:",
      error.message,
    );
    return original;
  }
};

/**
 * Compress an uploaded image, keeping the multer file shape so it can be
 * passed straight to storeFile.
 *
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file - multer file
 * @returns {Promise<{ buffer: Buffer, originalname: string, mimetype: string, size: number }>}
 */
export const compressUpload = async (file) => {
  const { buffer, filename, mimetype } = await compressImage(file);
  return { ...file, buffer, originalname: filename, mimetype, size: buffer.length };
};

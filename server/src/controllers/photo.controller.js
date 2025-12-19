import {
  uploadPhoto,
  deletePhoto,
  getPhotosByTrip,
} from "#services/photo.service.js";
import { utapi } from "#config/uploadthing.config.js";

/**
 * Upload a photo to a trip
 */
export const uploadPhotoController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Photo file is required",
      });
    }

    // Upload file to UploadThing using proper File format
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const uploadResult = await utapi.uploadFiles([file]);

    // UploadThing returns array when passed array, get first result
    const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

    // Check for errors
    if (result?.error || !result?.data) {
      console.error("UploadThing error:", result);
      throw new Error(
        result?.error?.message || "Failed to upload photo to cloud storage"
      );
    }

    const photoData = {
      trip: tripId,
      filename: req.file.originalname,
      url: result.data.url,
      fileKey: result.data.key,
      caption: req.body.caption || "",
      uploader: req.user.id, // From authentication middleware
    };

    const photo = await uploadPhoto(photoData);

    res.status(201).json({
      message: "Photo uploaded successfully",
      photo,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    next(e);
  }
};

/**
 * Delete a photo
 */
export const deletePhotoController = async (req, res, next) => {
  try {
    const { photoId } = req.params;

    const result = await deletePhoto(photoId, req.user.id);

    res.status(200).json(result);
  } catch (e) {
    if (e.message === "Photo not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Photo not found",
      });
    }

    if (
      e.message ===
      "Access denied: Only the photo uploader can delete this photo"
    ) {
      return res.status(403).json({
        error: "Access denied",
        message: "Only the photo uploader can delete this photo",
      });
    }

    next(e);
  }
};

/**
 * Get all photos for a trip
 */
export const getPhotosController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const photos = await getPhotosByTrip(tripId, req.user.id);

    res.status(200).json({
      photos,
      count: photos.length,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "Trip not found",
      });
    }

    if (e.message === "Access denied: You are not a member of this trip") {
      return res.status(403).json({
        error: "Access denied",
        message: "You are not a member of this trip",
      });
    }

    next(e);
  }
};

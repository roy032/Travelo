import Photo from "#models/photo.model.js";
import Trip from "#models/trip.model.js";
import Notification from "#models/notification.model.js";
import { deleteFiles } from "#config/uploadthing.config.js";

/**
 * Upload a photo to a trip
 * @param {Object} photoData - Photo upload data
 * @param {string} photoData.trip - Trip ID
 * @param {string} photoData.filename - Photo filename
 * @param {string} photoData.url - Photo URL from UploadThing
 * @param {string} photoData.fileKey - UploadThing file key
 * @param {string} photoData.caption - Photo caption (optional)
 * @param {string} photoData.uploader - User ID of the uploader
 * @returns {Promise<Object>} Created photo object
 * @throws {Error} If validation fails or trip not found
 */
export const uploadPhoto = async (photoData) => {
  try {
    const { trip, filename, url, fileKey, caption, uploader } = photoData;

    // Verify trip exists
    const tripDoc = await Trip.findById(trip);

    if (!tripDoc) {
      throw new Error("Trip not found");
    }

    // Create new photo
    const photo = new Photo({
      trip,
      filename,
      url,
      fileKey,
      caption,
      uploader,
      uploadedAt: new Date(),
    });

    await photo.save();

    // Populate uploader information
    await photo.populate("uploader", "name email");

    // Create notifications for all trip members except the uploader
    const notifications = tripDoc.members
      .filter((member) => member.toString() !== uploader.toString())
      .map((member) => ({
        user: member,
        type: "photo_uploaded",
        title: "New Photo Uploaded",
        message: `A new photo has been uploaded to the trip`,
        relatedTrip: trip,
        relatedResource: photo._id,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return {
      id: photo._id,
      trip: photo.trip,
      filename: photo.filename,
      url: photo.url,
      fileKey: photo.fileKey,
      caption: photo.caption,
      uploader: photo.uploader,
      uploadedAt: photo.uploadedAt,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Delete a photo with file removal from UploadThing
 * @param {string} photoId - Photo ID
 * @param {string} userId - User ID attempting to delete
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If photo not found or user is not the uploader
 */
export const deletePhoto = async (photoId, userId) => {
  try {
    // Find the photo
    const photo = await Photo.findById(photoId);

    if (!photo) {
      throw new Error("Photo not found");
    }

    // Verify user is the uploader
    if (photo.uploader.toString() !== userId.toString()) {
      throw new Error(
        "Access denied: Only the photo uploader can delete this photo"
      );
    }

    const fileKey = photo.fileKey;

    // Delete the photo from database
    await Photo.findByIdAndDelete(photoId);

    // Delete the photo file from UploadThing
    if (fileKey) {
      try {
        await deleteFiles(fileKey);
      } catch (fileError) {
        // Log the error but don't fail the deletion
        console.error(
          `Failed to delete photo file from UploadThing: ${fileKey}`,
          fileError
        );
        // Continue with photo deletion even if file deletion fails
      }
    }

    return {
      message: "Photo deleted successfully",
      photoId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all photos for a trip
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the photos
 * @returns {Promise<Array>} Array of photo objects
 * @throws {Error} If trip not found or user is not a member
 */
export const getPhotosByTrip = async (tripId, userId) => {
  try {
    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error("Access denied: You are not a member of this trip");
    }

    // Get all photos for the trip, sorted by upload date (newest first)
    const photos = await Photo.find({ trip: tripId })
      .populate("uploader", "name email")
      .sort({ uploadedAt: -1 });

    return photos.map((photo) => ({
      id: photo._id,
      trip: photo.trip,
      filename: photo.filename,
      url: photo.url,
      fileKey: photo.fileKey,
      caption: photo.caption,
      uploader: photo.uploader,
      uploadedAt: photo.uploadedAt,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    }));
  } catch (e) {
    throw e;
  }
};

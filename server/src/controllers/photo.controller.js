import {
  uploadPhoto,
  deletePhoto,
  getPhotosByTrip,
} from '#services/photo.service.js';

/**
 * Upload a photo to a trip
 */
export const uploadPhotoController = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Photo file is required',
      });
    }

    const photoData = {
      trip: tripId,
      filename: req.file.filename,
      path: req.file.path,
      caption: req.body.caption || '',
      uploader: req.user.id, // From authentication middleware
    };

    const photo = await uploadPhoto(photoData);

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo,
    });
  } catch (e) {
    if (e.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
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
    if (e.message === 'Photo not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Photo not found',
      });
    }

    if (e.message === 'Access denied: Only the photo uploader can delete this photo') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the photo uploader can delete this photo',
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
    if (e.message === 'Trip not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    }

    if (e.message === 'Access denied: You are not a member of this trip') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this trip',
      });
    }

    next(e);
  }
};

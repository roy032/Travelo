import { getUserProfile, updateProfile } from '#services/users.service.js';
import { updateProfileSchema } from '#validations/user.validation.js';
import { formatValidationError } from '#utils/format.js';

/**
 * Get current user's profile
 */
export const getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to view your profile',
      });
    }

    const profile = await getUserProfile(req.user.id);

    res.json({
      message: 'Profile retrieved successfully',
      user: profile,
    });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'User not found',
      });
    }

    next(e);
  }
};

/**
 * Update current user's profile
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to update your profile',
      });
    }

    // Validate the update data
    const validationResult = updateProfileSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    const updatedProfile = await updateProfile(req.user.id, updates);

    res.json({
      message: 'Profile updated successfully',
      user: updatedProfile,
    });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'User not found',
      });
    }

    if (e.message === 'Email already exists') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already exists',
      });
    }

    if (e.message === 'Current password is required to change password') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password is required to change password',
      });
    }

    if (e.message === 'Current password is incorrect') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password is incorrect',
      });
    }

    next(e);
  }
};

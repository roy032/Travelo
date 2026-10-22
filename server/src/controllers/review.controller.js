import {
  reviewSchema,
  reviewListQuerySchema,
} from '#validations/review.validation.js';
import { formatValidationError } from '#utils/format.js';
import {
  getDestinationReviews,
  getUserReview,
  upsertReview,
  deleteReview,
} from '#services/review.service.js';

const validationFailed = (res, error) =>
  res.status(400).json({
    error: 'Validation failed',
    details: formatValidationError(error),
  });

/**
 * Get reviews for a destination (public)
 */
export const getReviewsController = async (req, res, next) => {
  try {
    const validationResult = reviewListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    const result = await getDestinationReviews(
      req.params.destinationId,
      validationResult.data
    );
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
};

/**
 * Get the signed-in user's review of a destination
 */
export const getMyReviewController = async (req, res, next) => {
  try {
    const review = await getUserReview(req.params.destinationId, req.user.id);
    res.status(200).json({ review });
  } catch (e) {
    next(e);
  }
};

/**
 * Create or update the signed-in user's review of a destination
 */
export const upsertReviewController = async (req, res, next) => {
  try {
    const validationResult = reviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    const { review, created, rating } = await upsertReview(
      req.params.destinationId,
      req.user.id,
      validationResult.data
    );

    res.status(created ? 201 : 200).json({
      message: created ? 'Review posted' : 'Review updated',
      review,
      rating,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Delete a review (author or admin)
 */
export const deleteReviewController = async (req, res, next) => {
  try {
    const rating = await deleteReview(
      req.params.destinationId,
      req.params.reviewId,
      req.user
    );
    res.status(200).json({ message: 'Review deleted', rating });
  } catch (e) {
    next(e);
  }
};

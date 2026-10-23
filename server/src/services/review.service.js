import mongoose from 'mongoose';
import Review from '#models/review.model.js';
import Destination from '#models/destination.model.js';
import { AuthorizationError, NotFoundError } from '#errors/AppError.js';

const toReviewResponse = (review) => ({
  id: review._id,
  destinationId: review.destination?._id || review.destination,
  rating: review.rating,
  comment: review.comment,
  author: review.user?._id
    ? { id: review.user._id, name: review.user.name }
    : { id: review.user, name: null },
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const assertDestinationExists = async (destinationId) => {
  if (!mongoose.Types.ObjectId.isValid(destinationId)) {
    throw new NotFoundError('Destination not found');
  }
  const exists = await Destination.exists({ _id: destinationId });
  if (!exists) {
    throw new NotFoundError('Destination not found');
  }
};

/**
 * Recalculate a destination's average rating and review count from its reviews
 * @param {string} destinationId - Destination ID
 * @returns {Promise<{ratingAverage: number, ratingCount: number}>}
 */
export const refreshDestinationRating = async (destinationId) => {
  const [stats] = await Review.aggregate([
    { $match: { destination: new mongoose.Types.ObjectId(destinationId) } },
    {
      $group: {
        _id: '$destination',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const rating = {
    ratingAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
    ratingCount: stats ? stats.count : 0,
  };
  await Destination.updateOne({ _id: destinationId }, rating);
  return rating;
};

/**
 * Get reviews for a destination, newest first, with a rating breakdown
 * @param {string} destinationId - Destination ID
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Reviews per page
 * @returns {Promise<Object>} Reviews, pagination and summary
 */
export const getDestinationReviews = async (
  destinationId,
  { page = 1, limit = 10 } = {}
) => {
  await assertDestinationExists(destinationId);

  const [reviews, total, breakdownRows] = await Promise.all([
    Review.find({ destination: destinationId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments({ destination: destinationId }),
    Review.aggregate([
      { $match: { destination: new mongoose.Types.ObjectId(destinationId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const row of breakdownRows) {
    breakdown[row._id] = row.count;
    sum += row._id * row.count;
  }

  return {
    reviews: reviews.map(toReviewResponse),
    summary: {
      ratingAverage: total ? Math.round((sum / total) * 10) / 10 : 0,
      ratingCount: total,
      breakdown,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get the signed-in user's review of a destination, if they wrote one
 * @param {string} destinationId - Destination ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Review or null
 */
export const getUserReview = async (destinationId, userId) => {
  await assertDestinationExists(destinationId);
  const review = await Review.findOne({
    destination: destinationId,
    user: userId,
  }).populate('user', 'name');
  return review ? toReviewResponse(review) : null;
};

/**
 * Create or update the user's review of a destination (one per user)
 * @param {string} destinationId - Destination ID
 * @param {string} userId - User ID
 * @param {Object} data - Validated review data
 * @param {number} data.rating - 1 to 5
 * @param {string} data.comment - Optional text
 * @returns {Promise<{review: Object, created: boolean, rating: Object}>}
 */
export const upsertReview = async (destinationId, userId, { rating, comment }) => {
  await assertDestinationExists(destinationId);

  const existing = await Review.findOne({
    destination: destinationId,
    user: userId,
  });

  let review;
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    review = await existing.save();
  } else {
    review = await Review.create({
      destination: destinationId,
      user: userId,
      rating,
      comment,
    });
  }

  await review.populate('user', 'name');
  const destinationRating = await refreshDestinationRating(destinationId);

  return {
    review: toReviewResponse(review),
    created: !existing,
    rating: destinationRating,
  };
};

/**
 * Delete a review. Authors can delete their own; admins can delete any.
 * @param {string} destinationId - Destination ID
 * @param {string} reviewId - Review ID
 * @param {Object} user - Authenticated user ({ id, role })
 * @returns {Promise<Object>} The destination's updated rating
 */
export const deleteReview = async (destinationId, reviewId, user) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new NotFoundError('Review not found');
  }

  const review = await Review.findOne({
    _id: reviewId,
    destination: destinationId,
  });
  if (!review) {
    throw new NotFoundError('Review not found');
  }

  const isAuthor = review.user.toString() === user.id.toString();
  if (!isAuthor && user.role !== 'admin') {
    throw new AuthorizationError('You can only delete your own reviews');
  }

  await review.deleteOne();
  return refreshDestinationRating(destinationId);
};

import express from 'express';
import {
  getDestinationsController,
  getDestinationCountriesController,
  getDestinationByIdController,
} from '#controllers/destination.controller.js';
import {
  getReviewsController,
  getMyReviewController,
  upsertReviewController,
  deleteReviewController,
} from '#controllers/review.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';
import { createRateLimiter } from '#middlewares/rateLimit.middleware.js';

const router = express.Router();

// Limits review spam from a single client
const reviewWriteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many review changes, please try again later',
});

// Get all destinations with optional filtering and search
// Query parameters: search, category, country, minRating, sort
router.get('/', getDestinationsController);

// Countries that have destinations, for the country filter
router.get('/countries', getDestinationCountriesController);

// Get a specific destination by ID
router.get('/:destinationId', getDestinationByIdController);

// Reviews: anyone can read, signed-in users can write
router.get('/:destinationId/reviews', getReviewsController);
router.get('/:destinationId/reviews/me', authenticateToken, getMyReviewController);
router.put(
  '/:destinationId/reviews',
  authenticateToken,
  reviewWriteLimiter,
  upsertReviewController
);
router.delete(
  '/:destinationId/reviews/:reviewId',
  authenticateToken,
  reviewWriteLimiter,
  deleteReviewController
);

export default router;

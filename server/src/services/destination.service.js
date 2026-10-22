import mongoose from 'mongoose';
import Destination from '#models/destination.model.js';
import { escapeRegex } from '#validations/search.validation.js';

const toDestinationResponse = (destination) => ({
  id: destination._id,
  name: destination.name,
  description: destination.description,
  category: destination.category,
  country: destination.country,
  images: destination.images,
  featuredImage:
    destination.images.find((img) => img.isFeatured) || destination.images[0],
  highlights: destination.highlights,
  bestTimeToVisit: destination.bestTimeToVisit,
  ratingAverage: destination.ratingAverage || 0,
  ratingCount: destination.ratingCount || 0,
  createdAt: destination.createdAt,
});

const SORT_OPTIONS = {
  name: { name: 1 },
  rating: { ratingAverage: -1, ratingCount: -1, name: 1 },
  reviews: { ratingCount: -1, ratingAverage: -1, name: 1 },
  newest: { createdAt: -1 },
};

/**
 * Get all destinations with optional filtering and search
 * @param {Object} options - Query options
 * @param {string} options.category - Filter by category
 * @param {string} options.search - Search by name, description or country
 * @param {string} options.country - Filter by country (case-insensitive exact match)
 * @param {number} options.minRating - Only destinations rated at least this
 * @param {string} options.sort - name (default), rating, reviews or newest
 * @returns {Promise<Array>} Array of destination objects
 */
export const getDestinations = async ({
  category,
  search,
  country,
  minRating,
  sort,
} = {}) => {
  // Build query object
  const query = {};

  // Add category filter if provided
  if (typeof category === 'string' && category) {
    query.category = category;
  }

  if (typeof country === 'string' && country.trim()) {
    query.country = {
      $regex: `^${escapeRegex(country.trim().slice(0, 100))}$`,
      $options: 'i',
    };
  }

  if (typeof minRating === 'number' && minRating > 0) {
    query.ratingAverage = { $gte: minRating };
  }

  // Add search filter if provided (case-insensitive search in name and description)
  // (escape user input so it is matched literally, not as a regex)
  if (typeof search === 'string' && search.trim()) {
    const pattern = escapeRegex(search.trim().slice(0, 100));
    query.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { description: { $regex: pattern, $options: 'i' } },
      { country: { $regex: pattern, $options: 'i' } },
    ];
  }

  const destinations = await Destination.find(query).sort(
    SORT_OPTIONS[sort] || SORT_OPTIONS.name
  );

  return destinations.map(toDestinationResponse);
};

/**
 * Get every country that has at least one destination, for filter dropdowns
 * @returns {Promise<Array<string>>} Sorted country names
 */
export const getDestinationCountries = async () => {
  const countries = await Destination.distinct('country');
  return countries.sort((a, b) => a.localeCompare(b));
};

/**
 * Get a destination by ID
 * @param {string} destinationId - Destination ID
 * @returns {Promise<Object>} Destination object
 * @throws {Error} If destination not found
 */
export const getDestinationById = async (destinationId) => {
  const destination = mongoose.Types.ObjectId.isValid(destinationId)
    ? await Destination.findById(destinationId)
    : null;

  if (!destination) {
    throw new Error('Destination not found');
  }

  return toDestinationResponse(destination);
};

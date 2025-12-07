import Destination from '#models/destination.model.js';

/**
 * Get all destinations with optional filtering and search
 * @param {Object} options - Query options
 * @param {string} options.category - Filter by category
 * @param {string} options.search - Search by name or keyword
 * @returns {Promise<Array>} Array of destination objects
 */
export const getDestinations = async ({ category, search } = {}) => {
  try {
    // Build query object
    const query = {};

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Add search filter if provided (case-insensitive search in name and description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    // Find destinations matching the query
    const destinations = await Destination.find(query).sort({ name: 1 });

    return destinations.map((destination) => ({
      id: destination._id,
      name: destination.name,
      description: destination.description,
      category: destination.category,
      country: destination.country,
      images: destination.images,
      featuredImage: destination.images.find((img) => img.isFeatured) || destination.images[0],
      highlights: destination.highlights,
      bestTimeToVisit: destination.bestTimeToVisit,
      createdAt: destination.createdAt,
    }));
  } catch (e) {
    throw e;
  }
};

/**
 * Get a destination by ID
 * @param {string} destinationId - Destination ID
 * @returns {Promise<Object>} Destination object
 * @throws {Error} If destination not found
 */
export const getDestinationById = async (destinationId) => {
  try {
    const destination = await Destination.findById(destinationId);

    if (!destination) {
      throw new Error('Destination not found');
    }

    return {
      id: destination._id,
      name: destination.name,
      description: destination.description,
      category: destination.category,
      country: destination.country,
      images: destination.images,
      highlights: destination.highlights,
      bestTimeToVisit: destination.bestTimeToVisit,
      createdAt: destination.createdAt,
    };
  } catch (e) {
    throw e;
  }
};

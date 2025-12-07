import {
  getDestinations,
  getDestinationById,
} from '#services/destination.service.js';

/**
 * Get all destinations with optional filtering and search
 */
export const getDestinationsController = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const destinations = await getDestinations({ category, search });

    res.status(200).json({
      destinations,
      count: destinations.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Get a single destination by ID
 */
export const getDestinationByIdController = async (req, res, next) => {
  try {
    const { destinationId } = req.params;

    const destination = await getDestinationById(destinationId);

    res.status(200).json({
      destination,
    });
  } catch (e) {
    if (e.message === 'Destination not found') {
      return res.status(404).json({
        error: 'Resource not found',
        message: 'Destination not found',
      });
    }

    next(e);
  }
};

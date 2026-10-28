import {
  getDestinations,
  getDestinationCountries,
  getDestinationById,
} from '#services/destination.service.js';
import { destinationQuerySchema } from '#validations/search.validation.js';
import { formatValidationError } from '#utils/format.js';

/**
 * Get all destinations with optional filtering and search
 */
export const getDestinationsController = async (req, res, next) => {
  try {
    const validationResult = destinationQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const destinations = await getDestinations(validationResult.data);

    res.status(200).json({
      destinations,
      count: destinations.length,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Get the list of countries that have destinations
 */
export const getDestinationCountriesController = async (req, res, next) => {
  try {
    const countries = await getDestinationCountries();
    res.status(200).json({ countries });
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

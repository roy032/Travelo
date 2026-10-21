import {
  favoriteSchema,
  favoriteListQuerySchema,
} from '#validations/favorite.validation.js';
import { formatValidationError } from '#utils/format.js';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  getFavoriteIds,
} from '#services/favorite.service.js';

const validationFailed = (res, error) =>
  res.status(400).json({
    error: 'Validation failed',
    details: formatValidationError(error),
  });

/**
 * Get the user's saved destinations and trips
 */
export const getFavoritesController = async (req, res, next) => {
  try {
    const validationResult = favoriteListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    const favorites = await getFavorites(req.user.id, validationResult.data.itemType);
    res.status(200).json(favorites);
  } catch (e) {
    next(e);
  }
};

/**
 * Get only the IDs of saved items, grouped by type
 */
export const getFavoriteIdsController = async (req, res, next) => {
  try {
    const ids = await getFavoriteIds(req.user.id);
    res.status(200).json(ids);
  } catch (e) {
    next(e);
  }
};

/**
 * Save a destination or trip
 */
export const addFavoriteController = async (req, res, next) => {
  try {
    const validationResult = favoriteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    const { itemType, itemId } = validationResult.data;
    const { created } = await addFavorite(req.user.id, itemType, itemId);

    res.status(created ? 201 : 200).json({
      message: created ? 'Saved to favorites' : 'Already in favorites',
      itemType,
      itemId,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Remove a saved destination or trip
 */
export const removeFavoriteController = async (req, res, next) => {
  try {
    const validationResult = favoriteSchema.safeParse({
      itemType: req.params.itemType,
      itemId: req.params.itemId,
    });
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    const { itemType, itemId } = validationResult.data;
    const { removed } = await removeFavorite(req.user.id, itemType, itemId);

    res.status(200).json({
      message: removed ? 'Removed from favorites' : 'Not in favorites',
      itemType,
      itemId,
    });
  } catch (e) {
    next(e);
  }
};

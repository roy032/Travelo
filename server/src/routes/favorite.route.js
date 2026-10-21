import express from 'express';
import {
  getFavoritesController,
  getFavoriteIdsController,
  addFavoriteController,
  removeFavoriteController,
} from '#controllers/favorite.controller.js';
import { authenticateToken } from '#middlewares/auth.middleware.js';

const router = express.Router();

// All favorite routes require authentication
router.use(authenticateToken);

// Get saved destinations and trips with details (optional ?itemType=destination|trip)
router.get('/', getFavoritesController);

// Get just the saved IDs, grouped by type
router.get('/ids', getFavoriteIdsController);

// Save an item: { itemType, itemId }
router.post('/', addFavoriteController);

// Remove a saved item
router.delete('/:itemType/:itemId', removeFavoriteController);

export default router;

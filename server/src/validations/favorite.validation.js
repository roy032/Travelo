import { z } from 'zod';
import { FAVORITE_TYPES } from '#models/favorite.model.js';

const objectId = z
  .string('Item ID is required')
  .regex(/^[a-f\d]{24}$/i, 'Invalid item ID');

export const favoriteSchema = z.object({
  itemType: z.enum(FAVORITE_TYPES, 'Item type must be destination or trip'),
  itemId: objectId,
});

export const favoriteListQuerySchema = z.object({
  itemType: z.enum(FAVORITE_TYPES).optional(),
});

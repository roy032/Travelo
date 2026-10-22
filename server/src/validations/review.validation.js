import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.coerce
    .number('Rating is required')
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .trim()
    .max(2000, 'Review must not exceed 2000 characters')
    .optional()
    .default(''),
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

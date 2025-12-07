import { z } from 'zod';

export const createChecklistItemSchema = z.object({
  text: z
    .string()
    .min(1, 'Text must be at least 1 character')
    .max(200, 'Text must not exceed 200 characters')
    .trim(),
});

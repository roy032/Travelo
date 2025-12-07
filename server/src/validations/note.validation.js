import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string()
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must not exceed 10000 characters')
    .trim(),
  visibility: z
    .enum(['private', 'shared'], {
      errorMap: () => ({ message: 'Visibility must be either private or shared' }),
    })
    .default('shared'),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, 'Content must be at least 1 character')
    .max(10000, 'Content must not exceed 10000 characters')
    .trim()
    .optional(),
  visibility: z
    .enum(['private', 'shared'], {
      errorMap: () => ({ message: 'Visibility must be either private or shared' }),
    })
    .optional(),
});

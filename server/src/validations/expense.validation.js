import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .min(0.01, 'Amount must be at least 0.01'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .toUpperCase()
    .optional()
    .default('USD'),
  category: z.enum(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  payer: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payer ID format'),
});

export const updateExpenseSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .min(0.01, 'Amount must be at least 0.01')
    .optional(),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .toUpperCase()
    .optional(),
  category: z
    .enum(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'], {
      errorMap: () => ({ message: 'Invalid category' }),
    })
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  payer: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payer ID format')
    .optional(),
});

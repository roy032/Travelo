import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128),
});

export const signInSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email().max(255).toLowerCase().trim(),
});

// Tokens are 64 hex characters (32 random bytes)
const emailTokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/i, 'Invalid or expired link');

export const resetPasswordSchema = z.object({
  token: emailTokenSchema,
  password: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: emailTokenSchema,
});

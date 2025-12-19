import { z } from "zod";

export const sendMessageSchema = z.object({
  text: z
    .string({ required_error: "Message text is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must not exceed 2000 characters"),
});

export const getMessagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10).optional(),
  before: z.coerce
    .date()
    .optional()
    .or(
      z
        .string()
        .transform((val) => new Date(val))
        .optional()
    ),
});

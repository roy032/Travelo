import { z } from "zod";
import { createActivitySchema } from "#validations/activity.validation.js";

export const PLAN_PACES = ["relaxed", "balanced", "packed"];

export const planRequestSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(2, "Destination must be at least 2 characters")
    .max(120, "Destination must not exceed 120 characters"),
  budget: z
    .object({
      amount: z.number().positive("Budget must be more than 0").max(10_000_000),
      currency: z
        .string()
        .trim()
        .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code")
        .transform((code) => code.toUpperCase()),
    })
    .optional(),
  interests: z
    .array(z.string().trim().min(1).max(40))
    .max(10, "Choose up to 10 interests")
    .optional()
    .default([]),
  pace: z.enum(PLAN_PACES).optional().default("balanced"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .default(""),
});

export const applyPlanSchema = z.object({
  activities: z
    .array(createActivitySchema)
    .min(1, "Choose at least one activity")
    .max(80, "A plan can add at most 80 activities"),
});

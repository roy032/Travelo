import { z } from "zod";

// Time format validation (HH:MM)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createActivitySchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .or(z.literal("")), // Allow empty string
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  time: z.string().regex(timeRegex, "Time must be in HH:MM format"),
  location: z.object({
    name: z.string().min(1, "Location name is required").trim(),
    address: z.string().trim().optional().or(z.literal("")), // Allow empty string
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    country: z.string().trim().optional().or(z.literal("")), // Allow empty string
  }),
});

export const updateActivitySchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional(),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
  time: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
  location: z
    .object({
      name: z.string().min(1, "Location name is required").trim(),
      address: z.string().trim().optional(),
      coordinates: z
        .object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        })
        .optional(), // Optional during update as fail-safe
      country: z.string().trim().optional(),
    })
    .optional(),
});

import { z } from "zod";

export const createTripSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must not exceed 200 characters")
      .trim(),
    description: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .trim()
      .optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date format",
    }),
    destinationType: z
      .enum(["beach", "mountain", "city", "countryside", "other"])
      .optional(),
    tripCategory: z.enum(["domestic", "international"], {
      errorMap: () => ({
        message: "Trip category must be either domestic or international",
      }),
    }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    }
  );

export const updateTripSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must not exceed 200 characters")
      .trim()
      .optional(),
    description: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .trim()
      .optional(),
    startDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format",
      })
      .optional(),
    endDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format",
      })
      .optional(),
    destinationType: z
      .enum(["beach", "mountain", "city", "countryside", "other"])
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate date range if both dates are provided
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["endDate"],
    }
  );

export const adminDeleteTripSchema = z.object({
  message: z
    .string({ required_error: "Deletion message is required" })
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must not exceed 1000 characters")
    .trim(),
  reportId: z.string().optional(), // Optional - if deletion is triggered from a report
});

import { z } from "zod";

export const createReportSchema = z.object({
  category: z.enum(
    ["spam", "inappropriate", "fake", "unsafe", "copyright", "other"],
    {
      errorMap: () => ({ message: "Invalid report category" }),
    }
  ),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .trim(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(["resolved"], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
  message: z
    .string({ required_error: "Action message is required" })
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must not exceed 1000 characters")
    .trim(),
});

export const filterReportsSchema = z.object({
  category: z
    .enum(["spam", "inappropriate", "fake", "unsafe", "copyright", "other"])
    .optional(),
  status: z.enum(["pending", "reviewed", "resolved", "dismissed"]).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  sortBy: z
    .enum(["createdAt", "status", "category"])
    .default("createdAt")
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

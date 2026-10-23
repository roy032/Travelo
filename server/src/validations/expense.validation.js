import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "#services/currency.service.js";

const objectId = (message) => z.string().regex(/^[0-9a-fA-F]{24}$/, message);

const currency = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => SUPPORTED_CURRENCIES.includes(code), {
    message: "Unsupported currency",
  });

const category = z.enum(
  ["food", "transport", "accommodation", "activities", "shopping", "other"],
  {
    error: "Invalid category",
  }
);

// Multipart forms send the list as JSON text or comma-separated ids
const splitBetween = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      return JSON.parse(text);
    } catch {
      return value;
    }
  }
  return text.split(",").map((id) => id.trim());
}, z.array(objectId("Invalid member ID format")).max(100));

export const createExpenseSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .min(0.01, "Amount must be at least 0.01"),
  // Defaults to the trip's base currency
  currency: currency.optional(),
  category,
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters")
    .trim(),
  payer: objectId("Invalid payer ID format"),
  splitBetween: splitBetween.optional(),
});

export const updateExpenseSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .min(0.01, "Amount must be at least 0.01")
    .optional(),
  currency: currency.optional(),
  category: category.optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),
  payer: objectId("Invalid payer ID format").optional(),
  splitBetween: splitBetween.optional(),
});

export const createSettlementSchema = z
  .object({
    from: objectId("Invalid member ID format"),
    to: objectId("Invalid member ID format"),
    amount: z.coerce
      .number({ error: "Amount must be a number" })
      .min(0.01, "Amount must be at least 0.01")
      .max(1e12, "Amount is too large"),
    note: z.string().trim().max(200, "Note must not exceed 200 characters").optional(),
  })
  .refine((data) => data.from !== data.to, {
    message: "A member cannot pay themselves",
    path: ["to"],
  });

export const convertQuerySchema = z.object({
  amount: z.coerce
    .number({ error: "Amount must be a number" })
    .min(0, "Amount cannot be negative")
    .max(1e12, "Amount is too large")
    .default(1),
  from: currency,
  to: currency,
});

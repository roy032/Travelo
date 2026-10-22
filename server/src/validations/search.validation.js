import { z } from 'zod';

// Empty query-string values ("?category=") are treated as "not set"
const optionalString = (max = 100) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional()
  );

const optionalEnum = (values) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.enum(values).optional());

const optionalDate = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.coerce.date('Invalid date').optional()
);

const optionalInt = (min, max) =>
  z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().int().min(min).max(max).optional()
  );

export const DESTINATION_CATEGORIES = [
  'beach',
  'mountain',
  'city',
  'countryside',
  'historical',
  'adventure',
];

export const destinationQuerySchema = z.object({
  search: optionalString(),
  category: optionalEnum(DESTINATION_CATEGORIES),
  country: optionalString(),
  minRating: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().min(0).max(5).optional()
  ),
  sort: optionalEnum(['name', 'rating', 'reviews', 'newest']),
});

export const exploreQuerySchema = z
  .object({
    search: optionalString(),
    destinationType: optionalEnum([
      'beach',
      'mountain',
      'city',
      'countryside',
      'other',
    ]),
    tripCategory: optionalEnum(['domestic', 'international']),
    from: optionalDate,
    to: optionalDate,
    minDays: optionalInt(1, 365),
    maxDays: optionalInt(1, 365),
    sort: optionalEnum(['soonest', 'latest', 'newest', 'shortest', 'longest']),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'Start of date range must be before the end',
    path: ['to'],
  })
  .refine((q) => !q.minDays || !q.maxDays || q.minDays <= q.maxDays, {
    message: 'Minimum days must not exceed maximum days',
    path: ['maxDays'],
  });

export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

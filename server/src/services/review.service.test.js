import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#models/review.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
}));
vi.mock('#models/destination.model.js', () => ({
  default: {
    exists: vi.fn(),
    updateOne: vi.fn(),
  },
}));

const { default: Review } = await import('#models/review.model.js');
const { default: Destination } = await import('#models/destination.model.js');
const { upsertReview, deleteReview, refreshDestinationRating } = await import(
  '#services/review.service.js'
);

const destinationId = '64b000000000000000000001';
const userId = '64b000000000000000000002';
const otherUserId = '64b000000000000000000003';
const reviewId = '64b000000000000000000004';

const fakeReview = (fields) => ({
  _id: reviewId,
  destination: destinationId,
  user: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  populate: vi.fn().mockResolvedValue(undefined),
  save: vi.fn(function () {
    return Promise.resolve(this);
  }),
  deleteOne: vi.fn().mockResolvedValue(undefined),
  ...fields,
});

describe('review service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Destination.exists.mockResolvedValue({ _id: destinationId });
    Destination.updateOne.mockResolvedValue({});
  });

  describe('refreshDestinationRating', () => {
    it('stores the rounded average and count on the destination', async () => {
      Review.aggregate.mockResolvedValue([{ average: 4.333, count: 3 }]);

      const rating = await refreshDestinationRating(destinationId);

      expect(rating).toEqual({ ratingAverage: 4.3, ratingCount: 3 });
      expect(Destination.updateOne).toHaveBeenCalledWith(
        { _id: destinationId },
        { ratingAverage: 4.3, ratingCount: 3 }
      );
    });

    it('resets the rating when no reviews are left', async () => {
      Review.aggregate.mockResolvedValue([]);
      expect(await refreshDestinationRating(destinationId)).toEqual({
        ratingAverage: 0,
        ratingCount: 0,
      });
    });
  });

  describe('upsertReview', () => {
    it('creates a review the first time', async () => {
      Review.findOne.mockResolvedValue(null);
      Review.create.mockResolvedValue(fakeReview({ rating: 5, comment: 'Great' }));
      Review.aggregate.mockResolvedValue([{ average: 5, count: 1 }]);

      const result = await upsertReview(destinationId, userId, {
        rating: 5,
        comment: 'Great',
      });

      expect(result.created).toBe(true);
      expect(result.review.rating).toBe(5);
      expect(result.rating).toEqual({ ratingAverage: 5, ratingCount: 1 });
    });

    it('updates the existing review instead of adding a second one', async () => {
      const existing = fakeReview({ rating: 2, comment: 'Meh' });
      Review.findOne.mockResolvedValue(existing);
      Review.aggregate.mockResolvedValue([{ average: 4, count: 1 }]);

      const result = await upsertReview(destinationId, userId, {
        rating: 4,
        comment: 'Better on a second visit',
      });

      expect(Review.create).not.toHaveBeenCalled();
      expect(existing.save).toHaveBeenCalled();
      expect(result.created).toBe(false);
      expect(result.review.comment).toBe('Better on a second visit');
    });

    it('rejects reviews of a missing destination', async () => {
      Destination.exists.mockResolvedValue(null);
      await expect(
        upsertReview(destinationId, userId, { rating: 3, comment: '' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects an invalid destination id without querying', async () => {
      await expect(
        upsertReview('not-an-id', userId, { rating: 3, comment: '' })
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(Destination.exists).not.toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    it('lets the author delete their review', async () => {
      const review = fakeReview({ rating: 3 });
      Review.findOne.mockResolvedValue(review);
      Review.aggregate.mockResolvedValue([]);

      await deleteReview(destinationId, reviewId, { id: userId, role: 'user' });
      expect(review.deleteOne).toHaveBeenCalled();
    });

    it('lets an admin delete any review', async () => {
      const review = fakeReview({ rating: 3 });
      Review.findOne.mockResolvedValue(review);
      Review.aggregate.mockResolvedValue([]);

      await deleteReview(destinationId, reviewId, { id: otherUserId, role: 'admin' });
      expect(review.deleteOne).toHaveBeenCalled();
    });

    it("forbids deleting someone else's review", async () => {
      const review = fakeReview({ rating: 3 });
      Review.findOne.mockResolvedValue(review);

      await expect(
        deleteReview(destinationId, reviewId, { id: otherUserId, role: 'user' })
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(review.deleteOne).not.toHaveBeenCalled();
    });

    it('returns 404 for a missing review', async () => {
      Review.findOne.mockResolvedValue(null);
      await expect(
        deleteReview(destinationId, reviewId, { id: userId, role: 'user' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});

import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageSquare, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { reviewApi } from "../../services/api.service";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { StarDisplay, StarInput } from "./StarRating";

const PAGE_SIZE = 10;
const MAX_COMMENT = 2000;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Rating summary with a bar per star level
 */
const RatingSummary = ({ summary }) => (
  <div className='flex flex-col sm:flex-row gap-6 sm:items-center'>
    <div className='text-center sm:text-left'>
      <p className='text-5xl font-bold text-gray-900'>
        {summary.ratingCount ? summary.ratingAverage.toFixed(1) : "–"}
      </p>
      <StarDisplay value={summary.ratingAverage} size={18} className='mt-1' />
      <p className='text-sm text-gray-600 mt-1'>
        {summary.ratingCount}{" "}
        {summary.ratingCount === 1 ? "review" : "reviews"}
      </p>
    </div>
    <div className='flex-1 space-y-1 max-w-sm'>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = summary.breakdown?.[star] || 0;
        const percent = summary.ratingCount
          ? Math.round((count / summary.ratingCount) * 100)
          : 0;
        return (
          <div key={star} className='flex items-center gap-2 text-sm'>
            <span className='w-12 text-gray-600'>{star} star</span>
            <div
              className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'
              aria-hidden='true'
            >
              <div
                className='h-full bg-amber-400'
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className='w-10 text-right text-gray-600'>{count}</span>
          </div>
        );
      })}
    </div>
  </div>
);

RatingSummary.propTypes = {
  summary: PropTypes.shape({
    ratingAverage: PropTypes.number,
    ratingCount: PropTypes.number,
    breakdown: PropTypes.object,
  }).isRequired,
};

/**
 * Form to write or edit the signed-in user's review
 */
const ReviewForm = ({ initial, onSubmit, onCancel, saving }) => {
  const [rating, setRating] = useState(initial?.rating || 0);
  const [comment, setComment] = useState(initial?.comment || "");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!rating) {
      toast.error("Choose a star rating");
      return;
    }
    onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <StarInput value={rating} onChange={setRating} />
      <label htmlFor='review-comment' className='sr-only'>
        Your review
      </label>
      <textarea
        id='review-comment'
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={MAX_COMMENT}
        rows={4}
        placeholder='What did you like? Any tips for other travelers? (optional)'
        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      />
      <div className='flex items-center justify-between'>
        <span className='text-xs text-gray-500'>
          {comment.length}/{MAX_COMMENT}
        </span>
        <div className='flex gap-2'>
          {onCancel && (
            <Button type='button' variant='ghost' onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type='submit' variant='primary' disabled={saving}>
            {saving ? "Saving..." : initial ? "Update review" : "Post review"}
          </Button>
        </div>
      </div>
    </form>
  );
};

ReviewForm.propTypes = {
  initial: PropTypes.shape({ rating: PropTypes.number, comment: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  saving: PropTypes.bool,
};

/**
 * Reviews for a destination: summary, the user's own review, and everyone's reviews
 */
const ReviewsSection = ({ destinationId, onRatingChange }) => {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(
    async (nextPage = 1) => {
      const result = await reviewApi.getReviews(destinationId, {
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setPage(nextPage);
      setData((prev) =>
        nextPage === 1 || !prev
          ? result
          : { ...result, reviews: [...prev.reviews, ...result.reviews] }
      );
      return result;
    },
    [destinationId]
  );

  useEffect(() => {
    let cancelled = false;
    const requests = [loadReviews(1)];
    if (isAuthenticated) {
      requests.push(
        reviewApi.getMyReview(destinationId).then((review) => {
          if (!cancelled) setMyReview(review);
        })
      );
    }
    Promise.allSettled(requests).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [destinationId, isAuthenticated, loadReviews]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await loadReviews(page + 1);
    } catch {
      // Error toast shown by the API layer
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const response = await reviewApi.saveReview(destinationId, values);
      setMyReview(response.review);
      setEditing(false);
      toast.success(response.message);
      onRatingChange?.(response.rating);
      await loadReviews(1);
    } catch {
      // Error toast shown by the API layer
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review) => {
    const isMine = review.author.id === user?.id;
    const prompt = isMine
      ? "Delete your review?"
      : `Delete ${review.author.name || "this user"}'s review?`;
    if (!window.confirm(prompt)) return;

    try {
      const response = await reviewApi.deleteReview(destinationId, review.id);
      if (isMine) setMyReview(null);
      toast.success("Review deleted");
      onRatingChange?.(response.rating);
      await loadReviews(1);
    } catch {
      // Error toast shown by the API layer
    }
  };

  const summary = data?.summary || { ratingAverage: 0, ratingCount: 0, breakdown: {} };
  const reviews = data?.reviews || [];
  const hasMore = data ? page < data.pagination.totalPages : false;

  return (
    <section aria-labelledby='reviews-heading' className='mt-10'>
      <h2
        id='reviews-heading'
        className='text-2xl font-semibold text-gray-900 mb-6'
      >
        Reviews
      </h2>

      {loading ? (
        <div className='flex justify-center py-10'>
          <Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
        </div>
      ) : (
        <div className='space-y-8'>
          <RatingSummary summary={summary} />

          {/* The user's own review */}
          <div className='p-5 bg-gray-50 rounded-lg border border-gray-200'>
            {!isAuthenticated ? (
              <p className='text-gray-700'>
                <Link to='/login' className='text-blue-600 font-medium hover:underline'>
                  Log in
                </Link>{" "}
                to rate this destination and share your experience.
              </p>
            ) : myReview && !editing ? (
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-900 mb-1'>Your review</p>
                  <StarDisplay value={myReview.rating} />
                  {myReview.comment && (
                    <p className='text-gray-700 mt-2 whitespace-pre-line'>
                      {myReview.comment}
                    </p>
                  )}
                </div>
                <div className='flex gap-1 shrink-0'>
                  <button
                    type='button'
                    onClick={() => setEditing(true)}
                    className='p-2 rounded-lg text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    aria-label='Edit your review'
                  >
                    <Pencil size={18} aria-hidden='true' />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDelete(myReview)}
                    className='p-2 rounded-lg text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                    aria-label='Delete your review'
                  >
                    <Trash2 size={18} aria-hidden='true' />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className='text-sm font-medium text-gray-900 mb-3'>
                  {myReview ? "Edit your review" : "Rate this destination"}
                </p>
                <ReviewForm
                  key={myReview?.id || "new"}
                  initial={myReview}
                  onSubmit={handleSubmit}
                  onCancel={myReview ? () => setEditing(false) : undefined}
                  saving={saving}
                />
              </>
            )}
          </div>

          {/* Everyone's reviews */}
          {reviews.length === 0 ? (
            <div className='text-center py-8 text-gray-600'>
              <MessageSquare className='w-10 h-10 mx-auto mb-2 text-gray-400' />
              No reviews yet. Be the first to share your experience.
            </div>
          ) : (
            <ul className='divide-y divide-gray-200'>
              {reviews.map((review) => (
                <li key={review.id} className='py-5 flex gap-4'>
                  <Avatar name={review.author.name || "Traveler"} size='sm' />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='font-medium text-gray-900 truncate'>
                        {review.author.name || "Former member"}
                        {review.author.id === user?.id && (
                          <span className='text-gray-500 font-normal'> (you)</span>
                        )}
                      </p>
                      {user?.role === "admin" && review.author.id !== user?.id && (
                        <button
                          type='button'
                          onClick={() => handleDelete(review)}
                          className='p-1 rounded text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                          aria-label={`Delete review by ${review.author.name || "user"}`}
                        >
                          <Trash2 size={16} aria-hidden='true' />
                        </button>
                      )}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <StarDisplay value={review.rating} size={14} />
                      <span className='text-xs text-gray-500'>
                        {formatDate(review.createdAt)}
                        {review.updatedAt !== review.createdAt && " · edited"}
                      </span>
                    </div>
                    {review.comment && (
                      <p className='text-gray-700 mt-2 whitespace-pre-line break-words'>
                        {review.comment}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div className='text-center'>
              <Button variant='ghost' onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Show more reviews"}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

ReviewsSection.propTypes = {
  destinationId: PropTypes.string.isRequired,
  onRatingChange: PropTypes.func,
};

export default ReviewsSection;

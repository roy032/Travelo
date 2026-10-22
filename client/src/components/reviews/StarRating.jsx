import PropTypes from "prop-types";
import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Read-only star display. Supports fractional values (e.g. 4.3).
 */
export const StarDisplay = ({ value = 0, size = 16, className = "" }) => (
  <span
    className={`inline-flex items-center gap-0.5 ${className}`}
    role='img'
    aria-label={`Rated ${value.toFixed(1)} out of 5`}
  >
    {[1, 2, 3, 4, 5].map((star) => {
      const fill = Math.max(0, Math.min(1, value - (star - 1)));
      return (
        <span key={star} className='relative inline-block' aria-hidden='true'>
          <Star size={size} className='text-gray-300' />
          {fill > 0 && (
            <span
              className='absolute inset-0 overflow-hidden'
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className='fill-amber-400 text-amber-400' />
            </span>
          )}
        </span>
      );
    })}
  </span>
);

StarDisplay.propTypes = {
  value: PropTypes.number,
  size: PropTypes.number,
  className: PropTypes.string,
};

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * Clickable 1-5 star input, keyboard accessible as a radio group.
 */
export const StarInput = ({ value, onChange, size = 28 }) => {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className='flex items-center gap-3'>
      <div
        role='radiogroup'
        aria-label='Rating'
        className='flex items-center gap-1'
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button'
            role='radio'
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className='rounded focus:outline-none focus:ring-2 focus:ring-amber-400'
          >
            <Star
              size={size}
              aria-hidden='true'
              className={
                star <= shown
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 hover:text-amber-300"
              }
            />
          </button>
        ))}
      </div>
      <span className='text-sm text-gray-600 min-w-20 dark:text-gray-400'>{LABELS[shown]}</span>
    </div>
  );
};

StarInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.number,
};

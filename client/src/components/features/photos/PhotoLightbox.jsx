import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { X, ChevronLeft, ChevronRight, User, Calendar } from "lucide-react";
import Button from "../../ui/Button";

/**
 * PhotoLightbox component - displays full-size photo with navigation
 * @param {boolean} isOpen - Whether the lightbox is open
 * @param {Function} onClose - Handler for closing the lightbox
 * @param {Array} photos - Array of photo objects
 * @param {number} currentIndex - Index of the currently displayed photo
 * @param {Function} onNavigate - Handler for navigating between photos
 */
const PhotoLightbox = ({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onNavigate,
}) => {
  const [imageError, setImageError] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const isVisible = Boolean(isOpen && photos?.length);
  useFocusTrap(dialogRef, isVisible, closeButtonRef);

  useEffect(() => {
    // Reset image error when photo changes
    setImageError(false);
  }, [currentIndex]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  useEffect(() => {
    // Prevent body scroll when lightbox is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !photos || photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Use the URL directly from the photo object (UploadThing URL)
  const imageUrl = currentPhoto.url;

  return (
    <div
      ref={dialogRef}
      className='fixed inset-0 z-50 bg-black/95 flex items-center justify-center'
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-label={`Photo ${currentIndex + 1} of ${photos.length}`}
      tabIndex={-1}
    >
      {/* Close Button */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className='absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
        aria-label='Close photo viewer'
      >
        <X className='h-8 w-8' aria-hidden='true' />
      </button>

      {/* Previous Button */}
      {hasPrevious && (
        <button
          onClick={handlePrevious}
          className='absolute left-4 z-10 text-white hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
          aria-label='Previous photo'
        >
          <ChevronLeft className='h-12 w-12' aria-hidden='true' />
        </button>
      )}

      {/* Next Button */}
      {hasNext && (
        <button
          onClick={handleNext}
          className='absolute right-4 z-10 text-white hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white'
          aria-label='Next photo'
        >
          <ChevronRight className='h-12 w-12' aria-hidden='true' />
        </button>
      )}

      {/* Photo Container */}
      <div className='max-w-7xl max-h-screen w-full h-full flex flex-col items-center justify-center p-4'>
        {/* Image */}
        <div className='flex-1 flex items-center justify-center w-full mb-4'>
          {!imageError ? (
            <img
              src={imageUrl}
              alt={currentPhoto.caption || "Trip photo"}
              className='max-w-full max-h-full object-contain'
              onError={() => setImageError(true)}
            />
          ) : (
            <div className='text-white text-center'>
              <svg
                className='mx-auto h-24 w-24 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <p className='mt-4 text-lg'>Image not available</p>
            </div>
          )}
        </div>

        {/* Photo Info */}
        <div className='bg-black/50 rounded-lg p-4 max-w-2xl w-full'>
          {/* Caption */}
          {currentPhoto.caption && (
            <p className='text-white text-lg mb-3'>{currentPhoto.caption}</p>
          )}

          {/* Metadata */}
          <div className='flex items-center justify-between text-sm text-gray-300'>
            <div className='flex items-center space-x-4'>
              {/* Uploader */}
              <div className='flex items-center space-x-2'>
                <User className='h-4 w-4' />
                <span>{currentPhoto.uploader?.name || "Unknown"}</span>
              </div>

              {/* Upload Date */}
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4' />
                <span>{formatDate(currentPhoto.uploadedAt)}</span>
              </div>
            </div>

            {/* Photo Counter */}
            <span className='text-gray-400'>
              {currentIndex + 1} / {photos.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoLightbox;

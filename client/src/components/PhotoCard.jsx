import { useState } from 'react';
import { Trash2, User, Calendar } from 'lucide-react';
import Button from './Button';

/**
 * PhotoCard component - displays a photo thumbnail with metadata
 * @param {Object} photo - Photo object with id, filename, path, caption, uploader, uploadedAt
 * @param {Function} onClick - Handler for clicking the photo to view full size
 * @param {Function} onDelete - Handler for deleting the photo
 * @param {boolean} canDelete - Whether the current user can delete this photo
 */
const PhotoCard = ({ photo, onClick, onDelete, canDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent opening lightbox when clicking delete

    if (window.confirm('Are you sure you want to delete this photo?')) {
      setIsDeleting(true);
      try {
        await onDelete(photo.id);
      } catch (error) {
        console.error('Error deleting photo:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Construct the image URL
  const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${photo.path}`;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo Thumbnail */}
      <div
        className="aspect-square cursor-pointer overflow-hidden bg-gray-100"
        onClick={onClick}
      >
        {!imageError ? (
          <img
            src={imageUrl}
            alt={photo.caption || 'Trip photo'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm">Image not available</p>
            </div>
          </div>
        )}
      </div>

      {/* Photo Info */}
      <div className="p-3">
        {/* Caption */}
        {photo.caption && (
          <p className="text-sm text-gray-900 mb-2 line-clamp-2">{photo.caption}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {/* Uploader */}
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{photo.uploader?.name || 'Unknown'}</span>
            </div>

            {/* Upload Date */}
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(photo.uploadedAt)}</span>
            </div>
          </div>

          {/* Delete Button */}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;

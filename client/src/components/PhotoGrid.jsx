import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import PhotoCard from './PhotoCard';
import PhotoLightbox from './PhotoLightbox';
import Loader from './Loader';
import { SkeletonImage } from './SkeletonLoader';
import { EmptyPhotos } from './EmptyState';

/**
 * PhotoGrid component - displays photos in a responsive grid layout
 * @param {Array} photos - Array of photo objects
 * @param {Function} onDeletePhoto - Handler for deleting a photo
 * @param {string} currentUserId - ID of the current user
 * @param {boolean} loading - Whether photos are loading
 */
const PhotoGrid = ({ photos, onDeletePhoto, currentUserId, loading }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handlePhotoClick = (index) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handleNavigate = (newIndex) => {
    setCurrentPhotoIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonImage key={i} aspectRatio="1/1" />
        ))}
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return <EmptyPhotos />;
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => handlePhotoClick(index)}
            onDelete={onDeletePhoto}
            canDelete={photo.uploader?._id === currentUserId || photo.uploader?.id === currentUserId}
          />
        ))}
      </div>

      {/* Lightbox */}
      <PhotoLightbox
        isOpen={lightboxOpen}
        onClose={handleCloseLightbox}
        photos={photos}
        currentIndex={currentPhotoIndex}
        onNavigate={handleNavigate}
      />
    </>
  );
};

export default PhotoGrid;

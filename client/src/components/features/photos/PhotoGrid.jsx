import { useState } from "react";
import { Trash2, User, Download } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";
import { SkeletonImage } from "../../ui/SkeletonLoader";
import { EmptyPhotos } from "../../ui/EmptyState";

/**
 * PhotoGrid component - displays photos in a bento grid layout
 * @param {Array} photos - Array of photo objects
 * @param {Function} onDeletePhoto - Handler for deleting a photo
 * @param {string} currentUserId - ID of the current user
 * @param {boolean} loading - Whether photos are loading
 */
const PhotoGrid = ({ photos, onDeletePhoto, currentUserId, loading }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (e, photoId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this photo?")) {
      setDeletingId(photoId);
      try {
        await onDeletePhoto(photoId);
      } catch (error) {
        console.error("Error deleting photo:", error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDownload = async (e, photo) => {
    e.stopPropagation();
    try {
      // Fetch the image
      const response = await fetch(photo.url);
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = photo.filename || `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading photo:", error);
      alert("Failed to download photo");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Bento grid pattern - assign sizes based on position
  const getBentoClass = (index) => {
    const pattern = index % 7;
    switch (pattern) {
      case 0:
        return "col-span-2 row-span-2"; // Large
      case 1:
      case 2:
        return "col-span-1 row-span-1"; // Small
      case 3:
        return "col-span-1 row-span-2"; // Tall
      case 4:
        return "col-span-2 row-span-1"; // Wide
      case 5:
      case 6:
        return "col-span-1 row-span-1"; // Small
      default:
        return "col-span-1 row-span-1";
    }
  };

  if (loading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4'>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={getBentoClass(i)}>
            <SkeletonImage aspectRatio='1/1' />
          </div>
        ))}
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return <EmptyPhotos />;
  }

  return (
    <>
      {/* Bento Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4'>
        {photos.map((photo, index) => {
          const canDelete =
            photo.uploader?._id === currentUserId ||
            photo.uploader?.id === currentUserId;

          return (
            <div
              key={photo.id}
              className={`${getBentoClass(
                index
              )} relative group overflow-hidden rounded-lg cursor-pointer bg-gray-100`}
              onClick={() => handlePhotoClick(index)}
            >
              {/* Image */}
              <img
                src={photo.url}
                alt={photo.caption || "Trip photo"}
                className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
                loading='lazy'
              />

              {/* Hover Overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                {/* Content at bottom */}
                <div className='absolute bottom-0 left-0 right-0 p-4 text-white'>
                  {/* Uploader */}
                  <div className='flex items-center space-x-2 mb-2'>
                    <div className='bg-white/20 backdrop-blur-sm rounded-full p-1.5'>
                      <User className='h-4 w-4' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {photo.uploader?.name || "Unknown"}
                      </p>
                      <p className='text-xs text-gray-300'>
                        {formatDate(photo.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Caption */}
                  {photo.caption && (
                    <p className='text-sm text-white/90 line-clamp-2 mb-2'>
                      {photo.caption}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className='absolute top-3 right-3 flex space-x-2'>
                  {/* Download Button */}
                  <button
                    onClick={(e) => handleDownload(e, photo)}
                    className='bg-blue-500/90 hover:bg-blue-600 text-white p-2 rounded-full transition-colors shadow-lg'
                    aria-label='Download photo'
                  >
                    <Download className='h-4 w-4' />
                  </button>

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(e, photo.id)}
                      disabled={deletingId === photo.id}
                      className='bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg'
                      aria-label='Delete photo'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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

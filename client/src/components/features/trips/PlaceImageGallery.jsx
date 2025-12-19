import { useState, useEffect } from "react";
import { MapPin, ImageIcon, AlertCircle, ExternalLink } from "lucide-react";
import Loader from "../../ui/Loader";
import { fetchWikimediaImages } from "../../../utils/wikimedia";

/**
 * PlaceImageGallery component
 * Fetches and displays images from Wikimedia Commons for a given place
 *
 * @param {string} placeName - Name of the place to fetch images for
 * @param {number} latitude - Latitude coordinate of the place
 * @param {number} longitude - Longitude coordinate of the place
 */
const PlaceImageGallery = ({ placeName, latitude, longitude }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      if (!placeName) {
        setError("Place name is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const imageData = await fetchWikimediaImages(placeName, 10);

        if (isMounted) {
          if (imageData.length === 0) {
            setError("No images found for this location");
            return;
          }
          setImages(imageData);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading images:", err);
          setError("Failed to load images from Wikimedia Commons");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [placeName, latitude, longitude]);

  // Loading state
  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center mb-4'>
          <MapPin size={20} className='text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>{placeName}</h3>
        </div>
        <div className='flex justify-center py-8'>
          <Loader size='md' text='Loading images...' />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center mb-4'>
          <MapPin size={20} className='text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>{placeName}</h3>
        </div>
        <div className='text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
          <AlertCircle size={48} className='mx-auto text-gray-400 mb-4' />
          <p className='text-gray-600 mb-2'>{error}</p>
          <p className='text-sm text-gray-500'>
            Images are sourced from Wikimedia Commons
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center mb-4'>
          <MapPin size={20} className='text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>{placeName}</h3>
        </div>
        <div className='text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
          <ImageIcon size={48} className='mx-auto text-gray-400 mb-4' />
          <p className='text-gray-600 mb-2'>No images available</p>
          <p className='text-sm text-gray-500'>
            No images found on Wikimedia Commons for this location
          </p>
        </div>
      </div>
    );
  }

  // Success state with images
  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          <MapPin size={20} className='text-blue-600 mr-2' />
          <h3 className='text-lg font-semibold text-gray-900'>{placeName}</h3>
        </div>
        <div className='flex items-center text-sm text-gray-500'>
          <ImageIcon size={16} className='mr-1' />
          <span>
            {images.length} {images.length === 1 ? "image" : "images"}
          </span>
        </div>
      </div>

      {/* Coordinates info */}
      {latitude && longitude && (
        <div className='mb-4 text-sm text-gray-500'>
          <span>
            Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
      )}

      {/* Image Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className='group relative rounded-lg overflow-hidden bg-gray-200 hover:shadow-lg transition-shadow'
            style={{ aspectRatio: "1/1", minHeight: "150px" }}
          >
            <img
              src={imageUrl}
              alt={`Image ${index + 1} of ${placeName}`}
              className='w-full h-full object-cover transition-transform duration-200 group-hover:scale-110'
              loading='lazy'
              onError={(e) => {
                console.error("Failed to load image:", imageUrl);
                // Fallback for broken images
                e.target.src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />

            {/* Overlay with link to Wikimedia */}
            <div className='absolute inset-0 bg-transparent bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center'>
              <a
                href={imageUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-gray-100'
                title='View on Wikimedia Commons'
              >
                <ExternalLink size={16} />
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Attribution */}
      <div className='mt-4 pt-4 border-t border-gray-200'>
        <p className='text-xs text-gray-500 text-center'>
          Images sourced from{" "}
          <a
            href='https://commons.wikimedia.org'
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 hover:underline'
          >
            Wikimedia Commons
          </a>{" "}
          and are licensed under various free licenses
        </p>
      </div>
    </div>
  );
};

export default PlaceImageGallery;

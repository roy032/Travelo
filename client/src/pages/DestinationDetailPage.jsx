import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { destinationApi } from '../services/api.service';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import toast from 'react-hot-toast';

/**
 * DestinationDetailPage displays full destination information with multiple photos
 */
const DestinationDetailPage = () => {
  const { destinationId } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchDestination();
  }, [destinationId]);

  const fetchDestination = async () => {
    try {
      setLoading(true);
      const data = await destinationApi.getDestinationById(destinationId);
      setDestination(data);
    } catch (error) {
      console.error('Error fetching destination:', error);
      toast.error('Failed to load destination details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Destination not found</h2>
          <Button onClick={() => navigate('/destinations')}>
            Back to Destinations
          </Button>
        </div>
      </div>
    );
  }

  const images = destination.images || [];
  const currentImage = images[selectedImageIndex] || { path: '/placeholder-destination.jpg' };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/destinations')}
            className="flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Destinations
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Image Gallery */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative h-96 w-full overflow-hidden bg-gray-200">
              <img
                src={currentImage.path}
                alt={destination.name}
                className="h-full w-full object-cover"
              />
              {/* Category Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="primary" size="lg" className="capitalize">
                  {destination.category}
                </Badge>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-16 rounded overflow-hidden border-2 transition-all ${selectedImageIndex === index
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={image.path}
                      alt={`${destination.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination Information */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {destination.name}
              </h1>
              {destination.country && (
                <p className="text-lg text-gray-600 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {destination.country}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {destination.description}
              </p>
            </div>

            {/* Best Time to Visit */}
            {destination.bestTimeToVisit && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Best Time to Visit
                </h3>
                <p className="text-gray-700">{destination.bestTimeToVisit}</p>
              </div>
            )}

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Highlights</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {destination.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetailPage;

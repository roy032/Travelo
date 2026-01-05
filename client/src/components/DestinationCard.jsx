import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Badge from './Badge';

/**
 * DestinationCard component displays a destination with image, name, category, and description preview
 */
const DestinationCard = ({ destination }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/destinations/${destination._id}`);
  };

  // Get featured image or first image
  const featuredImage = destination.images?.find(img => img.isFeatured) || destination.images?.[0];
  const imageUrl = featuredImage?.path || '/placeholder-destination.jpg';

  // Truncate description for preview
  const truncateDescription = (text, maxLength = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card hover onClick={handleClick} padding="none" className="overflow-hidden">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-200">
        <img
          src={imageUrl}
          alt={destination.name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="primary" className="capitalize">
            {destination.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {destination.name}
        </h3>

        {destination.country && (
          <p className="text-sm text-gray-500 mb-2">
            📍 {destination.country}
          </p>
        )}

        <p className="text-sm text-gray-600 line-clamp-3">
          {truncateDescription(destination.description)}
        </p>

        {destination.bestTimeToVisit && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Best time to visit:</span> {destination.bestTimeToVisit}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DestinationCard;

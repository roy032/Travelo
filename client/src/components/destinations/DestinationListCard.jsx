import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import FavoriteButton from "../favorites/FavoriteButton";
import { StarDisplay } from "../reviews/StarRating";

/**
 * Destination card for the browse and saved pages
 */
const DestinationListCard = ({ destination }) => {
  const image = destination.featuredImage?.path;

  return (
    <Link
      to={`/destinations/${destination.id}`}
      className='group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500'
    >
      <div className='relative h-48 bg-gray-200 overflow-hidden'>
        {image && (
          <img
            src={image}
            alt=''
            loading='lazy'
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
          />
        )}
        <span className='absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-semibold text-gray-800 capitalize'>
          {destination.category}
        </span>
        <FavoriteButton
          itemType='destination'
          itemId={String(destination.id)}
          label={destination.name}
          size='sm'
          className='absolute top-3 right-3'
        />
      </div>
      <div className='p-5'>
        <h3 className='text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors'>
          {destination.name}
        </h3>
        <div className='flex items-center gap-1.5 text-sm text-gray-600 mt-1'>
          <MapPin size={14} className='text-blue-500' aria-hidden='true' />
          {destination.country}
        </div>
        <div className='flex items-center gap-2 mt-2 text-sm'>
          {destination.ratingCount > 0 ? (
            <>
              <StarDisplay value={destination.ratingAverage} size={14} />
              <span className='text-gray-700 font-medium'>
                {destination.ratingAverage.toFixed(1)}
              </span>
              <span className='text-gray-500'>({destination.ratingCount})</span>
            </>
          ) : (
            <span className='text-gray-500'>No reviews yet</span>
          )}
        </div>
        {destination.description && (
          <p className='text-sm text-gray-600 mt-3 line-clamp-2'>
            {destination.description}
          </p>
        )}
      </div>
    </Link>
  );
};

DestinationListCard.propTypes = {
  destination: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    country: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    featuredImage: PropTypes.shape({ path: PropTypes.string }),
    ratingAverage: PropTypes.number,
    ratingCount: PropTypes.number,
  }).isRequired,
};

export default DestinationListCard;

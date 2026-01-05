import { MapPin } from "lucide-react";

const DestinationCard = ({ image, title, location, price, description }) => {
  return (
    <div className='group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
      {/* Image Container */}
      <div className='relative h-64 overflow-hidden'>
        <img
          src={image}
          alt={title}
          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
        />
        {/* Overlay gradient */}
        <div className='absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent'></div>

        {/* Price Badge */}
        <div className='absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg'>
          <span className='text-blue-600 font-bold text-lg'>${price}</span>
        </div>
      </div>

      {/* Content */}
      <div className='p-6'>
        <h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
          {title}
        </h3>
        <div className='flex items-center gap-2 text-gray-600 mb-3'>
          <MapPin size={16} className='text-blue-500' />
          <span className='text-sm'>{location}</span>
        </div>
        {description && (
          <p className='text-sm text-gray-600 line-clamp-2'>{description}</p>
        )}
      </div>
    </div>
  );
};

export default DestinationCard;

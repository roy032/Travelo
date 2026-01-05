import DestinationCard from "./DestinationCard";

const DestinationsGrid = () => {
  const destinations = [
    {
      id: 1,
      image: "/main/img2.webp",
      title: "Tropical Paradise",
      location: "Maldives",
      price: "1299",
      description: "Experience crystal clear waters and pristine beaches",
    },
    {
      id: 2,
      image: "/main/img3.jpeg",
      title: "Mountain Retreat",
      location: "Swiss Alps",
      price: "899",
      description: "Breathtaking mountain views and cozy chalets",
    },
    {
      id: 3,
      image: "/main/img4.jpg",
      title: "Historic Journey",
      location: "Tuscany, Italy",
      price: "1099",
      description: "Discover ancient architecture and rolling vineyards",
    },
    {
      id: 4,
      image: "/main/img5.webp",
      title: "Desert Adventure",
      location: "Dubai, UAE",
      price: "1499",
      description: "Luxury meets adventure in the golden dunes",
    },
  ];

  return (
    <div className='bg-gradient-to-b from-gray-50 to-white py-20'>
      <div className='max-w-screen-xl mx-auto px-6'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Featured Destinations
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Explore our handpicked selection of breathtaking destinations around
            the world
          </p>
        </div>

        {/* Destinations Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {destinations.map((destination) => (
            <DestinationCard key={destination.id} {...destination} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinationsGrid;

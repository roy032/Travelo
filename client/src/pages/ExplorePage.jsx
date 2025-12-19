import { useState, useEffect } from "react";
import { Compass, Loader2, AlertCircle } from "lucide-react";
import TripCard from "../components/explore/TripCard";
import { useAuth } from "../hooks/useAuth";

/**
 * ExplorePage - Displays upcoming trips
 * NO AUTHENTICATION REQUIRED - accessible to all users
 * For logged-in users, shows only trips they are NOT a member of
 */
const ExplorePage = () => {
  const { user } = useAuth();

  // Trips state
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState(null);
  const [tripFilter, setTripFilter] = useState(""); // destination type filter
  const [tripSearch, setTripSearch] = useState("");

  useEffect(() => {
    fetchPublicTrips();
  }, []);

  useEffect(() => {
    applyTripFilters();
  }, [trips, tripFilter, tripSearch]);

  const fetchPublicTrips = async () => {
    try {
      setTripsLoading(true);
      setTripsError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trips/explore`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }

      const data = await response.json();
      let tripsData = data.trips || [];

      // If user is logged in, filter out trips where user is a member or owner
      if (user && user.id) {
        tripsData = tripsData.filter((trip) => {
          // Check if user is the owner
          const isOwner = trip.ownerId === user.id;

          // Check if user is in members array
          const isMember = trip.members?.some(
            (memberId) => memberId === user.id
          );

          // Show only trips where user is NOT owner and NOT member
          return !isOwner && !isMember;
        });
      }

      setTrips(tripsData);
      setFilteredTrips(tripsData);
    } catch (err) {
      console.error("Error fetching public trips:", err);
      setTripsError(err.message || "Failed to load trips");
    } finally {
      setTripsLoading(false);
    }
  };

  const applyTripFilters = () => {
    let filtered = [...trips];

    // Apply destination type filter
    if (tripFilter) {
      filtered = filtered.filter((trip) => trip.destinationType === tripFilter);
    }

    // Apply search filter
    if (tripSearch) {
      const query = tripSearch.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.title.toLowerCase().includes(query) ||
          trip.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTrips(filtered);
  };

  const handleTripFilterChange = (filter) => {
    setTripFilter(filter);
  };

  const handleTripSearchChange = (search) => {
    setTripSearch(search);
  };

  const clearTripFilters = () => {
    setTripFilter("");
    setTripSearch("");
  };

  const tripCategories = [
    { value: "", label: "All Types" },
    { value: "beach", label: "Beach" },
    { value: "mountain", label: "Mountain" },
    { value: "city", label: "City" },
    { value: "countryside", label: "Countryside" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Page Header */}
        <div className='mb-8 text-center'>
          <div className='flex items-center justify-center mb-4'>
            <Compass className='w-12 h-12 text-blue-600' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            Explore Trips
          </h1>
          <p className='text-lg text-gray-600'>
            Discover upcoming trips and join amazing adventures
          </p>
        </div>

        <>
          {/* Trips Filter */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
            {/* Search Input */}
            <div className='mb-4'>
              <input
                type='text'
                placeholder='Search trips by title...'
                value={tripSearch}
                onChange={(e) => handleTripSearchChange(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {/* Category Filters */}
            <div className='space-y-3'>
              <label className='block text-sm font-medium text-gray-700'>
                Filter by Destination Type
              </label>
              <div className='flex flex-wrap gap-2'>
                {tripCategories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleTripFilterChange(category.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tripFilter === category.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(tripFilter || tripSearch) && (
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <button
                  onClick={clearTripFilters}
                  className='px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          {!tripsLoading && (
            <div className='mb-6'>
              <p className='text-sm text-gray-600'>
                Showing {filteredTrips.length} of {trips.length}{" "}
                {trips.length === 1 ? "trip" : "trips"}
              </p>
            </div>
          )}

          {/* Loading State */}
          {tripsLoading && (
            <div className='flex flex-col items-center justify-center py-20'>
              <Loader2 className='w-12 h-12 text-blue-600 animate-spin mb-4' />
              <p className='text-gray-600'>Loading trips...</p>
            </div>
          )}

          {/* Error State */}
          {tripsError && !tripsLoading && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6 mb-8'>
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-6 h-6 text-red-600' />
                <div>
                  <h3 className='text-red-900 font-semibold'>Error</h3>
                  <p className='text-red-700 text-sm'>{tripsError}</p>
                </div>
              </div>
              <button
                onClick={fetchPublicTrips}
                className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium'
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!tripsLoading && !tripsError && filteredTrips.length === 0 && (
            <div className='text-center py-20'>
              <Compass className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                No Trips Found
              </h3>
              <p className='text-gray-600 mb-4'>
                {trips.length === 0
                  ? "Check back later to discover new travel plans!"
                  : "Try adjusting your filters to see more results"}
              </p>
              {(tripFilter || tripSearch) && (
                <button
                  onClick={clearTripFilters}
                  className='text-blue-600 hover:text-blue-700 font-medium'
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Trips Grid */}
          {!tripsLoading && !tripsError && filteredTrips.length > 0 && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
};

export default ExplorePage;

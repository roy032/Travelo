import { useState, useEffect } from "react";
import { Plus, Search, AlertCircle } from "lucide-react";
import { tripApi } from "../services/api.service";
import TripCard from "../components/TripCard";
import Button from "../components/Button";
import Input from "../components/Input";
import Loader from "../components/Loader";
import { SkeletonTripGrid } from "../components/SkeletonLoader";
import { EmptyTrips, EmptySearchResults } from "../components/EmptyState";
import Modal from "../components/Modal";
import TripCreateForm from "../components/TripCreateForm";
import { useAuth } from "../hooks/useAuth";

/**
 * TripListPage component - displays user's trips with filtering and search
 */
const TripListPage = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trips, searchQuery, activeFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripApi.getUserTrips();

      // Add isOwner flag to each trip
      const tripsWithOwnerFlag = data.map((trip) => {
        const ownerId = trip.owner?._id || trip.owner?.id || trip.owner;
        const userId = user?.id || user?._id;
        return {
          ...trip,
          isOwner: ownerId === userId,
        };
      });

      setTrips(tripsWithOwnerFlag);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trips];

    // Apply status filter
    const now = new Date();
    if (activeFilter === "upcoming") {
      filtered = filtered.filter((trip) => new Date(trip.startDate) > now);
    } else if (activeFilter === "past") {
      filtered = filtered.filter((trip) => new Date(trip.endDate) < now);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.title.toLowerCase().includes(query) ||
          trip.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTrips(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleCreateTrip = () => {
    // Check if user has at least one verification
    const hasDomesticVerification =
      user?.domesticVerification?.status === "verified";
    const hasInternationalVerification =
      user?.internationalVerification?.status === "verified";

    if (!hasDomesticVerification && !hasInternationalVerification) {
      // User has no verification at all
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (newTrip) => {
    setIsCreateModalOpen(false);
    fetchTrips(); // Refresh the trip list
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };
  console.log(user);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='bg-white shadow-sm border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <div className='h-9 w-32 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-5 w-64 bg-gray-200 rounded animate-pulse mt-2'></div>
              </div>
              <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <SkeletonTripGrid count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>My Trips</h1>
              <p className='mt-1 text-sm text-gray-600'>
                Plan and manage your travel adventures
              </p>
            </div>
            <Button
              variant='primary'
              onClick={handleCreateTrip}
              className='flex items-center'
              disabled={
                user?.domesticVerification?.status !== "verified" &&
                user?.internationalVerification?.status !== "verified"
              }
            >
              <Plus size={20} className='mr-2' />
              Create Trip
            </Button>
          </div>
        </div>
      </div>

      {/* Verification Warning Banner */}
      {user?.domesticVerification?.status !== "verified" &&
        user?.internationalVerification?.status !== "verified" && (
          <div className='bg-yellow-50 border-l-4 border-yellow-400'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <AlertCircle
                    className='h-5 w-5 text-yellow-400'
                    aria-hidden='true'
                  />
                </div>
                <div className='ml-3 flex-1'>
                  <h3 className='text-sm font-medium text-yellow-800'>
                    Document Verification Required
                  </h3>
                  <div className='mt-2 text-sm text-yellow-700'>
                    <p>
                      To create trips, you need to verify at least one document:
                    </p>
                    <ul className='list-disc list-inside mt-2 space-y-1'>
                      <li>
                        <strong>For Domestic trips:</strong> Upload and verify
                        your NID
                        {user?.domesticVerification?.status === "pending" && (
                          <span className='ml-1 text-yellow-600'>
                            (Verification pending - please wait for admin
                            approval)
                          </span>
                        )}
                      </li>
                      <li>
                        <strong>For International trips:</strong> Upload and
                        verify your Passport
                        {user?.internationalVerification?.status ===
                          "pending" && (
                          <span className='ml-1 text-yellow-600'>
                            (Verification pending - please wait for admin
                            approval)
                          </span>
                        )}
                      </li>
                    </ul>
                    <p className='mt-2 text-xs italic'>
                      Note: You can upload one document to start creating trips
                      for that category, and add the other document later.
                    </p>
                  </div>
                  <div className='mt-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => (window.location.href = "/profile")}
                    >
                      Go to Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Filters and Search */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          {/* Filter Buttons */}
          <div className='flex gap-2'>
            <Button
              variant={activeFilter === "all" ? "primary" : "outline"}
              size='sm'
              onClick={() => handleFilterChange("all")}
            >
              All Trips
            </Button>
            <Button
              variant={activeFilter === "upcoming" ? "primary" : "outline"}
              size='sm'
              onClick={() => handleFilterChange("upcoming")}
            >
              Upcoming
            </Button>
            <Button
              variant={activeFilter === "past" ? "primary" : "outline"}
              size='sm'
              onClick={() => handleFilterChange("past")}
            >
              Past
            </Button>
          </div>

          {/* Search */}
          <div className='flex-1 sm:max-w-md'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search size={18} className='text-gray-400' />
              </div>
              <input
                type='text'
                placeholder='Search trips...'
                value={searchQuery}
                onChange={handleSearchChange}
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Trip Grid */}
        {filteredTrips.length === 0 ? (
          searchQuery || activeFilter !== "all" ? (
            <EmptySearchResults />
          ) : (
            <EmptyTrips onCreateTrip={handleCreateTrip} />
          )
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title='Create New Trip'
        size='lg'
      >
        <TripCreateForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </Modal>
    </div>
  );
};

export default TripListPage;

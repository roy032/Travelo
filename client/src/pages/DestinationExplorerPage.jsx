import { useState, useEffect } from 'react';
import { destinationApi } from '../services/api.service';
import DestinationGrid from '../components/DestinationGrid';
import DestinationFilter from '../components/DestinationFilter';
import toast from 'react-hot-toast';

/**
 * DestinationExplorerPage displays curated destinations with filtering and search
 */
const DestinationExplorerPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [destinations, category, searchQuery]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const data = await destinationApi.getDestinations();
      setDestinations(data);
      setFilteredDestinations(data);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...destinations];

    // Apply category filter
    if (category) {
      filtered = filtered.filter(dest => dest.category === category);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dest =>
        dest.name.toLowerCase().includes(query) ||
        dest.description.toLowerCase().includes(query) ||
        dest.country?.toLowerCase().includes(query) ||
        dest.highlights?.some(h => h.toLowerCase().includes(query))
      );
    }

    setFilteredDestinations(filtered);
  };

  const handleFilterChange = (newCategory) => {
    setCategory(newCategory);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explore Destinations
          </h1>
          <p className="text-lg text-gray-600">
            Discover amazing places for your next adventure
          </p>
        </div>

        {/* Filters */}
        <DestinationFilter
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
        />

        {/* Results Count */}
        {!loading && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredDestinations.length} of {destinations.length} destinations
            </p>
          </div>
        )}

        {/* Destination Grid */}
        <DestinationGrid destinations={filteredDestinations} loading={loading} />
      </div>
    </div>
  );
};

export default DestinationExplorerPage;

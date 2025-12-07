import { useState } from 'react';
import Input from './Input';
import Button from './Button';

/**
 * DestinationFilter component provides category filtering and search functionality
 */
const DestinationFilter = ({ onFilterChange, onSearchChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: '', label: 'All Destinations' },
    { value: 'beach', label: 'Beach' },
    { value: 'mountain', label: 'Mountain' },
    { value: 'city', label: 'City' },
    { value: 'countryside', label: 'Countryside' },
    { value: 'historical', label: 'Historical' },
    { value: 'adventure', label: 'Adventure' },
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    onFilterChange(category);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    onFilterChange('');
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search destinations by name or keyword..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Filter by Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedCategory || searchQuery) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default DestinationFilter;

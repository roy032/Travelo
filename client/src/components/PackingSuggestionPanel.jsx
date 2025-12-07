import { useState, useEffect } from 'react';
import { packingApi } from '../services/api.service';
import SuggestionItem from './SuggestionItem';
import Button from './Button';
import Loader from './Loader';
import { Package, X, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * PackingSuggestionPanel component - displays packing suggestions with bulk addition
 */
const PackingSuggestionPanel = ({ tripId, onItemsAdded, onDismiss }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [tripId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await packingApi.getSuggestions(tripId);
      const data = response.data?.suggestions || response.suggestions || response;
      setSuggestions(data);

      // Pre-select all items by default
      if (data && data.items) {
        setSelectedItems([...data.items]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load packing suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (item) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAll = () => {
    if (suggestions && suggestions.items) {
      setSelectedItems([...suggestions.items]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const handleAddToChecklist = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    try {
      setAdding(true);
      await packingApi.addSuggestionsToChecklist(tripId, selectedItems);
      toast.success(`Added ${selectedItems.length} items to checklist`);
      onItemsAdded();
    } catch (error) {
      console.error('Error adding suggestions:', error);
      toast.error('Failed to add items to checklist');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (!suggestions || !suggestions.items || suggestions.items.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Package className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Smart Packing Suggestions
            </h3>
            <p className="text-sm text-gray-600">
              Based on your trip destination and duration
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss suggestions"
        >
          <X size={20} />
        </button>
      </div>

      {/* Category sections */}
      <div className="space-y-4 mb-4">
        {suggestions.categories && Object.entries(suggestions.categories).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
              {category}
            </h4>
            <div className="space-y-1 bg-white rounded-lg p-2 border border-blue-100">
              {items.map((item, index) => (
                <SuggestionItem
                  key={`${category}-${index}`}
                  item={item}
                  isSelected={selectedItems.includes(item)}
                  onToggle={handleToggleItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-blue-200">
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Deselect All
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {selectedItems.length} selected
          </span>
          <Button
            onClick={handleAddToChecklist}
            variant="primary"
            size="sm"
            loading={adding}
            disabled={selectedItems.length === 0 || adding}
          >
            <CheckSquare size={16} className="mr-1" />
            Add to Checklist
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PackingSuggestionPanel;

import { useState, useEffect } from "react";
import { checklistApi } from "../services/api.service";
import ChecklistItem from "./ChecklistItem";
import ChecklistAddForm from "./ChecklistAddForm";
import PackingSuggestionPanel from "./PackingSuggestionPanel";
import Loader from "./Loader";
import toast from "react-hot-toast";

/**
 * ChecklistView component - displays and manages trip checklist
 */
const ChecklistView = ({
  tripId,
  canEdit = true,
  showPackingSuggestions = true,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(
    showPackingSuggestions
  );

  useEffect(() => {
    fetchChecklist();
  }, [tripId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const data = await checklistApi.getChecklist(tripId);
      setItems(data.checklistItems || data);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      toast.error("Failed to load checklist");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (text) => {
    try {
      setAddingItem(true);
      const response = await checklistApi.createItem(tripId, text);
      const newItem = response.checklistItem || response;
      setItems([...items, newItem]);
      toast.success("Item added");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
      throw error;
    } finally {
      setAddingItem(false);
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      const response = await checklistApi.toggleItem(tripId, itemId);
      const updatedItem = response.checklistItem || response;

      setItems(items.map((item) => (item.id === itemId ? updatedItem : item)));
    } catch (error) {
      console.error("Error toggling item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      console.log(itemId);
      await checklistApi.deleteItem(tripId, itemId);
      setItems(items.filter((item) => item.id !== itemId));
      toast.success("Item deleted");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader />
      </div>
    );
  }

  const checkedCount = items.filter((item) => item.isChecked).length;
  const totalCount = items.length;

  const handleSuggestionsAdded = () => {
    // Refresh checklist after suggestions are added
    fetchChecklist();
    setShowSuggestions(false);
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
  };

  return (
    <div className='space-y-6'>
      {/* Header with progress */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Checklist</h2>
          {totalCount > 0 && (
            <p className='text-sm text-gray-600 mt-1'>
              {checkedCount} of {totalCount} completed
            </p>
          )}
        </div>
        {totalCount > 0 && (
          <div className='flex items-center space-x-2'>
            <div className='w-32 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className='text-sm font-medium text-gray-700'>
              {Math.round((checkedCount / totalCount) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Packing suggestions panel */}
      {showSuggestions && canEdit && (
        <PackingSuggestionPanel
          tripId={tripId}
          onItemsAdded={handleSuggestionsAdded}
          onDismiss={handleDismissSuggestions}
        />
      )}

      {/* Add item form */}
      {canEdit && (
        <ChecklistAddForm onAdd={handleAddItem} loading={addingItem} />
      )}

      {/* Checklist items */}
      {items.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500'>
            No items yet. Add your first item above!
          </p>
        </div>
      ) : (
        <div className='space-y-1 border border-gray-200 rounded-lg divide-y divide-gray-200'>
          {items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={handleToggleItem}
              onDelete={handleDeleteItem}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistView;

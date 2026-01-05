/**
 * SuggestionItem component - displays a single packing suggestion with checkbox
 */
const SuggestionItem = ({ item, isSelected, onToggle }) => {
  return (
    <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(item)}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-900">{item}</span>
    </label>
  );
};

export default SuggestionItem;

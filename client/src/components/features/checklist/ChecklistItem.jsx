import { Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * ChecklistItem component - displays a single checklist item with checkbox and delete
 */
const ChecklistItem = ({ item, onToggle, onDelete, canEdit = true }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggle(item.id);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className='flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group dark:hover:bg-gray-800'>
      <input
        type='checkbox'
        checked={item.isChecked}
        onChange={handleToggle}
        disabled={isToggling || !canEdit}
        className='mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed dark:text-blue-400 dark:border-gray-600'
      />

      <div className='flex-1 min-w-0'>
        <p
          className={`text-sm ${
            item.isChecked ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {item.text}
        </p>

        <div className='flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400'>
          <span>Added by {item.creator?.name || "Unknown"}</span>
          {item.isChecked && item.checkedBy && (
            <>
              <span>•</span>
              <span>Checked by {item.checkedBy?.name || "Unknown"}</span>
              {item.checkedAt && (
                <>
                  <span>•</span>
                  <span>{formatDate(item.checkedAt)}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {canEdit && (
        <button
          onClick={() => onDelete(item.id)}
          className='opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all p-1 dark:text-red-400 dark:hover:text-red-200'
          aria-label='Delete item'
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};

export default ChecklistItem;

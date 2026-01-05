import { Trash2, Receipt, User, Calendar } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";

/**
 * ExpenseCard component - displays individual expense information
 */
const ExpenseCard = ({ expense, onDelete, onViewReceipt }) => {
  const categoryColors = {
    food: "bg-orange-100 text-orange-800",
    transport: "bg-blue-100 text-blue-800",
    accommodation: "bg-purple-100 text-purple-800",
    activities: "bg-green-100 text-green-800",
    shopping: "bg-pink-100 text-pink-800",
    other: "bg-gray-100 text-gray-800",
  };

  const categoryLabels = {
    food: "Food",
    transport: "Transport",
    accommodation: "Accommodation",
    activities: "Activities",
    shopping: "Shopping",
    other: "Other",
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                categoryColors[expense.category]
              }`}
            >
              {categoryLabels[expense.category]}
            </span>
            <span className='text-2xl font-bold text-gray-900'>
              {expense.currency} ${expense.amount.toFixed(2)}
            </span>
          </div>

          <p className='text-gray-900 font-medium mb-3'>
            {expense.description}
          </p>

          <div className='flex items-center gap-4 text-sm text-gray-600'>
            <div className='flex items-center gap-1'>
              <User size={16} />
              <span>Paid by: {expense.payer?.name || "Unknown"}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar size={16} />
              <span>{formatDate(expense.createdAt)}</span>
            </div>
            {expense.receipt && (
              <button
                onClick={() => onViewReceipt(expense)}
                className='flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors'
              >
                <Receipt size={16} />
                <span>View Receipt</span>
              </button>
            )}
          </div>
        </div>

        <div className='flex gap-2 ml-4'>
          <Button
            onClick={onDelete}
            variant='ghost'
            size='sm'
            className='text-gray-600 hover:text-red-600'
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;

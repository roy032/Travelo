import Modal from "./Modal";
import { Calendar, User, DollarSign } from "lucide-react";

/**
 * ReceiptViewer component - modal for viewing expense receipts
 */
const ReceiptViewer = ({ isOpen, onClose, expense }) => {
  if (!expense) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReceiptUrl = () => {
    // Priority: Use UploadThing URL if available
    if (expense.receipt?.url) {
      return expense.receipt.url;
    }
    // Fallback: Construct from path for legacy receipts
    else if (expense.receipt?.path) {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      return `${baseUrl}/${expense.receipt.path}`;
    }
    // Fallback: Direct receiptUrl property
    else if (expense.receiptUrl) {
      return expense.receiptUrl;
    }
    return null;
  };

  const receiptUrl = getReceiptUrl();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Receipt Details' size='lg'>
      <div className='space-y-4'>
        {/* Expense Details */}
        <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>Amount</span>
            <span className='text-lg font-bold text-gray-900'>
              {expense.currency} ${expense.amount.toFixed(2)}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Description
            </span>
            <span className='text-sm text-gray-900'>{expense.description}</span>
          </div>

          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <User size={16} />
            <span>Paid by: {expense.payer?.name || "Unknown"}</span>
          </div>

          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Calendar size={16} />
            <span>{formatDate(expense.createdAt)}</span>
          </div>
        </div>

        {/* Receipt Image */}
        {receiptUrl ? (
          <div className='border border-gray-200 rounded-lg overflow-hidden'>
            <img
              src={receiptUrl}
              alt='Receipt'
              className='w-full h-auto max-h-[500px] object-contain bg-gray-50'
              onError={(e) => {
                e.target.src = "";
                e.target.alt = "Failed to load receipt image";
                e.target.className =
                  "w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500";
              }}
            />
          </div>
        ) : (
          <div className='border border-gray-200 rounded-lg p-8 text-center bg-gray-50'>
            <p className='text-gray-500'>No receipt image available</p>
          </div>
        )}

        {expense.receipt?.uploadedAt && (
          <p className='text-xs text-gray-500 text-center'>
            Receipt uploaded on {formatDate(expense.receipt.uploadedAt)}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptViewer;

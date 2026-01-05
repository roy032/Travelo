import { useState, useEffect } from "react";
import { expenseApi } from "../../../services/api.service";
import ExpenseCard from "./ExpenseCard";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";
import { SkeletonList } from "../../ui/SkeletonLoader";
import { EmptyExpenses } from "../../ui/EmptyState";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { successMessages } from "../../../utils/toast.config";

/**
 * ExpenseList component - displays all expenses for a trip in a table layout
 */
const ExpenseList = ({
  tripId,
  onAddExpense,
  onViewReceipt,
  refreshKey = 0,
}) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [tripId, refreshKey]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseApi.getExpenses(tripId);
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await expenseApi.deleteExpense(tripId, expenseId);
      toast.success(successMessages.deleted);
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const calculateTotal = () => {
    return expenses
      .reduce((sum, expense) => sum + expense.amount, 0)
      .toFixed(2);
  };

  console.log(expenses);
  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <div className='h-7 w-24 bg-gray-200 rounded animate-pulse'></div>
            <div className='h-4 w-40 bg-gray-200 rounded animate-pulse mt-2'></div>
          </div>
          <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Expenses</h2>
          <p className='text-sm text-gray-600 mt-1'>
            {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} •
            Total: ৳{calculateTotal()}
          </p>
        </div>
        <Button onClick={() => onAddExpense()} variant='primary' size='md'>
          <Plus size={20} className='mr-2' />
          Add Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <EmptyExpenses onAddExpense={() => onAddExpense()} />
      ) : (
        <div className='space-y-3'>
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onDelete={() => handleDelete(expense.id)}
              onViewReceipt={onViewReceipt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;

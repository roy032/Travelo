import { useState, useEffect } from "react";
import { expenseApi } from "../../../services/api.service";
import Loader from "../../ui/Loader";
import { Users, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

/**
 * SplitSummary component - displays expense split calculations
 */
const SplitSummary = ({ tripId, refreshKey = 0 }) => {
  const [splits, setSplits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSplits();
  }, [tripId, refreshKey]);

  const fetchSplits = async () => {
    try {
      setLoading(true);
      const data = await expenseApi.getSplits(tripId);
      setSplits(data);
    } catch (error) {
      console.error("Error fetching splits:", error);
      toast.error("Failed to load expense splits");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader />
      </div>
    );
  }

  if (!splits || splits.splits.length === 0) {
    return (
      <div className='bg-gray-50 rounded-lg p-6 text-center dark:bg-gray-950'>
        <p className='text-gray-600 dark:text-gray-400'>No expense data available</p>
      </div>
    );
  }

  const getBalanceColor = (balance) => {
    if (balance > 0) return "text-green-700 dark:text-green-300";
    if (balance < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getBalanceIcon = (balance) => {
    if (balance > 0) return <TrendingUp size={20} className='text-green-700 dark:text-green-300' />;
    if (balance < 0) return <TrendingDown size={20} className='text-red-600 dark:text-red-400' />;
    return <DollarSign size={20} className='text-gray-600 dark:text-gray-400' />;
  };

  const getBalanceText = (balance) => {
    if (balance > 0) return `Gets back ৳${Math.abs(balance).toFixed(2)}`;
    if (balance < 0) return `Owes ৳${Math.abs(balance).toFixed(2)}`;
    return "Settled up";
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold text-gray-900 mb-4 dark:text-gray-100'>
          Expense Split Summary
        </h2>

        {/* Overall Statistics */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'>
            <div className='flex items-center gap-2 mb-2'>
              <DollarSign size={20} className='text-blue-600 dark:text-blue-400' />
              <span className='text-sm font-medium text-blue-900 dark:text-blue-200'>
                Total Expenses
              </span>
            </div>
            <p className='text-2xl font-bold text-blue-900 dark:text-blue-200'>
              ৳{splits.totalExpenses.toFixed(2)}
            </p>
          </div>

          <div className='bg-purple-50 rounded-lg p-4 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800'>
            <div className='flex items-center gap-2 mb-2'>
              <Users size={20} className='text-purple-600 dark:text-purple-400' />
              <span className='text-sm font-medium text-purple-900 dark:text-purple-200'>
                Members
              </span>
            </div>
            <p className='text-2xl font-bold text-purple-900 dark:text-purple-200'>
              {splits.memberCount}
            </p>
          </div>

          <div className='bg-green-50 rounded-lg p-4 border border-green-200 dark:bg-green-950/40 dark:border-green-800'>
            <div className='flex items-center gap-2 mb-2'>
              <DollarSign size={20} className='text-green-700 dark:text-green-300' />
              <span className='text-sm font-medium text-green-900 dark:text-green-200'>
                Equal Share
              </span>
            </div>
            <p className='text-2xl font-bold text-green-900 dark:text-green-200'>
              ৳{splits.equalShare.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Member Splits */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-3 dark:text-gray-100'>
          Member Breakdown
        </h3>
        <div className='space-y-3'>
          {splits.splits.map((split) => (
            <div
              key={split.user.id}
              className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-700'
            >
              <div className='flex items-center justify-between gap-3 mb-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/40'>
                    <span className='text-blue-700 font-semibold text-sm dark:text-blue-300'>
                      {split.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <p className='font-medium text-gray-900 truncate dark:text-gray-100'>
                      {split.user.name}
                    </p>
                    <p className='text-sm text-gray-500 truncate dark:text-gray-400'>
                      {split.user.email}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  {getBalanceIcon(split.netBalance)}
                  <span
                    className={`font-semibold ${getBalanceColor(
                      split.netBalance
                    )}`}
                  >
                    {getBalanceText(split.netBalance)}
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800'>
                <div>
                  <p className='text-xs text-gray-500 mb-1 dark:text-gray-400'>Total Paid</p>
                  <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    ৳{split.totalPaid.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 mb-1 dark:text-gray-400'>Fair Share</p>
                  <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    ৳{split.equalShare.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 mb-1 dark:text-gray-400'>Balance</p>
                  <p
                    className={`text-sm font-semibold ${getBalanceColor(
                      split.netBalance
                    )}`}
                  >
                    ৳{Math.abs(split.netBalance).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Instructions */}
      <div className='bg-blue-50 rounded-lg p-4 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'>
        <h4 className='font-medium text-blue-900 mb-2 dark:text-blue-200'>How to Settle Up</h4>
        <ul className='text-sm text-blue-800 space-y-1 dark:text-blue-200'>
          <li>• Members with negative balance owe money</li>
          <li>• Members with positive balance should receive money</li>
          <li>• Members with zero balance are settled up</li>
        </ul>
      </div>
    </div>
  );
};

export default SplitSummary;

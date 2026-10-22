import { useState, useEffect } from "react";
import { expenseApi } from "../../../services/api.service";
import Loader from "../../ui/Loader";
import Button from "../../ui/Button";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowRight,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatMoney } from "../../../utils/currency";

const categoryLabels = {
  food: "Food",
  transport: "Transport",
  accommodation: "Accommodation",
  activities: "Activities",
  shopping: "Shopping",
  other: "Other",
};

/**
 * Spending against the trip budget, with a bar that turns red when over
 */
const BudgetCard = ({ splits, isOwner }) => {
  const { totalExpenses, budget, budgetRemaining, currency } = splits;

  if (budget === null || budget === undefined) {
    return (
      <div className='bg-gray-50 rounded-lg p-4 border border-gray-200 dark:bg-gray-950 dark:border-gray-700'>
        <div className='flex items-center gap-2 mb-1'>
          <PiggyBank size={20} className='text-gray-600 dark:text-gray-400' />
          <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
            Budget
          </span>
        </div>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {isOwner
            ? "No budget yet. Set one in Budget settings to track spending against it."
            : "The trip owner hasn't set a budget."}
        </p>
      </div>
    );
  }

  const percent = budget > 0 ? Math.round((totalExpenses / budget) * 100) : 100;
  const over = budgetRemaining < 0;
  const barColor = over
    ? "bg-red-600 dark:bg-red-500"
    : percent >= 80
      ? "bg-amber-500 dark:bg-amber-400"
      : "bg-green-600 dark:bg-green-500";

  return (
    <div className='bg-white rounded-lg p-4 border border-gray-200 dark:bg-gray-900 dark:border-gray-700'>
      <div className='flex flex-wrap items-baseline justify-between gap-2 mb-2'>
        <div className='flex items-center gap-2'>
          <PiggyBank size={20} className='text-gray-600 dark:text-gray-400' />
          <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
            Budget
          </span>
        </div>
        <span className='text-sm text-gray-600 dark:text-gray-400'>
          {formatMoney(totalExpenses, currency)} of {formatMoney(budget, currency)}
        </span>
      </div>
      <div
        className='h-3 w-full rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700'
        role='progressbar'
        aria-label='Budget used'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${percent}% of budget used`}
      >
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p
        className={`mt-2 text-sm font-medium ${
          over
            ? "text-red-700 dark:text-red-300"
            : "text-green-800 dark:text-green-300"
        }`}
      >
        {over
          ? `Over budget by ${formatMoney(-budgetRemaining, currency)}`
          : `${formatMoney(budgetRemaining, currency)} left (${percent}% used)`}
      </p>
    </div>
  );
};

/**
 * SplitSummary component - budget, balances and who owes whom
 */
const SplitSummary = ({
  tripId,
  refreshKey = 0,
  currentUserId,
  isOwner = false,
}) => {
  const [splits, setSplits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    fetchSplits();
  }, [tripId, refreshKey]);

  const fetchSplits = async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      const data = await expenseApi.getSplits(tripId);
      setSplits(data);
    } catch (error) {
      console.error("Error fetching splits:", error);
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (payment, key) => {
    try {
      setBusy(key);
      await expenseApi.createSettlement(tripId, {
        from: payment.from.id,
        to: payment.to.id,
        amount: payment.amount,
      });
      toast.success(`Recorded ${payment.from.name}'s payment to ${payment.to.name}`);
      await fetchSplits({ quiet: true });
    } catch (error) {
      console.error("Error recording payment:", error);
    } finally {
      setBusy(null);
    }
  };

  const removePayment = async (payment) => {
    try {
      setBusy(payment.id);
      await expenseApi.deleteSettlement(tripId, payment.id);
      toast.success("Payment removed");
      await fetchSplits({ quiet: true });
    } catch (error) {
      console.error("Error removing payment:", error);
    } finally {
      setBusy(null);
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

  const currency = splits.currency || "BDT";
  const money = (amount) => formatMoney(amount, currency);
  const suggested = splits.suggestedPayments || [];
  const recorded = splits.recordedPayments || [];
  const byCategory = splits.byCategory || [];
  const largestCategory = byCategory[0]?.total || 0;

  const getBalanceColor = (balance) => {
    if (balance > 0) return "text-green-700 dark:text-green-300";
    if (balance < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getBalanceIcon = (balance) => {
    if (balance > 0) return <TrendingUp size={20} aria-hidden='true' className='text-green-700 dark:text-green-300' />;
    if (balance < 0) return <TrendingDown size={20} aria-hidden='true' className='text-red-600 dark:text-red-400' />;
    return <CheckCircle2 size={20} aria-hidden='true' className='text-gray-600 dark:text-gray-400' />;
  };

  const getBalanceText = (balance) => {
    if (balance > 0) return `Gets back ${money(Math.abs(balance))}`;
    if (balance < 0) return `Owes ${money(Math.abs(balance))}`;
    return "Settled up";
  };

  const canRemove = (payment) =>
    isOwner || [payment.from?.id, payment.to?.id].includes(currentUserId);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold text-gray-900 mb-4 dark:text-gray-100'>
          Budget and Split Summary
        </h2>

        {/* Overall Statistics */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'>
            <div className='flex items-center gap-2 mb-2'>
              <Wallet size={20} className='text-blue-600 dark:text-blue-400' />
              <span className='text-sm font-medium text-blue-900 dark:text-blue-200'>
                Total Spent
              </span>
            </div>
            <p className='text-2xl font-bold text-blue-900 dark:text-blue-200'>
              {money(splits.totalExpenses)}
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
              <Wallet size={20} className='text-green-700 dark:text-green-300' />
              <span className='text-sm font-medium text-green-900 dark:text-green-200'>
                Average per Person
              </span>
            </div>
            <p className='text-2xl font-bold text-green-900 dark:text-green-200'>
              {money(splits.equalShare)}
            </p>
          </div>
        </div>

        <BudgetCard splits={splits} isOwner={isOwner} />
      </div>

      {/* Spending by category */}
      {byCategory.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-3 dark:text-gray-100'>
            Spending by Category
          </h3>
          <ul className='space-y-2'>
            {byCategory.map(({ category, total }) => (
              <li key={category} className='grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm'>
                <span className='text-gray-700 dark:text-gray-300'>
                  {categoryLabels[category] || category}
                </span>
                <span className='h-2 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700' aria-hidden='true'>
                  <span
                    className='block h-full rounded-full bg-blue-600 dark:bg-blue-400'
                    style={{ width: `${largestCategory ? (total / largestCategory) * 100 : 0}%` }}
                  />
                </span>
                <span className='font-medium text-gray-900 dark:text-gray-100'>{money(total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Who owes whom */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-3 dark:text-gray-100'>
          Who Owes Whom
        </h3>
        {suggested.length === 0 ? (
          <p className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
            <CheckCircle2 size={18} aria-hidden='true' className='text-green-700 dark:text-green-300' />
            Everyone is settled up.
          </p>
        ) : (
          <ul className='space-y-2'>
            {suggested.map((payment) => {
              const key = `${payment.from.id}-${payment.to.id}`;
              return (
                <li
                  key={key}
                  className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:bg-gray-900 dark:border-gray-700'
                >
                  <span className='flex flex-wrap items-center gap-2 text-gray-900 dark:text-gray-100'>
                    <span className='font-medium'>{payment.from.name}</span>
                    <ArrowRight size={16} aria-label='pays' className='text-gray-500 dark:text-gray-400' />
                    <span className='font-medium'>{payment.to.name}</span>
                    <span className='font-semibold text-red-600 dark:text-red-400'>
                      {money(payment.amount)}
                    </span>
                  </span>
                  <Button
                    size='sm'
                    variant='outline'
                    loading={busy === key}
                    disabled={busy !== null}
                    onClick={() => markPaid(payment, key)}
                    aria-label={`Mark ${payment.from.name}'s payment of ${money(payment.amount)} to ${payment.to.name} as paid`}
                  >
                    Mark as paid
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
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
                    {money(split.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 mb-1 dark:text-gray-400'>Their Share</p>
                  <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    {money(split.share ?? split.equalShare)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500 mb-1 dark:text-gray-400'>Balance</p>
                  <p
                    className={`text-sm font-semibold ${getBalanceColor(
                      split.netBalance
                    )}`}
                  >
                    {money(Math.abs(split.netBalance))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payments already made */}
      {recorded.length > 0 && (
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-3 dark:text-gray-100'>
            Recorded Payments
          </h3>
          <ul className='divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700'>
            {recorded.map((payment) => (
              <li key={payment.id} className='flex flex-wrap items-center justify-between gap-2 p-3 text-sm'>
                <span className='text-gray-900 dark:text-gray-100'>
                  <span className='font-medium'>{payment.from?.name || "Former member"}</span>{" "}
                  paid{" "}
                  <span className='font-medium'>{payment.to?.name || "former member"}</span>{" "}
                  <span className='font-semibold text-green-700 dark:text-green-300'>
                    {formatMoney(payment.amount, payment.currency || currency)}
                  </span>
                  <span className='text-gray-600 dark:text-gray-400'>
                    {" "}on {new Date(payment.createdAt).toLocaleDateString()}
                  </span>
                </span>
                {canRemove(payment) && (
                  <Button
                    size='sm'
                    variant='ghost'
                    loading={busy === payment.id}
                    disabled={busy !== null}
                    onClick={() => removePayment(payment)}
                    aria-label={`Undo payment from ${payment.from?.name} to ${payment.to?.name}`}
                  >
                    <Undo2 size={16} className='mr-1' aria-hidden='true' />
                    Undo
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SplitSummary;

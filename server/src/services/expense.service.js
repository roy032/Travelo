import Expense from '#models/expense.model.js';
import Trip from '#models/trip.model.js';
import Notification from '#models/notification.model.js';
import fs from 'fs/promises';
import { deleteFiles } from '#config/uploadthing.config.js';
import { convertAmount } from '#services/currency.service.js';

/**
 * Shape an expense document for API responses
 */
const toExpenseResponse = (expense) => ({
  id: expense._id,
  trip: expense.trip,
  amount: expense.amount,
  currency: expense.currency,
  // Expenses saved before currency support were recorded in the base currency
  convertedAmount: expense.convertedAmount ?? expense.amount,
  baseCurrency: expense.baseCurrency || expense.currency,
  exchangeRate: expense.exchangeRate ?? 1,
  rateSource: expense.rateSource,
  splitBetween: expense.splitBetween || [],
  category: expense.category,
  description: expense.description,
  payer: expense.payer,
  receipt: expense.receipt,
  creator: expense.creator,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

/**
 * Convert an expense amount into the trip's base currency
 */
const conversionFields = async (amount, currency, baseCurrency) => {
  const result = await convertAmount(amount, currency, baseCurrency);
  return {
    convertedAmount: result.converted,
    baseCurrency: result.to,
    exchangeRate: result.rate,
    rateSource: result.approximate ? `${result.source} (approximate)` : result.source,
  };
};

/**
 * Check that every member in splitBetween belongs to the trip
 */
const assertSplitMembers = (tripDoc, splitBetween) => {
  if (!splitBetween) return;
  const memberIds = new Set(tripDoc.members.map((id) => id.toString()));
  if (splitBetween.some((id) => !memberIds.has(id.toString()))) {
    throw new Error('Split members must be members of the trip');
  }
};

/**
 * Re-convert every expense of a trip after its base currency changes.
 * Uses current rates, since historical rates are not stored per currency pair.
 */
export const reconvertTripExpenses = async (tripId, baseCurrency) => {
  const expenses = await Expense.find({ trip: tripId });
  for (const expense of expenses) {
    Object.assign(
      expense,
      await conversionFields(expense.amount, expense.currency || 'BDT', baseCurrency)
    );
    await expense.save();
  }
  return expenses.length;
};

/**
 * Load an expense and verify it belongs to the given trip and that the user
 * may modify it (expense creator, payer, or trip owner).
 */
const loadEditableExpense = async (expenseId, tripId, userId) => {
  const expense = await Expense.findById(expenseId);

  if (!expense || (tripId && expense.trip.toString() !== tripId.toString())) {
    throw new Error('Expense not found');
  }

  const tripDoc = await Trip.findById(expense.trip);
  const uid = userId.toString();
  const canEdit =
    expense.creator?.toString() === uid ||
    expense.payer?.toString() === uid ||
    tripDoc?.owner?.toString() === uid;

  if (!canEdit) {
    throw new Error('Access denied: You cannot modify this expense');
  }

  return expense;
};

/**
 * Remove a stored receipt (UploadThing key, or legacy local file). Never throws.
 */
const removeReceipt = async (receipt) => {
  if (!receipt) return;
  try {
    if (receipt.key) {
      await deleteFiles(receipt.key);
    } else if (receipt.path) {
      await fs.unlink(receipt.path);
    }
  } catch (fileError) {
    console.error('Failed to delete old receipt:', fileError.message);
  }
};

/**
 * Create a new expense
 * @param {Object} expenseData - Expense creation data
 * @param {string} expenseData.trip - Trip ID
 * @param {number} expenseData.amount - Expense amount
 * @param {string} expenseData.currency - Currency code (default: the trip's base currency)
 * @param {Array<string>} expenseData.splitBetween - Members sharing it (default: everyone)
 * @param {string} expenseData.category - Expense category
 * @param {string} expenseData.description - Expense description
 * @param {string} expenseData.payer - User ID of the payer
 * @param {Object} expenseData.receipt - Receipt information (optional)
 * @param {string} expenseData.creator - User ID of the creator
 * @returns {Promise<Object>} Created expense object
 * @throws {Error} If validation fails or payer is not a trip member
 */
export const createExpense = async (expenseData) => {
  try {
    const {
      trip,
      amount,
      currency,
      category,
      description,
      payer,
      receipt,
      creator,
      splitBetween,
    } = expenseData;

    // Verify trip exists and payer is a member
    const tripDoc = await Trip.findById(trip);

    if (!tripDoc) {
      throw new Error('Trip not found');
    }

    // Validate that payer is a trip member
    const isPayerMember = tripDoc.members.some(
      (memberId) => memberId.toString() === payer.toString()
    );

    if (!isPayerMember) {
      throw new Error('Payer must be a member of the trip');
    }

    assertSplitMembers(tripDoc, splitBetween);

    const tripCurrency = tripDoc.baseCurrency || 'BDT';
    const expenseCurrency = currency || tripCurrency;

    // Create new expense
    const expense = new Expense({
      trip,
      amount,
      currency: expenseCurrency,
      ...(await conversionFields(amount, expenseCurrency, tripCurrency)),
      splitBetween: splitBetween || [],
      category,
      description,
      payer,
      receipt,
      creator,
    });

    await expense.save();

    // Populate payer and creator information
    await expense.populate('payer', 'name email');
    await expense.populate('creator', 'name email');

    // Create notifications for all trip members except the creator
    const notifications = tripDoc.members
      .filter((member) => member.toString() !== creator.toString())
      .map((member) => ({
        user: member,
        type: 'expense_added',
        title: 'New Expense Added',
        message: `A new expense of ${expenseCurrency} ${amount} for "${description}" has been added to the trip`,
        relatedTrip: trip,
        relatedResource: expense._id,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return toExpenseResponse(expense);
  } catch (e) {
    throw e;
  }
};

/**
 * Update an existing expense
 * @param {string} expenseId - Expense ID
 * @param {string} userId - User ID attempting the update
 * @param {Object} updateData - Data to update
 * @param {string} [tripId] - Trip ID from the route; the expense must belong to it
 * @returns {Promise<Object>} Updated expense object
 * @throws {Error} If expense not found or user may not edit it
 */
export const updateExpense = async (expenseId, userId, updateData, tripId) => {
  try {
    const expense = await loadEditableExpense(expenseId, tripId, userId);

    // Update allowed fields
    const allowedUpdates = [
      'amount',
      'currency',
      'category',
      'description',
      'payer',
      'receipt',
      'splitBetween',
    ];

    if (updateData.splitBetween) {
      assertSplitMembers(await Trip.findById(expense.trip), updateData.splitBetween);
    }

    // If payer is being updated, validate they are a trip member
    if (updateData.payer && updateData.payer !== expense.payer.toString()) {
      const tripDoc = await Trip.findById(expense.trip);

      if (!tripDoc) {
        throw new Error('Trip not found');
      }

      const isPayerMember = tripDoc.members.some(
        (memberId) => memberId.toString() === updateData.payer.toString()
      );

      if (!isPayerMember) {
        throw new Error('Payer must be a member of the trip');
      }
    }

    // If a new receipt is being uploaded, delete the old one
    if (updateData.receipt && expense.receipt) {
      await removeReceipt(expense.receipt);
    }

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        expense[field] = updateData[field];
      }
    });

    if (updateData.amount !== undefined || updateData.currency !== undefined) {
      const tripDoc = await Trip.findById(expense.trip);
      Object.assign(
        expense,
        await conversionFields(
          expense.amount,
          expense.currency || 'BDT',
          tripDoc?.baseCurrency || 'BDT'
        )
      );
    }

    await expense.save();
    await expense.populate('payer', 'name email');
    await expense.populate('creator', 'name email');

    // Get all trip members for notifications
    const tripDoc = await Trip.findById(expense.trip).populate('members', '_id');

    if (tripDoc) {
      // Create notifications for all trip members except the updater
      const notifications = tripDoc.members
        .filter((member) => member._id.toString() !== userId.toString())
        .map((member) => ({
          user: member._id,
          type: 'expense_added',
          title: 'Expense Updated',
          message: `The expense "${expense.description}" has been updated`,
          relatedTrip: expense.trip,
          relatedResource: expense._id,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return toExpenseResponse(expense);
  } catch (e) {
    throw e;
  }
};

/**
 * Delete an expense
 * @param {string} expenseId - Expense ID
 * @param {string} userId - User ID attempting the deletion
 * @param {string} [tripId] - Trip ID from the route; the expense must belong to it
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If expense not found or user may not delete it
 */
export const deleteExpense = async (expenseId, userId, tripId) => {
  try {
    const expense = await loadEditableExpense(expenseId, tripId, userId);

    const expenseTripId = expense.trip;
    const expenseDescription = expense.description;

    // Delete associated receipt file if exists
    await removeReceipt(expense.receipt);

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    // Get all trip members for notifications
    const tripDoc = await Trip.findById(expenseTripId).populate('members', '_id');

    if (tripDoc) {
      // Create notifications for all trip members except the deleter
      const notifications = tripDoc.members
        .filter((member) => member._id.toString() !== userId.toString())
        .map((member) => ({
          user: member._id,
          type: 'expense_added',
          title: 'Expense Deleted',
          message: `The expense "${expenseDescription}" has been deleted`,
          relatedTrip: expenseTripId,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return {
      message: 'Expense deleted successfully',
      expenseId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all expenses for a trip
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the expenses
 * @returns {Promise<Array>} Array of expense objects
 * @throws {Error} If trip not found or user is not a member
 */
export const getExpensesByTrip = async (tripId, userId) => {
  try {
    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error('Access denied: You are not a member of this trip');
    }

    // Get all expenses for the trip, sorted by creation date (newest first)
    const expenses = await Expense.find({ trip: tripId })
      .populate('payer', 'name email')
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    return expenses.map(toExpenseResponse);
  } catch (e) {
    throw e;
  }
};

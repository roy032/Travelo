import Expense from '#models/expense.model.js';
import Trip from '#models/trip.model.js';

/**
 * Calculate expense splits for a trip with equal division
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the calculation
 * @returns {Promise<Object>} Split calculation results
 * @throws {Error} If trip not found or user is not a member
 */
export const calculateSplits = async (tripId, userId) => {
  try {
    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId).populate('members', 'name email');

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (member) => member._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error('Access denied: You are not a member of this trip');
    }

    // Get all expenses for the trip
    const expenses = await Expense.find({ trip: tripId }).populate('payer', 'name email');

    // If no expenses, return empty splits
    if (expenses.length === 0) {
      return {
        tripId,
        memberCount: trip.members.length,
        totalExpenses: 0,
        equalShare: 0,
        splits: trip.members.map((member) => ({
          user: {
            id: member._id,
            name: member.name,
            email: member.email,
          },
          totalPaid: 0,
          equalShare: 0,
          netBalance: 0,
        })),
      };
    }

    // Work in integer cents so rounding never makes balances drift
    const toCents = (value) => Math.round(Number(value) * 100);
    const fromCents = (cents) => cents / 100;

    const memberCount = trip.members.length;
    const totalCents = expenses.reduce(
      (sum, expense) => sum + toCents(expense.amount),
      0
    );

    // Equal share in cents; leftover cents go one each to the first members
    // (ordered by id so the result is stable between requests)
    const baseShareCents = Math.floor(totalCents / memberCount);
    const remainderCents = totalCents - baseShareCents * memberCount;
    const orderedIds = trip.members
      .map((member) => member._id.toString())
      .sort();
    const shareCents = {};
    orderedIds.forEach((id, index) => {
      shareCents[id] = baseShareCents + (index < remainderCents ? 1 : 0);
    });

    // Calculate total paid by each member
    const memberPayments = {};
    orderedIds.forEach((id) => {
      memberPayments[id] = 0;
    });

    // Sum up payments by each member (payer may be null if the user was deleted)
    expenses.forEach((expense) => {
      const payerId = expense.payer?._id?.toString();
      if (payerId && memberPayments[payerId] !== undefined) {
        memberPayments[payerId] += toCents(expense.amount);
      }
    });

    // Calculate net balance for each member
    // Positive balance = member is owed money (paid more than their share)
    // Negative balance = member owes money (paid less than their share)
    const splits = trip.members.map((member) => {
      const memberId = member._id.toString();
      const paidCents = memberPayments[memberId] || 0;
      const memberShareCents = shareCents[memberId];

      return {
        user: {
          id: member._id,
          name: member.name,
          email: member.email,
        },
        totalPaid: fromCents(paidCents),
        equalShare: fromCents(memberShareCents),
        netBalance: fromCents(paidCents - memberShareCents),
      };
    });

    const totalExpenses = fromCents(totalCents);
    const equalShare = totalExpenses / memberCount;

    return {
      tripId,
      memberCount,
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      equalShare: parseFloat(equalShare.toFixed(2)),
      splits,
    };
  } catch (e) {
    throw e;
  }
};

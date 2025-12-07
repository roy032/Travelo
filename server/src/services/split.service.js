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

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate equal share per member
    const memberCount = trip.members.length;
    const equalShare = totalExpenses / memberCount;

    // Calculate total paid by each member
    const memberPayments = {};

    // Initialize all members with 0
    trip.members.forEach((member) => {
      memberPayments[member._id.toString()] = 0;
    });

    // Sum up payments by each member
    expenses.forEach((expense) => {
      const payerId = expense.payer._id.toString();
      if (memberPayments[payerId] !== undefined) {
        memberPayments[payerId] += expense.amount;
      }
    });

    // Calculate net balance for each member
    // Positive balance = member is owed money (paid more than their share)
    // Negative balance = member owes money (paid less than their share)
    const splits = trip.members.map((member) => {
      const memberId = member._id.toString();
      const totalPaid = memberPayments[memberId] || 0;
      const netBalance = totalPaid - equalShare;

      return {
        user: {
          id: member._id,
          name: member.name,
          email: member.email,
        },
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        equalShare: parseFloat(equalShare.toFixed(2)),
        netBalance: parseFloat(netBalance.toFixed(2)),
      };
    });

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

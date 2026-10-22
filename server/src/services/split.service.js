import mongoose from 'mongoose';
import Expense from '#models/expense.model.js';
import Settlement from '#models/settlement.model.js';
import Trip from '#models/trip.model.js';

// Work in integer cents so rounding never makes balances drift
const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => cents / 100;

const idOf = (value) => (value?._id ?? value)?.toString();

/**
 * Work out what each member paid, what their share is and what they are owed.
 *
 * Each expense is split equally between its `splitBetween` members (everyone
 * when empty, or when none of them are still on the trip). Leftover cents go
 * one each to the first sharers ordered by id, so results are stable.
 * Recorded settlements move balance from the recipient to the payer.
 *
 * @param {Object} input
 * @param {Array<string>} input.memberIds - Current trip members
 * @param {Array<{payer, convertedAmount, amount, splitBetween}>} input.expenses
 * @param {Array<{from, to, amount}>} [input.settlements]
 * @returns {Object<string, {paidCents, shareCents, sentCents, receivedCents, balanceCents}>}
 */
export const computeBalances = ({ memberIds, expenses, settlements = [] }) => {
  const members = memberIds.map((id) => id.toString());
  const memberSet = new Set(members);
  const sortedMembers = [...members].sort();

  const ledger = {};
  members.forEach((id) => {
    ledger[id] = { paidCents: 0, shareCents: 0, sentCents: 0, receivedCents: 0 };
  });

  expenses.forEach((expense) => {
    const cents = toCents(expense.convertedAmount ?? expense.amount);
    const chosen = (expense.splitBetween || [])
      .map(idOf)
      .filter((id) => memberSet.has(id));
    const sharers = chosen.length > 0 ? [...new Set(chosen)].sort() : sortedMembers;

    if (sharers.length === 0) return;

    const base = Math.floor(cents / sharers.length);
    const remainder = cents - base * sharers.length;
    sharers.forEach((id, index) => {
      ledger[id].shareCents += base + (index < remainder ? 1 : 0);
    });

    // The payer may have left the trip or been deleted; their payment then
    // still counts against everyone's share but nobody is owed for it
    const payerId = idOf(expense.payer);
    if (payerId && ledger[payerId]) {
      ledger[payerId].paidCents += cents;
    }
  });

  settlements.forEach((settlement) => {
    const from = idOf(settlement.from);
    const to = idOf(settlement.to);
    const cents = toCents(settlement.amount);
    if (ledger[from]) ledger[from].sentCents += cents;
    if (ledger[to]) ledger[to].receivedCents += cents;
  });

  Object.values(ledger).forEach((entry) => {
    entry.balanceCents =
      entry.paidCents - entry.shareCents + entry.sentCents - entry.receivedCents;
  });

  return ledger;
};

/**
 * Fewest-ish payments that settle every balance: repeatedly match the member
 * owed the most with the member who owes the most.
 * @param {Object<string, {balanceCents:number}>} ledger
 * @returns {Array<{from:string, to:string, amountCents:number}>}
 */
export const suggestPayments = (ledger) => {
  const byAmount = (a, b) => b.cents - a.cents || a.id.localeCompare(b.id);
  const creditors = [];
  const debtors = [];

  Object.entries(ledger).forEach(([id, entry]) => {
    if (entry.balanceCents > 0) creditors.push({ id, cents: entry.balanceCents });
    if (entry.balanceCents < 0) debtors.push({ id, cents: -entry.balanceCents });
  });

  const payments = [];
  creditors.sort(byAmount);
  debtors.sort(byAmount);

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const cents = Math.min(creditor.cents, debtor.cents);

    payments.push({ from: debtor.id, to: creditor.id, amountCents: cents });

    creditor.cents -= cents;
    debtor.cents -= cents;
    if (creditor.cents === 0) creditors.shift();
    if (debtor.cents === 0) debtors.shift();
    creditors.sort(byAmount);
    debtors.sort(byAmount);
  }

  return payments;
};

const userSummary = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

/**
 * Calculate expense splits, balances and suggested payments for a trip
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the calculation
 * @returns {Promise<Object>} Split calculation results
 * @throws {Error} If trip not found or user is not a member
 */
export const calculateSplits = async (tripId, userId) => {
  // Verify trip exists and user is a member
  const trip = await Trip.findById(tripId).populate('members', 'name email');

  if (!trip) {
    throw new Error('Trip not found');
  }

  const isMember = trip.members.some(
    (member) => member._id.toString() === userId.toString()
  );

  if (!isMember) {
    throw new Error('Access denied: You are not a member of this trip');
  }

  const [expenses, settlements] = await Promise.all([
    Expense.find({ trip: tripId }).lean(),
    Settlement.find({ trip: tripId })
      .populate('from', 'name email')
      .populate('to', 'name email')
      .populate('creator', 'name')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const memberIds = trip.members.map((member) => member._id.toString());
  const ledger = computeBalances({ memberIds, expenses, settlements });
  const membersById = Object.fromEntries(
    trip.members.map((member) => [member._id.toString(), member])
  );

  const totalCents = expenses.reduce(
    (sum, expense) => sum + toCents(expense.convertedAmount ?? expense.amount),
    0
  );
  const memberCount = trip.members.length;
  const currency = trip.baseCurrency || 'BDT';

  const byCategoryCents = {};
  expenses.forEach((expense) => {
    byCategoryCents[expense.category] =
      (byCategoryCents[expense.category] || 0) +
      toCents(expense.convertedAmount ?? expense.amount);
  });

  const splits = trip.members.map((member) => {
    const entry = ledger[member._id.toString()];
    return {
      user: userSummary(member),
      totalPaid: fromCents(entry.paidCents),
      // Kept under its original name for older clients; it is now the
      // member's share of the expenses they take part in
      equalShare: fromCents(entry.shareCents),
      share: fromCents(entry.shareCents),
      paymentsSent: fromCents(entry.sentCents),
      paymentsReceived: fromCents(entry.receivedCents),
      netBalance: fromCents(entry.balanceCents),
    };
  });

  const suggestedPayments = suggestPayments(ledger).map((payment) => ({
    from: userSummary(membersById[payment.from]),
    to: userSummary(membersById[payment.to]),
    amount: fromCents(payment.amountCents),
  }));

  const budget = trip.budget ?? null;

  return {
    tripId,
    currency,
    memberCount,
    expenseCount: expenses.length,
    totalExpenses: fromCents(totalCents),
    equalShare: memberCount > 0 ? Math.round(totalCents / memberCount) / 100 : 0,
    budget,
    budgetRemaining: budget === null ? null : fromCents(toCents(budget) - totalCents),
    byCategory: Object.entries(byCategoryCents)
      .map(([category, cents]) => ({ category, total: fromCents(cents) }))
      .sort((a, b) => b.total - a.total),
    splits,
    suggestedPayments,
    recordedPayments: settlements.map((settlement) => ({
      id: settlement._id,
      from: settlement.from ? userSummary(settlement.from) : null,
      to: settlement.to ? userSummary(settlement.to) : null,
      amount: settlement.amount,
      currency: settlement.currency || currency,
      note: settlement.note,
      createdBy: settlement.creator?.name,
      createdAt: settlement.createdAt,
    })),
  };
};

/**
 * Record a payment from one member to another, in the trip's base currency
 * @throws {Error} If either member is not on the trip
 */
export const createSettlement = async (tripId, userId, { from, to, amount, note }) => {
  const trip = await Trip.findById(tripId);
  const memberIds = new Set(trip.members.map((id) => id.toString()));

  if (!memberIds.has(from) || !memberIds.has(to)) {
    throw new Error('Both members must belong to the trip');
  }

  const settlement = await Settlement.create({
    trip: tripId,
    from,
    to,
    amount: fromCents(toCents(amount)),
    currency: trip.baseCurrency || 'BDT',
    note,
    creator: userId,
  });

  return {
    id: settlement._id,
    from: settlement.from,
    to: settlement.to,
    amount: settlement.amount,
    currency: settlement.currency,
    note: settlement.note,
    createdAt: settlement.createdAt,
  };
};

/**
 * Remove a recorded payment. Its creator, either member involved or the
 * trip owner may do this.
 */
export const deleteSettlement = async (tripId, settlementId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(settlementId)) {
    throw new Error('Payment not found');
  }

  const settlement = await Settlement.findOne({ _id: settlementId, trip: tripId });
  if (!settlement) {
    throw new Error('Payment not found');
  }

  const trip = await Trip.findById(tripId);
  const uid = userId.toString();
  const allowed = [
    settlement.creator,
    settlement.from,
    settlement.to,
    trip?.owner,
  ].some((id) => id?.toString() === uid);

  if (!allowed) {
    throw new Error('Access denied: You cannot remove this payment');
  }

  await settlement.deleteOne();
};

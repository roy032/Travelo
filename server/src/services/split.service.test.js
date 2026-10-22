import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeBalances, suggestPayments } from './split.service.js';

const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const C = 'cccccccccccccccccccccccc';

const balances = (ledger) =>
  Object.fromEntries(Object.entries(ledger).map(([id, e]) => [id, e.balanceCents]));

describe('computeBalances', () => {
  it('splits an expense equally between everyone by default', () => {
    const ledger = computeBalances({
      memberIds: [A, B, C],
      expenses: [{ payer: A, amount: 90 }],
    });
    expect(balances(ledger)).toEqual({ [A]: 6000, [B]: -3000, [C]: -3000 });
  });

  it('only charges the members an expense is split between', () => {
    const ledger = computeBalances({
      memberIds: [A, B, C],
      expenses: [{ payer: A, amount: 50, splitBetween: [A, B] }],
    });
    expect(balances(ledger)).toEqual({ [A]: 2500, [B]: -2500, [C]: 0 });
  });

  it('uses the converted amount when an expense was in another currency', () => {
    const ledger = computeBalances({
      memberIds: [A, B],
      expenses: [{ payer: B, amount: 10, currency: 'EUR', convertedAmount: 1400 }],
    });
    expect(balances(ledger)).toEqual({ [A]: -70000, [B]: 70000 });
  });

  it('falls back to everyone when no chosen sharer is still on the trip', () => {
    const ledger = computeBalances({
      memberIds: [A, B],
      expenses: [{ payer: A, amount: 10, splitBetween: [C] }],
    });
    expect(balances(ledger)).toEqual({ [A]: 500, [B]: -500 });
  });

  it('hands leftover cents to the first sharers so nothing drifts', () => {
    const ledger = computeBalances({
      memberIds: [C, B, A],
      expenses: [{ payer: A, amount: 0.1 }],
    });
    expect(ledger[A].shareCents).toBe(4);
    expect(ledger[B].shareCents).toBe(3);
    expect(ledger[C].shareCents).toBe(3);
  });

  it('counts recorded payments towards settling up', () => {
    const ledger = computeBalances({
      memberIds: [A, B],
      expenses: [{ payer: A, amount: 100 }],
      settlements: [{ from: B, to: A, amount: 50 }],
    });
    expect(balances(ledger)).toEqual({ [A]: 0, [B]: 0 });
  });
});

describe('suggestPayments', () => {
  it('says who owes whom', () => {
    const ledger = computeBalances({
      memberIds: [A, B, C],
      expenses: [
        { payer: A, amount: 90 },
        { payer: B, amount: 30 },
      ],
    });
    // Shares are 40 each: A is owed 50, B owes 10, C owes 40
    expect(suggestPayments(ledger)).toEqual([
      { from: C, to: A, amountCents: 4000 },
      { from: B, to: A, amountCents: 1000 },
    ]);
  });

  it('returns nothing when everyone is settled', () => {
    const ledger = computeBalances({
      memberIds: [A, B],
      expenses: [
        { payer: A, amount: 20 },
        { payer: B, amount: 20 },
      ],
    });
    expect(suggestPayments(ledger)).toEqual([]);
  });

  it('always settles every balance with at most n-1 payments', () => {
    const members = [A, B, C, 'dddddddddddddddddddddddd'];
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            payer: fc.constantFrom(...members),
            amount: fc.integer({ min: 1, max: 1_000_000 }).map((c) => c / 100),
            splitBetween: fc.subarray(members),
          }),
          { maxLength: 20 }
        ),
        (expenses) => {
          const ledger = computeBalances({ memberIds: members, expenses });
          const total = Object.values(ledger).reduce((s, e) => s + e.balanceCents, 0);
          expect(total).toBe(0);

          const payments = suggestPayments(ledger);
          expect(payments.length).toBeLessThanOrEqual(members.length - 1);

          const after = computeBalances({
            memberIds: members,
            expenses,
            settlements: payments.map((p) => ({ ...p, amount: p.amountCents / 100 })),
          });
          Object.values(after).forEach((e) => expect(e.balanceCents).toBe(0));
        }
      )
    );
  });
});

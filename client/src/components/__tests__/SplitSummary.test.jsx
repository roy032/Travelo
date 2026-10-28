import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SplitSummary from "../features/expenses/SplitSummary";
import { expenseApi } from "../../services/api.service";
import { expectNoAxeViolations } from "../../test/axe";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const user = (id, name) => ({ id, name, email: `${name.toLowerCase()}@example.com` });
const owner = user("u1", "Owner");
const member = user("u2", "Member");
const third = user("u3", "Third");

const splits = (overrides = {}) => ({
  currency: "BDT",
  memberCount: 3,
  totalExpenses: 1100,
  equalShare: 366.67,
  budget: 1000,
  budgetRemaining: -100,
  byCategory: [
    { category: "accommodation", total: 900 },
    { category: "food", total: 200 },
  ],
  splits: [
    { user: owner, totalPaid: 900, share: 400, netBalance: 500 },
    { user: member, totalPaid: 200, share: 400, netBalance: -200 },
    { user: third, totalPaid: 0, share: 300, netBalance: -300 },
  ],
  suggestedPayments: [
    { from: third, to: owner, amount: 300 },
    { from: member, to: owner, amount: 200 },
  ],
  recordedPayments: [],
  ...overrides,
});

describe("SplitSummary", () => {
  beforeEach(() => {
    vi.spyOn(expenseApi, "getSplits").mockResolvedValue(splits());
    vi.spyOn(expenseApi, "createSettlement").mockResolvedValue({ id: "s1" });
    vi.spyOn(expenseApi, "deleteSettlement").mockResolvedValue({});
  });

  it("shows the budget, categories and who owes whom", async () => {
    const { container } = render(<SplitSummary tripId='t1' currentUserId='u1' isOwner />);

    expect(await screen.findByText("Over budget by ৳100.00")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Budget used" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
    expect(screen.getByText("Accommodation")).toBeInTheDocument();
    expect(screen.getByText("Gets back ৳500.00")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Mark .* as paid/ })).toHaveLength(2);

    await expectNoAxeViolations(container);
  });

  it("records a payment and reloads the balances", async () => {
    const userEv = userEvent.setup();
    render(<SplitSummary tripId='t1' currentUserId='u3' />);

    await userEv.click(
      await screen.findByRole("button", {
        name: "Mark Third's payment of ৳300.00 to Owner as paid",
      })
    );

    expect(expenseApi.createSettlement).toHaveBeenCalledWith("t1", {
      from: "u3",
      to: "u1",
      amount: 300,
    });
    expect(expenseApi.getSplits).toHaveBeenCalledTimes(2);
  });

  it("lets people involved undo a recorded payment", async () => {
    expenseApi.getSplits.mockResolvedValue(
      splits({
        suggestedPayments: [],
        budget: null,
        budgetRemaining: null,
        recordedPayments: [
          { id: "s1", from: third, to: owner, amount: 300, createdAt: "2026-10-20T10:00:00Z" },
          { id: "s2", from: member, to: owner, amount: 200, createdAt: "2026-10-20T10:00:00Z" },
        ],
      })
    );
    const userEv = userEvent.setup();
    render(<SplitSummary tripId='t1' currentUserId='u3' />);

    expect(await screen.findByText("Everyone is settled up.")).toBeInTheDocument();
    expect(screen.getByText(/hasn't set a budget/)).toBeInTheDocument();
    // Third was not part of the second payment
    const undo = screen.getAllByRole("button", { name: /Undo payment/ });
    expect(undo).toHaveLength(1);

    await userEv.click(undo[0]);
    expect(expenseApi.deleteSettlement).toHaveBeenCalledWith("t1", "s1");
  });
});

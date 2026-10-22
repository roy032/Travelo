import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpenseForm from "../features/expenses/ExpenseForm";
import { currencyApi } from "../../services/api.service";
import { expectNoAxeViolations } from "../../test/axe";

const members = [
  { _id: "u1", name: "Ayesha" },
  { _id: "u2", name: "Rafi" },
  { _id: "u3", name: "Nila" },
];

const fillBasics = async (user) => {
  await user.type(screen.getByLabelText(/^Amount/), "30");
  await user.type(screen.getByLabelText("Description"), "Boat tickets");
};

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.spyOn(currencyApi, "convert").mockResolvedValue({
      from: "EUR",
      to: "BDT",
      rate: 140,
      converted: 4200,
      approximate: false,
    });
  });

  it("splits between everyone by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseForm members={members} baseCurrency='BDT' onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fillBasics(user);
    expect(screen.getByText(/৳10\.00 each for 3 people/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 30,
        currency: "BDT",
        payer: "u1",
        splitBetween: [],
      }),
      null
    );
    expect(currencyApi.convert).not.toHaveBeenCalled();
  });

  it("sends only the members ticked to share it", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fillBasics(user);
    await user.click(screen.getByRole("checkbox", { name: "Nila" }));
    expect(screen.getByText(/each for 2 people/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    expect(onSubmit.mock.calls[0][0].splitBetween).toEqual(["u1", "u2"]);
  });

  it("asks for at least one person to split with", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseForm members={members.slice(0, 2)} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fillBasics(user);
    await user.click(screen.getByRole("checkbox", { name: "Ayesha" }));
    await user.click(screen.getByRole("checkbox", { name: "Rafi" }));
    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("at least one person");
  });

  it("previews a foreign amount in the trip currency", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <ExpenseForm members={members} baseCurrency='BDT' onSubmit={onSubmit} onCancel={vi.fn()} />
    );

    await user.selectOptions(screen.getByLabelText("Currency"), "EUR");
    await fillBasics(user);

    await waitFor(() =>
      expect(screen.getByText(/≈ ৳4,200\.00 at 140 BDT\/EUR/)).toBeInTheDocument()
    );
    expect(currencyApi.convert).toHaveBeenLastCalledWith(30, "EUR", "BDT");

    await user.click(screen.getByRole("button", { name: "Add Expense" }));
    expect(onSubmit.mock.calls[0][0].currency).toBe("EUR");

    await expectNoAxeViolations(container);
  });
});

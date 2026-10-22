import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../RegisterPage";
import { makeAuth, renderWithProviders } from "../../test/utils";

const fill = async ({ name, email, password, confirm }) => {
  if (name) await userEvent.type(screen.getByLabelText("Full Name"), name);
  if (email) await userEvent.type(screen.getByLabelText("Email address"), email);
  if (password) await userEvent.type(screen.getByLabelText("Password"), password);
  if (confirm)
    await userEvent.type(screen.getByLabelText("Confirm Password"), confirm);
};

describe("RegisterPage", () => {
  it("requires matching passwords of at least 8 characters", async () => {
    const { auth, container } = renderWithProviders(<RegisterPage />);
    await fill({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
      confirm: "different",
    });

    fireEvent.submit(container.querySelector("form"));

    expect(
      await screen.findByText("Password must be at least 8 characters")
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("clears a field's error as the user types", async () => {
    const { container } = renderWithProviders(<RegisterPage />);
    fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Full Name"), "A");

    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("registers without sending the confirmation field", async () => {
    const auth = makeAuth({ register: vi.fn().mockResolvedValue({}) });
    renderWithProviders(<RegisterPage />, { auth, route: "/register" });
    await fill({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
      confirm: "password123",
    });

    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(auth.register).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
    });
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/trips")
    );
  });
});

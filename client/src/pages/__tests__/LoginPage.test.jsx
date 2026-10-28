import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../LoginPage";
import { makeAuth, renderWithProviders } from "../../test/utils";
import { expectNoAxeViolations } from "../../test/axe";

describe("LoginPage", () => {
  it("validates the form before calling the API", async () => {
    const { auth, container } = renderWithProviders(<LoginPage />, {
      route: "/login",
    });

    fireEvent.submit(container.querySelector("form"));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const { auth, container } = renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email address"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "password123");

    fireEvent.submit(container.querySelector("form"));

    expect(await screen.findByText("Email is invalid")).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("signs in and goes to the trips page", async () => {
    const auth = makeAuth({ login: vi.fn().mockResolvedValue({}) });
    renderWithProviders(<LoginPage />, { auth, route: "/login" });

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(auth.login).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "password123",
    });
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/trips")
    );
  });

  it("returns to the page the user came from", async () => {
    const auth = makeAuth({ login: vi.fn().mockResolvedValue({}) });
    renderWithProviders(<LoginPage />, {
      auth,
      route: "/login",
      initialState: { from: { pathname: "/explore" } },
    });

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/explore")
    );
  });

  it("stays on the page when sign-in fails", async () => {
    const auth = makeAuth({
      login: vi.fn().mockRejectedValue(new Error("Invalid credentials")),
    });
    renderWithProviders(<LoginPage />, { auth, route: "/login" });

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(auth.login).toHaveBeenCalled());
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("asks for the app code when two-factor sign-in is on", async () => {
    const auth = makeAuth({
      login: vi.fn().mockResolvedValue({ twoFactorRequired: true, challenge: "ch" }),
      completeTwoFactor: vi.fn().mockResolvedValue({}),
    });
    const { container } = renderWithProviders(<LoginPage />, { auth, route: "/login" });

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Enter your sign-in code" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    await expectNoAxeViolations(container);

    await userEvent.type(screen.getByLabelText("6-digit code"), "123 456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(auth.completeTwoFactor).toHaveBeenCalledWith({ challenge: "ch", code: "123456" });
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/trips")
    );
  });

  it("accepts a recovery code instead", async () => {
    const auth = makeAuth({
      login: vi.fn().mockResolvedValue({ twoFactorRequired: true, challenge: "ch" }),
      completeTwoFactor: vi.fn().mockResolvedValue({}),
    });
    renderWithProviders(<LoginPage />, { auth, route: "/login" });

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Use a recovery code instead" })
    );
    await userEvent.type(screen.getByLabelText("Recovery code"), "abcd-efgh-jkmn");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(auth.completeTwoFactor).toHaveBeenCalledWith({
      challenge: "ch",
      recoveryCode: "abcd-efgh-jkmn",
    });
  });
});

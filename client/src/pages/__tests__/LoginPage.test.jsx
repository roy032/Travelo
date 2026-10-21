import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../LoginPage";
import { makeAuth, renderWithProviders } from "../../test/utils";

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
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "../ForgotPasswordPage";
import ResetPasswordPage from "../ResetPasswordPage";
import VerifyEmailPage from "../VerifyEmailPage";
import { makeAuth, renderWithProviders } from "../../test/utils";
import { authApi } from "../../services/api.service";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock("../../services/api.service", () => ({
  authApi: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

const TOKEN = "a".repeat(64);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ForgotPasswordPage", () => {
  it("validates the email before calling the API", async () => {
    const { container } = renderWithProviders(<ForgotPasswordPage />);
    fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email address"), "nope");
    fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByText("Email is invalid")).toBeInTheDocument();
    expect(authApi.forgotPassword).not.toHaveBeenCalled();
  });

  it("shows the server's confirmation after sending", async () => {
    authApi.forgotPassword.mockResolvedValue({
      message: "If an account exists for that email, we've sent a link.",
    });
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(authApi.forgotPassword).toHaveBeenCalledWith("a@b.com");
    expect(
      await screen.findByText("If an account exists for that email, we've sent a link.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "href",
      "/login"
    );
  });
});

describe("ResetPasswordPage", () => {
  it("asks for a new link when the token is missing", () => {
    renderWithProviders(<ResetPasswordPage />, { route: "/reset-password" });
    expect(screen.getByRole("alert")).toHaveTextContent(/incomplete/);
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  it("checks the password length and that both fields match", async () => {
    renderWithProviders(<ResetPasswordPage />, {
      route: `/reset-password?token=${TOKEN}`,
    });

    await userEvent.type(screen.getByLabelText("New password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "different");
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText("Password must be at least 8 characters")
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it("resets the password and sends the user to sign in", async () => {
    authApi.resetPassword.mockResolvedValue({ message: "ok" });
    const auth = makeAuth({ checkAuth: vi.fn().mockResolvedValue() });
    renderWithProviders(<ResetPasswordPage />, {
      auth,
      route: `/reset-password?token=${TOKEN}`,
    });

    await userEvent.type(screen.getByLabelText("New password"), "new-password");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "new-password");
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(authApi.resetPassword).toHaveBeenCalledWith({
      token: TOKEN,
      password: "new-password",
    });
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/login")
    );
    expect(auth.checkAuth).toHaveBeenCalled();
  });

  it("stays on the page when the link has expired", async () => {
    authApi.resetPassword.mockRejectedValue(new Error("expired"));
    renderWithProviders(<ResetPasswordPage />, {
      route: `/reset-password?token=${TOKEN}`,
    });

    await userEvent.type(screen.getByLabelText("New password"), "new-password");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "new-password");
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalled());
    expect(screen.getByTestId("location")).toHaveTextContent("/reset-password");
    expect(screen.getByRole("button", { name: "Reset password" })).toBeEnabled();
  });
});

describe("VerifyEmailPage", () => {
  it("confirms the email once and updates the signed-in user", async () => {
    authApi.verifyEmail.mockResolvedValue({ message: "ok" });
    const auth = makeAuth({ isAuthenticated: true, user: { name: "Ada" } });
    renderWithProviders(<VerifyEmailPage />, {
      auth,
      route: `/verify-email?token=${TOKEN}`,
    });

    expect(await screen.findByText("Email confirmed")).toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledTimes(1);
    expect(authApi.verifyEmail).toHaveBeenCalledWith(TOKEN);
    expect(auth.updateUser).toHaveBeenCalledWith({ emailVerified: true });
    expect(screen.getByRole("link", { name: "Go to my trips" })).toBeInTheDocument();
  });

  it("explains an invalid link", async () => {
    authApi.verifyEmail.mockRejectedValue(
      new Error("This link is invalid or has expired. Please request a new one.")
    );
    renderWithProviders(<VerifyEmailPage />, {
      route: `/verify-email?token=${TOKEN}`,
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid or has expired/);
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  it("does not call the API without a token", () => {
    renderWithProviders(<VerifyEmailPage />, { route: "/verify-email" });
    expect(screen.getByRole("alert")).toHaveTextContent(/incomplete/);
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });
});

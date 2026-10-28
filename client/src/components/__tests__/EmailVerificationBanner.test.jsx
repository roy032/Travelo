import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailVerificationBanner from "../auth/EmailVerificationBanner";
import { makeAuth, renderWithProviders } from "../../test/utils";
import { authApi } from "../../services/api.service";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock("../../services/api.service", () => ({
  authApi: { resendVerification: vi.fn() },
}));

const signedIn = (user) =>
  makeAuth({ isAuthenticated: true, user: { name: "Ada", email: "ada@example.com", ...user } });

beforeEach(() => vi.clearAllMocks());

describe("EmailVerificationBanner", () => {
  it("is hidden for signed-out and verified users", () => {
    const { container, unmount } = renderWithProviders(<EmailVerificationBanner />);
    expect(container.querySelector("[role=region]")).toBeNull();
    unmount();

    renderWithProviders(<EmailVerificationBanner />, {
      auth: signedIn({ emailVerified: true }),
    });
    expect(screen.queryByText(/confirm your email/i)).toBeNull();
  });

  it("resends the confirmation email for an unverified user", async () => {
    authApi.resendVerification.mockResolvedValue({ message: "sent" });
    renderWithProviders(<EmailVerificationBanner />, {
      auth: signedIn({ emailVerified: false }),
    });

    expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Resend email" }));

    expect(authApi.resendVerification).toHaveBeenCalled();
    expect(await screen.findByText("Check your inbox for the link.")).toBeInTheDocument();
  });

  it("hides itself when the server says the email is already confirmed", async () => {
    const error = Object.assign(new Error("already"), {
      data: { error: "Already verified" },
    });
    authApi.resendVerification.mockRejectedValue(error);
    const auth = signedIn({ emailVerified: false });
    renderWithProviders(<EmailVerificationBanner />, { auth });

    await userEvent.click(screen.getByRole("button", { name: "Resend email" }));

    expect(auth.updateUser).toHaveBeenCalledWith({ emailVerified: true });
  });
});

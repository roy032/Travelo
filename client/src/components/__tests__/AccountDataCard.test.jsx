import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountDataCard from "../features/account/AccountDataCard";
import { profileApi } from "../../services/api.service";
import { makeAuth, renderWithProviders } from "../../test/utils";
import { expectNoAxeViolations } from "../../test/axe";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

describe("AccountDataCard", () => {
  beforeEach(() => {
    vi.spyOn(profileApi, "deleteAccount").mockResolvedValue({});
    vi.spyOn(profileApi, "signOutEverywhere").mockResolvedValue({});
  });

  it("links to the data export", async () => {
    const { container } = renderWithProviders(<AccountDataCard />, {
      auth: makeAuth(),
    });
    const link = screen.getByRole("link", { name: "Download data" });
    expect(link.getAttribute("href")).toMatch(/\/api\/profile\/export$/);
    await expectNoAxeViolations(container);
  });

  it("deletes the account only after the password and DELETE are entered", async () => {
    const user = userEvent.setup();
    const auth = makeAuth();
    renderWithProviders(<AccountDataCard />, { auth });

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = screen.getByRole("dialog");
    const submit = screen.getByRole("button", { name: "Delete my account" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/^Password/), "secret-pass");
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/Type DELETE/), "DELETE");
    expect(submit).toBeEnabled();
    await expectNoAxeViolations(dialog);

    await user.click(submit);
    expect(profileApi.deleteAccount).toHaveBeenCalledWith("secret-pass");
    expect(auth.clearSession).toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });

  it("signs out everywhere and goes to sign-in", async () => {
    const auth = makeAuth();
    renderWithProviders(<AccountDataCard />, { auth });
    await userEvent.click(
      screen.getByRole("button", { name: "Sign out everywhere" })
    );
    expect(profileApi.signOutEverywhere).toHaveBeenCalled();
    expect(auth.clearSession).toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TwoFactorCard from "../features/account/TwoFactorCard";
import { profileApi } from "../../services/api.service";
import { expectNoAxeViolations } from "../../test/axe";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const QR = "data:image/png;base64,iVBORw0KGgo=";
const CODES = Array.from({ length: 10 }, (_, i) => `aaaa-bbbb-cc${i}${i}`);

describe("TwoFactorCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sets up the authenticator app and shows recovery codes once", async () => {
    const status = vi
      .spyOn(profileApi, "twoFactorStatus")
      .mockResolvedValueOnce({ enabled: false })
      .mockResolvedValue({ enabled: true, recoveryCodesLeft: 10 });
    const twoFactor = vi.spyOn(profileApi, "twoFactor").mockImplementation(async (action) =>
      action === "setup"
        ? { secret: "JBSWY3DPEHPK3PXP", qrCode: QR, otpauthUrl: "otpauth://x" }
        : { recoveryCodes: CODES }
    );
    const user = userEvent.setup();
    const { container } = render(<TwoFactorCard />);

    await user.click(await screen.findByRole("button", { name: "Turn on" }));
    expect(screen.getByRole("img", { name: /QR code/ })).toHaveAttribute("src", QR);
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
    await expectNoAxeViolations(container);

    await user.type(screen.getByLabelText(/6-digit code/), "123456");
    await user.click(screen.getByRole("button", { name: "Turn on" }));
    expect(twoFactor).toHaveBeenLastCalledWith("enable", { code: "123456" });

    const list = screen.getByRole("list", { name: "Recovery codes" });
    expect(list.querySelectorAll("li")).toHaveLength(10);

    await user.click(screen.getByRole("button", { name: /saved them/ }));
    expect(screen.queryByRole("list", { name: "Recovery codes" })).toBeNull();
    expect(await screen.findByText(/10 recovery codes left/)).toBeInTheDocument();
    expect(status).toHaveBeenCalledTimes(2);
  });

  it("turns off with the password and a code", async () => {
    vi.spyOn(profileApi, "twoFactorStatus").mockResolvedValue({
      enabled: true,
      recoveryCodesLeft: 8,
    });
    const twoFactor = vi.spyOn(profileApi, "twoFactor").mockResolvedValue({});
    const user = userEvent.setup();
    render(<TwoFactorCard />);

    await user.click(await screen.findByRole("button", { name: "Turn off" }));
    await user.type(screen.getByLabelText(/^Password/), "secret-pass");
    await user.type(screen.getByLabelText(/6-digit code/), "654321");
    await user.click(screen.getByRole("button", { name: "Turn off" }));
    expect(twoFactor).toHaveBeenCalledWith("disable", {
      password: "secret-pass",
      code: "654321",
    });
  });
});

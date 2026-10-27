import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GettingStarted from "../features/trips/GettingStarted";
import { profileApi } from "../../services/api.service";
import { renderWithProviders } from "../../test/utils";
import { expectNoAxeViolations } from "../../test/axe";

const newUser = {
  id: "u1",
  emailVerified: true,
  domesticVerification: { status: "unverified" },
  internationalVerification: { status: "unverified" },
};

describe("GettingStarted", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(profileApi, "twoFactorStatus").mockResolvedValue({ enabled: false });
  });

  it("shows what is left and links to the next steps", async () => {
    const onCreateTrip = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <GettingStarted user={newUser} trips={[]} onCreateTrip={onCreateTrip} />
    );

    expect(
      await screen.findByRole("heading", { name: "Get started with Travelo" })
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 5 done")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText(/Confirm your email address/).closest("li")).toHaveTextContent("(done)");
    expect(screen.getByRole("link", { name: /Verify your identity/ })).toHaveAttribute(
      "href",
      "/profile"
    );
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: /Create your first trip/ }));
    expect(onCreateTrip).toHaveBeenCalled();
  });

  it("stays hidden once the user hides it", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(
      <GettingStarted user={newUser} trips={[]} />
    );
    await user.click(await screen.findByRole("button", { name: "Hide" }));
    expect(screen.queryByRole("heading", { name: /Get started/ })).toBeNull();
    unmount();

    renderWithProviders(<GettingStarted user={newUser} trips={[]} />);
    expect(screen.queryByRole("heading", { name: /Get started/ })).toBeNull();
  });

  it("disappears when every step is done", async () => {
    profileApi.twoFactorStatus.mockResolvedValue({ enabled: true });
    renderWithProviders(
      <GettingStarted
        user={{ ...newUser, domesticVerification: { status: "verified" } }}
        trips={[{ _id: "t1", members: ["u1", "u2"] }]}
      />
    );
    await waitFor(() => expect(profileApi.twoFactorStatus).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole("heading", { name: /Get started/ })).toBeNull();
  });
});

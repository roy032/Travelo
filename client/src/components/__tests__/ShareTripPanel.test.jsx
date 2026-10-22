import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareTripPanel from "../features/trips/ShareTripPanel";
import { tripApi } from "../../services/api.service";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const trip = { id: "trip1", title: "Sylhet tea gardens", shareToken: null };

describe("ShareTripPanel", () => {
  beforeEach(() => {
    vi.spyOn(tripApi, "enableSharing").mockResolvedValue({
      shareToken: "tok_abcdefghijklmnopqr",
    });
    vi.spyOn(tripApi, "disableSharing").mockResolvedValue({});
  });

  it("lets the owner create a public link", async () => {
    const onShareTokenChange = vi.fn();
    render(
      <ShareTripPanel
        trip={trip}
        isOwner
        onShareTokenChange={onShareTokenChange}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Create public link/ })
    );

    expect(tripApi.enableSharing).toHaveBeenCalledWith("trip1");
    expect(onShareTokenChange).toHaveBeenCalledWith("tok_abcdefghijklmnopqr");
  });

  it("shows, copies and turns off an existing link", async () => {
    const user = userEvent.setup();
    const onShareTokenChange = vi.fn();
    render(
      <ShareTripPanel
        trip={{ ...trip, shareToken: "tok_abcdefghijklmnopqr" }}
        isOwner
        onShareTokenChange={onShareTokenChange}
      />
    );

    const link = `${window.location.origin}/share/tok_abcdefghijklmnopqr`;
    expect(screen.getByLabelText("Public link")).toHaveValue(link);

    await user.click(screen.getByRole("button", { name: /Copy link/ }));
    expect(await navigator.clipboard.readText()).toBe(link);
    expect(screen.getByRole("button", { name: /Copied/ })).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Turn off public link/ })
    );
    expect(tripApi.disableSharing).toHaveBeenCalledWith("trip1");
    expect(onShareTokenChange).toHaveBeenCalledWith(null);
  });

  it("lets other members copy the link but not change it", () => {
    const { rerender } = render(
      <ShareTripPanel
        trip={trip}
        isOwner={false}
        onShareTokenChange={vi.fn()}
      />
    );
    expect(
      screen.getByText("Only the trip organizer can create a public link.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create/ })).toBeNull();

    rerender(
      <ShareTripPanel
        trip={{ ...trip, shareToken: "tok_abcdefghijklmnopqr" }}
        isOwner={false}
        onShareTokenChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Turn off/ })).toBeNull();
  });
});

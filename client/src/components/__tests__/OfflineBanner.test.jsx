import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import OfflineBanner from "../layout/OfflineBanner";
import { SW_UPDATED_EVENT } from "../../utils/offline";

const setOnline = (online) => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
  act(() => window.dispatchEvent(new Event(online ? "online" : "offline")));
};

describe("OfflineBanner", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows while offline and hides when the connection returns", () => {
    render(<OfflineBanner />);
    expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();

    setOnline(false);
    expect(screen.getByRole("status")).toHaveTextContent(
      /You're offline. Trips you've opened before are still available/
    );

    setOnline(true);
    expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();
  });

  it("starts in the offline state when the page loads without signal", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/You're offline/)).toBeInTheDocument();
  });

  it("offers a reload after a new version is installed", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("button", { name: "Reload" })).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event(SW_UPDATED_EVENT)));

    expect(screen.getByText("A new version of Travelo is ready.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });
});

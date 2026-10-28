import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const handlers = {};
const socket = {
  connected: true,
  on: vi.fn((event, handler) => {
    handlers[event] = handler;
  }),
  off: vi.fn((event) => {
    delete handlers[event];
  }),
  emit: vi.fn((event, payload, ack) => {
    if (event === "watchTrip") ack?.({ success: true, userIds: ["me"] });
  }),
};

vi.mock("../utils/socket", () => ({
  getSocket: () => socket,
  connectSocket: vi.fn(),
}));

const { default: useTripLive } = await import("./useTripLive");

describe("useTripLive", () => {
  it("watches the trip, tracks viewers and reports changes for it", () => {
    const onChange = vi.fn();
    const { result, unmount } = renderHook(() => useTripLive("trip1", onChange));

    expect(socket.emit).toHaveBeenCalledWith(
      "watchTrip",
      { tripId: "trip1" },
      expect.any(Function)
    );
    expect(result.current).toEqual({ viewerIds: ["me"], isLive: true });

    act(() => handlers.tripPresence({ tripId: "trip1", userIds: ["me", "m2"] }));
    expect(result.current.viewerIds).toEqual(["me", "m2"]);

    // Other trips are ignored
    handlers.tripChange({ tripId: "other", resource: "notes" });
    handlers.tripChange({ tripId: "trip1", resource: "notes", action: "created" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ resource: "notes" })
    );

    act(() => handlers.disconnect());
    expect(result.current.isLive).toBe(false);

    unmount();
    expect(socket.emit).toHaveBeenCalledWith("unwatchTrip", { tripId: "trip1" });
    expect(handlers.tripChange).toBeUndefined();
  });
});

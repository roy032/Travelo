import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// The shared socket is already connected, as it is once useTripLive has run
const socket = {
  connected: true,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn((event, payload, ack) => {
    if (event === "joinRoom") ack?.({ success: true });
  }),
};

vi.mock("../utils/socket", () => ({
  getSocket: () => socket,
  connectSocket: vi.fn(),
}));

const { default: useSocket } = await import("./useSocket");

describe("useSocket", () => {
  it("joins the chat room when the shared socket is already connected", async () => {
    const { result } = renderHook(() => useSocket("trip1"));

    await waitFor(() => expect(result.current.isJoined).toBe(true));
    expect(result.current.isConnected).toBe(true);
    expect(socket.emit).toHaveBeenCalledWith(
      "joinRoom",
      { tripId: "trip1" },
      expect.any(Function)
    );
  });
});

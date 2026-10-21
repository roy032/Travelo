import { beforeEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import {
  ApiError,
  authApi,
  getErrorMessage,
  photoApi,
  profileApi,
  tripApi,
} from "./api.service";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("getErrorMessage", () => {
  it("shows the server's message", () => {
    const error = new ApiError(
      "You must upload and verify your NID to create domestic trips.",
      403,
      {}
    );
    expect(getErrorMessage(error)).toMatch(/verify your NID/);
  });

  it("explains a failed sign-in instead of asking to log in", () => {
    const error = new ApiError("Invalid credentials", 401, {
      error: "Invalid credentials",
    });
    expect(getErrorMessage(error)).toBe("Invalid email or password");
  });

  it("asks to log in when the session is missing or expired", () => {
    const error = new ApiError("No access token provided", 401, {
      error: "Authentication required",
    });
    expect(getErrorMessage(error)).toBe("Please log in to continue");
  });

  it("hides server internals on 5xx errors", () => {
    const error = new ApiError("Cannot read properties of undefined", 500, {});
    expect(getErrorMessage(error)).toBe("Server error. Please try again later");
  });

  it("handles non-API errors as network errors", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"))).toMatch(
      /Network error/
    );
  });
});

describe("API client", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    toast.error.mockClear();
  });

  it("sends cookies and JSON with every request", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { trip: { id: "t1" } }));

    const trip = await tripApi.createTrip({ title: "Trip" });

    expect(trip).toEqual({ id: "t1" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/trips$/);
    expect(options.credentials).toBe("include");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("shows validation details from the server", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: "Validation failed",
        details: "End date must be greater than or equal to start date",
      })
    );

    await expect(tripApi.createTrip({})).rejects.toBeInstanceOf(ApiError);
    expect(toast.error).toHaveBeenCalledWith(
      "End date must be greater than or equal to start date"
    );
  });

  it("signs out through the sign-out route", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { message: "ok" }));

    await authApi.logout();

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/sign-out$/);
  });

  it("checks the session silently", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: "Authentication required" })
    );

    await expect(profileApi.getProfile({ silent: true })).rejects.toThrow();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("turns a failed fetch into a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(profileApi.getProfile()).rejects.toMatchObject({ status: 0 });
    expect(toast.error).toHaveBeenCalledWith(
      "Network error. Please check your connection."
    );
  });

  it("uploads photos as multipart form data", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { photo: { id: "p1" } }));
    const file = new File(["png"], "photo.png", { type: "image/png" });

    await photoApi.uploadPhoto("trip1", file, "Sunset");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/trips\/trip1\/photos$/);
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("photo")).toBeInstanceOf(File);
    expect(options.body.get("caption")).toBe("Sunset");
    // The browser must set the multipart boundary itself
    expect(options.headers["Content-Type"]).toBeUndefined();
  });
});

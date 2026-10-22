import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminAnalytics from "../AdminAnalytics";
import { adminApi } from "../../../../services/api.service";
import { expectNoAxeViolations } from "../../../../test/axe";

vi.mock("../../../../services/api.service", () => ({
  adminApi: { getAnalytics: vi.fn() },
}));

const makeAnalytics = (days) => ({
  range: { days, from: "2026-10-16", to: "2026-10-22" },
  totals: { users: 12, signups: 5, activeTripsToday: 3, errors: 1 },
  series: Array.from({ length: days }, (_, i) => ({
    date: `2026-10-${String(16 + (i % 7)).padStart(2, "0")}`,
    signups: i === days - 1 ? 4 : i % 2,
    activeTrips: 3,
    errors: i === 0 ? 1 : 0,
  })),
  recentErrors: [
    {
      id: "e1",
      status: 500,
      method: "GET",
      path: "/api/trips",
      message: "boom",
      createdAt: "2026-10-16T10:00:00Z",
    },
  ],
});

describe("AdminAnalytics", () => {
  beforeEach(() => {
    adminApi.getAnalytics.mockReset();
    adminApi.getAnalytics.mockImplementation(async (days) => makeAnalytics(days === 30 ? 7 : days));
  });

  it("charts sign-ups, active trips and errors with their totals", async () => {
    const { container } = render(<AdminAnalytics />);

    expect(await screen.findByRole("heading", { name: "Sign-ups" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Active trips" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Server errors" })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("GET /api/trips", { exact: false })).toBeInTheDocument();
    expect(adminApi.getAnalytics).toHaveBeenCalledWith(30);
    await expectNoAxeViolations(container);
  });

  it("shows the hovered day's value", async () => {
    render(<AdminAnalytics />);
    await screen.findByRole("heading", { name: "Sign-ups" });

    const lastDay = screen.getAllByRole("img")[0].querySelectorAll("g");
    fireEvent.mouseEnter(lastDay[lastDay.length - 1]);

    expect(screen.getByText("Oct 22: 4", { selector: "p" })).toBeInTheDocument();
  });

  it("reloads when another range is picked", async () => {
    render(<AdminAnalytics />);
    await screen.findByRole("heading", { name: "Sign-ups" });

    await userEvent.click(screen.getByRole("button", { name: "7 days" }));

    await waitFor(() => expect(adminApi.getAnalytics).toHaveBeenLastCalledWith(7));
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
  });

  it("says so when analytics fail to load", async () => {
    adminApi.getAnalytics.mockRejectedValue(new Error("nope"));
    render(<AdminAnalytics />);

    expect(await screen.findByText("Analytics could not be loaded.")).toBeInTheDocument();
  });
});

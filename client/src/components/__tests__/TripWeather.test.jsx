import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import TripWeather from "../features/weather/TripWeather";
import { packingApi, weatherApi } from "../../services/api.service";
import { expectNoAxeViolations } from "../../test/axe";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const khulna = { name: "Khulna", lat: 22.82, lng: 89.55 };

const weather = {
  hasLocation: true,
  locations: [khulna],
  truncated: false,
  days: [
    {
      date: "2026-11-05",
      location: khulna,
      source: "forecast",
      weatherCode: 63,
      description: "Rain",
      tempMax: 31.2,
      tempMin: 24,
      precipitationChance: 90,
      windMax: 14,
    },
    {
      date: "2026-11-25",
      location: khulna,
      source: "typical",
      basedOn: "2025-11-25",
      weatherCode: 0,
      description: "Clear sky",
      tempMax: 28,
      tempMin: 18,
      precipitationSum: 0,
      windMax: 9,
    },
    { date: "2026-11-26", location: khulna, source: "unavailable" },
  ],
  packing: [
    { item: "Rain jacket", reason: "Rain likely on 5 Nov", days: ["2026-11-05"] },
    { item: "Sun hat", reason: "Hot (30°C or more) on 5 Nov", days: ["2026-11-05"] },
  ],
};

describe("TripWeather", () => {
  beforeEach(() => {
    vi.spyOn(weatherApi, "getTripWeather").mockResolvedValue(weather);
    vi.spyOn(packingApi, "addSuggestionsToChecklist").mockResolvedValue({
      items: [{ text: "Rain jacket" }],
      skipped: 0,
    });
  });

  it("shows each day with where its numbers come from", async () => {
    const { container } = render(<TripWeather tripId='t1' />);

    const days = await screen.findAllByRole("listitem");
    expect(within(days[0]).getByText("Thu 5 Nov")).toBeInTheDocument();
    expect(within(days[0]).getByText("Forecast")).toBeInTheDocument();
    expect(within(days[0]).getByText("Rain 90%")).toBeInTheDocument();
    expect(within(days[1]).getByText("Typical")).toBeInTheDocument();
    expect(within(days[2]).getByText(/isn't available/)).toBeInTheDocument();
    expect(screen.getByText(/same date last year/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open-Meteo/ })).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it("adds the ticked packing items to the checklist", async () => {
    const user = userEvent.setup();
    const onChecklistUpdated = vi.fn();
    render(<TripWeather tripId='t1' onChecklistUpdated={onChecklistUpdated} />);

    expect(await screen.findByText("Rain likely on 5 Nov")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Sun hat/ }));
    await user.click(screen.getByRole("button", { name: "Add 1 to checklist" }));

    expect(packingApi.addSuggestionsToChecklist).toHaveBeenCalledWith("t1", ["Rain jacket"]);
    expect(toast.success).toHaveBeenCalledWith("Added 1 to the checklist");
    expect(onChecklistUpdated).toHaveBeenCalled();
  });

  it("explains what to do when the trip has no locations", async () => {
    weatherApi.getTripWeather.mockResolvedValue({
      hasLocation: false,
      locations: [],
      days: [{ date: "2026-11-05", location: null, source: "no-location" }],
      packing: [],
    });
    render(<TripWeather tripId='t1' />);

    expect(await screen.findByText(/Add activities with a location/)).toBeInTheDocument();
    expect(screen.getByText(/once we know where you're going/)).toBeInTheDocument();
  });

  it("offers a retry when the weather cannot be loaded", async () => {
    weatherApi.getTripWeather.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<TripWeather tripId='t1' />);

    await user.click(await screen.findByRole("button", { name: /Retry/ }));
    expect(await screen.findByText("Thu 5 Nov")).toBeInTheDocument();
  });
});

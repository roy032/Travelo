import { describe, expect, it } from "vitest";
import {
  DAY_COLORS,
  formatDay,
  groupByDay,
  hasCoordinates,
  openStreetMapUrl,
  sortActivities,
  toLatLngs,
} from "./itinerary";

const at = (id, date, time, coordinates = { lat: 21.4, lng: 91.98 }) => ({
  id,
  title: `Stop ${id}`,
  date: `${date}T00:00:00.000Z`,
  time,
  location: { name: `Place ${id}`, coordinates },
});

describe("sortActivities", () => {
  it("orders by day and then by time, including single-digit hours", () => {
    const sorted = sortActivities([
      at("c", "2030-01-12", "08:00"),
      at("b", "2030-01-11", "14:00"),
      at("a", "2030-01-11", "9:30"),
    ]);
    expect(sorted.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});

describe("groupByDay", () => {
  const activities = [
    at("3", "2030-01-13", "10:00"),
    at("1", "2030-01-11", "09:00"),
    at("2", "2030-01-11", "18:00"),
  ];

  it("numbers stops across the whole trip and counts days from the start", () => {
    const days = groupByDay(activities, "2030-01-10T00:00:00.000Z");
    expect(days.map((d) => [d.key, d.dayNumber])).toEqual([
      ["2030-01-11", 2],
      ["2030-01-13", 4],
    ]);
    expect(days[0].stops.map((s) => s.stopNumber)).toEqual([1, 2]);
    expect(days[1].stops.map((s) => s.stopNumber)).toEqual([3]);
    expect(days.map((d) => d.color)).toEqual(DAY_COLORS.slice(0, 2));
  });

  it("counts days in order when the trip start is unknown", () => {
    expect(groupByDay(activities).map((d) => d.dayNumber)).toEqual([1, 2]);
  });

  it("returns no days for an empty itinerary", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("coordinates", () => {
  it("skips stops without a usable location", () => {
    const stops = [
      at("1", "2030-01-11", "09:00"),
      at("2", "2030-01-11", "10:00", { lat: 200, lng: 0 }),
      { ...at("3", "2030-01-11", "11:00"), location: { name: "Somewhere" } },
    ];
    expect(stops.map(hasCoordinates)).toEqual([true, false, false]);
    expect(toLatLngs(stops)).toEqual([[21.4, 91.98]]);
  });

  it("links a stop to OpenStreetMap", () => {
    expect(openStreetMapUrl({ lat: 21.4, lng: 91.98 })).toBe(
      "https://www.openstreetmap.org/?mlat=21.4&mlon=91.98#map=16/21.4/91.98"
    );
  });
});

describe("formatDay", () => {
  it("formats the stored UTC day without shifting it", () => {
    expect(formatDay("2030-01-11")).toBe("Fri 11 Jan");
  });
});

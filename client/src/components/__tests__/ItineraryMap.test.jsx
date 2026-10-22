import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ItineraryMap from "../features/trips/ItineraryMap";

vi.mock("react-leaflet", async () =>
  (await import("../../test/leaflet-mock")).reactLeafletMock()
);

const stop = (id, date, time, extra = {}) => ({
  id,
  title: `Stop ${id}`,
  date: `${date}T00:00:00.000Z`,
  time,
  location: {
    name: `Place ${id}`,
    coordinates: { lat: 21 + Number(id) / 10, lng: 92 },
  },
  ...extra,
});

const activities = [
  stop("3", "2030-01-12", "10:00"),
  stop("1", "2030-01-11", "09:00"),
  stop("2", "2030-01-11", "17:30"),
];

describe("ItineraryMap", () => {
  it("numbers the stops in visiting order and draws a route per day", () => {
    render(
      <ItineraryMap activities={activities} tripStartDate='2030-01-11' />
    );

    expect(
      screen.getAllByTestId("marker").map((marker) => marker.title)
    ).toEqual(["1. Stop 1", "2. Stop 2", "3. Stop 3"]);
    // Only day 1 has more than one stop to connect
    const routes = screen.getAllByTestId("route");
    expect(routes).toHaveLength(1);
    expect(routes[0].dataset.points).toBe("2");

    expect(
      screen.getByRole("link", { name: "Open Stop 1 in OpenStreetMap" })
    ).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/?mlat=21.1&mlon=92#map=16/21.1/92"
    );
  });

  it("filters the map and list to one day", async () => {
    render(
      <ItineraryMap activities={activities} tripStartDate='2030-01-11' />
    );
    const days = screen.getByRole("group", { name: "Show day" });

    await userEvent.click(
      within(days).getByRole("button", { name: /Day 2/ })
    );

    expect(
      screen.getAllByTestId("marker").map((marker) => marker.title)
    ).toEqual(["3. Stop 3"]);
    expect(screen.queryByText("Stop 1")).not.toBeInTheDocument();

    await userEvent.click(within(days).getByRole("button", { name: "All days" }));
    expect(screen.getAllByTestId("marker")).toHaveLength(3);
  });

  it("lists stops without a map location and says so", () => {
    render(
      <ItineraryMap
        activities={[
          stop("1", "2030-01-11", "09:00"),
          stop("2", "2030-01-11", "10:00", { location: { name: "Hotel" } }),
        ]}
      />
    );

    expect(screen.getAllByTestId("marker")).toHaveLength(1);
    expect(screen.getByText("Stop 2")).toBeInTheDocument();
    expect(
      screen.getByText(/1 activity has no map location/)
    ).toBeInTheDocument();
    // A single day needs no day filter
    expect(screen.queryByRole("group", { name: "Show day" })).toBeNull();
  });

  it("explains an empty itinerary", () => {
    render(<ItineraryMap activities={[]} />);
    expect(screen.getByText("No activities on the map yet")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).toBeNull();
  });
});

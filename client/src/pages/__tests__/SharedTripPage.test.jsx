import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import SharedTripPage from "../SharedTripPage";
import { makeAuth, renderWithProviders } from "../../test/utils";

vi.mock("react-leaflet", async () =>
  (await import("../../test/leaflet-mock")).reactLeafletMock()
);

const shared = {
  trip: {
    id: "trip1",
    title: "Sylhet tea gardens",
    description: "Tea, hills and waterfalls",
    startDate: "2030-03-01T00:00:00.000Z",
    endDate: "2030-03-04T00:00:00.000Z",
    destinationType: "countryside",
    memberCount: 3,
  },
  activities: [
    {
      id: "a1",
      title: "Ratargul swamp forest",
      date: "2030-03-02T00:00:00.000Z",
      time: "09:30",
      location: { name: "Ratargul", coordinates: { lat: 25, lng: 91.98 } },
    },
  ],
};

const respond = (status, body) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const renderPage = (auth) =>
  renderWithProviders(<SharedTripPage />, {
    route: "/share/tok_abcdefghijklmnopqr",
    path: "/share/:token",
    auth,
  });

describe("SharedTripPage", () => {
  it("shows the trip plan to signed-out visitors", async () => {
    respond(200, shared);
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Sylhet tea gardens" })
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/shared\/tok_abcdefghijklmnopqr$/)
    );
    expect(screen.getByText(/Fri, March 1, 2030/)).toBeInTheDocument();
    expect(screen.getByText("3 travellers")).toBeInTheDocument();
    expect(screen.getByText("Ratargul swamp forest")).toBeInTheDocument();
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
    expect(document.title).toBe("Sylhet tea gardens | Travelo");

    const calendar = screen.getByRole("link", { name: /Add to calendar/ });
    expect(calendar.getAttribute("href")).toMatch(
      /^http:\/\/localhost:3000\/api\/shared\/tok_abcdefghijklmnopqr\/calendar\.ics$/
    );
    expect(
      screen.getByRole("link", { name: /Subscribe/ }).getAttribute("href")
    ).toMatch(/^webcal:\/\/localhost:3000\/api\/shared\//);
    expect(
      screen.getByRole("link", { name: "Create a free account" })
    ).toBeInTheDocument();
  });

  it("skips the sign-up pitch for signed-in users", async () => {
    respond(200, shared);
    renderPage(makeAuth({ isAuthenticated: true, user: { id: "me" } }));

    await screen.findByRole("heading", { name: "Sylhet tea gardens" });
    expect(screen.queryByText("Create a free account")).toBeNull();
  });

  it("explains a link that was turned off", async () => {
    respond(404, { message: "This shared trip link is no longer available" });
    renderPage();

    expect(
      await screen.findByText("This link isn't available")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore trips/ })).toHaveAttribute(
      "href",
      "/explore"
    );
  });
});

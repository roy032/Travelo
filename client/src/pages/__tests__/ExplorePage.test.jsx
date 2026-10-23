import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import userEvent from "@testing-library/user-event";
import ExplorePage from "../ExplorePage";
import { FavoritesContext } from "../../context/favorites-context";
import { makeAuth, makeFavorites, renderWithProviders } from "../../test/utils";

const trips = [
  {
    id: "t1",
    title: "Cox's Bazar beach week",
    description: "Sun and sea",
    startDate: "2030-01-10",
    endDate: "2030-01-15",
    destinationType: "beach",
    tripCategory: "domestic",
    ownerId: "owner1",
    members: ["owner1"],
    activities: [],
    checklist: [],
  },
  {
    id: "t2",
    title: "Bandarban hills",
    description: "Hiking",
    startDate: "2030-02-01",
    endDate: "2030-02-04",
    destinationType: "mountain",
    tripCategory: "domestic",
    ownerId: "owner2",
    members: ["owner2", "me"],
    activities: [],
    checklist: [],
  },
  {
    id: "t3",
    title: "Dhaka food tour",
    description: "Street food",
    startDate: "2030-03-01",
    endDate: "2030-03-02",
    destinationType: "city",
    tripCategory: "domestic",
    ownerId: "me",
    members: ["me"],
    activities: [],
    checklist: [],
  },
];

// Answers like the server: filtering happens there, not in the page
const exploreResponse = async (url) => {
  const params = new URL(url, "http://localhost").searchParams;
  const type = params.get("destinationType");
  const search = params.get("search")?.toLowerCase();
  const matches = trips.filter(
    (trip) =>
      (!type || trip.destinationType === type) &&
      (!search ||
        `${trip.title} ${trip.description}`.toLowerCase().includes(search))
  );
  return new Response(JSON.stringify({ trips: matches }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const lastRequest = () => new URL(fetch.mock.calls.at(-1)[0], "http://localhost");

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(exploreResponse));
  });

  it("shows every upcoming trip to signed-out visitors", async () => {
    renderWithProviders(<ExplorePage />);

    expect(await screen.findByText("Cox's Bazar beach week")).toBeInTheDocument();
    expect(screen.getByText("Bandarban hills")).toBeInTheDocument();
    expect(screen.getByText("Dhaka food tour")).toBeInTheDocument();
    expect(screen.getAllByText("Log in to Join")).toHaveLength(3);
  });

  it("hides trips the signed-in user owns or belongs to", async () => {
    renderWithProviders(<ExplorePage />, {
      auth: makeAuth({ isAuthenticated: true, user: { id: "me" } }),
    });

    expect(await screen.findByText("Cox's Bazar beach week")).toBeInTheDocument();
    expect(screen.queryByText("Bandarban hills")).not.toBeInTheDocument();
    expect(screen.queryByText("Dhaka food tour")).not.toBeInTheDocument();
  });

  it("hides the user's trips once the session check finishes", async () => {
    const view = (auth) => (
      <AuthContext.Provider value={auth}>
        <FavoritesContext.Provider value={makeFavorites()}>
          <MemoryRouter>
            <ExplorePage />
          </MemoryRouter>
        </FavoritesContext.Provider>
      </AuthContext.Provider>
    );
    const { rerender } = render(view(makeAuth({ loading: true })));
    expect(await screen.findByText("Dhaka food tour")).toBeInTheDocument();

    // AuthProvider resolves the user after the trips have loaded
    rerender(view(makeAuth({ isAuthenticated: true, user: { id: "me" } })));

    expect(screen.getByText("Cox's Bazar beach week")).toBeInTheDocument();
    expect(screen.queryByText("Dhaka food tour")).not.toBeInTheDocument();
  });

  it("filters by destination type and search text", async () => {
    renderWithProviders(<ExplorePage />);
    await screen.findByText("Cox's Bazar beach week");

    await userEvent.click(screen.getByRole("button", { name: "Mountain" }));
    await waitFor(() =>
      expect(lastRequest().searchParams.get("destinationType")).toBe("mountain")
    );
    expect(await screen.findByText("Bandarban hills")).toBeInTheDocument();
    expect(screen.queryByText("Cox's Bazar beach week")).not.toBeInTheDocument();
    expect(lastRequest().searchParams.get("destinationType")).toBe("mountain");

    await userEvent.click(screen.getByRole("button", { name: "All Types" }));
    await userEvent.type(screen.getByLabelText("Search trips"), "street");
    await waitFor(() =>
      expect(lastRequest().searchParams.get("search")).toBe("street")
    );
    expect(await screen.findByText("Dhaka food tour")).toBeInTheDocument();
    expect(screen.queryByText("Bandarban hills")).not.toBeInTheDocument();
    expect(lastRequest().searchParams.get("search")).toBe("street");
    expect(lastRequest().searchParams.has("destinationType")).toBe(false);
  });

  it("shows an error when trips cannot be loaded", async () => {
    fetch.mockImplementation(async () => new Response("oops", { status: 500 }));
    renderWithProviders(<ExplorePage />);

    expect(await screen.findByText(/Failed to load trips/)).toBeInTheDocument();
  });
});

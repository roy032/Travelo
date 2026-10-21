import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import userEvent from "@testing-library/user-event";
import ExplorePage from "../ExplorePage";
import { makeAuth, renderWithProviders } from "../../test/utils";

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

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        new Response(JSON.stringify({ trips }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
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
        <MemoryRouter>
          <ExplorePage />
        </MemoryRouter>
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
    expect(screen.getByText("Bandarban hills")).toBeInTheDocument();
    expect(screen.queryByText("Cox's Bazar beach week")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "All Types" }));
    await userEvent.type(
      screen.getByPlaceholderText("Search trips by title..."),
      "street"
    );
    expect(screen.getByText("Dhaka food tour")).toBeInTheDocument();
    expect(screen.queryByText("Bandarban hills")).not.toBeInTheDocument();
  });

  it("shows an error when trips cannot be loaded", async () => {
    fetch.mockImplementation(async () => new Response("oops", { status: 500 }));
    renderWithProviders(<ExplorePage />);

    expect(await screen.findByText(/Failed to fetch trips/)).toBeInTheDocument();
  });
});

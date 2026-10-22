import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import ProtectedRoute from "../shared/ProtectedRoute";
import AdminRoute from "../shared/AdminRoute";
import { makeAuth, renderWithProviders } from "../../test/utils";

describe("ProtectedRoute", () => {
  it("redirects signed-out visitors to the login page", () => {
    renderWithProviders(
      <ProtectedRoute>
        <p>Secret trips</p>
      </ProtectedRoute>,
      { route: "/trips", path: "/trips" }
    );

    expect(screen.queryByText("Secret trips")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });

  it("waits for the session check before deciding", () => {
    renderWithProviders(
      <ProtectedRoute>
        <p>Secret trips</p>
      </ProtectedRoute>,
      { auth: makeAuth({ loading: true }), route: "/trips", path: "/trips" }
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/trips");
    expect(screen.queryByText("Secret trips")).not.toBeInTheDocument();
  });

  it("shows the page to signed-in users", () => {
    renderWithProviders(
      <ProtectedRoute>
        <p>Secret trips</p>
      </ProtectedRoute>,
      {
        auth: makeAuth({ isAuthenticated: true, user: { id: "u1" } }),
        route: "/trips",
        path: "/trips",
      }
    );

    expect(screen.getByText("Secret trips")).toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  it("keeps regular users out of the admin area", () => {
    renderWithProviders(
      <AdminRoute>
        <p>Admin dashboard</p>
      </AdminRoute>,
      {
        auth: makeAuth({
          isAuthenticated: true,
          user: { id: "u1", role: "user" },
        }),
        route: "/admin",
        path: "/admin",
      }
    );

    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
  });

  it("lets admins in", () => {
    renderWithProviders(
      <AdminRoute>
        <p>Admin dashboard</p>
      </AdminRoute>,
      {
        auth: makeAuth({
          isAuthenticated: true,
          user: { id: "u1", role: "admin" },
        }),
        route: "/admin",
        path: "/admin",
      }
    );

    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });
});

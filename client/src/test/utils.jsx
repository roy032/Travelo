import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../context/auth-context";

export const makeAuth = (overrides = {}) => ({
  user: null,
  loading: false,
  isAuthenticated: false,
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  checkAuth: vi.fn(),
  ...overrides,
});

// Shows the current path so tests can assert on navigation
export const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid='location'>{location.pathname}</div>;
};

/**
 * Render a page inside a router and a stubbed auth context.
 * `path` is the route pattern, `route` the URL to start at.
 */
export const renderWithProviders = (
  ui,
  { auth = makeAuth(), route = "/", path = "*", initialState } = {}
) => {
  const result = render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[{ pathname: route, state: initialState }]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path='*' element={null} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return { ...result, auth };
};

import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../context/auth-context";
import { FavoritesContext } from "../context/favorites-context";

export const makeAuth = (overrides = {}) => ({
  user: null,
  loading: false,
  isAuthenticated: false,
  register: vi.fn(),
  login: vi.fn(),
  completeTwoFactor: vi.fn(),
  logout: vi.fn(),
  clearSession: vi.fn(),
  updateUser: vi.fn(),
  checkAuth: vi.fn(),
  ...overrides,
});

// Nothing saved; favorites tests render FavoritesProvider themselves
export const makeFavorites = (overrides = {}) => ({
  isFavorite: () => false,
  isPending: () => false,
  toggleFavorite: vi.fn(),
  savedCount: 0,
  ...overrides,
});

// Shows the current path so tests can assert on navigation
export const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

/**
 * Render a page inside a router and a stubbed auth context.
 * `path` is the route pattern, `route` the URL to start at (may include ?query).
 */
export const renderWithProviders = (
  ui,
  {
    auth = makeAuth(),
    favorites = makeFavorites(),
    route = "/",
    path = "*",
    initialState,
  } = {},
) => {
  const [pathname, query] = route.split("?");
  const search = query ? `?${query}` : "";
  const result = render(
    <AuthContext.Provider value={auth}>
      <FavoritesContext.Provider value={favorites}>
        <MemoryRouter
          initialEntries={[{ pathname, search, state: initialState }]}
        >
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={null} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </FavoritesContext.Provider>
    </AuthContext.Provider>,
  );
  return { ...result, auth };
};

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";

// A controllable prefers-color-scheme media query
const mockSystemTheme = (dark) => {
  const listeners = new Set();
  const query = {
    matches: dark,
    addEventListener: (_event, listener) => listeners.add(listener),
    removeEventListener: (_event, listener) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => query));
  return (nextDark) => {
    query.matches = nextDark;
    listeners.forEach((listener) => listener({ matches: nextDark }));
  };
};

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );

const isDark = () => document.documentElement.classList.contains("dark");

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the system setting by default, including live changes", () => {
    const setSystemDark = mockSystemTheme(true);
    renderToggle();

    expect(isDark()).toBe(true);
    expect(
      screen.getByRole("button", { name: "System theme. Switch to light theme" })
    ).toBeInTheDocument();

    act(() => setSystemDark(false));
    expect(isDark()).toBe(false);
  });

  it("cycles system, light, dark and remembers the choice", async () => {
    mockSystemTheme(true);
    renderToggle();
    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(isDark()).toBe(false);
    expect(localStorage.getItem("travelo-theme")).toBe("light");
    expect(button).toHaveAccessibleName("Light theme. Switch to dark theme");

    await userEvent.click(button);
    expect(isDark()).toBe(true);
    expect(localStorage.getItem("travelo-theme")).toBe("dark");

    await userEvent.click(button);
    expect(localStorage.getItem("travelo-theme")).toBeNull();
    expect(button).toHaveAccessibleName("System theme. Switch to light theme");
  });

  it("starts from a saved choice over the system setting", () => {
    mockSystemTheme(false);
    localStorage.setItem("travelo-theme", "dark");
    renderToggle();

    expect(isDark()).toBe(true);
    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Dark theme. Switch to system theme"
    );
  });
});

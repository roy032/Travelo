import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./theme-context";

// Same key and logic as public/theme-init.js, which applies the theme
// before the first paint
const STORAGE_KEY = "travelo-theme";
const PREFERENCES = ["system", "light", "dark"];
const THEME_COLORS = { light: "#2563eb", dark: "#030712" };

const darkQuery = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

const readPreference = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
};

/**
 * Light or dark colour theme. "system" (the default) follows the device
 * setting and updates live when it changes; "light" and "dark" are saved
 * choices.
 */
export const ThemeProvider = ({ children }) => {
  const [preference, setPreferenceState] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(
    () => darkQuery()?.matches ?? false
  );

  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;
    const handleChange = (event) => setSystemDark(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const theme =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice lasts until the page is closed
    }
  }, []);

  const value = useMemo(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

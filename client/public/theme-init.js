// Applies the saved colour theme before the app renders, so a dark-mode
// visitor never sees a flash of the light page. Kept in sync with
// src/context/ThemeContext.jsx. A separate file because the CSP blocks
// inline scripts.
(function () {
  var preference = "system";
  try {
    preference = localStorage.getItem("travelo-theme") || "system";
  } catch {
    // Storage blocked: follow the system setting
  }
  var dark =
    preference === "dark" ||
    (preference !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();

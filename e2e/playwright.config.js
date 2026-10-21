import { defineConfig, devices } from "@playwright/test";

// The suite runs against the production shape of the app: the built client
// served by the API server on one origin, a real MongoDB and uploads stored
// on local disk (no UploadThing account needed).
const PORT = Number(process.env.E2E_PORT || 3100);
export const BASE_URL = `http://localhost:${PORT}`;
export const MONGODB_URI =
  process.env.E2E_MONGODB_URI || "mongodb://127.0.0.1:27017/travelo_e2e";

export default defineConfig({
  testDir: "./tests",
  // Tests share one database (the first account becomes admin), so run in order
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./global-setup.js",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "npm --prefix ../client run build && node ../server/src/index.js",
    url: `${BASE_URL}/api`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    env: {
      // Empty API URL: the client calls the API on its own origin
      VITE_API_URL: "",
      CLIENT_DIST: "../client/dist",
      NODE_ENV: "test",
      PORT: String(PORT),
      MONGODB_URI,
      JWT_SECRET: "e2e-only-secret-not-for-production",
      CLIENT_URL: BASE_URL,
      FILE_STORAGE: "local",
      AUTH_RATE_LIMIT_MAX: "1000",
    },
  },
});

import { afterEach, describe, expect, it, vi } from "vitest";

const load = async (env = {}) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./analytics.js");
};

afterEach(() => {
  vi.unstubAllEnvs();
  document.head.querySelectorAll("script[data-travelo-analytics]").forEach((s) => s.remove());
  delete window.plausible;
});

describe("analytics", () => {
  it("does nothing unless a Plausible domain is configured", async () => {
    const { initAnalytics, trackEvent, analyticsEnabled } = await load();
    initAnalytics();
    trackEvent("Signup");
    expect(analyticsEnabled()).toBe(false);
    expect(document.querySelector("script[data-travelo-analytics]")).toBeNull();
    expect(window.plausible).toBeUndefined();
  });

  it("loads the script once and queues events until it arrives", async () => {
    const { initAnalytics, trackEvent } = await load({
      VITE_PLAUSIBLE_DOMAIN: "travelo.example",
      VITE_PLAUSIBLE_HOST: "https://stats.example/",
    });
    initAnalytics();
    initAnalytics();
    const scripts = document.querySelectorAll("script[data-travelo-analytics]");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("https://stats.example/js/script.js");
    expect(scripts[0].dataset.domain).toBe("travelo.example");

    trackEvent("Trip created", { category: "domestic" });
    expect(window.plausible.q).toEqual([["Trip created", { props: { category: "domestic" } }]]);
  });
});

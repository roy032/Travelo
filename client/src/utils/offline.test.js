import { afterEach, describe, expect, it, vi } from "vitest";
import {
  API_CACHE,
  SW_UPDATED_EVENT,
  clearOfflineData,
  registerServiceWorker,
} from "./offline";

describe("clearOfflineData", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("deletes the saved API cache", async () => {
    const remove = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", { delete: remove });
    await clearOfflineData();
    expect(remove).toHaveBeenCalledWith(API_CACHE);
  });

  it("does nothing when cache storage is missing or blocked", async () => {
    await expect(clearOfflineData()).resolves.toBeUndefined();
    vi.stubGlobal("caches", { delete: vi.fn().mockRejectedValue(new Error("blocked")) });
    await expect(clearOfflineData()).resolves.toBeUndefined();
  });

  it("uses the same cache name as the service worker", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const worker = readFileSync(resolve(globalThis.process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain(`const API_CACHE = "${API_CACHE}";`);
  });
});

describe("registerServiceWorker", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(navigator, "serviceWorker", originalDescriptor);
    } else {
      delete navigator.serviceWorker;
    }
  });

  const fakeServiceWorker = (controller) => {
    const target = new EventTarget();
    const worker = {
      controller,
      register: vi.fn().mockResolvedValue({ scope: "/" }),
      addEventListener: target.addEventListener.bind(target),
      fire: () => target.dispatchEvent(new Event("controllerchange")),
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: worker,
      configurable: true,
    });
    return worker;
  };

  it("announces an update only when a worker already controlled the page", async () => {
    const worker = fakeServiceWorker({});
    const onUpdate = vi.fn();
    window.addEventListener(SW_UPDATED_EVENT, onUpdate);

    await registerServiceWorker();
    expect(worker.register).toHaveBeenCalledWith("/sw.js");
    worker.fire();
    expect(onUpdate).toHaveBeenCalledTimes(1);
    window.removeEventListener(SW_UPDATED_EVENT, onUpdate);
  });

  it("stays quiet on the first install", async () => {
    const worker = fakeServiceWorker(null);
    const onUpdate = vi.fn();
    window.addEventListener(SW_UPDATED_EVENT, onUpdate);

    await registerServiceWorker();
    worker.fire();
    expect(onUpdate).not.toHaveBeenCalled();
    window.removeEventListener(SW_UPDATED_EVENT, onUpdate);
  });
});

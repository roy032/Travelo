import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createTrip, logIn, logOut, markVerified, newUser, signUp } from "./support.js";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectAccessible(page, label) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude(".leaflet-container")
    .analyze();
  expect(
    violations.map((violation) => `${label}: ${violation.id} ${violation.nodes[0].target}`)
  ).toEqual([]);
}

// The service worker has installed (build files saved) and controls the page
async function waitForServiceWorker(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true })
      );
    }
  });
}

test.describe("Offline app", () => {
  test("is installable", async ({ page }) => {
    await page.goto("/");
    const manifest = await page.request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    const body = await manifest.json();
    expect(body.display).toBe("standalone");
    expect(body.icons.some((icon) => icon.sizes === "512x512")).toBeTruthy();

    // The build filled in the worker's file list
    const worker = await (await page.request.get("/sw.js")).text();
    expect(worker).not.toContain('const BUILD_ID = "dev"');
    expect(worker).toMatch(/const BUILD_ASSETS = \["\/assets\//);
  });

  test("a trip opened once still opens without a connection", async ({ page, context }) => {
    const user = newUser("Offline");
    await signUp(page, user);
    await markVerified(user.email);
    await page.reload();
    await createTrip(page, { title: "Srimangal offline weekend" });

    await waitForServiceWorker(page);
    // Load the list and the trip with the worker in control so it saves them
    await page.goto("/trips");
    await page.getByText("Srimangal offline weekend").click();
    await expect(page.getByRole("heading", { name: "Srimangal offline weekend" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const tripUrl = page.url();

    await context.setOffline(true);
    await page.goto(tripUrl);
    await expect(page.getByRole("heading", { name: "Srimangal offline weekend" })).toBeVisible();
    await expect(page.getByText(/You're offline/)).toBeVisible();

    await page.goto("/trips");
    await expect(page.getByText("Srimangal offline weekend")).toBeVisible();

    for (const colorScheme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme });
      await expect(page.locator("html")).toHaveClass(
        colorScheme === "dark" ? /dark/ : /^(?!.*dark)/
      );
      // Links fade to the new theme's colours; check contrast once they settle
      await page.waitForFunction(() => document.getAnimations().length === 0);
      await expectAccessible(page, `offline /trips (${colorScheme})`);
    }

    await context.setOffline(false);
    await expect(page.getByText(/You're offline/)).toBeHidden();
  });

  test("signing out removes saved trips from the device", async ({ page }) => {
    const user = newUser("Shared device");
    await signUp(page, user);
    await waitForServiceWorker(page);
    await page.goto("/trips");
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => caches.has("travelo-api"))).toBe(true);

    await logOut(page);
    expect(await page.evaluate(() => caches.has("travelo-api"))).toBe(false);

    await logIn(page, user);
  });
});

test.describe("Languages", () => {
  test("follows a Spanish browser and can switch back to English", async ({ browser }) => {
    const context = await browser.newContext({ locale: "es-ES" });
    const page = await context.newPage();
    await page.goto("/login");

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { name: "Inicia sesión en tu cuenta" })).toBeVisible();
    await expect(page).toHaveTitle("Iniciar sesión | Travelo");
    await expect(page.getByRole("link", { name: "Explorar" })).toBeVisible();

    await page.getByRole("navigation").getByLabel("Idioma").selectOption("en");
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // The choice beats the browser setting on the next visit
    await page.reload();
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await context.close();
  });

  test("Spanish pages pass the accessibility checks in both themes", async ({ browser }) => {
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({ locale: "es-ES", colorScheme });
      const page = await context.newPage();
      const user = newUser(`Idioma ${colorScheme}`);

      await page.goto("/register");
      await page.getByLabel("Nombre completo").fill(user.name);
      await page.getByLabel("Correo electrónico").fill(user.email);
      await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
      await page.getByLabel("Confirmar contraseña").fill(user.password);
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await expect(page).toHaveURL(/\/trips$/);

      await expect(page.getByRole("heading", { name: "Mis viajes" })).toBeVisible();
      await expect(page.getByText("Se requiere verificar un documento")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expectAccessible(page, `/trips es (${colorScheme})`);

      for (const path of ["/login", "/forgot-password", "/no-such-page"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expectAccessible(page, `${path} es (${colorScheme})`);
      }
      await context.close();
    }
  });
});

import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ADMIN, createTrip, logIn, markVerified, newUser, signUp } from "./support.js";

// WCAG 2.1 A/AA, including colour contrast, in both colour themes
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectAccessible(page, label) {
  // Let entrance animations and lazy content settle before checking contrast
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    // Map tiles and their attribution come from OpenStreetMap
    .exclude(".leaflet-container")
    .analyze();
  const summary = violations.map(
    (violation) =>
      `${label}: ${violation.id} (${violation.nodes.length}) ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" "))
        .join(", ")}`
  );
  expect(summary).toEqual([]);
}

for (const colorScheme of ["light", "dark"]) {
  test.describe(`Accessibility in the ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("public pages", async ({ page }) => {
      for (const path of [
        "/", "/login", "/register", "/forgot-password", "/reset-password?token=e2e",
        "/explore", "/destinations", "/privacy", "/terms", "/no-such-page",
      ]) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveClass(
          colorScheme === "dark" ? /dark/ : /^(?!.*dark)/
        );
        await expectAccessible(page, path);
      }
    });

    test("signed-in pages and every trip tab", async ({ page }) => {
      // Checks about fifteen pages, each after the network settles
      test.slow();
      const user = newUser(`A11y ${colorScheme}`);
      await signUp(page, user);
      await markVerified(user.email);
      await page.reload();
      await createTrip(page, { title: `Sylhet tea trail ${colorScheme}` });
      await expectAccessible(page, "/trips");

      for (const path of ["/profile", "/notifications", "/invitations", "/join-requests", "/favorites"]) {
        await page.goto(path);
        await expectAccessible(page, path);
      }

      await page.goto("/trips");
      await page.getByText(`Sylhet tea trail ${colorScheme}`).click();
      const tabs = page.getByRole("tab");
      await expect(tabs.first()).toBeVisible();
      const count = await tabs.count();
      expect(count).toBeGreaterThan(5);
      for (let index = 0; index < count; index += 1) {
        const tab = tabs.nth(index);
        const name = (await tab.textContent()).trim();
        await tab.click();
        await expect(tab).toHaveAttribute("aria-selected", "true");
        await expectAccessible(page, `trip tab ${name}`);
      }
    });

    test("admin dashboard with analytics", async ({ page }) => {
      await logIn(page, ADMIN);
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Sign-ups" })).toBeVisible();
      await page.getByText("Daily numbers as a table").click();
      await expectAccessible(page, "/admin");
    });
  });
}

test("the theme switch overrides the system setting and is remembered", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/explore");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: /^System theme/ }).click();
  await page.getByRole("button", { name: /^Light theme/ }).click();
  await expect(html).toHaveClass(/dark/);

  // Applied before the app loads on the next visit (no light flash)
  await page.reload();
  await expect(html).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: /^Dark theme/ })).toBeVisible();
});

test("trip tabs work from the keyboard", async ({ page }) => {
  const user = newUser("Keyboard");
  await signUp(page, user);
  await markVerified(user.email);
  await page.reload();
  await createTrip(page, { title: "Keyboard trip" });
  await page.getByText("Keyboard trip").click();

  const overview = page.getByRole("tab", { name: "Overview" });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Itinerary" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Itinerary" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Photos" })).toBeFocused();
});

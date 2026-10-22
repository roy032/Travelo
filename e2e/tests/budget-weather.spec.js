import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createTrip, futureDate, markVerified, newUser, signUp } from "./support.js";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectAccessible(page, label) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    violations.map(
      (v) => `${label}: ${v.id} ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`
    )
  ).toEqual([]);
}

async function openTrip(page, title) {
  await page.goto("/trips");
  await page.getByText(title).click();
  await expect(page).toHaveURL(/\/trips\/[0-9a-f]{24}$/);
  return page.url().split("/").pop();
}

// Rates and weather come from public APIs; when they can't be reached the
// server falls back (approximate rates, "No data" days), so nothing here
// depends on the network
for (const colorScheme of ["light", "dark"]) {
  test.describe(`Budget, currency and weather (${colorScheme})`, () => {
    test.use({ colorScheme });

    test("tracks spending in several currencies against a budget", async ({ page }) => {
      const user = newUser(`Budget ${colorScheme}`);
      await signUp(page, user);
      await markVerified(user.email);
      const title = `Sundarbans budget ${colorScheme}`;
      await createTrip(page, { title, days: 5 });
      await openTrip(page, title);

      await page.getByRole("tab", { name: "Expenses" }).click();
      await page.getByLabel(/^Budget \(BDT\)/).fill("5000");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.getByText("Budget settings saved")).toBeVisible();

      await page.getByRole("button", { name: "Add Expense" }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Currency").selectOption("EUR");
      await dialog.getByLabel(/^Amount/).fill("5");
      await dialog.getByLabel("Description").fill("Ferry tickets");
      await expect(dialog.getByText(/≈ ৳[\d,.]+ at [\d.]+ BDT\/EUR/)).toBeVisible();
      await dialog.getByRole("button", { name: "Add Expense" }).click();
      await expect(dialog).toBeHidden();

      await expect(page.getByText("€5.00")).toBeVisible();
      await expect(page.getByText(/of ৳5,000\.00/)).toBeVisible();
      await expect(page.getByText(/left \(\d+% used\)/)).toBeVisible();
      await expect(page.getByText("Everyone is settled up.")).toBeVisible();
      await expect(page.getByTestId("converted-amount")).toHaveText(/৳[\d,.]+/);

      await expectAccessible(page, "expenses tab");
    });

    test("shows weather for every trip day", async ({ page }) => {
      const user = newUser(`Weather ${colorScheme}`);
      await signUp(page, user);
      await markVerified(user.email);
      const title = `Sylhet weather ${colorScheme}`;
      await createTrip(page, { title, days: 4 });
      const tripId = await openTrip(page, title);

      await page.getByRole("tab", { name: "Weather & Packing" }).click();
      await expect(page.getByText(/Add activities with a location/)).toBeVisible();

      const activity = await page.request.post(`/api/trips/${tripId}/activities`, {
        data: {
          title: "Tea garden walk",
          date: futureDate(4),
          time: "09:00",
          location: { name: "Sylhet", coordinates: { lat: 24.89, lng: 91.87 } },
        },
      });
      expect(activity.status()).toBe(201);

      await page.reload();
      await page.getByRole("tab", { name: "Weather & Packing" }).click();
      const days = page.getByRole("region", { name: "Weather by Day" }).getByRole("listitem");
      await expect(days).toHaveCount(4);
      await expect(page.getByText(/Add activities with a location/)).toBeHidden();
      await expect(page.getByRole("link", { name: /Open-Meteo/ })).toBeVisible();

      await expectAccessible(page, "weather tab");
    });
  });
}

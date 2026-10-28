import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addMember, createTrip, futureDate, markVerified, newUser, signUp } from "./support.js";

test.describe("Live trip collaboration", () => {
  test("members see each other and each other's changes without reloading", async ({
    page,
    browser,
  }) => {
    const owner = newUser("Live Owner");
    await signUp(page, owner);
    await markVerified(owner.email);
    await page.reload();
    await createTrip(page, { title: "Bandarban hills live" });

    const friend = newUser("Live Friend");
    const friendContext = await browser.newContext();
    const friendPage = await friendContext.newPage();
    await signUp(friendPage, friend);
    await addMember("Bandarban hills live", friend.email);

    await page.goto("/trips");
    await page.getByText("Bandarban hills live").click();
    const tripUrl = page.url();
    await expect(page.getByText(/appear here instantly/)).toBeVisible();

    await friendPage.goto(tripUrl);
    await expect(page.getByText(`Also viewing: ${friend.name}`)).toBeVisible();
    await expect(friendPage.getByText(`Also viewing: ${owner.name}`)).toBeVisible();

    // The friend adds a checklist item; it shows up for the owner
    await page.getByRole("tab", { name: "Checklist" }).click();
    await friendPage.getByRole("tab", { name: "Checklist" }).click();
    await friendPage.getByPlaceholder("Add a new item...").fill("Leech socks");
    await friendPage.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Leech socks")).toBeVisible();
    await expect(page.getByText(`${friend.name} updated the checklist`)).toBeVisible();

    // The friend leaves the page
    await friendContext.close();
    await expect(page.getByText(/appear here instantly/)).toBeVisible();
  });
});

const fakePlan = (start) => ({
  summary: "Two days of hills and waterfalls.",
  destination: "Bandarban",
  currency: "BDT",
  estimatedTotalPerPerson: 6000,
  tips: ["Carry cash, cards are rarely accepted."],
  days: [
    {
      date: start,
      theme: "Nilgiri",
      activities: [
        {
          title: "Sunrise at Nilgiri",
          time: "05:30",
          description: "Watch the clouds roll under the hills.",
          location: {
            name: "Nilgiri",
            address: "",
            country: "Bangladesh",
            coordinates: { lat: 21.9, lng: 92.3 },
          },
          estimatedCost: 500,
        },
        {
          title: "Chimbuk Hill",
          time: "11:00",
          description: "",
          location: {
            name: "Chimbuk Hill",
            address: "",
            country: "Bangladesh",
            coordinates: { lat: 22.03, lng: 92.3 },
          },
          estimatedCost: 0,
        },
      ],
    },
  ],
});

// page.route can't see requests the service worker makes, so keep it out of
// the way of the stubbed planner endpoints
test.describe("AI planner", () => {
  test.use({ serviceWorkers: "block" });

for (const colorScheme of ["light", "dark"]) {
  test(`the AI planner adds chosen activities (${colorScheme} theme)`, async ({ page }) => {
    // Claude isn't called in tests: the planner's two read-only endpoints are
    // stubbed in the browser, and applying the plan uses the real API
    await page.emulateMedia({ colorScheme });
    await page.route("**/api/ai-planner/status", (route) =>
      route.fulfill({ json: { enabled: true, maxDays: 14 } })
    );
    let request;
    await page.route("**/api/trips/*/ai-plan", (route) => {
      request = route.request().postDataJSON();
      return route.fulfill({ json: { plan: fakePlan(futureDate(30)) } });
    });

    const user = newUser(`Planner ${colorScheme}`);
    await signUp(page, user);
    await markVerified(user.email);
    await page.reload();
    const title = `Bandarban plan ${colorScheme}`;
    await createTrip(page, { title });
    await page.getByText(title).click();
    await page.getByRole("tab", { name: "Itinerary" }).click();
    await page.getByRole("button", { name: "Plan with AI" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Destination/).fill("Bandarban");
    await dialog.getByLabel(/Budget per person/).fill("8000");
    await dialog.getByLabel("Currency").fill("BDT");
    await dialog.getByRole("button", { name: /Create plan/ }).click();
    await expect(dialog.getByText("Two days of hills and waterfalls.")).toBeVisible();
    expect(request).toMatchObject({
      destination: "Bandarban",
      budget: { amount: 8000, currency: "BDT" },
    });

    await page.waitForTimeout(300);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('[role="dialog"]')
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);

    await dialog.getByLabel(/Chimbuk Hill/).uncheck();
    await dialog.getByRole("button", { name: "Add 1 activity" }).click();
    await expect(page.getByText("Added 1 activity to the itinerary")).toBeVisible();
    await expect(page.getByText("Sunrise at Nilgiri")).toBeVisible();
    await expect(page.getByText("Chimbuk Hill")).toHaveCount(0);
  });
}
});

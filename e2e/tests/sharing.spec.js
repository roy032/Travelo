import { readFile } from "fs/promises";
import { expect, test } from "@playwright/test";
import {
  createTrip,
  futureDate,
  markVerified,
  newUser,
  signUp,
} from "./support.js";

test.describe("Trip map, calendar and share links", () => {
  test("an owner maps the plan, exports it and shares a public link", async ({
    page,
    browser,
  }) => {
    const owner = newUser("Sharer");
    await signUp(page, owner);
    await markVerified(owner.email);
    await page.reload();
    await createTrip(page, { title: "Sylhet tea gardens", days: 40 });

    await page.getByText("Sylhet tea gardens").click();
    await expect(page).toHaveURL(/\/trips\/[a-f0-9]{24}$/);
    const tripId = page.url().split("/").pop();

    // Add two stops through the API (the form looks places up online)
    for (const [title, time, lat] of [
      ["Ratargul swamp forest", "09:30", 25.0],
      ["Jaflong stone collection", "15:00", 25.16],
    ]) {
      const res = await page.request.post(`/api/trips/${tripId}/activities`, {
        data: {
          title,
          date: futureDate(41),
          time,
          location: { name: title.split(" ")[0], coordinates: { lat, lng: 91.98 } },
        },
      });
      expect(res.status()).toBe(201);
    }

    // Map tab: numbered stops in visiting order
    await page.reload();
    await page.getByRole("tab", { name: "Map" }).click();
    await expect(page.locator('.leaflet-marker-icon[title="1. Ratargul swamp forest"]')).toBeVisible();
    await expect(page.locator('.leaflet-marker-icon[title="2. Jaflong stone collection"]')).toBeVisible();

    // Calendar export downloads an .ics with both stops
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Add to calendar" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("sylhet-tea-gardens.ics");
    const ics = await readFile(await download.path(), "utf8");
    expect(ics).toContain("SUMMARY:Ratargul swamp forest");
    expect(ics).toContain("DTSTART:");

    // Turn on the public link
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Create public link" }).click();
    const link = await dialog.getByLabel("Public link").inputValue();
    expect(link).toMatch(/\/share\/[A-Za-z0-9_-]{22}$/);

    // A signed-out visitor sees the plan, and link previews describe it
    const visitor = await browser.newPage();
    await visitor.goto(link);
    await expect(visitor.getByRole("heading", { name: "Sylhet tea gardens" })).toBeVisible();
    await expect(visitor.getByText("Jaflong stone collection")).toBeVisible();
    await expect(visitor.getByText(owner.email)).toHaveCount(0);

    const html = await (await visitor.request.get(link)).text();
    expect(html).toContain("<title>Sylhet tea gardens | Travelo</title>");
    expect(html).toMatch(/og:description"\s+content="[^"]*2 stops: Ratargul, Jaflong/);

    // Turning sharing off breaks the link
    await dialog.getByRole("button", { name: "Turn off public link" }).click();
    await expect(dialog.getByRole("button", { name: "Create public link" })).toBeVisible();
    await visitor.reload();
    await expect(visitor.getByText("This link isn't available")).toBeVisible();
    await visitor.close();
  });
});

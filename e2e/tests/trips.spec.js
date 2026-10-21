import { expect, test } from "@playwright/test";
import {
  ADMIN,
  PNG,
  createTrip,
  logIn,
  logOut,
  markVerified,
  newUser,
  signUp,
} from "./support.js";

test.describe("Trips, uploads and browsing", () => {
  test("a verified user creates a trip and uploads a photo", async ({ page }) => {
    const user = newUser("Photographer");
    await signUp(page, user);
    await markVerified(user.email);
    await page.reload();

    // No destination type chosen: this used to fail validation
    await createTrip(page, { title: "Sundarbans boat trip" });

    await page.getByText("Sundarbans boat trip").click();
    await expect(
      page.getByRole("heading", { name: "Sundarbans boat trip" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Photos", exact: true }).click();
    await page.getByRole("button", { name: /Add Photo/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[type="file"]').setInputFiles(PNG);
    await dialog.getByLabel(/Caption/).fill("Mangroves at dawn");
    await dialog.getByRole("button", { name: /^Upload/ }).click();

    await expect(page.getByText("Photo uploaded successfully")).toBeVisible();
    await expect(page.getByText("(1 photo)")).toBeVisible();

    // The image is actually served back
    const image = page.locator('img[src^="/uploads/photos/"]').first();
    await expect(image).toBeVisible();
    expect(await image.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test("an unverified user is told to verify before creating a trip", async ({ page }) => {
    await signUp(page, newUser("Unverified"));

    await expect(page.getByText("Document Verification Required")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Trip" }).first()).toBeDisabled();
  });

  test("visitors browse and filter upcoming trips on Explore", async ({ page, browser }) => {
    const owner = newUser("Planner");
    await signUp(page, owner);
    await markVerified(owner.email);
    await page.reload();
    await createTrip(page, { title: "Bandarban hill hike", destinationType: "mountain" });
    await createTrip(page, { title: "Cox's Bazar beach days", destinationType: "beach" });

    // The owner does not see their own trips on Explore
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: "Explore Trips" })).toBeVisible();
    await expect(page.getByText("Bandarban hill hike")).toHaveCount(0);

    const visitor = await browser.newPage();
    await visitor.goto("/explore");
    await expect(visitor.getByText("Bandarban hill hike")).toBeVisible();
    await expect(visitor.getByText("Cox's Bazar beach days")).toBeVisible();

    await visitor.getByRole("button", { name: "Mountain" }).click();
    await expect(visitor.getByText("Bandarban hill hike")).toBeVisible();
    await expect(visitor.getByText("Cox's Bazar beach days")).toHaveCount(0);

    await visitor.getByRole("button", { name: "All Types" }).click();
    await visitor.getByLabel("Search trips").fill("beach");
    await expect(visitor.getByText("Cox's Bazar beach days")).toBeVisible();
    await expect(visitor.getByText("Bandarban hill hike")).toHaveCount(0);
    await visitor.close();
  });

  test("a new user gets verified, joins a trip and sees its photos", async ({ page, browser }) => {
    // The owner sets up a trip with a photo
    const owner = newUser("Host");
    await signUp(page, owner);
    await markVerified(owner.email);
    await page.reload();
    await createTrip(page, { title: "Srimangal tea trail", destinationType: "countryside" });
    await page.getByText("Srimangal tea trail").click();
    await page.getByRole("button", { name: "Photos", exact: true }).click();
    await page.getByRole("button", { name: /Add Photo/ }).click();
    await page.getByRole("dialog").locator('input[type="file"]').setInputFiles(PNG);
    await page.getByRole("dialog").getByRole("button", { name: /^Upload/ }).click();
    await expect(page.getByText("Photo uploaded successfully")).toBeVisible();
    await logOut(page);

    // A visitor finds the trip and is sent to log in, then back to Explore
    const guest = newUser("Guest");
    await signUp(page, guest);
    await logOut(page);
    await page.goto("/explore");
    const card = page.locator("div.rounded-lg", { hasText: "Srimangal tea trail" }).last();
    await card.getByRole("button", { name: "Log in to Join" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email address").fill(guest.email);
    await page.getByLabel("Password").fill(guest.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/explore$/);

    // Joining needs a verified NID
    await page
      .locator("div.rounded-lg", { hasText: "Srimangal tea trail" })
      .last()
      .getByRole("button", { name: "Request to Join" })
      .click();
    await expect(page.getByText(/verify your NID to join/)).toBeVisible();

    // Upload the NID from the profile page
    await page.goto("/profile");
    await page.locator("#nid-upload").setInputFiles({ ...PNG, name: "nid.png" });
    await page.getByRole("button", { name: /^Upload NID/ }).click();
    await expect(page.getByText(/uploaded successfully/)).toBeVisible();

    // The admin approves it
    const adminPage = await browser.newPage();
    await logIn(adminPage, ADMIN);
    await adminPage.goto("/admin");
    await expect(adminPage.getByText(guest.email)).toBeVisible();
    // The uploaded document is viewable by the admin
    const doc = adminPage.locator('img[src^="/api/documents/file/"]');
    await expect(doc).toBeVisible();
    expect(await doc.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    await adminPage.getByRole("button", { name: "Approve" }).first().click();
    await adminPage
      .getByRole("dialog")
      .getByRole("button", { name: "Approve" })
      .click();
    await expect(adminPage.getByText("NID verification approved successfully")).toBeVisible();
    await expect(adminPage.getByText("No Pending Verifications")).toBeVisible();

    // Now the guest can ask to join
    await page.goto("/explore");
    await page
      .locator("div.rounded-lg", { hasText: "Srimangal tea trail" })
      .last()
      .getByRole("button", { name: "Request to Join" })
      .click();
    await expect(page.getByText("Join request sent successfully")).toBeVisible();
    await expect(page.getByRole("button", { name: "Request Sent" })).toBeDisabled();

    // The owner accepts the request
    const ownerPage = await browser.newPage();
    await logIn(ownerPage, owner);
    await ownerPage.goto("/join-requests");
    await expect(ownerPage.getByText(guest.email).first()).toBeVisible();
    await ownerPage.getByRole("button", { name: /Accept/ }).first().click();
    await expect(ownerPage.getByText(/accepted/i).first()).toBeVisible();

    // The guest now has the trip and can see its photos
    await page.goto("/trips");
    await page.getByText("Srimangal tea trail").click();
    await page.getByRole("button", { name: "Photos", exact: true }).click();
    await expect(page.getByText("(1 photo)")).toBeVisible();

    await adminPage.close();
    await ownerPage.close();
  });
});

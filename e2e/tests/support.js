import { randomUUID } from "crypto";
import { MongoClient } from "mongodb";
import { expect } from "@playwright/test";

export const ADMIN = {
  name: "Admin User",
  email: "admin@travelo.test",
  password: "admin-password-123",
};

const MONGODB_URI =
  process.env.E2E_MONGODB_URI || "mongodb://127.0.0.1:27017/travelo_e2e";

export const newUser = (name = "Traveler") => ({
  name,
  email: `${name.toLowerCase().replace(/\W+/g, "-")}-${randomUUID().slice(0, 8)}@travelo.test`,
  password: "password-123",
});

// Smallest valid PNG (1x1 pixel)
export const PNG = {
  name: "photo.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
    "base64"
  ),
};

export const futureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
};

export async function signUp(page, user) {
  await page.goto("/register");
  await page.getByLabel("Full Name").fill(user.name);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByLabel("Confirm Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/trips$/);
}

export async function logIn(page, user) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/trips$/);
}

// Verification normally needs an admin to review an uploaded NID; tests
// that are not about verification skip that step
export async function markVerified(email) {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    await client.db().collection("users").updateOne(
      { email },
      {
        $set: {
          verificationStatus: "verified",
          "domesticVerification.status": "verified",
          "internationalVerification.status": "verified",
        },
      }
    );
  } finally {
    await client.close();
  }
}

export async function createTrip(page, { title, destinationType, days = 30 }) {
  await page.goto("/trips");
  await page.getByRole("button", { name: "Create Trip" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Trip Title").fill(title);
  await dialog.getByLabel("Start Date").fill(futureDate(days));
  await dialog.getByLabel("End Date").fill(futureDate(days + 3));
  if (destinationType) {
    await dialog.getByLabel("Destination Type").selectOption(destinationType);
  }
  await dialog.getByRole("button", { name: "Create Trip" }).click();
  await expect(page.getByText("Trip created successfully!")).toBeVisible();
  await expect(dialog).toBeHidden();
}

export async function logOut(page) {
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

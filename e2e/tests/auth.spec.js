import { expect, test } from "@playwright/test";
import { ADMIN, logIn, logOut, newUser, signUp } from "./support.js";

test.describe("Sign up, log in and log out", () => {
  test("a visitor is not nagged to log in on public pages", async ({ page }) => {
    await page.goto("/");
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: "Explore Trips" })).toBeVisible();
    await expect(page.getByText("Please log in to continue")).toHaveCount(0);
  });

  test("a new user signs up and lands on their trips", async ({ page }) => {
    const user = newUser("Signup");
    await signUp(page, user);

    await expect(page.getByRole("heading", { name: "My Trips" })).toBeVisible();
    await expect(page.getByText("No trips yet")).toBeVisible();
    // Only ADMIN_EMAILS accounts are admins
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });

  test("signing up twice with the same email is refused", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full Name").fill("Copycat");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill("password-123");
    await page.getByLabel("Confirm Password").fill("password-123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Email already exist")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("a wrong password shows a clear error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logging out ends the session, even after a reload", async ({ page }) => {
    const user = newUser("Logout");
    await signUp(page, user);

    await logOut(page);
    await page.reload();
    await page.goto("/trips");
    await expect(page).toHaveURL(/\/login$/);

    await logIn(page, user);
    await expect(page.getByRole("heading", { name: "My Trips" })).toBeVisible();
  });

  test("a protected page sends the visitor back after logging in", async ({ page }) => {
    const user = newUser("Return");
    await signUp(page, user);
    await page.context().clearCookies();

    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/notifications$/);
  });

  test("the admin sees the admin dashboard", async ({ page }) => {
    await logIn(page, ADMIN);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();

    // Analytics count the accounts made during this run, and switch range
    await expect(page.getByRole("heading", { name: "Sign-ups" })).toBeVisible();
    await expect(page.getByRole("img", { name: /^Sign-ups, daily/ })).toBeVisible();
    await page.getByRole("button", { name: "7 days" }).click();
    await expect(page.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Recent server errors" })).toBeVisible();
  });

  test("a user downloads their data and deletes their account", async ({ page }) => {
    const user = newUser("Leaver");
    await signUp(page, user);
    await page.goto("/profile");

    const exportLink = page.getByRole("link", { name: "Download data" });
    const response = await page.request.get(await exportLink.getAttribute("href"));
    expect(response.status()).toBe(200);
    expect((await response.json()).account.email).toBe(user.email);

    await page.getByRole("button", { name: "Delete account" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Password").fill(user.password);
    await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
    await dialog.getByRole("button", { name: "Delete my account" }).click();

    await expect(page).toHaveURL(/\/$/);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });
});

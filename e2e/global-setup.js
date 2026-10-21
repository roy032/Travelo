import { MongoClient } from "mongodb";
import { BASE_URL, MONGODB_URI } from "./playwright.config.js";
import { ADMIN } from "./tests/support.js";

// Runs after the web server is up. Start from an empty database and create
// the admin account (the first account to sign up becomes the admin).
export default async function globalSetup() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    // Delete documents rather than dropping the database, so the indexes the
    // running server created (e.g. unique emails) stay in place
    const collections = await client.db().collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  } finally {
    await client.close();
  }

  const res = await fetch(`${BASE_URL}/api/auth/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ADMIN),
  });
  const body = await res.json();
  if (res.status !== 201 || body.user?.role !== "admin") {
    throw new Error(`Could not create the admin: ${res.status} ${JSON.stringify(body)}`);
  }
}

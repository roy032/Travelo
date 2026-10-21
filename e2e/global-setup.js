import { MongoClient } from "mongodb";
import { BASE_URL, MONGODB_URI } from "./playwright.config.js";
import { ADMIN } from "./tests/support.js";

// Runs after the web server is up. Start from an empty database and create
// the admin account: ADMIN.email is in the server's ADMIN_EMAILS, so it is
// promoted to admin on its first sign-in.
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

  const post = async (path, data) => {
    const res = await fetch(`${BASE_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { status: res.status, body: await res.json() };
  };

  const signUp = await post("sign-up", ADMIN);
  if (signUp.status !== 201) {
    throw new Error(`Could not create the admin: ${signUp.status} ${JSON.stringify(signUp.body)}`);
  }
  const signIn = await post("sign-in", { email: ADMIN.email, password: ADMIN.password });
  if (signIn.status !== 200 || signIn.body.user?.role !== "admin") {
    throw new Error(`The admin was not promoted on sign-in: ${signIn.status} ${JSON.stringify(signIn.body)}`);
  }
}

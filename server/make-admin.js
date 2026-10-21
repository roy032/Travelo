/**
 * Promote an existing account to admin.
 * Usage: MONGODB_URI="..." npm run make-admin -- you@example.com
 */
import "dotenv/config";
import mongoose from "mongoose";
import { promoteToAdmin } from "./src/services/auth.service.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await promoteToAdmin(email);
  if (!user) {
    console.error(`No account found for ${email}. Register it first.`);
    process.exitCode = 1;
  } else {
    console.log(
      `${user.email} is now an admin. Sign out and back in to use it.`,
    );
  }
} catch (error) {
  console.error("Failed to promote user:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

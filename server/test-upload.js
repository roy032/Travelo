import { UTApi } from "uploadthing/server";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Decode the token to see what's in it
const token = process.env.UPLOADTHING_TOKEN;
console.log("Token (first 50 chars):", token?.substring(0, 50) + "...");

try {
  const decoded = JSON.parse(Buffer.from(token, "base64").toString());
  console.log("Decoded token:", decoded);
} catch (e) {
  console.log("Could not decode token:", e.message);
}

const utapi = new UTApi({ token });

// Create a simple test file
const testContent = "Hello, UploadThing!";
const testFile = new File([testContent], "test.txt", { type: "text/plain" });

console.log("\nTesting UploadThing upload...");
console.log("File:", testFile.name, testFile.type, testFile.size);

try {
  const result = await utapi.uploadFiles([testFile], {
    metadata: { test: true },
    contentDisposition: "inline",
  });

  console.log("\nUpload successful!");
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("\nUpload failed!");
  console.error("Error:", error);
  console.error("Stack:", error.stack);
}

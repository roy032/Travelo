import { createUploadthing } from "uploadthing/server";

const f = createUploadthing();

/**
 * File Router for UploadThing
 * Define upload endpoints and their configurations
 */
export const uploadRouter = {
  // Photo uploads for trips
  photoUploader: f({
    image: { maxFileSize: "10MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // This middleware runs before file upload
      // You can add authentication/authorization here
      return { uploadedBy: "server" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs after upload completes
      console.log("Photo upload complete:", file.url);
      return { url: file.url };
    }),

  // Document uploads (NID/Passport)
  documentUploader: f({
    image: { maxFileSize: "5MB", maxFileCount: 1 },
    pdf: { maxFileSize: "5MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      return { uploadedBy: "server" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete:", file.url);
      return { url: file.url };
    }),

  // Receipt uploads for expenses
  receiptUploader: f({
    image: { maxFileSize: "5MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      return { uploadedBy: "server" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Receipt upload complete:", file.url);
      return { url: file.url };
    }),
};

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Locally stored uploads (development without UploadThing) are served
    // by the API server; in production the client and API share an origin
    proxy: {
      "/uploads": process.env.VITE_API_URL || "http://localhost:3000",
    },
  },
});

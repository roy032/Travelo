import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Fill in public/sw.js's BUILD_ID and BUILD_ASSETS once the build is
// written, so the worker saves every JS/CSS chunk (including lazily loaded
// pages) at install and the app opens offline on any page
const serviceWorkerManifest = () => {
  let outDir = "dist";
  return {
    name: "travelo-sw-manifest",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    writeBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => /\.(js|css|woff2?)$/.test(file))
        .sort()
        .map((file) => `/${file}`);
      const buildId = createHash("sha256")
        .update(assets.join("\n"))
        .digest("hex")
        .slice(0, 12);
      const swPath = join(outDir, "sw.js");
      const source = readFileSync(swPath, "utf8");
      const output = source
        .replace('const BUILD_ID = "dev";', `const BUILD_ID = "${buildId}";`)
        .replace(
          "const BUILD_ASSETS = [];",
          `const BUILD_ASSETS = ${JSON.stringify(assets)};`
        );
      if (output === source) {
        throw new Error("sw.js placeholders not found; update vite.config.js");
      }
      writeFileSync(swPath, output);
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), serviceWorkerManifest()],
  server: {
    // Locally stored uploads (development without UploadThing) are served
    // by the API server; in production the client and API share an origin
    proxy: {
      "/uploads": process.env.VITE_API_URL || "http://localhost:3000",
      "/api/documents/file": process.env.VITE_API_URL || "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    css: false,
  },
});

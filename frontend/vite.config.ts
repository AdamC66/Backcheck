import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // strictPort so a busy 5173 fails loudly instead of drifting to 5174 and turning
  // into a CORS error on the backend side.
  server: { port: 5173, strictPort: true },
  resolve: {
    // Mirrors the `paths` entry in tsconfig.app.json — both have to agree or
    // absolute imports resolve for the type-checker but not the bundler.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});

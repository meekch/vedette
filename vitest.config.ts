import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Mirror tsconfig's "@/*" -> "./src/*" path alias.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Node environment: Phase 1 tests are pure logic + the RLS zero-leak
    // integration check (step 5). Component tests can add jsdom later.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

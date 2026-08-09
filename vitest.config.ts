import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Mirror tsconfig's path aliases. "@seed" must be listed before "@" —
    // Vitest matches these prefixes in order, so a bare "@" first would swallow
    // "@seed/..." and resolve it to "src/eed/...".
    alias: {
      "@seed": fileURLToPath(new URL("./seed", import.meta.url)),
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

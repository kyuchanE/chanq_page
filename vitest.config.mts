import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/component/**/*.test.{ts,tsx}",
    ],
    restoreMocks: true,
    setupFiles: ["./tests/setup/vitest.ts"],
  },
});

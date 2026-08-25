import { fileURLToPath } from "node:url";

import { config as loadEnvironment } from "dotenv";
import { defineConfig } from "vitest/config";

loadEnvironment({ path: ".env.local", quiet: true });

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    restoreMocks: true,
    testTimeout: 10_000,
  },
});

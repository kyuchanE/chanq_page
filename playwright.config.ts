import { defineConfig, devices } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: true,
  outputDir: "test-results/playwright",
  reporter: "list",
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: baseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "corepack pnpm start --hostname 127.0.0.1 --port 3100",
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseUrl,
  },
  workers: 1,
});

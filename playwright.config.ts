import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/film-color-script-generator/",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  reporter: [["list"]]
});

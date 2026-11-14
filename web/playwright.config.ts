import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const basePath = isDemo ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "/Healthcare-Data-Exchange") : "";
const baseURL = `http://127.0.0.1:${PORT}${basePath}/`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  testIgnore: isDemo ? undefined : ["**/demo.spec.ts", "**/live-review.spec.ts"],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: isDemo ? "npm run preview:demo" : "npm run start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

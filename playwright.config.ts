import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "set NEXT_DIST_DIR=.next-e2e&& npm.cmd run dev:web -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/tier-list/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

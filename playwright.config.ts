import { defineConfig, devices } from "@playwright/test";

/**
 * E2E (TEST-004/005) — Playwright.
 * - webServer menyalakan Next dev (env dari .env.local: DATABASE_URL,
 *   AUTH_SECRET, BOOKING_ENGINE_PROVIDER=mock).
 * - DB harus sudah di-seed (npm run db:seed).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // satu server + state DB bersama → serial lebih deterministik
  timeout: 90_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      // skenario mobile-only ada di file terpisah
      testIgnore: /landing-mobile\.spec\.ts/,
    },
    {
      // Emulasi mobile via Chromium (tanpa WebKit binary) — viewport & touch iPhone 14.
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent: devices["iPhone 14"].userAgent,
      },
      testMatch: /landing-mobile\.spec\.ts/,
    },
  ],
  // Production build (seperti CI) — dev-mode React butuh unsafe-eval yang
  // dilarang CSP. ALLOW_MOCK_ENGINE=true hanya untuk E2E (lihat
  // provider-guard.ts) — jangan pernah di-set di production rill.
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { ...process.env, ALLOW_MOCK_ENGINE: "true" },
  },
});

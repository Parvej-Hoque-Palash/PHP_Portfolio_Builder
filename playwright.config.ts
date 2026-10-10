import { defineConfig } from '@playwright/test';

const PORT = 48173;

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Use the locally installed Google Chrome instead of downloading a browser.
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    // Production build with the fake values from .env.test, served like a static host.
    command: `vite build --mode test --outDir dist-e2e && vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
  },
});

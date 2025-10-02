import { defineConfig, devices } from 'playwright/test';

const PORT = process.env.PORT ? Number(process.env.PORT) : 19006;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 120 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: `npx expo start --web --port ${PORT} --clear`,
        env: {
          EXPO_NO_TELEMETRY: '1',
          BROWSER: 'none',
          CI: '1',
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240 * 1000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

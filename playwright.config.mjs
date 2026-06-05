import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npx serve . --listen 4321 --no-clipboard',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
  },
});

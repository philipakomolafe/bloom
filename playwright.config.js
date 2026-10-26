import { defineConfig } from '@playwright/test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  outputDir: join(tmpdir(), 'bloom-playwright-results'),
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8765', channel: 'msedge', viewport: { width: 1440, height: 1000 }, trace: 'off', screenshot: 'off' },
  webServer: { command: 'python -B -m http.server 8765 --bind 127.0.0.1', url: 'http://127.0.0.1:8765', reuseExistingServer: false, stdout: 'ignore', stderr: 'ignore' },
})

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const browserPath = process.env.REACT_SNAP_CHROME_PATH || '/Users/pratyushraj/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

if (!existsSync(browserPath)) {
  console.log(`[react-snap] Skipping prerender; browser not found at ${browserPath}`);
  process.exit(0);
}

const result = spawnSync('react-snap', {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    REACT_SNAP_CHROME_PATH: browserPath,
    PUPPETEER_EXECUTABLE_PATH: browserPath,
  },
});

process.exit(result.status ?? 1);

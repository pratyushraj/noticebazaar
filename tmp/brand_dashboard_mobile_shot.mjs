import { chromium } from 'playwright';

const url = process.env.URL || 'http://localhost:8080/brand-dashboard';
const out = process.env.OUT || 'tmp/brand_dashboard_mobile.png';

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') console.log('[console]', msg.text());
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  await page.screenshot({ path: out, fullPage: true });
  console.log(out);
  await context.close();
} finally {
  await browser.close();
}

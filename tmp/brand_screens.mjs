import { chromium } from 'playwright';

const baseUrl = 'http://localhost:8080';
const email = 'brand-demo@noticebazaar.com';
const password = 'BrandDemo123!@#';
const storagePath = '/tmp/brand_storage.json';

async function loginAndSaveState() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await context.storageState({ path: storagePath });
  await browser.close();
}

async function captureShots(label, viewport) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, storageState: storagePath });
  const page = await context.newPage();
  const routes = [
    { path: '/brand/offers', name: 'offers' },
    { path: '/brand/collaborations', name: 'collaborations' },
    { path: '/brand/analytics', name: 'analytics' },
  ];
  for (const route of routes) {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const file = `/tmp/brand_${route.name}_${label}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
  }
  await browser.close();
}

await loginAndSaveState();
await captureShots('mobile', { width: 390, height: 844 });
await captureShots('desktop', { width: 1440, height: 900 });

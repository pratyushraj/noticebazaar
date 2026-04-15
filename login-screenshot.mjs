import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.fill('input[type="email"]', 'notice104@yopmail.com');
await page.fill('input[type="password"]', 'kickurass');
await page.click('button[type="submit"]');
await page.waitForTimeout(9000);
await page.screenshot({ path: '/tmp/dashboard.png', fullPage: false });
console.log('DONE URL:', page.url());
await browser.close();

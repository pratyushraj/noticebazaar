import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('/tmp/audit', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // Mobile viewport (iPhone 14)

// Login
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.fill('input[type="email"]', 'notice104@yopmail.com');
await page.fill('input[type="password"]', 'kickurass');
await page.click('button[type="submit"]');
await page.waitForTimeout(6000);
console.log('Logged in, URL:', page.url());

// Helper to screenshot
const shot = async (name) => {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/audit/${name}.png`, fullPage: true });
  console.log(`Screenshot: ${name}`);
};

// 1. Full dashboard overview
await shot('01-dashboard-overview');

// 2. Scroll through main content
await page.evaluate(() => window.scrollTo(0, 400));
await shot('02-dashboard-scroll-400');
await page.evaluate(() => window.scrollTo(0, 800));
await shot('03-dashboard-scroll-800');
await page.evaluate(() => window.scrollTo(0, 1200));
await shot('04-dashboard-scroll-1200');
await page.evaluate(() => window.scrollTo(0, 0));

// 3. Try clicking nav tabs at bottom or sidebar
const tabSelectors = [
  { name: 'deals-tab', selectors: ['[data-tab="deals"]', 'button:has-text("Deals")', 'a:has-text("Deals")', '[aria-label*="deal" i]'] },
  { name: 'analytics-tab', selectors: ['[data-tab="analytics"]', 'button:has-text("Analytics")', 'a:has-text("Analytics")', '[aria-label*="analytic" i]'] },
  { name: 'messages-tab', selectors: ['[data-tab="messages"]', 'button:has-text("Messages")', 'a:has-text("Messages")', '[aria-label*="message" i]'] },
  { name: 'profile-tab', selectors: ['[data-tab="profile"]', 'button:has-text("Profile")', 'a:has-text("Profile")', '[aria-label*="profile" i]'] },
  { name: 'earnings-tab', selectors: ['[data-tab="earnings"]', 'button:has-text("Earnings")', 'a:has-text("Earnings")', '[aria-label*="earning" i]'] },
  { name: 'contracts-tab', selectors: ['button:has-text("Contracts")', 'a:has-text("Contracts")'] },
  { name: 'opportunities-tab', selectors: ['button:has-text("Opportunities")', 'a:has-text("Opportunities")'] },
];

for (const tab of tabSelectors) {
  for (const sel of tab.selectors) {
    try {
      const el = page.locator(sel).first();
      const count = await el.count();
      if (count > 0) {
        await el.click({ timeout: 3000 });
        await shot(tab.name);
        // Scroll through tab content
        await page.evaluate(() => window.scrollTo(0, 400));
        await shot(`${tab.name}-scroll`);
        await page.evaluate(() => window.scrollTo(0, 0));
        break;
      }
    } catch {}
  }
}

// 4. Check for modals/drawers - try clicking a deal card if visible
try {
  const dealCard = page.locator('.deal-card, [data-type="deal"], .offer-card').first();
  if (await dealCard.count() > 0) {
    await dealCard.click();
    await shot('deal-detail-modal');
    await page.keyboard.press('Escape');
  }
} catch {}

// 5. Desktop viewport too
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:5173/creator-dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await shot('desktop-dashboard-overview');
await page.evaluate(() => window.scrollTo(0, 500));
await shot('desktop-dashboard-scroll');

// 6. Check other dashboard routes
const routes = [
  '/creator-dashboard',
  '/messages',
  '/contracts',
  '/advisor-dashboard',
  '/brand-opportunities',
  '/creator-profile',
  '/settings',
];

for (const route of routes) {
  try {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(2500);
    const url = page.url();
    if (!url.includes('/login')) {
      const safeName = route.replace(/\//g, '_').replace(/^_/, '');
      await shot(`route-${safeName}`);
    }
  } catch {}
}

await browser.close();
console.log('All screenshots done.');

const { chromium } = require('playwright');
const fs = require('fs');

const TUNNEL = 'https://hobbies-carefully-pieces-expression.trycloudflare.com';
const BRAND = { email: 'mellowprints0707@yopmail.com', pass: 'kickurass' };

const doLogin = async (page, creds) => {
  await page.goto(`${TUNNEL}/login`, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  return page.url().includes('dashboard');
};

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().substring(0, 200));
  });
  
  await doLogin(page, BRAND);
  
  // Go to collabs
  await page.goto(`${TUNNEL}/brand-dashboard?tab=collabs`, { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: '/tmp/brand-collabs.png', fullPage: true });
  
  const bodyText = await page.locator('body').textContent();
  console.log('Body length:', bodyText.length);
  console.log('Body preview:', bodyText.substring(0, 300));
  console.log('Errors:', JSON.stringify(errors));
  
  await browser.close();
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

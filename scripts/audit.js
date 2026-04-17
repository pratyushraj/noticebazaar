const { chromium } = require('playwright');
const fs = require('fs');

const TUNNEL = 'https://drilling-retailer-nicholas-seemed.trycloudflare.com';
const CREATOR = { email: 'notice104@yopmail.com', pass: 'kickurass' };
const BRAND = { email: 'mellowprints0707@yopmail.com', pass: 'kickurass' };
const LOG = '/home/node/.openclaw/workspace/memory/audit-log.md';

const log = (msg) => {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG, `[${ts}] ${msg}\n`);
  console.log(`[${ts}] ${msg}`);
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const doLogin = async (page, creds, label) => {
  try {
    await page.goto(`${TUNNEL}/login`, { timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.pass);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    const url = page.url();
    const ok = url.includes('dashboard');
    log(`${label} login: ${ok ? 'OK' : 'FAILED - ' + url}`);
    return ok;
  } catch (e) {
    log(`${label} login ERROR: ${e.message}`);
    return false;
  }
};

(async () => {
  log('=== AUDIT CYCLE START ===');
  
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  // === CREATOR SIDE ===
  log('-- CREATOR AUDIT --');
  const creatorPage = await browser.newPage();
  creatorPage.on('console', msg => {
    if (msg.type() === 'error') log(`CREATOR CONSOLE ERROR: ${msg.text()}`);
  });
  
  if (await doLogin(creatorPage, CREATOR, 'Creator')) {
    // Deals page
    await creatorPage.goto(`${TUNNEL}/creator-dashboard?tab=deals`, { timeout: 20000 });
    await creatorPage.waitForTimeout(3000);
    const dealsContent = await creatorPage.locator('body').textContent();
    log(`Deals page: ${dealsContent.length > 100 ? 'OK' : 'BLANK'}`);
    const qaCount = (dealsContent.match(/QA Brand/g) || []).length;
    log(`QA Brand occurrences: ${qaCount}`);
    
    // Sub-tabs
    for (const tab of ['New Offers', 'Active Deals', 'Completed']) {
      const tabBtn = creatorPage.locator(`button:has-text("${tab}")`);
      if (await tabBtn.count() > 0) {
        await tabBtn.click();
        await creatorPage.waitForTimeout(1500);
        log(`Clicked "${tab}": OK`);
      }
    }
    
    // Account page
    await creatorPage.goto(`${TUNNEL}/creator-dashboard?tab=account`, { timeout: 20000 });
    await creatorPage.waitForTimeout(3000);
    const acctContent = await creatorPage.locator('body').textContent();
    log(`Account page: ${acctContent.includes('Profile') || acctContent.includes('Account') ? 'OK' : 'BLANK'}`);
  }
  await creatorPage.close();

  // === BRAND SIDE ===
  log('-- BRAND AUDIT --');
  const brandPage = await browser.newPage();
  brandPage.on('console', msg => {
    if (msg.type() === 'error') log(`BRAND CONSOLE ERROR: ${msg.text()}`);
  });
  
  if (await doLogin(brandPage, BRAND, 'Brand')) {
    await brandPage.goto(`${TUNNEL}/brand-dashboard?tab=collabs`, { timeout: 20000 });
    await brandPage.waitForTimeout(3000);
    const collabContent = await brandPage.locator('body').textContent();
    log(`Collabs page: ${collabContent.length > 100 ? 'OK' : 'BLANK'}`);
    
    const hasNeedsReview = collabContent.includes('need your review');
    const hasAllCaughtUp = collabContent.includes('All caught up');
    log(`Collabs: need_your_review=${hasNeedsReview}, all_caught_up=${hasAllCaughtUp} ${hasNeedsReview && hasAllCaughtUp ? 'CONTRADICTION' : ''}`);
    
    await brandPage.goto(`${TUNNEL}/brand-dashboard?tab=payments`, { timeout: 20000 });
    await brandPage.waitForTimeout(3000);
    const paymentsContent = await brandPage.locator('body').textContent();
    log(`Payments page: ${paymentsContent.length > 100 ? 'OK (len=' + paymentsContent.length + ')' : 'BLANK/LEN=' + paymentsContent.length}`);
  }
  await brandPage.close();
  
  log('=== AUDIT CYCLE COMPLETE ===\n');
  await browser.close();
  process.exit(0);
})().catch(err => {
  log(`FATAL ERROR: ${err.message}`);
  process.exit(1);
});

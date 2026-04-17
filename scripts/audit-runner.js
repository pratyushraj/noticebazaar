#!/bin/bash
# CreatorArmour Overnight Audit Runner
# Runs every 30 minutes via cron

TUNNEL_URL="${TUNNEL_URL:-https://drilling-retailer-nicholas-seemed.trycloudflare.com}"
CREATOR_EMAIL="notice104@yopmail.com"
CREATOR_PASS="kickurass"
BRAND_EMAIL="mellowprints0707@yopmail.com"
BRAND_PASS="kickurass"
AUDIT_LOG="/home/node/.openclaw/workspace/memory/audit-log.md"
PROJECT_DIR="/home/node/noticebazaar"

echo "=== CreatorArmour Audit Run: $(date) ===" >> "$AUDIT_LOG"

cd "$PROJECT_DIR" || exit 1

node << 'AUDIT_SCRIPT'
const { chromium } = require('playwright');
const fs = require('fs');

const TUNNEL = 'https://drilling-retailer-nicholas-seemed.trycloudflare.com';
const CREATOR = { email: 'notice104@yopmail.com', pass: 'kickurass' };
const BRAND = { email: 'mellowprints0707@yopmail.com', pass: 'kickurass' };
const LOG = '/home/node/.openclaw/workspace/memory/audit-log.md';

const log = (msg) => {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG, `[${ts}] ${msg}\n`);
  console.log(msg);
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const doLogin = async (page, creds, label) => {
  await page.goto(`${TUNNEL}/login`, { timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  const url = page.url();
  log(`${label} login: ${url.includes('dashboard') ? 'OK' : 'FAILED - ' + url}`);
  return url.includes('dashboard');
};

const checkConsole = async (page, label) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(1000);
  if (errors.length > 0) {
    log(`${label} CONSOLE ERRORS: ${errors.join(' | ')}`);
  }
  return errors;
};

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  // === CREATOR SIDE ===
  log('--- CREATOR AUDIT ---');
  const creatorPage = await browser.newPage();
  
  if (await doLogin(creatorPage, CREATOR, 'Creator')) {
    // Nav: Deals
    await creatorPage.goto(`${TUNNEL}/creator-dashboard?tab=deals`, { timeout: 20000 });
    await creatorPage.waitForTimeout(3000);
    const dealsContent = await creatorPage.locator('body').textContent();
    log(`Deals page loads: ${dealsContent.length > 100 ? 'OK' : 'BLANK'}`);
    const qaBrandCount = (dealsContent.match(/QA Brand/g) || []).length;
    log(`QA Brand occurrences: ${qaBrandCount}`);
    
    // Check sub-tabs
    for (const tab of ['New Offers', 'Active Deals', 'Completed']) {
      const tabBtn = creatorPage.locator(`button:has-text("${tab}")`);
      if (await tabBtn.count() > 0) {
        await tabBtn.click();
        await creatorPage.waitForTimeout(1500);
        log(`Clicked "${tab}" tab: OK`);
      }
    }
    
    // Account page
    await creatorPage.goto(`${TUNNEL}/creator-dashboard?tab=account`, { timeout: 20000 });
    await creatorPage.waitForTimeout(3000);
    const acctContent = await creatorPage.locator('body').textContent();
    log(`Account page: ${acctContent.includes('Profile') || acctContent.includes('Account') ? 'OK' : 'BLANK'}`);
  }
  
  await checkConsole(creatorPage, 'Creator');
  await creatorPage.close();

  // === BRAND SIDE ===
  log('--- BRAND AUDIT ---');
  const brandPage = await browser.newPage();
  
  if (await doLogin(brandPage, BRAND, 'Brand')) {
    // Collabs
    await brandPage.goto(`${TUNNEL}/brand-dashboard?tab=collabs`, { timeout: 20000 });
    await brandPage.waitForTimeout(3000);
    const collabContent = await brandPage.locator('body').textContent();
    log(`Collabs page: ${collabContent.length > 100 ? 'OK' : 'BLANK'}`);
    
    // Check for contradiction
    const hasNeedsReview = collabContent.includes('need your review');
    const hasAllCaughtUp = collabContent.includes('All caught up');
    log(`Brand collabs: need_your_review=${hasNeedsReview}, all_caught_up=${hasAllCaughtUp} ${hasNeedsReview && hasAllCaughtUp ? '⚠️ CONTRADICTION' : ''}`);
    
    // Payments tab
    await brandPage.goto(`${TUNNEL}/brand-dashboard?tab=payments`, { timeout: 20000 });
    await brandPage.waitForTimeout(3000);
    const paymentsContent = await brandPage.locator('body').textContent();
    log(`Payments page: ${paymentsContent.length > 100 ? 'OK' : 'BLANK/' + paymentsContent.length}`);
  }
  
  await checkConsole(brandPage, 'Brand');
  await brandPage.close();
  
  log(`--- AUDIT COMPLETE: ${new Date().toISOString()} ---\n`);
  await browser.close();
})().catch(err => {
  log(`AUDIT ERROR: ${err.message}`);
  process.exit(1);
});
AUDIT_SCRIPT
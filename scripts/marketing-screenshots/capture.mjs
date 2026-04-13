/**
 * Marketing Screenshot Capture Script
 * Automatically navigates the Creator Armour web app and captures marketing-ready screenshots
 *
 * Usage:
 *   node scripts/marketing-screenshots/capture.mjs
 *
 * Prerequisites:
 *   - Dev server running: npm run dev (or the baseUrl in config.ts)
 *   - Logged in session cookie (or auth token set in environment)
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { SCREENSHOT_CONFIG } from './config.mjs';

const { baseUrl, outputDir } = SCREENSHOT_CONFIG;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function waitForPageIdle(page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => new Promise(r => requestAnimationFrame(r))).catch(() => {});
}

async function takeScreenshot(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(800); // Let animations settle
  await waitForPageIdle(page);

  const safeName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const dir = resolve(outputDir, viewport.width + 'x' + viewport.height);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${safeName}.png`);

  await page.screenshot({
    path: filePath,
    fullPage: true,
    animations: 'disabled',
  });
  console.log(`  ✅ ${safeName} (${viewport.width}x${viewport.height})`);
  return filePath;
}

async function runScript(page, path, setup) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  if (setup) await setup(page);
  await waitForPageIdle(page);
}

// ─── Screenshot Scenarios ────────────────────────────────────────────────────

async function captureLandingPage(page, viewports) {
  console.log('\n📸 Landing Page...');
  await runScript(page, '/', null);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'landing-hero', vp))
  );
}

async function captureLoginPage(page, viewports) {
  console.log('\n📸 Login Page...');
  await runScript(page, '/login', null);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'auth-login', vp))
  );
}

async function captureCreatorDashboard(page, viewports, authToken) {
  console.log('\n📸 Creator Dashboard...');

  // Inject auth token into localStorage to auto-login
  async function autoLogin(page) {
    await page.evaluate((token) => {
      // Set Supabase auth token in localStorage
      localStorage.setItem('supabase-auth-token', token);
      localStorage.setItem('sb-session', JSON.stringify({
        access_token: token,
        user: { email: 'notice104@yopmail.com' }
      }));
    }, authToken);
  }

  await runScript(page, '/creator-dashboard', autoLogin);
  await page.waitForTimeout(2000);

  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'dashboard-overview', vp))
  );
}

async function capturePendingOffers(page, viewports) {
  console.log('\n📸 Pending Offers (empty state)...');
  await runScript(page, '/creator-dashboard?tab=deals&subtab=pending', null);
  await page.waitForTimeout(1500);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'dashboard-pending-empty', vp))
  );
}

async function captureActiveDeals(page, viewports) {
  console.log('\n📸 Active Deals...');
  await runScript(page, '/creator-dashboard?tab=deals&subtab=active', null);
  await page.waitForTimeout(1500);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'dashboard-active-deals', vp))
  );
}

async function captureEarnings(page, viewports) {
  console.log('\n📸 Earnings / Completed Deals...');
  await runScript(page, '/creator-dashboard?tab=earnings', null);
  await page.waitForTimeout(1500);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'dashboard-earnings', vp))
  );
}

async function captureCollabLink(page, viewports) {
  console.log('\n📸 Collab Link Public Page...');
  await runScript(page, '/b/beyonce', null);
  await page.waitForTimeout(2000);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'collab-link-public', vp))
  );
}

async function captureBrandDiscovery(page, viewports) {
  console.log('\n📸 Brand Discovery...');
  await runScript(page, '/discover', null);
  await page.waitForTimeout(1500);
  return Promise.all(
    viewports.map(vp => takeScreenshot(page, 'brand-discovery', vp))
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runCapture(authToken) {
  console.log('🎬 Creator Armour — Marketing Screenshot Capture');
  console.log('═'.repeat(50));
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Output:   ${outputDir}/\n`);

  mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    locale: 'en-US',
  });
  const page = await context.newPage();

  const marketingVp = [SCREENSHOT_CONFIG.viewports.marketing];
  const socialVp = [SCREENSHOT_CONFIG.viewports.story];
  const mobileVp = [SCREENSHOT_CONFIG.viewports.mobile];
  const slideVp = [SCREENSHOT_CONFIG.viewports.slide];

  const results = {};

  try {
    // Landing & Auth
    await captureLandingPage(page, marketingVp);
    await captureLoginPage(page, [SCREENSHOT_CONFIG.viewports.marketing]);

    // Creator Dashboard states
    if (authToken) {
      await captureCreatorDashboard(page, marketingVp, authToken);
      await capturePendingOffers(page, mobileVp);
      await captureActiveDeals(page, mobileVp);
      await captureEarnings(page, mobileVp);
      await captureCollabLink(page, marketingVp);
    }

    // Brand discovery
    await captureBrandDiscovery(page, marketingVp);

    // Social media formats
    await captureLandingPage(page, socialVp);
    await captureCollabLink(page, socialVp);

    // Presentation slides
    await captureLandingPage(page, slideVp);
    await captureCreatorDashboard(page, slideVp, authToken);

  } catch (err) {
    console.error('\n❌ Capture error:', err.message);
  } finally {
    await browser.close();
    console.log('\n✅ Screenshot capture complete!');
    console.log(`📁 Saved to: ${outputDir}/`);
  }

  return results;
}

// Allow running directly
const authToken = process.argv[2] || '';
runCapture(authToken).catch(console.error);

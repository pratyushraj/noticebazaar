const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const TUNNEL = 'https://structure-fathers-adapted-childhood.trycloudflare.com';;;;
const OLLAMA = 'http://20.197.60.36:11434';
const CREATOR = { email: 'notice104@yopmail.com', pass: 'kickurass' };
const BRAND = { email: 'mellowprints0707@yopmail.com', pass: 'kickurass' };
const LOG = '/home/node/.openclaw/workspace/memory/audit-log.md';
const SCREENSHOTS = '/home/node/.openclaw/workspace/memory/screenshots/';
fs.mkdirSync(SCREENSHOTS, { recursive: true });

const log = (msg) => {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG, `[${ts}] ${msg}\n`);
  console.log(`[${ts}] ${msg}`);
};

const waitStable = async (page, ms = 3500) => {
  await page.waitForTimeout(ms);
};

const doLogin = async (page, creds, label) => {
  try {
    await page.goto(`${TUNNEL}/login`, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 60000 });
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.pass);
    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    await waitStable(page, 3000);
    log(`${label} login: OK → ${page.url()}`);
    return true;
  } catch (e) {
    log(`${label} login FAILED: ${e.message.substring(0, 150)}`);
    return false;
  }
};

const analyzeWithVision = async (screenshotPath, label) => {
  try {
    const imgBase64 = fs.readFileSync(screenshotPath).toString('base64');
    const prompt = 'Indian creator economy app. Find: (1) blank sections (2) duplicate UI elements (3) wrong text/badges (4) spacing issues (5) unreadable content. Reply max 2 sentences.';
    const payload = JSON.stringify({
      model: 'llava:latest',
      prompt: prompt,
      images: [imgBase64],
      stream: false
    });
    const result = await new Promise((resolve, reject) => {
      const req = http.request(`${OLLAMA}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        timeout: 60000
      }, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
      req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.write(payload); req.end();
    });
    const parsed = JSON.parse(result);
    const analysis = (parsed.response || '').trim();
    if (analysis) log(`VISION [${label}]: ${analysis.substring(0, 250)}`);
    return analysis;
  } catch (e) {
    log(`VISION [${label}] ERROR: ${e.message.substring(0, 80)}`);
    return '';
  }
};

const consoleErrors = [];
const captureConsole = (page, label) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text().substring(0, 150);
      if (!consoleErrors.find(e => e.txt === txt)) {
        consoleErrors.push({ label, txt });
        log(`CONSOLE ERROR [${label}]: ${txt}`);
      }
    }
  });
  page.on('pageerror', err => {
    const txt = err.message.substring(0, 150);
    if (!consoleErrors.find(e => e.txt === txt)) {
      consoleErrors.push({ label, txt });
      log(`PAGE ERROR [${label}]: ${txt}`);
    }
  });
};

const auditPage = async (browser, url, label, waitMs = 4000) => {
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  captureConsole(page, label);
  try {
    await page.goto(`${TUNNEL}${url}`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await waitStable(page, waitMs);
    const ssPath = `${SCREENSHOTS}${label.replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: ssPath, fullPage: true });
    const bodyText = await page.locator('body').textContent();
    const status = bodyText.length > 80 ? `OK (${bodyText.length} chars)` : `BLANK (${bodyText.length} chars)`;
    log(`PAGE [${label}]: ${status}`);
    await analyzeWithVision(ssPath, label);
    await page.close();
    return { bodyText, ssPath };
  } catch (e) {
    log(`PAGE [${label}] FAILED: ${e.message.substring(0, 100)}`);
    await page.close().catch(() => {});
    return null;
  }
};

// === CREATOR ===
const creatorAudit = async (browser) => {
  log('== CREATOR AUDIT ==');
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  captureConsole(page, 'Creator');
  if (!await doLogin(page, CREATOR, 'Creator')) { await page.close(); return; }

  const r1 = await auditPage(browser, '/creator-dashboard?tab=deals', 'creator-deals');

  // Check QA Brand count
  if (r1 && r1.bodyText) {
    const qaCount = (r1.bodyText.match(/QA Brand/g) || []).length;
    log(`QA Brand occurrences: ${qaCount} ${qaCount > 3 ? '⚠️ (possible duplication)' : ''}`);
  }

  // Tab sub-navigation
  for (const sub of ['New Offers', 'Active Deals', 'Completed']) {
    try {
      const btn = page.locator(`button:has-text("${sub}")`).first();
      if (await btn.count() > 0) {
        await btn.click();
        await waitStable(page, 2000);
        log(`CREATOR subTab "${sub}": OK`);
      }
    } catch (e) { log(`CREATOR subTab "${sub}" FAILED`); }
  }

  await auditPage(browser, '/creator-dashboard?tab=account', 'creator-account');
  await auditPage(browser, '/creator-dashboard?tab=profile', 'creator-profile');
  await page.close().catch(() => {});
};

// === BRAND ===
const brandAudit = async (browser) => {
  log('== BRAND AUDIT ==');
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  captureConsole(page, 'Brand');
  if (!await doLogin(page, BRAND, 'Brand')) { await page.close().catch(() => {}); return; }

  await auditPage(browser, '/brand-dashboard?tab=dashboard', 'brand-dashboard');
  await auditPage(browser, '/brand-dashboard?tab=collabs', 'brand-collabs');

  // Collabs sub-tabs
  for (const sub of ['Action Required', 'Active', 'Completed']) {
    try {
      const btn = page.locator(`button:has-text("${sub}")`).first();
      if (await btn.count() > 0) {
        await btn.click();
        await waitStable(page, 2000);
        log(`BRAND Collabs subTab "${sub}": OK`);
      }
    } catch (e) { log(`BRAND Collabs subTab "${sub}" FAILED`); }
  }

  await auditPage(browser, '/brand-dashboard?tab=payments', 'brand-payments');
  await auditPage(browser, '/brand-dashboard?tab=account', 'brand-account');
  await page.close().catch(() => {});
};

// === API ===
const apiAudit = () => {
  log('== API AUDIT ==');
  const endpoints = [
    ['health', 'https://creatorarmour-api.onrender.com/health'],
    ['api-root', 'https://creatorarmour-api.onrender.com/api/'],
  ];
  for (const [name, url] of endpoints) {
    try {
      const code = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}" --max-time 10`, { timeout: 15000 }).toString().trim();
      log(`API [${name}]: HTTP ${code}`);
    } catch { log(`API [${name}]: TIMEOUT/ERROR`); }
  }
};

// === MAIN ===
(async () => {
  log('========================================');
  log(' OVERNIGHT AUDIT CYCLE START');
  log('========================================');
  consoleErrors.length = 0;

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-web-security']
    });
    await creatorAudit(browser);
    await brandAudit(browser);
  } catch (e) {
    log(`BROWSER ERROR: ${e.message.substring(0, 100)}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  apiAudit();

  log('========================================');
  log(` ERRORS: ${consoleErrors.length}`);
  consoleErrors.forEach(e => log(`  - [${e.label}] ${e.txt}`));
  log(' CYCLE COMPLETE');
  log('========================================\n');
  process.exit(0);
})().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });

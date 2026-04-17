import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const EMAIL = process.env.LOGIN_EMAIL || 'notice104@yopmail.com';
const PASSWORD = process.env.LOGIN_PASSWORD || 'kickurass';

function isoStamp() {
  return new Date().toISOString().replaceAll(':', '').replaceAll('.', '').replace('T', '_').replace('Z', 'Z');
}

function redact(value) {
  if (!value) return value;
  return String(value)
    .replaceAll(EMAIL, '[REDACTED_EMAIL]')
    .replaceAll(PASSWORD, '[REDACTED_PASSWORD]');
}

async function collectDomSignals(page) {
  return await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;

    const hasHorizontalOverflow =
      Math.max(docEl?.scrollWidth || 0, body?.scrollWidth || 0) >
      Math.max(docEl?.clientWidth || 0, body?.clientWidth || 0) + 2;

    const brokenImages = Array.from(document.images || [])
      .filter((img) => img.complete && img.naturalWidth === 0)
      .slice(0, 20)
      .map((img) => ({
        src: img.currentSrc || img.src || '',
        alt: img.alt || '',
      }));

    // Spot elements causing overflow (best-effort; capped).
    const overflowElements = [];
    if (hasHorizontalOverflow) {
      const viewportWidth = docEl?.clientWidth || window.innerWidth || 0;
      const candidates = Array.from(document.querySelectorAll('body *')).slice(0, 2000);
      for (const el of candidates) {
        const rect = el.getBoundingClientRect?.();
        if (!rect) continue;
        if (rect.right > viewportWidth + 2) {
          const tag = el.tagName?.toLowerCase?.() || 'unknown';
          const id = el.id ? `#${el.id}` : '';
          const cls = typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : '';
          overflowElements.push({
            selector: `${tag}${id}${cls}`,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
          if (overflowElements.length >= 20) break;
        }
      }
    }

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hasHorizontalOverflow,
      brokenImages,
      overflowElements,
    };
  });
}

async function main() {
  const outDir = path.join(process.cwd(), 'reports', `ui-audit-${isoStamp()}`);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const audit = {
    baseUrl: BASE_URL,
    outDir,
    runs: [],
  };

  async function runVariant(name, viewport) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    const consoleEvents = [];
    const pageErrors = [];
    const requestFailures = [];
    const abortedRequests = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        consoleEvents.push({
          type,
          text: redact(msg.text()),
          location: msg.location(),
        });
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(redact(err?.stack || err?.message || String(err)));
    });

    page.on('requestfailed', (req) => {
      const failure = req.failure();
      const errorText = redact(failure?.errorText || 'unknown');
      const item = { url: redact(req.url()), method: req.method(), errorText };
      // Playwright marks in-flight fetches as aborted when we navigate away;
      // keep them separate so they don't look like real production failures.
      if (errorText === 'net::ERR_ABORTED') abortedRequests.push(item);
      else requestFailures.push(item);
    });

    const routes = [
      { label: 'login', url: new URL('/login', BASE_URL).toString(), screenshot: `01-${name}-login.png` },
      { label: 'creator-dashboard', url: new URL('/creator-dashboard', BASE_URL).toString(), screenshot: `02-${name}-creator-dashboard.png` },
      { label: 'creator-profile', url: new URL('/creator-profile', BASE_URL).toString(), screenshot: `03-${name}-creator-profile.png` },
    ];

    // Login
    await page.goto(routes[0].url, { waitUntil: 'domcontentloaded' });
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await Promise.allSettled([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    const pageSnapshots = [];

    for (const route of routes) {
      await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const domSignals = await collectDomSignals(page);
      const screenshotPath = path.join(outDir, route.screenshot);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      pageSnapshots.push({
        label: route.label,
        url: route.url,
        finalUrl: page.url(),
        screenshot: screenshotPath,
        domSignals,
      });
    }

    await context.close();

    audit.runs.push({
      name,
      viewport,
      counts: {
        console: consoleEvents.length,
        pageErrors: pageErrors.length,
        requestFailures: requestFailures.length,
        abortedRequests: abortedRequests.length,
      },
      console: consoleEvents,
      pageErrors,
      requestFailures,
      abortedRequests,
      pages: pageSnapshots,
    });
  }

  await runVariant('mobile', { width: 390, height: 844 });
  await runVariant('desktop', { width: 1440, height: 900 });

  await browser.close();

  const auditPath = path.join(outDir, 'audit.json');
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
  process.stdout.write(JSON.stringify({ outDir, auditPath }, null, 2) + '\n');
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n');
  process.exit(1);
});

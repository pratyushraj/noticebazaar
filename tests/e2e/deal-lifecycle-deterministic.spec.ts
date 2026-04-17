import { test, expect, Page } from '@playwright/test';

const FALLBACK_BASE_URLS = ['http://localhost:8080', 'http://localhost:5173'];
let RESOLVED_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || '';

async function gotoWithFallback(page: Page, path: string) {
  const candidates = RESOLVED_BASE_URL
    ? [RESOLVED_BASE_URL]
    : FALLBACK_BASE_URLS;

  let lastErr: any = null;
  for (const base of candidates) {
    try {
      await page.goto(`${base}${path}`, { waitUntil: 'load' });
      RESOLVED_BASE_URL = base;
      return;
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr;
}

const CREATOR = {
  email: 'notice104@yopmail.com',
  password: 'kickurass',
};

const BRAND = {
  email: 'mellowprints0707@yopmail.com',
  password: 'kickurass',
};

type ApiSnapshot = {
  dealsMine?: any;
  collabRequests?: any;
  urls: string[];
};

async function login(page: Page, email: string, password: string) {
  await gotoWithFallback(page, '/login');
  await page.setViewportSize({ width: 390, height: 844 });

  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill(email);
  await passInput.fill(password);
  await submitButton.click();

  await page.waitForURL(/creator-dashboard|dashboard|brand-dashboard|advisor-dashboard/i, { timeout: 30000 });
}

function attachApiRecorder(page: Page) {
  const snap: ApiSnapshot = { urls: [] };

  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('/api/')) return;
    if (!/\/api\/deals\/mine|\/api\/collab-requests/i.test(url)) return;
    snap.urls.push(url);
    try {
      const ct = resp.headers()['content-type'] || '';
      if (!ct.includes('application/json')) return;
      const json = await resp.json();
      if (url.includes('/api/deals/mine')) snap.dealsMine = json;
      if (url.includes('/api/collab-requests')) snap.collabRequests = json;
    } catch {
      // ignore json parse issues
    }
  });

  return snap;
}

function normalizeList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.collabRequests)) return payload.collabRequests;
  if (Array.isArray(payload?.deals)) return payload.deals;
  return [];
}

function extractAmount(item: any): number | null {
  const raw =
    item?.amount ??
    item?.budget ??
    item?.offer_budget ??
    item?.deal_value ??
    item?.deal_amount ??
    item?.creator_payout ??
    item?.payout_amount ??
    item?.reel_price ??
    item?.post_price ??
    item?.story_price ??
    item?.total_amount ??
    item?.raw?.amount ??
    item?.raw?.budget ??
    item?.raw?.offer_budget ??
    item?.raw?.deal_value ??
    item?.raw?.deal_amount ??
    item?.raw?.creator_payout ??
    item?.raw?.payout_amount ??
    item?.raw?.reel_price;
  if (raw === undefined || raw === null) return null;
  const num = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function extractBrandName(item: any): string {
  return (
    item?.brand_name ||
    item?.brand?.name ||
    item?.brandName ||
    item?.raw?.brand_name ||
    item?.raw?.brand?.name ||
    ''
  );
}

function extractId(item: any): string {
  return String(item?.id || item?.deal_id || item?.request_id || item?.raw?.id || '').trim();
}

function assertNoInvalidRecords(kind: string, list: any[]) {
  for (const item of list) {
    const id = extractId(item);
    expect(id, `${kind}: missing id`).toBeTruthy();
    expect(extractBrandName(item), `${kind}(${id}): missing brand`).toBeTruthy();
    const amount = extractAmount(item);
    expect(amount, `${kind}(${id}): missing/invalid amount`).not.toBeNull();
    expect(amount!, `${kind}(${id}): amount must be > 0`).toBeGreaterThan(0);
  }
}

function assertDedup(kind: string, list: any[]) {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const item of list) {
    const key = `${extractBrandName(item).toLowerCase()}::${extractAmount(item) ?? 'na'}::${extractId(item)}`;
    if (seen.has(key)) dupes.push(key);
    seen.add(key);
  }
  expect(dupes, `${kind}: duplicate keys found: ${dupes.join(', ')}`).toEqual([]);
}

async function waitForDashboardIdle(page: Page) {
  // "networkidle" is best-effort; also wait for API payloads to land.
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function gotoCreatorDeals(page: Page) {
  await gotoWithFallback(page, '/creator-dashboard');
  await waitForDashboardIdle(page);

  // If dashboard uses bottom nav, try to click "Deals" tab.
  const dealsNav = page.getByRole('button', { name: /^deals$/i }).first();
  if (await dealsNav.isVisible({ timeout: 1500 }).catch(() => false)) {
    await dealsNav.click();
  } else {
    const dealsText = page.getByText(/^Deals$/i).first();
    if (await dealsText.isVisible({ timeout: 1500 }).catch(() => false)) await dealsText.click();
  }

  await page.waitForTimeout(300);
}

async function screenshotTab(page: Page, label: string) {
  await page.screenshot({ path: `test-results/deal-lifecycle/${label}.png`, fullPage: true });
}

async function selectDealsSubtab(page: Page, name: 'New Offers' | 'Active Deals' | 'Completed') {
  // Support both "NEW OFFERS" and "New Offers" casing.
  const candidates = [
    new RegExp(`^${name.replace(' ', '\\s+')}$`, 'i'),
    new RegExp(`^${name.toUpperCase().replace(' ', '\\s+')}$`),
  ];

  for (const re of candidates) {
    const tab = page.getByRole('button', { name: re }).first();
    if (await tab.isVisible({ timeout: 1200 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(350);
      return;
    }
  }
}

async function openFirstOfferFromNewOffers(page: Page) {
  await selectDealsSubtab(page, 'New Offers');

  // Prefer clicking the card body rather than directly clicking accept.
  const rupee = page.locator('text=/₹\\s?[0-9][0-9,]*/').first();
  if (await rupee.isVisible({ timeout: 8000 }).catch(() => false)) {
    await rupee.click();
    return;
  }

  // Fallback: click first card-ish container.
  const firstCard = page.locator('article, [role="article"], .rounded-2xl, .rounded-3xl').first();
  await firstCard.click({ timeout: 8000 });
}

async function acceptInOfferBrief(page: Page) {
  await expect(page.getByText('Offer Brief', { exact: true })).toBeVisible({ timeout: 15000 });
  await screenshotTab(page, 'offer-brief');

  const brandSubtitle = page.locator('p').filter({ hasText: /brand/i }).first();
  await expect(page.locator('text=/₹\\s?[0-9][0-9,]*/').first()).toBeVisible();

  const accept = page.locator('[data-testid="offer-brief-accept"]').first();
  await expect(accept).toBeVisible({ timeout: 15000 });

  // Root-cause guard: ensure the button is topmost at its click point.
  await accept.scrollIntoViewIfNeeded();
  const box = await accept.boundingBox();
  expect(box, 'Accept button bounding box').not.toBeNull();
  const cx = Math.floor((box!.x + box!.width / 2) * 100) / 100;
  const cy = Math.floor((box!.y + box!.height / 2) * 100) / 100;
  const hit = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      tag: el.tagName,
      id: el.id || null,
      classes: el.className || null,
      pointerEvents: cs.pointerEvents,
      zIndex: cs.zIndex,
      text: (el.innerText || '').slice(0, 80),
    };
  }, { x: cx, y: cy });

  const acceptStyle = await page.evaluate(({ x, y }) => {
    const btn = document.querySelector('[data-testid="offer-brief-accept"]') as HTMLElement | null;
    if (!btn) return null;
    const cs = window.getComputedStyle(btn);
    return { pointerEvents: cs.pointerEvents, zIndex: cs.zIndex, position: cs.position, display: cs.display };
  }, { x: cx, y: cy }).catch(() => null);

  // If something else is topmost, fail with a clear reason (don’t use force unless UI is fixed).
  const isButtonTopmost = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    const btn = document.querySelector('[data-testid="offer-brief-accept"]') as HTMLElement | null;
    return !!el && !!btn && (el === btn || (btn as any).contains(el));
  }, { x: cx, y: cy }).catch(() => false);

  expect(
    isButtonTopmost,
    `Click intercepted at (${cx},${cy}) by ${hit ? JSON.stringify(hit) : 'null'}; acceptStyle=${acceptStyle ? JSON.stringify(acceptStyle) : 'null'}`
  ).toBeTruthy();

  await accept.click({ timeout: 10_000 });

  // Allow any modal/redirect to settle.
  await page.waitForTimeout(1200);

  // If it navigates away, try to go back to dashboard.
  if (!/creator-dashboard/i.test(page.url())) {
    await gotoWithFallback(page, '/creator-dashboard?tab=deals');
  }

  await waitForDashboardIdle(page);
}

test.describe('Deterministic Deal Lifecycle (UI + API)', () => {
  test('creator lifecycle: screenshot tabs, accept + decline + refresh consistency (5 runs)', async ({ page }) => {
    test.setTimeout(8 * 60 * 1000);

    const api = attachApiRecorder(page);

    // Capture JS errors
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page, CREATOR.email, CREATOR.password);

    // 1) Dashboard load + Deals tab + screenshots
    await gotoCreatorDeals(page);
    await selectDealsSubtab(page, 'New Offers');
    await screenshotTab(page, 'tab-new-offers');
    await selectDealsSubtab(page, 'Active Deals');
    await screenshotTab(page, 'tab-active-deals');
    await selectDealsSubtab(page, 'Completed');
    await screenshotTab(page, 'tab-completed');

    // API validations (initial load)
    const mineDeals = normalizeList(api.dealsMine);
    const collab = normalizeList(api.collabRequests);
    assertNoInvalidRecords('deals/mine', mineDeals);
    assertNoInvalidRecords('collab-requests', collab);
    assertDedup('deals/mine', mineDeals);
    assertDedup('collab-requests', collab);

    // 2) New offer: open + accept, verify API changes (best-effort).
    await gotoCreatorDeals(page);
    await openFirstOfferFromNewOffers(page);
    await acceptInOfferBrief(page);

    // 4) Decline flow: go back to New Offers and attempt decline from brief.
    await gotoCreatorDeals(page);
    await selectDealsSubtab(page, 'New Offers');
    // Try open another offer
    await openFirstOfferFromNewOffers(page);
    await expect(page.getByText('Offer Brief', { exact: true })).toBeVisible({ timeout: 15000 });
    await screenshotTab(page, 'offer-brief-decline');

    const decline = page.getByRole('button', { name: /decline offer/i }).first();
    if (await decline.isVisible({ timeout: 2000 }).catch(() => false)) {
      await decline.click();
      await page.waitForTimeout(1200);
    }
    // Return to dashboard after decline.
    await gotoWithFallback(page, '/creator-dashboard?tab=deals');
    await waitForDashboardIdle(page);

    // 5) Refresh consistency: refresh 3 times, then repeat entire check 5 runs.
    for (let run = 1; run <= 5; run++) {
      for (let r = 1; r <= 3; r++) {
        await page.reload({ waitUntil: 'load' });
        await waitForDashboardIdle(page);
      }

      // Re-capture API (the recorder holds last payload).
      const dealsRun = normalizeList(api.dealsMine);
      const collabRun = normalizeList(api.collabRequests);
      assertNoInvalidRecords(`run${run}:deals/mine`, dealsRun);
      assertNoInvalidRecords(`run${run}:collab-requests`, collabRun);
      assertDedup(`run${run}:deals/mine`, dealsRun);
      assertDedup(`run${run}:collab-requests`, collabRun);

      await screenshotTab(page, `run-${run}-dashboard`);
    }

    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(api.urls.length, 'expected at least one /api/(deals/mine|collab-requests) response').toBeGreaterThan(0);
  });

  test('slow network: API delay injection should not create duplicates', async ({ browser }) => {
    test.setTimeout(4 * 60 * 1000);

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const api = attachApiRecorder(page);

    await page.route(/\/api\/(deals\/mine|collab-requests)/i, async (route) => {
      // Simulate slow 3G-ish delay.
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });

    await login(page, CREATOR.email, CREATOR.password);
    await gotoCreatorDeals(page);
    await page.waitForTimeout(1500);

    const deals = normalizeList(api.dealsMine);
    const collab = normalizeList(api.collabRequests);
    assertDedup('slow:deals/mine', deals);
    assertDedup('slow:collab-requests', collab);

    await page.screenshot({ path: 'test-results/deal-lifecycle/slow-network-dashboard.png', fullPage: true });
    await context.close();
  });
});

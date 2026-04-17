import { test, expect, Page } from '@playwright/test';

const FALLBACK_BASE_URLS = ['http://localhost:8080', 'http://localhost:5173'];
let RESOLVED_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || '';

async function gotoWithFallback(page: Page, path: string) {
  const candidates = RESOLVED_BASE_URL ? [RESOLVED_BASE_URL] : FALLBACK_BASE_URLS;
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

async function login(page: Page) {
  await gotoWithFallback(page, '/login');
  await page.setViewportSize({ width: 390, height: 844 });

  await page.locator('input[type="email"]').first().fill(CREATOR.email);
  await page.locator('input[type="password"]').first().fill(CREATOR.password);
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL(/creator-dashboard|dashboard|brand-dashboard|advisor-dashboard/i, { timeout: 30000 });
}

async function gotoDealsTab(page: Page) {
  await gotoWithFallback(page, '/creator-dashboard?tab=deals');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  // Ensure "Deals" view is active (bottom nav).
  const dealsNav = page.getByRole('button', { name: /^deals$/i }).first();
  if (await dealsNav.isVisible({ timeout: 1500 }).catch(() => false)) {
    await dealsNav.click();
  }
  await page.waitForTimeout(250);
}

async function selectDealsSubtab(page: Page, name: 'New Offers' | 'Active Deals' | 'Completed') {
  const tab = page.getByRole('button', { name: new RegExp(`^${name.replace(' ', '\\s+')}$`, 'i') }).first();
  await tab.click({ timeout: 10000 });
  await page.waitForTimeout(350);
}

test.describe('Data Consistency (Delay / Partial Failure / Mismatch)', () => {
  test('delay API: slow deals should not create ghost duplicates', async ({ page }) => {
    test.setTimeout(2 * 60 * 1000);

    // Mock: collab requests returns fast, deals returns slow.
    await page.route(/\/api\/collab-requests(\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          requests: [
            {
              id: 'req_delay_1',
              brand_name: 'Delay Brand',
              collab_type: 'paid',
              exact_budget: 15000,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route(/\/api\/deals\/mine(\?.*)?$/i, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          deals: [
            {
              id: 'deal_delay_1',
              brand_name: 'Some Active Deal',
              deal_amount: 22000,
              status: 'Active',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await login(page);
    await gotoDealsTab(page);

    // After both endpoints resolve, ensure the mocked offer appears exactly once in New Offers.
    await selectDealsSubtab(page, 'New Offers');
    await expect(page.getByText('Delay Brand')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Delay Brand').count()).resolves.toBe(1);

    // And it should not appear in Active/Completed.
    await selectDealsSubtab(page, 'Active Deals');
    await expect(page.getByText('Delay Brand')).toHaveCount(0);
    await selectDealsSubtab(page, 'Completed');
    await expect(page.getByText('Delay Brand')).toHaveCount(0);
  });

  test('partial failure: deals 500 should show error banner (not empty state)', async ({ page }) => {
    test.setTimeout(2 * 60 * 1000);

    await page.route(/\/api\/collab-requests(\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          requests: [],
        }),
      });
    });

    await page.route(/\/api\/deals\/mine(\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'server_error' }),
      });
    });

    await login(page);
    await gotoWithFallback(page, '/creator-dashboard');

    // Banner lives in the header area.
    await expect(page.getByText('Data failed to load')).toBeVisible({ timeout: 20000 });
    // Should offer retry CTA.
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('mismatched responses: offer converted to deal should not appear in New Offers', async ({ page }) => {
    test.setTimeout(2 * 60 * 1000);

    // The offer is pending but the deal indicates it was created from that request.
    const requestId = 'req_mismatch_1';

    await page.route(/\/api\/collab-requests(\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          requests: [
            {
              id: requestId,
              brand_name: 'Mismatch Brand',
              collab_type: 'paid',
              exact_budget: 15000,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route(/\/api\/deals\/mine(\?.*)?$/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          deals: [
            {
              id: 'deal_mismatch_1',
              collab_request_id: requestId,
              brand_name: 'Mismatch Brand',
              collab_type: 'paid',
              deal_amount: 15000,
              status: 'Active',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await login(page);
    await gotoDealsTab(page);

    await selectDealsSubtab(page, 'New Offers');
    await expect(page.getByText('Mismatch Brand')).toHaveCount(0);

    await selectDealsSubtab(page, 'Active Deals');
    await expect(page.getByText('Mismatch Brand')).toBeVisible();
  });
});


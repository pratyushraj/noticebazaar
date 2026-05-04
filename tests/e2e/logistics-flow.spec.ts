import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';

const CREATOR = {
  email: 'notice104@yopmail.com',
  password: 'kickurass',
};

const BRAND = {
  email: 'mellowprints0707@yopmail.com',
  password: 'kickurass',
};

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.setViewportSize({ width: 390, height: 844 });

  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill(email);
  await passInput.fill(password);
  await submitButton.click();

  await page.waitForURL(/creator-dashboard|dashboard|brand-dashboard/i, { timeout: 30000 });
}

async function extractCreatorHandle(page: Page): Promise<string> {
  const linkText = page.locator('text=/creatorarmour\\.com\\/[a-z0-9._-]+/i').first();
  if (await linkText.isVisible({ timeout: 10000 }).catch(() => false)) {
    const raw = (await linkText.innerText()).trim();
    const match = raw.match(/creatorarmour\.com\/([a-z0-9._-]+)/i);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return 'notice104'; // Fallback
}

test.describe('Logistics Flow E2E', () => {
  test('hybrid deal: from offer to logistics tracking', async ({ page, browser }) => {
    test.setTimeout(5 * 60 * 1000);

    // 1. Seed Hybrid Offer
    await login(page, CREATOR.email, CREATOR.password);
    const handle = await extractCreatorHandle(page);
    
    const brandCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const brandPage = await brandCtx.newPage();
    await brandPage.goto(`${BASE_URL}/${handle}`);

    // Fill form
    await brandPage.locator('#brand-name-input').fill(`QA Logistics Brand ${Date.now().toString().slice(-4)}`);
    await brandPage.locator('#brand-email-input').fill(BRAND.email);
    
    // Toggle "Yes" for shipping
    const shippingYes = brandPage.getByRole('button', { name: /yes/i }).first();
    await shippingYes.click();
    
    await brandPage.locator('#barter-product-name-input').fill('Premium QA Test Product');
    await brandPage.locator('#campaign-description-input').fill('Logistics flow E2E test brief.');
    
    const budgetInput = brandPage.locator('#offer-budget-input');
    if (await budgetInput.isVisible()) await budgetInput.fill('15000');

    await brandPage.getByRole('button', { name: /send offer/i }).last().click();
    await brandPage.waitForURL(new RegExp(`/${handle}/success`), { timeout: 30000 });
    await brandCtx.close();

    // 2. Creator Accepts Offer
    await page.goto(`${BASE_URL}/creator-dashboard?tab=deals`);
    // Select New Offers tab
    const newOffersTab = page.getByRole('button', { name: /new offers/i }).first();
    await newOffersTab.click();
    
    // Open the offer
    const firstOffer = page.locator('text=/Premium QA Test Product/i').first();
    await firstOffer.click();
    
    // Accept
    const acceptBtn = page.locator('[data-testid="offer-brief-accept"]').first();
    await acceptBtn.click();
    await page.waitForTimeout(2000);

    // Verify Timeline Step 3 is "Logistics" (index 2)
    const timeline = page.locator('text=/logistics/i').first();
    await expect(timeline).toBeVisible();

    // 3. Brand Provides Tracking
    const brandSessionPage = await browser.newPage();
    await login(brandSessionPage, BRAND.email, BRAND.password);
    
    // Go to the deal (should be in Active Deals)
    await brandSessionPage.goto(`${BASE_URL}/brand-dashboard`);
    const dealCard = brandSessionPage.locator('text=/Premium QA Test Product/i').first();
    await dealCard.click();
    
    // Verify "Logistics" step in timeline
    await expect(brandSessionPage.locator('text=/logistics/i').first()).toBeVisible();
    
    // Add Tracking
    const addTrackingBtn = brandSessionPage.getByRole('button', { name: /add tracking/i }).first();
    await addTrackingBtn.click();
    
    await brandSessionPage.locator('input[placeholder*="Delhivery"]').fill('FastQA Courier');
    await brandSessionPage.locator('input[placeholder*="tracking number"]').fill('QA-TRACK-123456');
    await brandSessionPage.getByRole('button', { name: /save tracking/i }).click();
    
    // Verify tracking info displayed
    await expect(brandSessionPage.locator('text=/QA-TRACK-123456/i')).toBeVisible();

    // 4. Creator Final Verification
    await page.reload();
    await page.locator('text=/Premium QA Test Product/i').first().click();
    await expect(page.locator('text=/logistics/i').first()).toBeVisible();
    await expect(page.locator('text=/QA-TRACK-123456/i')).toBeVisible();
  });
});

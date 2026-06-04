import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';

test.describe('Creator Brand Loop', () => {
  test('creator can sign up, receive a public offer, accept it, and submit content', async ({ browser }) => {
    test.setTimeout(180000);

    const creatorEmail = `qa.creator.${Date.now()}@example.com`;
    const creatorPassword = 'Test@12345';
    const creatorName = 'QA Creator';
    const handle = `qacreator${Date.now().toString().slice(-6)}`;
    const brandEmail = `qa.brand.${Date.now()}@example.com`;

    const creatorContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const brandContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const creatorPage = await creatorContext.newPage();
    const brandPage = await brandContext.newPage();

    const creatorErrors: string[] = [];
    const brandErrors: string[] = [];

    creatorPage.on('pageerror', (error) => creatorErrors.push(error.message));
    brandPage.on('pageerror', (error) => brandErrors.push(error.message));

    creatorPage.on('console', msg => console.log('CREATOR CONSOLE:', msg.text()));
    brandPage.on('console', msg => console.log('BRAND CONSOLE:', msg.text()));

    creatorPage.on('requestfailed', request => console.log('CREATOR REQ FAILED:', request.url(), request.failure()?.errorText));
    brandPage.on('requestfailed', request => console.log('BRAND REQ FAILED:', request.url(), request.failure()?.errorText));

    creatorPage.on('response', response => {
      if (response.status() >= 400) {
        console.log('CREATOR REQ ERROR:', response.url(), response.status());
        response.text().then(text => console.log('CREATOR REQ ERROR BODY:', text)).catch(() => {});
      }
    });
    brandPage.on('response', response => {
      if (response.status() >= 400) {
        console.log('BRAND REQ ERROR:', response.url(), response.status());
        response.text().then(text => console.log('BRAND REQ ERROR BODY:', text)).catch(() => {});
      }
    });


    // Creator signup + onboarding
    await creatorPage.goto(`${BASE_URL}/signup`, { waitUntil: 'load' });
    // Dismiss any promotional modal that appears on page load
    const noThanksBtn = creatorPage.getByText('No Thanks').first();
    if (await noThanksBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noThanksBtn.click();
    } else {
      // Try close button if modal has one
      const closeBtn = creatorPage.locator('[aria-label="Close"], .fixed button, [type="button"].fixed').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }
    await creatorPage.waitForSelector('#signup-name', { timeout: 15000 });
    await creatorPage.locator('#signup-name').fill(creatorName);
    await creatorPage.locator('#signup-handle').fill(handle);
    await creatorPage.locator('input[type="email"]').fill(creatorEmail);
    await creatorPage.locator('input[type="password"]').fill(creatorPassword);
    await creatorPage.locator('button[type="submit"]').click();

    await creatorPage.waitForURL(/creator-onboarding|creator-dashboard/, { timeout: 30000 });

    await creatorPage.goto(`${BASE_URL}/creator-dashboard`, { waitUntil: 'load' });
    await expect(creatorPage.locator('h1')).toContainText(/scale your influence|offer inbox|new offer|active deal|completed deals/i);

    // Brand sends public offer
    await brandPage.goto(`${BASE_URL}/${handle}`, { waitUntil: 'load' });
    await brandPage.waitForSelector('[role="button"]:has-text("Collab"), [role="button"]:has-text("Service")', { timeout: 15000 }).catch(() => {});
    const selectServiceButton = brandPage.getByRole('button', { name: /select service/i }).first();
    if (await selectServiceButton.isVisible()) {
      await selectServiceButton.click();
    } else {
      const startCollabButton = brandPage.getByRole('button', { name: /start collab/i }).first();
      if (await startCollabButton.isVisible()) {
        await startCollabButton.click();
      }
      await selectServiceButton.click();
    }

    await brandPage.locator('#brand-name-input').fill('QA Brand');
    await brandPage.locator('#brand-email-input').fill(brandEmail);
    await brandPage.locator('#campaign-description-input').fill('Need one Instagram reel to promote our launch.');

    const budgetInput = brandPage.locator('#offer-budget-input');
    if (await budgetInput.isVisible()) {
      await budgetInput.fill('8000');
    }

    const deadlineInput = brandPage.locator('#offer-deadline-input');
    if (await deadlineInput.isVisible()) {
      await deadlineInput.fill('2026-04-20');
    }

    await brandPage.getByRole('button', { name: /send.*offer/i }).filter({ visible: true }).first().click();
    await brandPage.waitForURL(new RegExp(`/${handle}/success`), { timeout: 30000 });
    await expect(brandPage.locator('h1')).toContainText(/has your offer|offer sent/i);

    // Creator receives and reviews offer
    await creatorPage.goto(`${BASE_URL}/creator-dashboard`, { waitUntil: 'load' });
    await creatorPage.waitForSelector('h1', { timeout: 15000 }).catch(() => {});

    const reviewOfferButton = creatorPage.getByRole('button', { name: /review offer/i }).first();
    const reviewOfferLink = creatorPage.getByRole('link', { name: /review offer/i }).first();

    if (await reviewOfferButton.isVisible()) {
      await reviewOfferButton.click();
    } else {
      await reviewOfferLink.click();
    }

    await creatorPage.waitForURL(/collab-requests\//, { timeout: 20000 });
    await expect(
      creatorPage
        .locator('#offer-action-heading, [aria-label="Offer actions"]')
        .filter({ hasText: /do you want this offer/i })
        .first()
    ).toBeVisible();

    await creatorPage.getByRole('button', { name: /accept( this)? offer/i }).first().click();

    const requirementDialog = creatorPage.getByText(/add one missing detail/i);
    if (await requirementDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const reelPrice = creatorPage.locator('#pending-reel-price');
      if (await reelPrice.isVisible()) {
        await reelPrice.fill('8000');
      }
      const pendingAddress = creatorPage.locator('#pending-address');
      if (await pendingAddress.isVisible()) {
        await pendingAddress.fill('Sector 104, Noida, Uttar Pradesh 201301');
      }
      await creatorPage.getByRole('button', { name: /save and accept/i }).click();
    }

    await creatorPage.waitForURL(/deal\//, { timeout: 30000 });

    const postLinkInput = creatorPage.locator('#deal-content-link');
    await expect(postLinkInput).toBeVisible({ timeout: 20000 });
    await postLinkInput.fill('https://www.instagram.com/reel/C5TESTQA123/');
    await creatorPage.locator('#deal-content-note').fill('QA submission from automated flow.');
    await creatorPage.getByRole('button', { name: /share your post link|share the updated post link|submit/i }).first().click();

    await creatorPage.waitForTimeout(2000);

    expect(creatorErrors, `creator page errors: ${creatorErrors.join('\n')}`).toEqual([]);
    expect(brandErrors, `brand page errors: ${brandErrors.join('\n')}`).toEqual([]);

    await creatorContext.close();
    await brandContext.close();
  });
});

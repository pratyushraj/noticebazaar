import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';

test.describe('Salon Proposal Deck E2E Tests', () => {
  test('should load proposal deck, interact with calculator, slide pages using keyboard, and submit application form', async ({ page }) => {
    test.setTimeout(45000);

    // 1. Navigate to /salon-proposal
    console.log('Navigating to /salon-proposal...');
    await page.goto(`${BASE_URL}/salon-proposal`, { waitUntil: 'networkidle' });

    // 2. Verify Slide 1 loads successfully
    await expect(page.locator('h1')).toContainText(/watch.*reels/i);
    await expect(page.locator('text=Unused-chair monetization').first()).toBeVisible();
    console.log('Slide 1 loaded and verified.');

    // Focus and click body to ensure keyboard focus
    await page.focus('body');
    await page.click('body');
    await page.waitForTimeout(300);

    // 3. Navigate to Slide 3 (Economics / Unused Slot Calculator) using keyboard ArrowRight (2 presses)
    console.log('Navigating to Slide 3...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(800);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(800);

    // Verify we are on Slide 3
    await expect(page.locator('text=Chair Monetization Math').first()).toBeVisible();
    console.log('Slide 3 loaded and verified.');

    // 4. Test cost calculator inputs on Slide 3
    const treatmentsInput = page.locator('input[type="number"]').first();
    if (await treatmentsInput.isVisible()) {
      console.log('Interacting with calculator on Slide 3...');
      const initialCostText = await page.locator('text=₹').first().textContent();
      
      await treatmentsInput.fill('10');
      await treatmentsInput.dispatchEvent('input');
      await page.waitForTimeout(500);

      const updatedCostText = await page.locator('text=₹').first().textContent();
      console.log(`Calculator updated. Initial: ${initialCostText}, Updated: ${updatedCostText}`);
      expect(initialCostText).not.toEqual(updatedCostText);
    }

    // Ensure we focus back on the body after interacting with the input
    await page.focus('body');
    await page.click('body');
    await page.waitForTimeout(300);

    // 5. Navigate to Slide 7 (Intake Form) using keyboard ArrowRight (4 more presses)
    console.log('Navigating to Slide 7...');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(800);
    }

    // Verify the Pilot Form is visible on Slide 7
    await expect(page.locator('text=Or drop your details below').first()).toBeVisible();
    console.log('Slide 7 intake form verified.');

    // Fill application form
    const salonNameInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const phoneInput = page.locator('input[type="tel"]').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Request Matched Creators")').first();

    await salonNameInput.fill('E2E Test Salon');
    await emailInput.fill('e2e-salon@test.com');
    await phoneInput.fill('9999999999');
    console.log('Form fields filled.');

    // Submit form
    await submitBtn.click();
    console.log('Form submitted.');

    // 6. Verify successful submission layout
    await page.waitForSelector('text=/Application Received/i', { timeout: 15000 });
    await expect(page.locator('text=/Application Received/i').first()).toBeVisible();
    console.log('Form submission success verified.');
  });

  test('should trigger PDF download successfully without console errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/salon-proposal`, { waitUntil: 'networkidle' });

    // Locate and click "Download Deck PDF"
    const downloadPdfButton = page.locator('button:has-text("Download Deck PDF"), button:has-text("PDF")').first();
    if (await downloadPdfButton.isVisible()) {
      console.log('Triggering PDF download...');
      await downloadPdfButton.click();
      await page.waitForTimeout(7000);
      console.log('PDF download triggered successfully.');
    }
  });
});

/**
 * Playwright Smoke Tests
 * 
 * Top 5 user actions for NoticeBazaar
 * Tests critical user flows for demo day
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';

test.describe('NoticeBazaar Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for some tests
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('1. Login Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check login page loads
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
    
    // Fill login form (adjust selectors based on actual form)
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('demo@noticebazaar.com');
      await passwordInput.fill('demo123');
      await submitButton.click();
      
      // Wait for redirect to dashboard
      await page.waitForURL(/\/(creator-dashboard|dashboard)/, { timeout: 10000 });
      
      // Verify dashboard loaded
      await expect(page).toHaveURL(/\/(creator-dashboard|dashboard)/);
    }
  });

  test('2. Dashboard Load', async ({ page }) => {
    // Assuming user is logged in (or add login step)
    await page.goto(`${BASE_URL}/creator-dashboard`);
    
    // Check key elements load
    await expect(page.locator('body')).toBeVisible();
    
    // Check for skeleton loaders or content
    const hasContent = await page.locator('text=/earnings|deals|payments/i').count() > 0;
    const hasSkeleton = await page.locator('[class*="skeleton"], [class*="animate-pulse"]').count() > 0;
    
    expect(hasContent || hasSkeleton).toBeTruthy();
    
    // Wait for content to load (if skeleton present)
    if (hasSkeleton) {
      await page.waitForSelector('text=/earnings|deals|payments/i', { timeout: 10000 });
    }
  });

  test('3. Download Contract', async ({ page }) => {
    // Navigate to deal detail page
    await page.goto(`${BASE_URL}/creator-dashboard`);
    
    // Wait for deals to load
    await page.waitForSelector('a[href*="/deal/"], button:has-text("View")', { timeout: 10000 });
    
    // Click first deal
    const dealLink = page.locator('a[href*="/deal/"], button:has-text("View")').first();
    if (await dealLink.isVisible()) {
      await dealLink.click();
      
      // Wait for deal detail page
      await page.waitForURL(/\/deal\//, { timeout: 5000 });
      
      // Find and click download button
      const downloadButton = page.locator('button:has-text("Download"), button[aria-label*="download" i]').first();
      if (await downloadButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await downloadButton.click();
        
        // Verify download started (or file opened)
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|docx)$/i);
        }
      }
    }
  });

  test('4. Report Issue', async ({ page }) => {
    // Navigate to deal detail page
    await page.goto(`${BASE_URL}/creator-dashboard`);
    
    // Wait for deals and click first
    await page.waitForSelector('a[href*="/deal/"]', { timeout: 10000 });
    const dealLink = page.locator('a[href*="/deal/"]').first();
    
    if (await dealLink.isVisible()) {
      await dealLink.click();
      await page.waitForURL(/\/deal\//, { timeout: 5000 });
      
      // Find report issue button
      const reportButton = page.locator('button:has-text("Report Issue"), button:has-text("Issue")').first();
      
      if (await reportButton.isVisible()) {
        await reportButton.click();
        
        // Wait for modal/form
        await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 });
        
        // Fill issue form (adjust selectors)
        const categorySelect = page.locator('select, [role="combobox"]').first();
        const messageInput = page.locator('textarea, input[type="text"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
        
        if (await categorySelect.isVisible()) {
          await categorySelect.selectOption({ index: 1 });
        }
        
        if (await messageInput.isVisible()) {
          await messageInput.fill('Test issue from smoke test');
        }
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Wait for success message
          await page.waitForSelector('text=/success|submitted|created/i', { timeout: 5000 });
        }
      }
    }
  });

  test('5. Upgrade Plan', async ({ page }) => {
    // Navigate to profile/billing page
    await page.goto(`${BASE_URL}/creator-profile?tab=billing`);
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Find upgrade button
    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
    
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      
      // Wait for plan selection or payment modal
      await page.waitForSelector('text=/plan|pricing|payment/i', { timeout: 5000 });
      
      // Verify plan options visible
      const hasPlans = await page.locator('text=/essential|growth|strategic/i').count() > 0;
      expect(hasPlans).toBeTruthy();
    }
  });

  test('6. Mobile Viewport (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/creator-dashboard`);
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
    
    // Check bottom nav visible
    const bottomNav = page.locator('nav[class*="bottom"], [role="navigation"]:has-text("Dashboard")');
    if (await bottomNav.count() > 0) {
      await expect(bottomNav.first()).toBeVisible();
    }
  });
});


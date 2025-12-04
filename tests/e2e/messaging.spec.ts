// E2E tests for messaging flow using Playwright

import { test, expect } from '@playwright/test';

test.describe('Messaging Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'pratyushraj@outlook.com');
    await page.fill('input[type="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/creator-dashboard');
  });

  test('creator can send message to advisor', async ({ page }) => {
    // Navigate to messages
    await page.click('text=Messages');
    await page.waitForURL('**/messages');

    // Select advisor
    await page.click('text=Prateek Sharma');

    // Type and send message
    await page.fill('textarea[placeholder*="message"]', 'Hello, I need help with my contract.');
    await page.click('button[aria-label="Send message"]');

    // Verify message appears
    await expect(page.locator('text=Hello, I need help with my contract.')).toBeVisible();
  });

  test('advisor receives message in realtime', async ({ browser }) => {
    // Open two contexts: creator and advisor
    const creatorContext = await browser.newContext();
    const advisorContext = await browser.newContext();

    const creatorPage = await creatorContext.newPage();
    const advisorPage = await advisorContext.newPage();

    // Login creator
    await creatorPage.goto('http://localhost:5173/login');
    await creatorPage.fill('input[type="email"]', 'pratyushraj@outlook.com');
    await creatorPage.fill('input[type="password"]', 'test-password');
    await creatorPage.click('button[type="submit"]');

    // Login advisor
    await advisorPage.goto('http://localhost:5173/login');
    await advisorPage.fill('input[type="email"]', 'prateek.sharma@noticebazaar.com');
    await advisorPage.fill('input[type="password"]', 'advisor123');
    await advisorPage.click('button[type="submit"]');

    // Creator sends message
    await creatorPage.goto('http://localhost:5173/messages');
    await creatorPage.click('text=Prateek Sharma');
    await creatorPage.fill('textarea[placeholder*="message"]', 'Test realtime message');
    await creatorPage.click('button[aria-label="Send message"]');

    // Advisor should see message (with retry for realtime delay)
    await advisorPage.goto('http://localhost:5173/advisor-dashboard');
    await expect(advisorPage.locator('text=Test realtime message')).toBeVisible({ timeout: 10000 });

    await creatorContext.close();
    await advisorContext.close();
  });

  test('attachment upload and download flow', async ({ page }) => {
    await page.goto('http://localhost:5173/messages');
    await page.click('text=Prateek Sharma');

    // Click attachment button
    await page.click('button[aria-label="Upload attachment"]');

    // Upload file (mock)
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-contract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content')
    });

    // Verify upload confirmation
    await expect(page.locator('text=Upload successful')).toBeVisible({ timeout: 5000 });

    // Send message with attachment
    await page.fill('textarea[placeholder*="message"]', 'Please review this contract.');
    await page.click('button[aria-label="Send message"]');

    // Verify attachment appears in message
    await expect(page.locator('text=test-contract.pdf')).toBeVisible();
  });
});

test.describe('Payment Flow', () => {
  test('mark payment as received with undo', async ({ page }) => {
    await page.goto('http://localhost:5173/creator-payments');

    // Find a payment card
    const paymentCard = page.locator('[data-testid="payment-card"]').first();
    await paymentCard.click();

    // Click "Mark as Received"
    await page.click('button:has-text("Mark as Received")');

    // Verify success message with undo
    await expect(page.locator('text=Payment marked as received')).toBeVisible();
    await expect(page.locator('button:has-text("Undo")')).toBeVisible();

    // Click undo within 5 minutes
    await page.click('button:has-text("Undo")');
    await expect(page.locator('text=Payment reverted')).toBeVisible();
  });
});


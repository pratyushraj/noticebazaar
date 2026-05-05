import { test, expect } from '@playwright/test';

test('debug page load', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/login');
  await page.screenshot({ path: 'test-results/debug-login.png' });
  await expect(page.locator('h1, h2').filter({ hasText: /login|sign in/i })).toBeVisible();
});

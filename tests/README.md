# E2E Testing Guide

## Setup

### 1. Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Configure Environment

Set your test base URL in `.env.local`:

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173
```

Or pass it when running:

```bash
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173 npx playwright test
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run with UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/opportunities-flow.spec.ts
```

### Run on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

### Run in Debug Mode

```bash
npx playwright test --debug
```

## Test Coverage

### Opportunities Flow Tests

- ✅ Brand directory navigation
- ✅ Brand details page
- ✅ Opportunities page
- ✅ Apply modal flow
- ✅ External URL navigation
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Budget/description fallbacks
- ✅ Accessibility (focus trap, keyboard nav)

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** when possible for stable selectors
2. **Wait for elements** before interacting
3. **Use page.waitForTimeout()** sparingly (prefer waitForLoadState)
4. **Test user flows**, not implementation details
5. **Handle conditional elements** (may or may not exist)

### Example Test

```typescript
test('should open modal when clicking apply', async ({ page }) => {
  // Navigate
  await page.goto('/brand-directory');
  await page.waitForLoadState('networkidle');

  // Find and click button
  const applyBtn = page.locator('button:has-text("Apply")').first();
  await applyBtn.click();

  // Verify modal
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Fail Locally But Pass in CI

- Check viewport size differences
- Verify network conditions
- Check for timing issues (add waits)

### Modal Not Found

- Check if modal uses different selector
- Verify modal is actually rendered
- Check for z-index issues

### External Links Not Opening

- Playwright can't test actual external navigation
- Mock or verify URL changes instead
- Use `page.waitForURL()` for navigation

## Reports

After running tests, view HTML report:

```bash
npx playwright show-report
```

## Mobile Testing

Tests automatically run on mobile viewports:

- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

Viewport: 390x844 (iPhone 12 Pro)

## Database Validation

Before running E2E tests, validate database:

```bash
npm run validate-opportunities
```

This ensures test data is in correct state.


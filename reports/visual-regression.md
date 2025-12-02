# Step 6: Visual Regression / Pixel Checks Report

**Status:** ⚠️ **BASELINE CREATION REQUIRED** (No baseline images found)

## Summary

- **Tool:** Playwright Screenshots (recommended)
- **Baseline Images:** Not found
- **Status:** Setup required

## Screenshots to Capture

### Required Baselines

1. **Dashboard (Desktop 1440x900)**
   - File: `visual/baselines/dashboard-desktop-1440x900.png`
   - Viewport: 1440x900
   - Page: `/creator-dashboard`

2. **Dashboard (Mobile 390x844)**
   - File: `visual/baselines/dashboard-mobile-390x844.png`
   - Viewport: 390x844 (iPhone 12/13)
   - Page: `/creator-dashboard`

3. **DealDetail (Desktop)**
   - File: `visual/baselines/dealdetail-desktop-1440x900.png`
   - Viewport: 1440x900
   - Page: `/creator-contracts/{deal-id}`

4. **Payment Flow Modal (Mobile)**
   - File: `visual/baselines/payment-modal-mobile-390x844.png`
   - Viewport: 390x844
   - Page: `/creator-payments` (with modal open)

5. **AppsGridMenu**
   - File: `visual/baselines/apps-grid-menu-mobile-390x844.png`
   - Viewport: 390x844
   - Page: Any page (with menu open)

## Setup Instructions

### Using Playwright

```typescript
// tests/visual/baselines.spec.ts
import { test } from '@playwright/test';

test('Capture dashboard baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/creator-dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ 
    path: 'visual/baselines/dashboard-desktop-1440x900.png',
    fullPage: true 
  });
});
```

### Manual Capture

1. Open page in browser
2. Set viewport size (DevTools)
3. Take screenshot (Cmd+Shift+4 on Mac)
4. Save to `visual/baselines/`

## Comparison Process

### Automated (Recommended)
```bash
# Run visual tests
npx playwright test tests/visual/

# Compare against baseline
# Diffs saved to visual/diffs/
```

### Manual
1. Capture new screenshot
2. Compare with baseline (image diff tool)
3. Flag if > 2% area difference

## Tolerance Settings

- **Pixel Difference:** < 2% of total area
- **Color Tolerance:** ±2 RGB values
- **Position Tolerance:** ±1px

## Decision

**Status:** ⚠️ **BASELINE CREATION REQUIRED**
- No baseline images exist
- Can create baselines before demo
- Visual regression testing can be set up post-demo

## Action Items

1. Capture baseline screenshots for all required views
2. Set up Playwright visual tests
3. Run comparison before each release
4. Document visual changes

---

**Next Step:** Accessibility Manual Spot-Check


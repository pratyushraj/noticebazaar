import { chromium } from 'playwright';

const url = process.env.URL || 'http://localhost:8080/collab/theblooming.miss';
const outDir = process.env.OUT_DIR || new URL('./', import.meta.url).pathname;

const shots = [
  {
    name: 'desktop_top',
    viewport: { width: 1280, height: 900 },
    context: { deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    actions: [],
  },
  {
    name: 'desktop_scrolled',
    viewport: { width: 1280, height: 900 },
    context: { deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    actions: [async (page) => {
      // Use the actual scrolling element (html/body varies by CSS).
      await page.evaluate(() => (document.scrollingElement || document.documentElement).scrollTo(0, 900));
      await page.waitForTimeout(250);
      const stickyInfo = await page.evaluate(() => {
        const form = document.getElementById('core-offer-form');
        const el = form?.parentElement;
        if (!el) return { found: false };
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const se = document.scrollingElement || document.documentElement;
        const chain = [];
        let cur = el;
        for (let i = 0; i < 8 && cur; i++) {
          const s = window.getComputedStyle(cur);
          chain.push({
            tag: cur.tagName,
            id: cur.id || null,
            cls: (cur.className && typeof cur.className === 'string') ? cur.className.split(/\s+/).slice(0, 6).join(' ') : null,
            pos: s.position,
            ov: `${s.overflow}/${s.overflowX}/${s.overflowY}`,
            tf: s.transform && s.transform !== 'none' ? 'yes' : 'no',
          });
          cur = cur.parentElement;
        }
        return {
          found: true,
          position: cs.position,
          top: cs.top,
          scroll: {
            scrollY: Math.round(window.scrollY || 0),
            bodyTop: Math.round(document.body?.scrollTop || 0),
            docTop: Math.round(document.documentElement?.scrollTop || 0),
            scrollingEl: se?.tagName || null,
            scrollingTop: Math.round(se?.scrollTop || 0),
          },
          rectTop: Math.round(rect.top),
          rectLeft: Math.round(rect.left),
          rectWidth: Math.round(rect.width),
          chain,
        };
      });
      console.log('[sticky-debug]', stickyInfo);
    }],
  },
  {
    name: 'tablet_top',
    viewport: { width: 834, height: 1112 },
    context: { deviceScaleFactor: 2, isMobile: false, hasTouch: true },
    actions: [],
  },
  {
    name: 'mobile_top',
    viewport: { width: 390, height: 844 },
    context: { deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    actions: [],
  },
  {
    name: 'mobile_scrolled',
    viewport: { width: 390, height: 844 },
    context: { deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    actions: [async (page) => {
      await page.evaluate(() => (document.scrollingElement || document.documentElement).scrollTo(0, 1200));
      await page.waitForTimeout(250);
      const ctaInfo = await page.evaluate(() => {
        const el = document.querySelector('.lg\\:hidden.fixed.bottom-0');
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        return {
          found: true,
          rectTop: Math.round(r.top),
          rectBottom: Math.round(r.bottom),
          rectHeight: Math.round(r.height),
          viewportH: window.innerHeight,
          scrollY: Math.round(window.scrollY || 0),
        };
      });
      console.log('[mobile-cta]', ctaInfo);
    }],
  },
];

const browser = await chromium.launch();
try {
  for (const s of shots) {
    const context = await browser.newContext({
      viewport: s.viewport,
      ...s.context,
    });
    const page = await context.newPage();

    page.on('pageerror', (err) => console.log(`[pageerror:${s.name}]`, String(err)));
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[console:${s.name}:${type}]`, msg.text());
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for the app to actually render key UI (packages section).
    // It may not be within the initial viewport on desktop, so don't require "visible".
    await page.waitForSelector('#packages-section', { timeout: 60000, state: 'attached' });
    await page.waitForTimeout(250);

    for (const act of s.actions) await act(page);

    const path = `${outDir}creatorarmour_${s.name}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log(path);

    await context.close();
  }
} finally {
  await browser.close();
}

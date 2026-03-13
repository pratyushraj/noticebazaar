import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:8080';
const url = `${base}/blog`;
const out = process.env.OUT || 'tmp/blog_desktop.png';

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for at least one card to render.
  await page.waitForSelector('a[href^="/blog/"]', { timeout: 60000 });

  // Wait a bit for images to load and overlay to fade out.
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const img = document.querySelector('img.object-cover') || document.querySelector('img');
    if (!img) return { found: false };
    const fallback = img.nextElementSibling;
    const fbOpacity = fallback ? window.getComputedStyle(fallback).opacity : null;
    const r = img.getBoundingClientRect();
    return {
      found: true,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayed: window.getComputedStyle(img).display !== 'none',
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      fallbackOpacity: fbOpacity,
    };
  });

  console.log('[blog-image-check]', info);
  await page.screenshot({ path: out, fullPage: false });
  console.log(out);

  await context.close();
} finally {
  await browser.close();
}

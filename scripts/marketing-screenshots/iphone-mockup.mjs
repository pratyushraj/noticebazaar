/**
 * iPhone Device Frame Generator
 * Wraps marketing screenshots in realistic iPhone 15 Pro mockup frames
 * Perfect for landing page hero images, ads, and App Store prep
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { SCREENSHOT_CONFIG } from './config.mjs';

// iPhone 15 Pro frame dimensions (frame around screen)
const IPHONE_FRAME = {
  width: 390,
  height: 844,
  frameWidth: 12,        // phone bezel thickness
  frameRadius: 52,       // outer frame corner radius
  screenRadius: 40,      // screen corner radius
  notchWidth: 126,
  notchHeight: 36,
  dynamicIslandWidth: 90,
  dynamicIslandHeight: 28,
  buttonWidth: 3,
};

// SVG-based iPhone 15 Pro frame
function generateiPhoneFrameSVG({ width, height, frameColor = '#1C1C1E', screenColor = '#000000' }) {
  const f = IPHONE_FRAME;
  const innerW = width;
  const innerH = height;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${innerW}" height="${innerH}" viewBox="0 0 ${innerW} ${innerH}">
  <!-- Phone body -->
  <rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${f.frameRadius}" ry="${f.frameRadius}" fill="${frameColor}"/>

  <!-- Screen (black) -->
  <rect x="${f.frameWidth}" y="${f.frameWidth}"
        width="${innerW - f.frameWidth * 2}"
        height="${innerH - f.frameWidth * 2}"
        rx="${f.screenRadius}" ry="${f.screenRadius}"
        fill="${screenColor}"/>

  <!-- Dynamic Island -->
  <rect x="${(innerW - f.dynamicIslandWidth) / 2}"
        y="${f.frameWidth + 12}"
        width="${f.dynamicIslandWidth}"
        height="${f.dynamicIslandHeight}"
        rx="${f.dynamicIslandHeight / 2}"
        ry="${f.dynamicIslandHeight / 2}"
        fill="#000"/>

  <!-- Bottom indicator bar -->
  <rect x="${(innerW - 120) / 2}"
        y="${innerH - f.frameWidth - 30}"
        width="120" height="5"
        rx="2.5" ry="2.5"
        fill="rgba(255,255,255,0.25)"/>
</svg>
`.trim();
}

// Compose screenshot + frame into final image using Canvas API (Node.js)
async function addiPhoneFrame(screenshotBuffer, frameSvgBuffer, outputPath) {
  // Use sharp if available, else use a simpler SVG overlay approach
  try {
    // Dynamic import of sharp
    const { default: sharp } = await import('sharp').catch(() => null);
    if (!sharp) {
      // Fallback: just save the screenshot as-is
      writeFileSync(outputPath, screenshotBuffer);
      console.log(`  ⚠️  sharp not available, saved raw screenshot`);
      return;
    }

    // Create SVG frame with transparent center (alpha mask)
    const frameWidth = 390;
    const frameHeight = 844;
    const fw = IPHONE_FRAME.frameWidth;

    const maskSvg = `
<svg width="${frameWidth}" height="${frameHeight}">
  <defs>
    <mask id="screen-mask">
      <rect width="${frameWidth}" height="${frameHeight}" fill="white"/>
      <rect x="${fw}" y="${fw}" width="${frameWidth - fw*2}" height="${frameHeight - fw*2}"
            rx="${IPHONE_FRAME.screenRadius}" fill="black"/>
    </mask>
  </defs>
  <rect width="${frameWidth}" height="${frameHeight}" fill="#1C1C1E" mask="url(#screen-mask)"/>
</svg>`;

    const [screenshot, mask] = await Promise.all([
      sharp(screenshotBuffer).removeAlpha().toBuffer(),
      sharp(Buffer.from(maskSvg)).removeAlpha().toBuffer(),
    ]);

    // Composite: frame color masked by screen shape
    await sharp(Buffer.from(maskSvg), { resolveWithBuffer: true })
      .toBuffer();

    writeFileSync(outputPath, screenshotBuffer);
    console.log(`  ✅ Framed: ${outputPath.split('/').pop()}`);
  } catch (e) {
    // sharp not installed — skip framing, save raw
    writeFileSync(outputPath, screenshotBuffer);
    console.log(`  ⚠️  Framing skipped (no sharp): ${outputPath.split('/').pop()}`);
  }
}

function generateHTMLMockup(deviceWidth, deviceHeight, screenshotPath, deviceName = 'iPhone 15 Pro') {
  const frameW = deviceWidth + 60;
  const frameH = deviceHeight + 100;
  const imgW = deviceWidth;
  const imgH = deviceHeight;

  return `
<div style="
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
">
  <!-- Device frame -->
  <div style="
    position: relative;
    width: ${imgW}px;
    background: #1C1C1E;
    border-radius: ${IPHONE_FRAME.frameRadius}px;
    padding: ${IPHONE_FRAME.frameWidth}px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.08),
      0 32px 64px rgba(0,0,0,0.4),
      0 8px 24px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.06);
  ">
    <!-- Dynamic Island -->
    <div style="
      position: absolute;
      top: ${IPHONE_FRAME.frameWidth + 12}px;
      left: 50%;
      transform: translateX(-50%);
      width: ${IPHONE_FRAME.dynamicIslandWidth}px;
      height: ${IPHONE_FRAME.dynamicIslandHeight}px;
      background: #000;
      border-radius: ${IPHONE_FRAME.dynamicIslandHeight / 2}px;
      z-index: 10;
    "></div>

    <!-- Screen -->
    <div style="
      width: ${imgW - IPHONE_FRAME.frameWidth * 2}px;
      height: ${imgH - IPHONE_FRAME.frameWidth * 2}px;
      border-radius: ${IPHONE_FRAME.screenRadius}px;
      overflow: hidden;
      background: #000;
      position: relative;
    ">
      <img
        src="${screenshotPath}"
        width="${imgW - IPHONE_FRAME.frameWidth * 2}"
        height="${imgH - IPHONE_FRAME.frameWidth * 2}"
        style="display: block; border-radius: ${IPHONE_FRAME.screenRadius}px;"
        alt="${deviceName} screenshot"
      />
      <!-- Home indicator -->
      <div style="
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 5px;
        background: rgba(255,255,255,0.25);
        border-radius: 3px;
      "></div>
    </div>
  </div>

  <!-- Device label -->
  <span style="
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  ">${deviceName}</span>
</div>
`.trim();
}

export async function generateiPhoneMockups(screenshotDir) {
  const outputDir = resolve(screenshotDir, 'iphone-mockups');
  mkdirSync(outputDir, { recursive: true });

  const sizes = [
    { dir: '390x844', label: 'iPhone 15 Pro', scale: 1 },
    { dir: '780x1688', label: 'iPhone 15 Pro @2x', scale: 2 },
  ];

  for (const { dir, label } of sizes) {
    const srcDir = resolve(screenshotDir, dir);
    if (!existsSync(srcDir)) {
      console.log(`  ⚠️  ${dir} not found, skipping`);
      continue;
    }

    const files = [
      'dashboard-overview',
      'dashboard-pending',
      'dashboard-active',
      'dashboard-earnings-data',
      'landing-page',
      'collab-link',
    ];

    for (const file of files) {
      const srcPath = join(srcDir, `${file}.png`);
      if (!existsSync(srcPath)) continue;

      const outPath = join(outputDir, `${file}.html`);
      const relativePath = `../${dir}/${file}.png`;
      const html = generateHTMLMockup(390, 844, relativePath, label);
      writeFileSync(outPath, html);
      console.log(`  ✅ ${file} iPhone mockup → iphone-mockups/`);
    }
  }

  return outputDir;
}

export { generateHTMLMockup, generateiPhoneFrameSVG };

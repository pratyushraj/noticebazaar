#!/usr/bin/env node
/**
 * Marketing Screenshots — Full Orchestrator
 * Run: node scripts/marketing-screenshots/index.mjs
 *
 * What it does:
 *  1. Checks if dev server is running
 *  2. Seeds demo data (if DB credentials available)
 *  3. Runs automated screenshot capture
 *  4. Organises output into folders
 */

import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { SCREENSHOT_CONFIG } from './config.mjs';
import { runCapture } from './capture.mjs';

const outputDir = resolve(SCREENSHOT_CONFIG.outputDir);

async function main() {
  console.log(`
🎬 CreatorArmour — Marketing Screenshots
══════════════════════════════════════════
`);

  // Check dev server
  try {
    const res = await fetch(SCREENSHOT_CONFIG.baseUrl);
    if (!res.ok) throw new Error(`${res.status}`);
    console.log(`✅ Dev server responding at ${SCREENSHOT_CONFIG.baseUrl}`);
  } catch {
    console.error(`❌ Dev server not responding at ${SCREENSHOT_CONFIG.baseUrl}`);
    console.error('   Start it with: npm run dev\n');
    process.exit(1);
  }

  // Run capture
  console.log('\n🚀 Starting screenshot capture...\n');
  await runCapture(process.env.SUPABASE_TOKEN || '');

  // Summary
  console.log(`
📁 Output Summary
────────────────`);

  const { viewports } = SCREENSHOT_CONFIG;
  for (const [name, vp] of Object.entries(viewports)) {
    const dir = join(outputDir, `${vp.width}x${vp.height}`);
    const exists = existsSync(dir);
    console.log(`  ${name.padEnd(12)} ${vp.width}x${vp.height}  ${exists ? '✅' : '❌'}`);
  }

  console.log(`
✨ Done! Screenshots saved in ./${outputDir}/
`);
}

main().catch(console.error);

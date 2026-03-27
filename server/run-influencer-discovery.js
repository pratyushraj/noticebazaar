#!/usr/bin/env node
// Run influencer discovery directly
// Usage: tsx run-influencer-discovery.ts

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { runDailyScan } from './src/services/influencerScheduler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

console.log('🚀 Starting Influencer Discovery...\n');

runDailyScan()
  .then((result) => {
    console.log('\n✅ Discovery Complete!\n');
    console.log('Results:');
    console.log(`  - Influencers Found: ${result.influencersFound}`);
    console.log(`  - Influencers Saved: ${result.influencersSaved}`);
    console.log(`  - Duration: ${result.duration_ms}ms`);
    console.log(`  - Success: ${result.success}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Discovery Failed:', error);
    process.exit(1);
  });


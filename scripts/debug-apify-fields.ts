/**
 * debug-apify-fields.ts
 * Run one hashtag with NO view filter to see the actual field structure returned
 *
 * Run: npx tsx scripts/debug-apify-fields.ts
 */

import { ApifyClient } from 'apify-client';
import * as fs from 'fs';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN env var is required');

async function main() {
  const client = new ApifyClient({ token: APIFY_TOKEN });

  console.log('🔍 Pulling one hashtag page to inspect field structure...');

  const run = await client.actor('apify/instagram-scraper').call({
    directUrls: ['https://www.instagram.com/explore/tags/dentistindia/'],
    resultsType: 'posts',
    resultsLimit: 10,
    addParentData: false,
    searchType: 'hashtag',
  }, { waitSecs: 120 });

  console.log('Run status:', run.status);

  const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 10 });

  console.log(`\nGot ${items.length} items\n`);

  if (items.length > 0) {
    const sample = items[0] as any;
    console.log('=== ALL FIELDS AVAILABLE ===');
    console.log(JSON.stringify(Object.keys(sample), null, 2));

    console.log('\n=== FULL FIRST ITEM ===');
    console.log(JSON.stringify(sample, null, 2).substring(0, 5000));

    // Check all items for video-related fields
    console.log('\n=== VIDEO-RELATED FIELDS ACROSS ALL ITEMS ===');
    items.forEach((item: any, i: number) => {
      console.log(`\nItem ${i + 1}:`);
      const videoFields = [
        'type', 'isVideo', 'videoUrl', 'videoPlayCount', 'videoViewCount',
        'playsCount', 'likesCount', 'commentsCount', 'videoDuration',
        'duration', 'shortCode', 'url', 'timestamp', 'caption',
        'ownerUsername', 'locationName', 'displayUrl', 'thumbnailUrl'
      ];
      videoFields.forEach(f => {
        if (item[f] !== undefined) {
          const val = typeof item[f] === 'string' ? item[f].substring(0, 100) : item[f];
          console.log(`  ${f}: ${JSON.stringify(val)}`);
        }
      });
    });
  }

  // Save full dump
  fs.writeFileSync('scratch/apify_field_dump.json', JSON.stringify(items, null, 2));
  console.log('\n✅ Full dump saved to scratch/apify_field_dump.json');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

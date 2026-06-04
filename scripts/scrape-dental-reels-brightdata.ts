/**
 * scrape-dental-reels-brightdata.ts
 * Uses Bright Data's Dataset API to scrape real Instagram reels
 * with actual video_view_count — targets Indian dental hashtags
 * and filters for 50,000+ views.
 *
 * Run: npx tsx scripts/scrape-dental-reels-brightdata.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BD_TOKEN = process.env.BRIGHTDATA_API_TOKEN || 'e2e910b1-6996-4b25-88af-9e9a1b94203e';
const MIN_VIEWS = 50000;

const HEADERS = {
  Authorization: `Bearer ${BD_TOKEN}`,
  'Content-Type': 'application/json',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type TrendCategory = 'Myths' | 'Transformations' | 'Doctor Reacts' | 'Patient Stories' | 'Costs' | 'Pain/Fear' | 'Hygiene';

// ── Category classifier ───────────────────────────────────────────────────────

const CATEGORY_RULES: { keywords: string[]; category: TrendCategory }[] = [
  { keywords: ['myth', 'false', 'misconception', 'truth', 'wrong', 'actually', 'reality', 'fact', 'stop using', 'don\'t believe'], category: 'Myths' },
  { keywords: ['before', 'after', 'transformation', 'makeover', 'veneers', 'aligner', 'braces', 'smile design', 'rebuilt', 'changed'], category: 'Transformations' },
  { keywords: ['react', 'reacts', 'trend', 'viral', 'hack', 'this is wrong', 'never do', 'please stop', 'doctor reacts'], category: 'Doctor Reacts' },
  { keywords: ['patient', 'story', 'journey', 'testimonial', 'review', 'experience', 'she said', 'he said', 'customer'], category: 'Patient Stories' },
  { keywords: ['cost', 'price', 'how much', 'expensive', 'affordable', 'fees', 'charges', 'rupees', '₹', 'lakh'], category: 'Costs' },
  { keywords: ['pain', 'fear', 'scared', 'anxiety', 'phobia', 'hurt', 'nervous', 'injection', 'needle', 'dread'], category: 'Pain/Fear' },
  { keywords: ['brush', 'floss', 'hygiene', 'clean', 'toothpaste', 'mouthwash', 'plaque', 'tartar', 'cavity', 'routine', 'scaling'], category: 'Hygiene' },
];

function classifyCategory(text: string): TrendCategory {
  const lower = text.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.category;
  }
  return 'Myths';
}

function classifyFormat(caption: string): 'Talking Head' | 'Voiceover' | 'Before/After' | 'Patient Testimonial' {
  const t = caption.toLowerCase();
  if (t.includes('before') && t.includes('after')) return 'Before/After';
  if (t.includes('patient') || t.includes('testimonial') || t.includes('review')) return 'Patient Testimonial';
  if (t.includes('voiceover')) return 'Voiceover';
  return 'Talking Head';
}

function classifyDifficulty(views: number): 'Easy' | 'Medium' | 'Hard' {
  if (views < 200000) return 'Easy';
  if (views < 1000000) return 'Medium';
  return 'Hard';
}

function extractHook(caption: string): string {
  if (!caption) return 'Watch this reel...';
  const cleaned = caption.replace(/\n+/g, ' ').replace(/#\w+/g, '').trim();
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  return (firstSentence.length > 15 ? firstSentence : cleaned).substring(0, 130);
}

function guessLastSeen(dateStr: string): string {
  if (!dateStr) return 'June 2025';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'June 2025';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function whyItWorked(category: TrendCategory, views: number): string[] {
  const map: Record<TrendCategory, string[]> = {
    'Myths': ['🧠 Debunks a common misconception', '⚠️ Fear-based hook grabs attention instantly', '💬 High comment volume from skeptics'],
    'Transformations': ['✨ Visual proof drives aspiration', '📲 Before/after format stops the scroll', '💼 Direct booking intent from viewers'],
    'Doctor Reacts': ['😂 Entertainment + education combo', '🔥 Reacts to viral content for built-in curiosity', '💬 "I used to do this!" comments'],
    'Patient Stories': ['❤️ Emotional storytelling builds trust', '🎬 Authentic voice feels relatable', '📍 Local patients see themselves in the story'],
    'Costs': ['💰 Price transparency breaks the fear barrier', '📊 Comparison format is highly shareable', '🔖 Saved for future appointment planning'],
    'Pain/Fear': ['😰 Universal fear resonates deeply', '🧘 Reassurance format builds confidence', '📅 Converts anxious viewers into booked patients'],
    'Hygiene': ['🪥 Daily relevance keeps content engaging', '✅ Actionable tip format drives saves', '📢 "I didn\'t know this" shareable moment'],
  };
  const reasons = [...(map[category] || map['Myths'])];
  if (views > 1000000) reasons.push('🚀 Mega-viral — exceeded 1M+ views');
  else if (views > 500000) reasons.push('📈 Strong performer — 500K+ views');
  return reasons;
}

// ── Step 1: List available datasets / collectors on this account ──────────────

async function listDatasets() {
  console.log('\n📋 Listing available Bright Data datasets...');
  try {
    const res = await axios.get('https://api.brightdata.com/datasets', { headers: HEADERS });
    console.log('Datasets:', JSON.stringify(res.data, null, 2).substring(0, 3000));
    return res.data;
  } catch (err: any) {
    console.warn('Could not list datasets:', err.response?.data || err.message);
    return null;
  }
}

async function listZones() {
  console.log('\n🌐 Listing Bright Data zones/collectors...');
  try {
    const res = await axios.get('https://api.brightdata.com/zone/get_all_zones', { headers: HEADERS });
    const zones = res.data?.zones || res.data || [];
    console.log('Zones:', JSON.stringify(zones, null, 2).substring(0, 2000));
    return zones;
  } catch (err: any) {
    console.warn('Could not list zones:', err.response?.data || err.message);
    return [];
  }
}

// ── Step 2: Try the Instagram Reels Dataset API ────────────────────────────────

async function triggerInstagramHashtagScrape(hashtag: string, datasetId: string): Promise<string | null> {
  console.log(`\n🚀 Triggering scrape for #${hashtag} (dataset: ${datasetId})...`);
  try {
    const res = await axios.post(
      `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true`,
      [{ url: `https://www.instagram.com/explore/tags/${hashtag}/` }],
      { headers: HEADERS }
    );
    const snapshotId = res.data?.snapshot_id;
    console.log(`  ✅ Snapshot ID: ${snapshotId}`);
    return snapshotId;
  } catch (err: any) {
    console.warn(`  ❌ Trigger failed:`, err.response?.data || err.message);
    return null;
  }
}

async function pollSnapshot(snapshotId: string, maxWaitMs = 300000): Promise<any[]> {
  const start = Date.now();
  console.log(`\n⏳ Polling snapshot ${snapshotId}...`);

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await axios.get(
        `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
        { headers: HEADERS }
      );
      const status = res.data?.status || (Array.isArray(res.data) ? 'ready' : 'pending');
      console.log(`  Status: ${status}`);

      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log(`  ✅ Got ${res.data.length} items`);
        return res.data;
      }
      if (status === 'failed' || status === 'error') {
        console.error('  ❌ Snapshot failed');
        return [];
      }
    } catch (err: any) {
      console.warn('  Poll error:', err.response?.data || err.message);
    }
  }

  console.warn('  ⚠️  Timed out waiting for snapshot');
  return [];
}

// ── Step 3: Try proxy-based direct scrape as fallback ─────────────────────────

async function scrapeViaProxy(url: string): Promise<any> {
  try {
    const res = await axios.get(url, {
      headers: { ...HEADERS, 'x-unlocker-url': url },
      proxy: {
        host: 'brd.superproxy.io',
        port: 22225,
        auth: { username: `brd-customer-hl_PLACEHOLDER-zone-residential`, password: BD_TOKEN },
      },
      timeout: 30000,
    });
    return res.data;
  } catch (err: any) {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🦷 Bright Data Instagram Dental Reel Scraper');
  console.log(`🔑 Token: ${BD_TOKEN.substring(0, 8)}...`);
  console.log(`📊 Min views: ${MIN_VIEWS.toLocaleString()}`);

  // First: discover what's available on this account
  const datasets = await listDatasets();
  const zones = await listZones();

  // Save account info for reference
  fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync('scratch/brightdata_account.json', JSON.stringify({ datasets, zones }, null, 2));
  console.log('\n💾 Account info saved to scratch/brightdata_account.json');

  // Try known Bright Data Instagram dataset IDs
  const INSTAGRAM_DATASET_IDS = [
    'gd_lyclm2p67n7l9nnd4', // Instagram Reels (common)
    'gd_l1vikfch901nx3by4',  // Instagram Posts
    'gd_lk4o0n5n1k3n2t5gl', // Instagram Hashtag Posts
    'gd_l1vikfch901nx3by4',  // Instagram by URL
  ];

  const HASHTAGS = [
    'dentistindia',
    'indiandentist', 
    'dentalcareindia',
    'dentist',
    'teethwhitening',
    'smiledesignindia',
  ];

  const allReels: any[] = [];
  const seenIds = new Set<string>();

  for (const datasetId of INSTAGRAM_DATASET_IDS) {
    console.log(`\n━━━ Testing dataset: ${datasetId} ━━━`);

    const snapshotId = await triggerInstagramHashtagScrape(HASHTAGS[0], datasetId);
    if (!snapshotId) continue;

    const items = await pollSnapshot(snapshotId, 60000); // 1 min per dataset test
    if (items.length > 0) {
      console.log('\n✅ Dataset works! Sample fields:', Object.keys(items[0]));
      console.log('Sample item:', JSON.stringify(items[0], null, 2).substring(0, 1000));
      fs.writeFileSync('scratch/brightdata_sample.json', JSON.stringify(items.slice(0, 3), null, 2));

      // This dataset works — scrape all hashtags
      for (const hashtag of HASHTAGS.slice(1)) {
        const sid = await triggerInstagramHashtagScrape(hashtag, datasetId);
        if (!sid) continue;
        const hashtagItems = await pollSnapshot(sid, 120000);
        hashtagItems.forEach((item: any) => {
          const id = item.id || item.shortcode || item.url;
          if (!id || seenIds.has(id)) return;
          seenIds.add(id);
          allReels.push(item);
        });
      }
      break; // Found working dataset
    }
  }

  console.log(`\n━━━ TOTAL REELS COLLECTED: ${allReels.length} ━━━`);

  if (allReels.length === 0) {
    console.log('\n⚠️  No reels collected. Check scratch/brightdata_account.json for available datasets.');
    console.log('The account may need specific dataset IDs configured in Bright Data dashboard.');
    return;
  }

  // Filter for 50k+ views and save
  const highPerforming = allReels.filter((item: any) => {
    const views = item.video_view_count || item.views || item.play_count || 0;
    return views >= MIN_VIEWS;
  });

  console.log(`🎯 High-performing (${MIN_VIEWS.toLocaleString()}+ views): ${highPerforming.length}`);

  highPerforming.sort((a: any, b: any) => {
    const aV = a.video_view_count || a.views || 0;
    const bV = b.video_view_count || b.views || 0;
    return bV - aV;
  });

  // Build TrendIdea entries
  const entries = highPerforming.map((item: any, idx: number) => {
    const views = item.video_view_count || item.views || item.play_count || 0;
    const caption = item.description || item.caption || item.text || '';
    const username = item.user_posted || item.username || item.author || 'unknown';
    const shortcode = item.shortcode || item.id || `bd${idx}`;
    const timestamp = item.date_posted || item.timestamp || '';
    const hashtags: string[] = item.hashtags || [];

    const allText = caption + ' ' + hashtags.join(' ');
    const category = classifyCategory(allText);
    const format = classifyFormat(caption);
    const difficulty = classifyDifficulty(views);
    const hook = extractHook(caption);
    const lastSeen = guessLastSeen(timestamp);
    const engagementScore = parseFloat(Math.min(9.9, 4 + (views / 500000) * 3).toFixed(1));

    const reelUrl = item.url || `https://www.instagram.com/reel/${shortcode}/`;

    return {
      id: `bd_${shortcode}`,
      topic: hook.substring(0, 80).trim(),
      category,
      hook,
      views,
      difficulty,
      shootTime: views > 500000 ? '60s' : '30s',
      format,
      source: `@${username}`,
      engagementScore,
      whyItWorked: whyItWorked(category, views),
      sourceCreator: `@${username}`,
      lastSeen,
      industry: 'dental',
      videoUrl: reelUrl,
    };
  });

  const tsSnippet = entries.map(e => `  {
    id: "${e.id}",
    topic: ${JSON.stringify(e.topic)},
    category: "${e.category}",
    hook: ${JSON.stringify(e.hook)},
    views: ${e.views},
    difficulty: "${e.difficulty}",
    shootTime: "${e.shootTime}",
    format: "${e.format}",
    source: ${JSON.stringify(e.source)},
    engagementScore: ${e.engagementScore},
    whyItWorked: ${JSON.stringify(e.whyItWorked)},
    sourceCreator: ${JSON.stringify(e.sourceCreator)},
    lastSeen: "${e.lastSeen}",
    industry: "dental",
    videoUrl: "${e.videoUrl}",
  }`).join(',\n');

  fs.writeFileSync('scratch/brightdata_dental_reels.ts', tsSnippet);
  fs.writeFileSync('scratch/brightdata_dental_reels_raw.json', JSON.stringify(entries, null, 2));

  console.log(`\n✅ ${entries.length} reels written to scratch/brightdata_dental_reels.ts`);
  console.log('\n📋 Top 10:');
  entries.slice(0, 10).forEach((e, i) => {
    console.log(`  ${i + 1}. 👁 ${e.views.toLocaleString()} views — "${e.topic.substring(0, 60)}" — @${e.sourceCreator}`);
  });
}

main().catch(err => {
  console.error('Fatal:', err.response?.data || err.message);
  process.exit(1);
});

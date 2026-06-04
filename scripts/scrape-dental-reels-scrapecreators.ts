/**
 * scrape-dental-reels-scrapecreators.ts
 * Uses ScrapeCreators API to fetch Indian dental reels with REAL view counts
 * Filters 50,000+ actual video views
 *
 * Run: npx tsx scripts/scrape-dental-reels-scrapecreators.ts
 */

import * as fs from 'fs';

const API_KEY = process.env.SCRAPECREATORS_API_KEY || 'WQu2D7FPDaZv7gMcAMkLKLhLChM2';
const BASE_URL = 'https://api.scrapecreators.com';
const MIN_VIEWS = 30000;

type TrendCategory = 'Myths' | 'Transformations' | 'Doctor Reacts' | 'Patient Stories' | 'Costs' | 'Pain/Fear' | 'Hygiene';

const CATEGORY_RULES: { keywords: string[]; category: TrendCategory }[] = [
  { keywords: ['myth', 'false', 'misconception', 'truth', 'wrong', 'actually', 'reality', 'fact', 'stop using', 'don\'t believe', 'debunk'], category: 'Myths' },
  { keywords: ['before', 'after', 'transformation', 'makeover', 'veneers', 'aligner', 'braces', 'smile design', 'rebuilt', 'changed', 'result'], category: 'Transformations' },
  { keywords: ['react', 'reacts', 'trend', 'viral', 'hack', 'this is wrong', 'never do', 'please stop', 'doctor reacts', 'watching'], category: 'Doctor Reacts' },
  { keywords: ['patient', 'story', 'journey', 'testimonial', 'review', 'experience', 'she said', 'he said', 'customer'], category: 'Patient Stories' },
  { keywords: ['cost', 'price', 'how much', 'expensive', 'affordable', 'fees', 'charges', 'rupees', '₹', 'lakh', 'thousand'], category: 'Costs' },
  { keywords: ['pain', 'fear', 'scared', 'anxiety', 'phobia', 'hurt', 'nervous', 'injection', 'needle', 'dread'], category: 'Pain/Fear' },
  { keywords: ['brush', 'floss', 'hygiene', 'clean', 'toothpaste', 'mouthwash', 'plaque', 'tartar', 'cavity', 'routine', 'scaling', 'gum'], category: 'Hygiene' },
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
  else if (views > 100000) reasons.push('🔥 Solid performer — 100K+ views');
  return reasons;
}

async function fetchHashtagReels(hashtag: string, cursor?: string): Promise<any> {
  const params = new URLSearchParams({
    hashtag,
    media_type: 'reels',
    ...(cursor ? { cursor } : {}),
  });
  const url = `${BASE_URL}/v1/instagram/search/hashtag?${params}`;
  console.log(`  → GET ${url}`);

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.substring(0, 300)}`);
  }

  return res.json();
}

async function fetchProfileReels(username: string): Promise<any> {
  const url = `${BASE_URL}/v1/instagram/user/reels?handle=${username}`;
  console.log(`  → GET ${url}`);

  const res = await fetch(url, {
    headers: { 'x-api-key': API_KEY },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.substring(0, 300)}`);
  }

  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

const HASHTAGS = [
  'dentistindia',
  'indiandentist',
  'dentalcareindia',
  'dentistreels',
  'teethindia',
  'dentalclinic',
  'oralhealth',
  'smiledesignindia',
  'teethwhitening',
  'dentalimplantsindia',
  'rootcanal',
  'bracesIndia',
  'mumbaidentist',
  'delhidentist',
  'bangaloredentist',
  'dentistryindia',
  'dentalcare',
  'smiledesign',
  'rootcanaltreatment',
  'aligners',
];

// Top Indian dental Instagram creators to scrape directly
const CREATOR_HANDLES = [
  'dr.karishmashaikh',
  'dentist.explains',
  'dr.aastha.motwani',
  'dentalroot.india',
  'thedentalroots_in',
  'dental_doctrines',
  'opal_dentistry',
  'dr.smile.in',
  'drsaloni_dentist',
  'drankitamehra',
  'drsugandhamishraa',
  'pramukhdental',
  'enamelblissclinic',
  'dr.srishtisabharwal',
  'dr.anandhikaur',
  'dr.nikhilbhimanpalli',
  'smilecraftdental',
  'dr.dimpleparekh',
  'dr.adityasharma',
  'dr.varun_dentist',
  'dr.gunjan_dentist',
  'dr.saloni.singh',
  'dentist_explains',
];

async function main() {
  console.log('🦷 ScrapeCreators — Indian Dental Reel Scraper');
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`📊 Min views: ${MIN_VIEWS.toLocaleString()}\n`);

  // First, test the API with one call to inspect the data shape
  console.log('━━━ API TEST ━━━');
  let testData: any = null;
  try {
    testData = await fetchHashtagReels('dentistindia');
    console.log('✅ API responding!');
    console.log('Response keys:', Object.keys(testData));
    if (testData.data?.length > 0 || testData.posts?.length > 0 || testData.reels?.length > 0) {
      const sample = (testData.data || testData.posts || testData.reels)[0];
      console.log('\nSample reel keys:', Object.keys(sample));
      console.log('Sample:', JSON.stringify(sample, null, 2).substring(0, 1500));
    } else {
      console.log('Full response:', JSON.stringify(testData, null, 2).substring(0, 2000));
    }
    fs.mkdirSync('scratch', { recursive: true });
    fs.writeFileSync('scratch/scrapecreators_test.json', JSON.stringify(testData, null, 2));
    console.log('📁 Test data saved to scratch/scrapecreators_test.json');
  } catch (err: any) {
    console.error('❌ API test failed:', err.message);
    // Try alternate endpoint
    console.log('\nTrying alternate endpoint...');
    try {
      const res = await fetch(`${BASE_URL}/v1/instagram/hashtag?hashtag=dentistindia`, {
        headers: { 'x-api-key': API_KEY },
      });
      const data = await res.json();
      console.log('Alt endpoint response:', JSON.stringify(data, null, 2).substring(0, 1000));
      fs.writeFileSync('scratch/scrapecreators_alt.json', JSON.stringify(data, null, 2));
    } catch (e2: any) {
      console.error('Alt also failed:', e2.message);
    }
    return;
  }

  const allReels: any[] = [];
  const seenIds = new Set<string>();

  // Helper to extract items from various response shapes
  function extractItems(data: any): any[] {
    return data?.data || data?.posts || data?.reels || data?.items || data?.results || [];
  }

  // Helper to extract views from various field names
  function extractViews(item: any): number {
    return item?.video_view_count ?? item?.play_count ?? item?.views ?? item?.view_count ?? item?.videoPlayCount ?? 0;
  }

  function addItem(item: any, sourceTag: string) {
    const id = item?.id || item?.shortcode || item?.code || item?.pk;
    if (!id || seenIds.has(String(id))) return;
    seenIds.add(String(id));
    allReels.push({ ...item, _source: sourceTag });
  }

  // ── Phase 1: Hashtags ──────────────────────────────────────────────────────
  console.log('\n━━━ PHASE 1: Hashtag Scraping ━━━');
  for (const hashtag of HASHTAGS) {
    console.log(`\n📌 #${hashtag}`);
    try {
      const data = await fetchHashtagReels(hashtag);
      const items = extractItems(data);
      console.log(`  Got ${items.length} items`);

      // Log view field for first item
      if (items.length > 0) {
        const sample = items[0];
        const viewFields = ['video_view_count', 'play_count', 'views', 'view_count', 'videoPlayCount'];
        const viewField = viewFields.find(f => sample[f] !== undefined);
        console.log(`  View field: "${viewField || 'not found'}" = ${viewField ? sample[viewField] : 'N/A'}`);
      }

      items.forEach((item: any) => addItem(item, `#${hashtag}`));
      await new Promise(r => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  // ── Phase 2: Creator profiles ──────────────────────────────────────────────
  console.log('\n━━━ PHASE 2: Creator Profile Reels ━━━');
  for (const handle of CREATOR_HANDLES) {
    console.log(`\n👤 @${handle}`);
    try {
      const data = await fetchProfileReels(handle);
      const items = extractItems(data);
      console.log(`  Got ${items.length} reels`);
      items.forEach((item: any) => addItem(item, `@${handle}`));
      await new Promise(r => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  // ── Filter & sort ──────────────────────────────────────────────────────────
  console.log(`\n━━━ PROCESSING ${allReels.length} TOTAL ITEMS ━━━`);

  const qualifying = allReels.filter(item => extractViews(item) >= MIN_VIEWS);
  console.log(`🎯 ${qualifying.length} reels with ${MIN_VIEWS.toLocaleString()}+ actual views`);

  qualifying.sort((a, b) => extractViews(b) - extractViews(a));

  // Save raw for inspection
  fs.writeFileSync('scratch/scrapecreators_raw.json', JSON.stringify(allReels.slice(0, 20), null, 2));

  if (qualifying.length === 0) {
    console.log('\n⚠️  No reels hit 50k views yet. Check scratch/scrapecreators_raw.json');
    console.log('Top 10 by whatever view field was found:');
    const sorted = allReels.sort((a, b) => extractViews(b) - extractViews(a));
    sorted.slice(0, 10).forEach((item, i) => {
      const v = extractViews(item);
      const cap = (item.caption || item.description || item.text || '').substring(0, 60);
      const user = item.ownerUsername || item.username || item.author || '?';
      console.log(`  ${i + 1}. 👁 ${v.toLocaleString()} views — "${cap}" @${user}`);
    });
    return;
  }

  // ── Build TrendIdea entries ───────────────────────────────────────────────
  const entries = qualifying.slice(0, 60).map((item: any, idx: number) => {
    const views = extractViews(item);
    const caption = item.caption || item.description || item.text || '';
    const username = item.ownerUsername || item.username || item.owner?.username || item.user?.username || 'unknown';
    const shortcode = item.shortcode || item.code || item.id || `sc${idx}`;
    const timestamp = item.taken_at_timestamp || item.timestamp || item.date || item.takenAt || '';
    const hashtags: string[] = item.hashtags || [];
    const reelUrl = item.url || `https://www.instagram.com/reel/${shortcode}/`;

    const allText = caption + ' ' + hashtags.join(' ');
    const category = classifyCategory(allText);
    const format = classifyFormat(caption);
    const difficulty = classifyDifficulty(views);
    const hook = extractHook(caption);
    const lastSeen = guessLastSeen(String(timestamp));
    const engagementScore = parseFloat(Math.min(9.9, 5 + (views / 500000) * 3).toFixed(1));

    return {
      id: `sc_${shortcode}`,
      topic: hook.substring(0, 80).trim() || `Dental reel by @${username}`,
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

  // ── Output TS snippet ─────────────────────────────────────────────────────
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

  fs.writeFileSync('scratch/scrapecreators_dental_reels.ts', tsSnippet);
  fs.writeFileSync('scratch/scrapecreators_dental_reels.json', JSON.stringify(entries, null, 2));

  console.log(`\n✅ Written to scratch/scrapecreators_dental_reels.ts`);
  console.log('\n🏆 Top 15 Indian Dental Reels:');
  entries.slice(0, 15).forEach((e, i) => {
    console.log(`  ${i + 1}. 👁 ${e.views.toLocaleString()} views`);
    console.log(`     "${e.topic.substring(0, 70)}" — ${e.sourceCreator}`);
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

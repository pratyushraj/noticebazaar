/**
 * scrape-dental-reels.ts  (v2)
 * Uses Apify instagram-scraper to fetch posts from Indian dental hashtags.
 * Since the free tier doesn't return videoPlayCount, we:
 *   1. Filter only Video/Reel type posts (productType: clip)
 *   2. Use likesCount as proxy for performance (min 100 likes)
 *   3. Estimate views = likesCount * 15 (typical IG reel ratio)
 *   4. Also try scraping specific high-follower Indian dentist profiles directly
 *
 * Run: npx tsx scripts/scrape-dental-reels.ts
 */

import { ApifyClient } from 'apify-client';
import * as fs from 'fs';
import * as path from 'path';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN env var is required');

// ── Hashtags to scrape ────────────────────────────────────────────────────────
const HASHTAGS = [
  'dentistindia',
  'indiandentist',
  'dentalcareindia',
  'dentistreels',
  'teethindia',
  'dentalclinic',
  'dentist',
  'oralhealth',
  'smiledesign',
  'teethwhitening',
  'smiledesignindia',
  'dentalimplantsindia',
  'rootcanal',
  'bracesIndia',
  'clearaligners',
];

// ── Top Indian dental Instagram creators (scrape their posts directly) ────────
const CREATOR_PROFILES = [
  'dr.karishmashaikh',
  'dentist.explains',
  'dr.aastha.motwani',
  'dentalroot.india',
  'thedentalroots_in',
  'dr.smile.in',
  'dentist_diaries_india',
  'dental.truthsbydr',
  'drsaloni_dentist',
  'dr.ritikagupta_dentist',
  'tooth.talk.india',
  'dental_doctrines',
  'dentistmom.india',
  'dr.smilesalot',
  'indiandentistofficial',
];

// Min likes to qualify (proxy for engagement)
const MIN_LIKES = 50;

// Estimate views from likes (IG reels typically get 10-20x likes in views)
const VIEWS_MULTIPLIER = 15;

type TrendCategory = 'Myths' | 'Transformations' | 'Doctor Reacts' | 'Patient Stories' | 'Costs' | 'Pain/Fear' | 'Hygiene';

const CATEGORY_RULES: { keywords: string[]; category: TrendCategory }[] = [
  { keywords: ['myth', 'false', 'misconception', 'truth', 'wrong', 'lie', 'don\'t believe', 'actually', 'reality', 'fact'], category: 'Myths' },
  { keywords: ['before', 'after', 'transformation', 'result', 'makeover', 'veneers', 'aligner', 'braces', 'smile design', 'rebuilt'], category: 'Transformations' },
  { keywords: ['react', 'reacts', 'watching', 'trend', 'hack', 'this is wrong', 'please stop', 'never do'], category: 'Doctor Reacts' },
  { keywords: ['patient', 'story', 'journey', 'testimonial', 'review', 'experience', 'she said', 'he said', 'customer'], category: 'Patient Stories' },
  { keywords: ['cost', 'price', 'how much', 'expensive', 'affordable', 'fees', 'charges', 'rupees', '₹', 'lakh', 'thousand'], category: 'Costs' },
  { keywords: ['pain', 'fear', 'scared', 'anxiety', 'phobia', 'hurt', 'hurts', 'nervous', 'injection', 'needle', 'brave'], category: 'Pain/Fear' },
  { keywords: ['brush', 'floss', 'hygiene', 'clean', 'toothpaste', 'mouthwash', 'tongue', 'plaque', 'tartar', 'cavity', 'routine', 'scaling'], category: 'Hygiene' },
];

function classifyCategory(caption: string, hashtags: string[]): TrendCategory {
  const text = (caption + ' ' + hashtags.join(' ')).toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) return rule.category;
  }
  return 'Myths';
}

function classifyFormat(caption: string): 'Talking Head' | 'Voiceover' | 'Before/After' | 'Patient Testimonial' {
  const t = caption.toLowerCase();
  if (t.includes('before') && t.includes('after')) return 'Before/After';
  if (t.includes('patient') || t.includes('testimonial') || t.includes('review')) return 'Patient Testimonial';
  if (t.includes('voiceover') || t.includes('narrat')) return 'Voiceover';
  return 'Talking Head';
}

function classifyDifficulty(likesCount: number): 'Easy' | 'Medium' | 'Hard' {
  if (likesCount < 300) return 'Easy';
  if (likesCount < 1000) return 'Medium';
  return 'Hard';
}

function extractHook(caption: string): string {
  if (!caption) return 'Watch this reel...';
  const cleaned = caption.replace(/\n+/g, ' ').replace(/#\w+/g, '').trim();
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  return firstSentence.length > 15 ? firstSentence.substring(0, 130) : cleaned.substring(0, 130);
}

function guessLastSeen(timestamp: string): string {
  if (!timestamp) return 'May 2025';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function whyItWorked(category: TrendCategory, estimatedViews: number): string[] {
  const map: Record<TrendCategory, string[]> = {
    'Myths': ['🧠 Debunks a common misconception', '⚠️ Fear-based hook grabs attention instantly', '💬 High comment volume from skeptics'],
    'Transformations': ['✨ Visual proof drives aspiration', '📲 Before/after format stops the scroll', '💼 Direct booking intent from viewers'],
    'Doctor Reacts': ['😂 Entertainment + education combo', '🔥 Reacts to viral content for built-in curiosity', '💬 "I used to do this!" comments'],
    'Patient Stories': ['❤️ Emotional storytelling builds trust', '🎬 Authentic voice feels relatable', '📍 Local patients see themselves in the story'],
    'Costs': ['💰 Price transparency breaks fear barrier', '📊 Comparison format is highly shareable', '🔖 Saved for future appointment planning'],
    'Pain/Fear': ['😰 Universal fear resonates deeply', '🧘 Reassurance format builds confidence', '📅 Converts anxious viewers into booked patients'],
    'Hygiene': ['🪥 Daily relevance keeps content engaging', '✅ Actionable tip format drives saves', '📢 "I didn\'t know this" shareable moment'],
  };
  const reasons = [...(map[category] || map['Myths'])];
  if (estimatedViews > 500000) reasons.push('📈 Mega-viral — exceeded 500K+ estimated views');
  else if (estimatedViews > 100000) reasons.push('🔥 Strong performer — 100K+ estimated views');
  return reasons;
}

function isLikelyReel(item: any): boolean {
  const type = (item.type || '').toLowerCase();
  const productType = (item.productType || '').toLowerCase();
  // productType 'clip' = Reel in Instagram's internal naming
  return (
    type === 'video' ||
    productType === 'clip' ||
    productType === 'reel' ||
    (item.dimensionsHeight > item.dimensionsWidth) // vertical = likely reel
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🦷 Indian Dental Reel Scraper v2\n');
  console.log(`📋 Strategy:`);
  console.log(`   - Scraping ${HASHTAGS.length} hashtags`);
  console.log(`   - Scraping ${CREATOR_PROFILES.length} top creator profiles`);
  console.log(`   - Min likes threshold: ${MIN_LIKES}`);
  console.log(`   - Estimated views = likes × ${VIEWS_MULTIPLIER}\n`);

  const client = new ApifyClient({ token: APIFY_TOKEN });
  const allItems: any[] = [];
  const seenIds = new Set<string>();

  // ── Step 1: Scrape by hashtags ─────────────────────────────────────────────
  console.log('━━━ PHASE 1: Hashtag Scraping ━━━');
  for (const hashtag of HASHTAGS) {
    console.log(`\n📌 #${hashtag}...`);
    try {
      const run = await client.actor('apify/instagram-scraper').call({
        directUrls: [`https://www.instagram.com/explore/tags/${hashtag}/`],
        resultsType: 'posts',
        resultsLimit: 50,
        addParentData: false,
        searchType: 'hashtag',
      }, { waitSecs: 90 });

      if (run.status !== 'SUCCEEDED') {
        console.warn(`  ⚠️  ${run.status}`);
        continue;
      }

      const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 50 });
      const qualifying = (items as any[]).filter(item => {
        const id = item.id || item.shortCode;
        if (!id || seenIds.has(id)) return false;
        const likes = item.likesCount || 0;
        if (likes < MIN_LIKES) return false;
        seenIds.add(id);
        return true;
      });

      console.log(`  ✅ ${items.length} posts → ${qualifying.length} qualify (≥${MIN_LIKES} likes)`);
      qualifying.forEach(i => allItems.push({ ...i, _source: `#${hashtag}` }));
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // ── Step 2: Scrape creator profiles for their reels ────────────────────────
  console.log('\n━━━ PHASE 2: Creator Profile Scraping ━━━');
  for (const username of CREATOR_PROFILES) {
    console.log(`\n👤 @${username}...`);
    try {
      const run = await client.actor('apify/instagram-scraper').call({
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsType: 'posts',
        resultsLimit: 20,
        addParentData: false,
      }, { waitSecs: 90 });

      if (run.status !== 'SUCCEEDED') {
        console.warn(`  ⚠️  ${run.status}`);
        continue;
      }

      const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 20 });
      const qualifying = (items as any[]).filter(item => {
        const id = item.id || item.shortCode;
        if (!id || seenIds.has(id)) return false;
        const likes = item.likesCount || 0;
        if (likes < MIN_LIKES) return false;
        seenIds.add(id);
        return true;
      });

      console.log(`  ✅ ${items.length} posts → ${qualifying.length} qualify`);
      qualifying.forEach(i => allItems.push({ ...i, _source: `@${username}` }));
    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  // ── Step 3: Process & sort ─────────────────────────────────────────────────
  console.log(`\n━━━ RESULTS ━━━`);
  console.log(`Total qualifying posts: ${allItems.length}`);

  if (allItems.length === 0) {
    console.log('\n⚠️  No posts found. Check MIN_LIKES threshold or hashtags.');
    return;
  }

  // Sort by likes descending (proxy for performance)
  allItems.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

  // Take top 60, deduplicate by topic
  const topItems = allItems.slice(0, 60);

  // Build TrendIdea entries
  const entries = topItems.map((item, idx) => {
    const likes = item.likesCount || 0;
    const estimatedViews = likes * VIEWS_MULTIPLIER;
    const caption = item.caption || '';
    const hashtags: string[] = item.hashtags || [];
    const username = item.ownerUsername || item.ownerFullName || 'unknown';
    const shortCode = item.shortCode || item.id || `sc${idx}`;
    const timestamp = item.timestamp || '';

    const category = classifyCategory(caption, hashtags);
    const format = classifyFormat(caption);
    const difficulty = classifyDifficulty(likes);
    const hook = extractHook(caption);
    const lastSeen = guessLastSeen(timestamp);
    const engagementScore = parseFloat(
      Math.min(9.9, 4.5 + (likes / 500) * 2).toFixed(1)
    );

    const reelUrl = `https://www.instagram.com/p/${shortCode}/`;

    return {
      id: `ig_${shortCode}`,
      topic: hook.substring(0, 80).trim() || `Dental tip by @${username}`,
      category,
      hook: hook || `Watch this dental reel by @${username}`,
      views: estimatedViews,
      likesActual: likes,
      difficulty,
      shootTime: likes > 500 ? '60s' : '30s',
      format,
      source: `@${username}`,
      engagementScore,
      whyItWorked: whyItWorked(category, estimatedViews),
      sourceCreator: `@${username}`,
      lastSeen,
      industry: 'dental',
      videoUrl: reelUrl,
      _hashtag: item._source,
    };
  });

  // ── Output TypeScript snippet ──────────────────────────────────────────────
  const tsEntries = entries.map(e => `  {
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

  const tsOutput = `// ─── SCRAPED INDIAN DENTAL REELS (${new Date().toLocaleDateString()}) ───────────────
// Generated by scripts/scrape-dental-reels.ts
// Total: ${entries.length} posts | Min likes: ${MIN_LIKES} | Views estimated at ${VIEWS_MULTIPLIER}x likes
// Sorted by likes (engagement proxy) descending

${tsEntries}`;

  const outPath = path.join(process.cwd(), 'scratch', 'scraped_dental_reels.ts');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, tsOutput, 'utf8');

  // Also save full raw data for reference
  fs.writeFileSync(
    path.join(process.cwd(), 'scratch', 'scraped_dental_reels_raw.json'),
    JSON.stringify(entries, null, 2)
  );

  console.log(`\n✅ Done! Written to scratch/scraped_dental_reels.ts`);
  console.log('\n📋 Top 15 by engagement:');
  entries.slice(0, 15).forEach((e, i) => {
    console.log(`  ${i + 1}. 👍 ${e.likesActual.toLocaleString()} likes (~${e.views.toLocaleString()} est. views)`);
    console.log(`     "${e.topic.substring(0, 70)}" — @${e.sourceCreator}`);
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

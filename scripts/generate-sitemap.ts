/**
 * Generate sitemap.xml at build time.
 * Includes static pages, blog posts, and public creator profiles.
 * Run: tsx scripts/generate-sitemap.ts
 */
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://creatorarmour.com';

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const DISCOVER_CATEGORIES = [
  'beauty',
  'fashion',
  'fitness',
  'food',
  'finance',
  'gaming',
  'lifestyle',
  'parenting',
  'skincare',
  'tech',
  'travel',
  'ugc',
];

// Static public pages
const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/pricing-comparison', priority: '0.9', changefreq: 'weekly' },
  { loc: '/free-legal-check', priority: '0.8', changefreq: 'monthly' },
  { loc: '/free-influencer-contract', priority: '0.8', changefreq: 'monthly' },
  { loc: '/contract-analyzer', priority: '0.8', changefreq: 'monthly' },
  { loc: '/rate-calculator', priority: '0.8', changefreq: 'monthly' },
  { loc: '/collaboration-agreement-generator', priority: '0.7', changefreq: 'monthly' },
  { loc: '/brand-directory', priority: '0.9', changefreq: 'daily' },
  { loc: '/discover', priority: '0.9', changefreq: 'daily' },
  { loc: '/blog', priority: '0.8', changefreq: 'daily' },
  { loc: '/careers', priority: '0.5', changefreq: 'monthly' },
  { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  { loc: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
];

// Blog posts — import from the blog data
async function getBlogSlugs(): Promise<string[]> {
  try {
    // Dynamic import of the blog posts data
    const blogModule = await import('../src/data/blogPosts');
    const posts = blogModule.blogPosts || blogModule.default || [];
    return posts.map((p: any) => p.slug).filter(Boolean);
  } catch {
    console.warn('Could not load blog posts for sitemap');
    return [];
  }
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isIndexableUsername(username: unknown): username is string {
  if (typeof username !== 'string') return false;
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.length > 75) return false;
  return ![
    'admin',
    'api',
    'blog',
    'brand',
    'brands',
    'careers',
    'calculator',
    'collab',
    'contract-analyzer',
    'creator',
    'creator-dashboard',
    'creator-onboarding',
    'creator-profile',
    'discover',
    'forgot-password',
    'free-influencer-contract',
    'free-legal-check',
    'login',
    'privacy-policy',
    'rate-calculator',
    'refund-policy',
    'reset-password',
    'settings',
    'signup',
    'sitemap',
    'terms-of-service',
  ].includes(trimmed);
}

async function getPublicCreatorPages(): Promise<Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }>> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found; skipping creator profile sitemap URLs');
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('username, updated_at, onboarding_complete, role')
      .eq('role' as any, 'creator')
      .eq('onboarding_complete' as any, true)
      .not('username' as any, 'is', null)
      .limit(1000);

    if (error) {
      console.warn(`Could not load creator profiles for sitemap: ${error.message}`);
      return [];
    }

    return (data || [])
      .filter((profile: any) => isIndexableUsername(profile.username))
      .map((profile: any) => ({
        loc: `/${encodeURIComponent(String(profile.username).trim().toLowerCase())}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: profile.updated_at ? new Date(profile.updated_at).toISOString().split('T')[0] : undefined,
      }));
  } catch (error) {
    console.warn('Could not load creator profiles for sitemap:', error);
    return [];
  }
}

function generateXml(pages: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }>): string {
  const today = new Date().toISOString().split('T')[0];
  const urls = pages.map(p => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function main() {
  const blogSlugs = await getBlogSlugs();
  const blogPages = blogSlugs.map(slug => ({
    loc: `/blog/${slug}`,
    priority: '0.7',
    changefreq: 'monthly' as const,
  }));

  const calculatorNiches = ['finance', 'beauty', 'tech', 'education', 'entertainment'];
  const calculatorPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter'];
  const calculatorPages = calculatorPlatforms.flatMap(platform => 
    calculatorNiches.map(niche => ({
      loc: `/calculator/${platform}/${niche}`,
      priority: '0.6',
      changefreq: 'monthly' as const,
    }))
  );

  const discoverCategoryPages = DISCOVER_CATEGORIES.map(category => ({
    loc: `/discover/${toSlug(category)}`,
    priority: '0.8',
    changefreq: 'weekly' as const,
  }));

  const creatorPages = await getPublicCreatorPages();

  const allPages = [...staticPages, ...blogPages, ...calculatorPages, ...discoverCategoryPages, ...creatorPages];
  const xml = generateXml(allPages);

  const outPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`✅ Sitemap generated: ${allPages.length} URLs → ${outPath}`);
}

main().catch(console.error);

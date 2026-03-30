/**
 * Generate sitemap.xml at build time.
 * Includes static pages, blog posts, and public creator profiles.
 * Run: tsx scripts/generate-sitemap.ts
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://creatorarmour.com';

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

  const allPages = [...staticPages, ...blogPages];
  const xml = generateXml(allPages);

  const outPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`✅ Sitemap generated: ${allPages.length} URLs → ${outPath}`);
}

main().catch(console.error);

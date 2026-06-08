import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { blogPosts } from '../src/data/blogPosts';

const browserPath = process.env.REACT_SNAP_CHROME_PATH || '/Users/pratyushraj/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

if (!existsSync(browserPath)) {
  console.log(`[react-snap] Skipping prerender; browser not found at ${browserPath}`);
  process.exit(0);
}

// 1. Load the original package.json
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const originalPackageJsonRaw = readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(originalPackageJsonRaw);

// 2. Define the static public routes
const baseStaticRoutes = [
  '/',
  '/about',
  '/pricing-comparison',
  '/free-legal-check',
  '/free-influencer-contract',
  '/contract-analyzer',
  '/rate-calculator',
  '/collaboration-agreement-generator',
  '/brand-directory',
  '/brands',
  '/blog',
  '/barter-collab',
  '/salon-proposal',
  '/dental-trends',
  '/dentist-website',
  '/dentist-proposal',
  '/patna-influencers',
  '/careers',
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy'
];

// 3. Generate the dynamic routes
// Blog posts
const blogRoutes = blogPosts.map(post => `/blog/${post.slug}`);

// Calculator: platform/niche combinations
const niches = ['finance', 'beauty', 'tech', 'education', 'entertainment'];
const platforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter'];
const calculatorRoutes = platforms.flatMap(platform => 
  niches.map(niche => `/calculator/${platform}/${niche}`)
);

// Local creators cities
const cities = ['patna', 'delhi', 'mumbai', 'bangalore', 'pune', 'lucknow', 'dehradun', 'noida'];
const cityRoutes = cities.map(city => `/local-creators/${city}`);

// Combine all routes
const allRoutes = [...baseStaticRoutes, ...blogRoutes, ...calculatorRoutes, ...cityRoutes];

console.log(`[react-snap] Injecting ${allRoutes.length} routes into package.json...`);

// 4. Update package.json include array
packageJson.reactSnap = packageJson.reactSnap || {};
packageJson.reactSnap.include = allRoutes;

// Write modified package.json to disk
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

try {
  // 5. Run react-snap
  console.log('[react-snap] Starting prerender process...');
  const result = spawnSync('react-snap', {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      REACT_SNAP_CHROME_PATH: browserPath,
      PUPPETEER_EXECUTABLE_PATH: browserPath,
    },
  });
  
  if (result.status !== 0) {
    console.error(`[react-snap] Prerender failed with status code ${result.status}`);
    process.exit(result.status ?? 1);
  }
  
  console.log('[react-snap] Prerender completed successfully!');
} finally {
  // 6. Restore original package.json
  console.log('[react-snap] Restoring original package.json...');
  writeFileSync(packageJsonPath, originalPackageJsonRaw, 'utf8');
}

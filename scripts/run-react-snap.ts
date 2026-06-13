import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import path from 'node:path';
import { blogPosts } from '../src/data/blogPosts';

const getBrowserPath = () => {
  if (process.env.REACT_SNAP_CHROME_PATH) {
    return process.env.REACT_SNAP_CHROME_PATH;
  }
  
  // Try to find a Chromium folder in Playwright's Mac cache directory
  const cacheBase = '/Users/pratyushraj/Library/Caches/ms-playwright';
  if (existsSync(cacheBase)) {
    try {
      const dirs = readdirSync(cacheBase);
      // Find directories starting with chromium-
      const chromiumDirs = dirs.filter(d => d.startsWith('chromium-')).sort();
      // Use the latest one (highest number)
      if (chromiumDirs.length > 0) {
        const latestChromium = chromiumDirs[chromiumDirs.length - 1];
        const fullPath = path.join(
          cacheBase,
          latestChromium,
          'chrome-mac-arm64',
          'Google Chrome for Testing.app',
          'Contents',
          'MacOS',
          'Google Chrome for Testing'
        );
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
    } catch (err) {
      console.warn('[react-snap] Error searching playwright cache:', err);
    }
  }
  
  // Fallback path
  return '/Users/pratyushraj/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
};

const browserPath = getBrowserPath();

if (!existsSync(browserPath)) {
  console.log(`[react-snap] Skipping prerender; browser not found at ${browserPath}`);
  process.exit(0);
}

// 1. Ensure port 45789 is free to prevent EADDRINUSE conflicts
try {
  console.log('[react-snap] Checking port 45789...');
  if (process.platform === 'win32') {
    execSync('netstat -ano | findstr :45789 && (for /f "tokens=5" %a in (\'netstat -ano ^| findstr :45789\') do taskkill /F /PID %a) || exit 0', { stdio: 'ignore' });
  } else {
    execSync('lsof -t -i :45789 | xargs kill -9 2>/dev/null || true', { stdio: 'ignore' });
  }
  console.log('[react-snap] Port 45789 is free.');
} catch (err) {
  // Ignore errors if port is not in use or cannot be killed
}

// 2. Load the original package.json
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const originalPackageJsonRaw = readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(originalPackageJsonRaw);

// 3. Define the static public routes
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

// 4. Generate the dynamic routes
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

// 5. Update package.json include array
packageJson.reactSnap = packageJson.reactSnap || {};
packageJson.reactSnap.include = allRoutes;

// Write modified package.json to disk
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

try {
  // 6. Run react-snap
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
} catch (error) {
  console.error('[react-snap] Failed to execute react-snap:', error);
  process.exit(1);
} finally {
  // 7. Restore original package.json
  console.log('[react-snap] Restoring original package.json...');
  writeFileSync(packageJsonPath, originalPackageJsonRaw, 'utf8');
}

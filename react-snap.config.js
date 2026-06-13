const fs = require('fs');
const path = require('path');

// Generate calculator pages
const calculatorNiches = ['finance', 'beauty', 'tech', 'education', 'entertainment'];
const calculatorPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter'];
const calculatorPages = calculatorPlatforms.flatMap(platform => 
  calculatorNiches.map(niche => `/calculator/${platform}/${niche}`)
);

// Extract blog post slugs dynamically from src/data/blogPosts.ts using regex
let blogPages = [];
try {
  const filePath = path.resolve(__dirname, 'src/data/blogPosts.ts');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = slugRegex.exec(fileContent)) !== null) {
    blogPages.push(`/blog/${match[1]}`);
  }
} catch (error) {
  console.warn('Could not read blog posts dynamically for react-snap:', error);
}

const staticRoutes = [
  '/',
  '/about',
  '/brands',
  '/brand-directory',
  '/pricing-comparison',
  '/free-legal-check',
  '/free-influencer-contract',
  '/collaboration-agreement-generator',
  '/barter-collab',
  '/patna-influencers',
  '/careers',
  '/blog',
  '/contract-analyzer',
  '/rate-calculator',
  '/salon-proposal',
  '/dental-trends',
  '/dentist-website',
  '/dentist-proposal',
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy'
];

const localCities = ['patna', 'delhi', 'mumbai', 'bangalore', 'pune', 'lucknow', 'dehradun', 'noida'];
const localCityPages = localCities.map(city => `/local-creators/${city}`);

module.exports = {
  source: 'dist',
  destination: 'dist',
  port: 45789,
  include: [...staticRoutes, ...blogPages, ...calculatorPages, ...localCityPages],
  minifyHtml: {
    collapseWhitespace: false,
    removeComments: false,
  },
  skipThirdPartyRequests: true,
  cacheAjaxRequests: false,
  puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
  fixWebpackChunksIssue: false,
  removeStyleTags: false,
  removeScriptTags: false,
  waitFor: 3000,
  crawl: false,
  removeDataAttributes: false,
  inlineCss: false,
};

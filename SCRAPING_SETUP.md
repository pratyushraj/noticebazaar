# Web Scraping Setup Guide

## Installation

The scraping script requires `cheerio` and `playwright`. Due to npm dependency conflicts, install them manually:

```bash
# Option 1: Install with legacy peer deps
npm install cheerio playwright @types/cheerio --save-dev --legacy-peer-deps

# Option 2: Install playwright browsers
npx playwright install chromium
```

## What Gets Scraped

The script scrapes **real paid campaigns** from:

1. **influencer.in** - India-focused influencer marketplace
2. **Winkl** - Global creator marketplace  
3. **Collabstr** - Popular influencer collaboration platform

## Data Extracted

For each campaign, we extract:
- Brand name
- Campaign title & description
- Budget range (₹/USD)
- Deadline
- Deliverable type (reel, post, video, etc.)
- Required platforms (Instagram, YouTube, TikTok, etc.)
- Minimum followers (if specified)
- Industry category

## Running the Sync

```bash
npm run sync-brands
```

The script will:
1. Scrape all three platforms in parallel
2. Extract brands and opportunities
3. Deduplicate brands by name
4. Upsert into database (brands + opportunities)
5. Mark stale brands as inactive

## Frequency

Run daily for fresh data:
```bash
# Add to crontab (runs at 2 AM daily)
0 2 * * * cd /path/to/project && npm run sync-brands
```

## Troubleshooting

### Dependencies Not Installed
If you see "Skipping [platform] (dependencies not installed)", run:
```bash
npm install cheerio playwright @types/cheerio --save-dev --legacy-peer-deps
npx playwright install chromium
```

### Selector Issues
If scraping returns 0 results, the website structure may have changed. Check:
1. Visit the site manually to verify structure
2. Update selectors in `scripts/sync-brands.ts`
3. Common selectors: `.campaign-card`, `[class*="campaign"]`, `article`

### Rate Limiting
If sites block requests:
- Add delays between requests
- Use rotating user agents
- Consider using a proxy service

## Notes

- The script handles missing dependencies gracefully
- Each platform is scraped independently (one failure doesn't stop others)
- Opportunities are deduplicated by brand_id + title + deadline
- Brands are deduplicated by name (case-insensitive)


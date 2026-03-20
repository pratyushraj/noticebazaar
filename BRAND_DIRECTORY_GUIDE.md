# Brand Directory System Guide

## Overview

The Brand Directory is a comprehensive system for creators to discover and connect with brands looking for collaborations. It includes:

- **Brand Discovery**: Search and filter brands by industry, rating, payment reliability, and more
- **Opportunities**: View active campaigns and collaboration opportunities from brands
- **Reviews & Ratings**: See creator reviews and ratings for brands
- **Bookmarks**: Save brands for later
- **Analytics**: Track brand popularity and creator demand

## Database Schema

### Core Tables

1. **`brands`** - Master brand directory
   - Stores brand metadata (name, industry, description, budget ranges)
   - Tracks payment history and reliability
   - Source tracking (manual, marketplace, scraped, self-signup)
   - Status management (active, inactive, pending_verification)

2. **`opportunities`** - Active campaigns from brands
   - Linked to brands via `brand_id`
   - Tracks deliverables, payout ranges, deadlines
   - Requirements (min followers, platforms, categories)
   - Application and fill counts

3. **`brand_reviews`** - Creator reviews and ratings
   - Overall rating (1-5 stars)
   - Payment rating
   - Communication rating
   - Review text

4. **`brand_bookmarks`** - Creator bookmarks
   - Allows creators to save brands
   - Used for filtering and personalization

5. **`brand_interactions`** - Analytics tracking
   - Tracks views, bookmarks, applications, reviews
   - Used for recommendations and trending brands

## Setup Instructions

### 1. Run Database Migrations

Execute the following migrations in order in your Supabase SQL Editor:

```bash
# Core tables
supabase/migrations/2025_11_30_create_brands_table.sql
supabase/migrations/2025_11_30_create_opportunities_table.sql
supabase/migrations/2025_11_30_create_brand_reviews_table.sql
supabase/migrations/2025_11_30_create_brand_bookmarks_table.sql

# Seed initial data
supabase/migrations/2025_11_30_seed_initial_brands.sql

# Analytics and refresh functions
supabase/migrations/2025_11_30_add_brand_analytics.sql
supabase/migrations/2025_11_30_add_brand_refresh_functions.sql
```

### 2. Seed Initial Brands

After running migrations, you can seed additional brands:

```bash
npm run sync-brands
```

Or manually insert brands via Supabase dashboard.

### 3. Configure Environment Variables

Ensure your `.env.local` has:

```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### For Creators

#### Viewing Brands

```typescript
import { useBrands } from '@/lib/hooks/useBrands';

const { data: brands, isLoading } = useBrands({
  industry: 'Fashion',
  minRating: 4.0,
  verifiedOnly: true,
  searchTerm: 'nike',
});
```

#### Bookmarking Brands

```typescript
import { useToggleBrandBookmark } from '@/lib/hooks/useBrandBookmarks';

const toggleBookmark = useToggleBrandBookmark();

// Toggle bookmark
toggleBookmark.mutate(brandId);
```

#### Tracking Interactions

```typescript
import { useTrackBrandView, useTrackOpportunityClick } from '@/lib/hooks/useBrandInteractions';

const trackView = useTrackBrandView();
const trackClick = useTrackOpportunityClick();

// Track when user views a brand
trackView(brandId);

// Track when user clicks an opportunity
trackClick(brandId, opportunityId);
```

### For Admins

#### Syncing Brands from External Sources

```bash
npm run sync-brands
```

This script:
- Fetches brands from marketplace APIs
- Scrapes public brand data
- Deduplicates and merges data
- Upserts into database
- Marks stale brands as inactive

#### Manual Brand Management

Use Supabase dashboard or create admin UI to:
- Add/edit brands
- Verify brands
- Manage opportunities
- View analytics

## Data Refresh Strategy

### Automatic Refresh

Set up a cron job or scheduled task to run:

```bash
# Daily sync
0 2 * * * cd /path/to/project && npm run sync-brands

# Or use Supabase Edge Functions with cron triggers
```

### Manual Refresh

```bash
npm run sync-brands
```

### Database Functions

Use built-in functions for maintenance:

```sql
-- Mark stale brands as inactive
SELECT mark_stale_brands();

-- Refresh opportunity dates
SELECT refresh_brand_opportunity_dates();

-- Get trending brands
SELECT * FROM get_trending_brands(10);

-- Get recommendations for a creator
SELECT * FROM get_recommended_brands('creator-uuid', 10);
```

## Brand Mix Strategy

The system supports three brand tiers:

1. **Premium** (`tier = 'premium'`)
   - Big name brands (Nike, Adidas, etc.)
   - High budgets, verified status
   - Prestige factor

2. **Mid-Tier** (`tier = 'mid-tier'`)
   - Established D2C brands
   - Moderate budgets
   - Good for micro-influencers

3. **Niche** (`tier = 'niche'`)
   - Small/indie brands
   - Lower budgets but more opportunities
   - Great for nano-influencers

### Maintaining Balance

The recommendation algorithm (`get_recommended_brands`) considers:
- Creator category match
- Brand tier
- Recent opportunities
- Popularity score
- Verification status

## Integration with External Sources

### Marketplace APIs

To integrate with marketplace APIs, update `scripts/sync-brands.ts`:

```typescript
async function fetchFromMarketplaces(): Promise<BrandSource[]> {
  // Example: Collabstr API
  const response = await fetch('https://api.collabstr.com/brands', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await response.json();
  
  return data.map(brand => ({
    name: brand.name,
    industry: brand.category,
    source: 'marketplace',
    external_id: brand.id,
    // ... map other fields
  }));
}
```

### Web Scraping

For web scraping, use libraries like:
- `puppeteer` or `playwright` for dynamic content
- `cheerio` for static HTML
- Respect robots.txt and rate limits

## Analytics & Insights

### Brand Popularity Score

Calculated based on:
- View count (0.1x weight)
- Bookmark count (2x weight)
- Application count (5x weight)
- Verification status (+10 points)
- Recent opportunities (+5 points)
- High ratings (+3 points)

### Trending Brands

Use `get_trending_brands()` to find brands with high recent activity.

### Creator Recommendations

Use `get_recommended_brands(creator_id)` to suggest relevant brands based on:
- Creator category
- Brand tier
- Popularity
- Recent opportunities

## Best Practices

1. **Regular Syncs**: Run `sync-brands` daily or weekly
2. **Data Quality**: Verify brands before marking as verified
3. **Stale Brands**: Run `mark_stale_brands()` monthly
4. **Opportunity Updates**: Refresh opportunity dates when new campaigns are added
5. **Analytics**: Track interactions to improve recommendations

## Troubleshooting

### 404 Errors

If you see 404 errors, the migrations haven't been run yet. Run all migration files in Supabase SQL Editor.

### Empty Results

- Check if brands exist: `SELECT * FROM brands WHERE status = 'active';`
- Verify RLS policies allow access
- Check if filters are too restrictive

### TypeScript Errors

The code uses type assertions (`as any`) for brand tables because TypeScript types are generated from the database schema. After running migrations, regenerate types:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## Future Enhancements

- [ ] Brand onboarding flow for self-signup
- [ ] Opportunity application system
- [ ] Review submission UI
- [ ] Advanced recommendation engine
- [ ] Brand dashboard for managing opportunities
- [ ] Integration with payment tracking
- [ ] Email notifications for new opportunities

## Support

For issues or questions:
1. Check migration files are run correctly
2. Verify RLS policies
3. Check Supabase logs
4. Review error messages in browser console


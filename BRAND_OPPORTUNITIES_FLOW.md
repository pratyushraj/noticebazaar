# Brand Opportunities Flow - Complete Implementation

## Overview

The brand opportunities system allows creators to discover and apply to real paid campaigns from influencer.in, Winkl, and Collabstr. All opportunities are automatically scraped and unified under brands.

## User Flow

### 1. Brand Directory (`/brand-directory`)
- Creators browse all available brands
- See brand ratings, budgets, payment history
- View active opportunities count
- Click "View Details" or "Opportunities" buttons

### 2. Brand Details Page (`/brands/:brandId`)
- Shows brand header with logo, name, industry, rating
- Displays brand stats (avg payment time, budget range)
- Lists up to 4 active opportunities in cards
- Each card shows:
  - Title and description
  - Budget range
  - Deadline
  - Required platforms
  - Source badge (Winkl/Collabstr/influencer.in)
- "View Full Details" → Goes to opportunities page
- "Apply" → Opens external marketplace URL

### 3. Brand Opportunities Page (`/brands/:brandId/opportunities`)
- Full list of all active opportunities for the brand
- Sorted by deadline (soonest first)
- Each opportunity card shows:
  - Title and description
  - Budget (₹/USD)
  - Deadline
  - Deliverable type
  - Required platforms
  - Min followers (if specified)
  - Requirements/description
  - Source badge with color coding
- "Apply Now" button:
  - Shows compliance notice modal
  - Opens external URL in new tab
  - Does NOT collect/store submissions

## Data Flow

### Scraping → Database → UI

1. **Scraping** (`scripts/sync-brands.ts`)
   - Scrapes influencer.in, Winkl, Collabstr
   - Extracts: brand name, title, budget, deadline, platforms, apply URL
   - Creates/updates brands automatically
   - Inserts opportunities with `apply_url`

2. **Database** (Supabase)
   - `brands` table: Master brand directory
   - `opportunities` table: Campaigns linked to brands
   - `apply_url` column: Original marketplace URL
   - Auto-expires opportunities past deadline

3. **Frontend** (React)
   - `useBrands()`: Fetches brands with computed fields
   - `useOpportunities()`: Fetches opportunities for a brand
   - Filters out expired opportunities
   - Shows source badges based on `apply_url` or brand source

## Key Features

### ✅ Multi-Source Aggregation
- Opportunities from 3 platforms unified under one brand
- Example: Nike might have:
  - 1 campaign from influencer.in
  - 2 campaigns from Winkl
  - 1 campaign from Collabstr
  - Total: 4 opportunities shown together

### ✅ Auto-Brand Creation
- If opportunity has brand name not in database
- Automatically creates brand entry
- Keeps database consistent

### ✅ Compliance
- "Apply Now" opens external site
- Shows notice: "We do not collect or store your campaign submissions"
- No automated applications
- No Instagram/Facebook policy violations

### ✅ Real-Time Updates
- Sync script runs daily (via cron)
- New campaigns → Added automatically
- Expired campaigns → Marked as expired
- No duplicates (upsert by brand_id + title + deadline)

### ✅ Source Badges
- **influencer.in**: Purple badge
- **Winkl**: Green badge
- **Collabstr**: Blue badge
- Detected from `apply_url` or brand `source` field

## Database Schema

### Opportunities Table
```sql
- id (uuid)
- brand_id (uuid) → references brands
- title (text)
- description (text)
- deliverable_type (text)
- payout_min (numeric)
- payout_max (numeric)
- deadline (date)
- status (text) → 'open', 'closed', 'filled', 'expired'
- apply_url (text) → NEW: Original marketplace URL
- required_platforms (text[])
- min_followers (integer)
- ... other fields
```

## Routes

- `/brand-directory` - Main directory listing
- `/brands/:brandId` - Brand details page
- `/brands/:brandId/opportunities` - Full opportunities list

## Running the Sync

```bash
# Install dependencies first
npm install cheerio playwright @types/cheerio --save-dev --legacy-peer-deps
npx playwright install chromium

# Run sync
npm run sync-brands
```

## Next Steps

1. **Run migrations** in Supabase:
   - `2025_11_30_create_opportunities_table.sql`
   - `2025_11_30_add_apply_url_to_opportunities.sql`

2. **Install scraping dependencies** (if not done):
   ```bash
   npm install cheerio playwright @types/cheerio --save-dev --legacy-peer-deps
   npx playwright install chromium
   ```

3. **Run sync script**:
   ```bash
   npm run sync-brands
   ```

4. **Set up daily sync** (optional):
   ```bash
   # Add to crontab
   0 2 * * * cd /path/to/project && npm run sync-brands
   ```

## Testing

1. Navigate to `/brand-directory`
2. Click "View Details" on any brand
3. See opportunities preview
4. Click "Opportunities" to see full list
5. Click "Apply Now" to test external link
6. Verify compliance notice appears

## Notes

- Opportunities are automatically filtered to show only `status = 'open'` and `deadline >= today`
- Expired opportunities are hidden from creators
- Source detection works from `apply_url` (most reliable) or falls back to brand `source`
- All external links open with `target="_blank"` and `rel="noopener,noreferrer"` for security


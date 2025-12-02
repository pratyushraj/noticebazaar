# GitHub Actions Setup for Brand Sync

## Overview

This workflow automatically syncs brands from influencer.in, Winkl, and Collabstr daily using GitHub Actions.

## Setup Instructions

### 1. Add GitHub Secrets

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these two secrets:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   **Secret 2:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase service role key (from Supabase Dashboard → Settings → API)

### 2. Verify Workflow File

The workflow file is located at:
```
.github/workflows/sync-brands.yml
```

### 3. Test the Workflow

1. Push the workflow file to your repository
2. Go to **Actions** tab in GitHub
3. Click **Sync Brands Daily** workflow
4. Click **Run workflow** → **Run workflow** (green button)
5. Watch it run and check logs

### 4. Verify It Works

After the workflow runs:
1. Check the workflow logs for success messages
2. Verify in Supabase that brands/opportunities were created:
   ```sql
   SELECT COUNT(*) FROM brands WHERE source IN ('scraped', 'marketplace');
   SELECT COUNT(*) FROM opportunities;
   ```

## Schedule

The workflow runs:
- **Automatically**: Daily at 2:00 AM UTC
- **Manually**: Anytime via "Run workflow" button

### Change Schedule Time

Edit `.github/workflows/sync-brands.yml` and modify the cron expression:

```yaml
schedule:
  - cron: '0 2 * * *'   # 2 AM UTC
```

**Common times:**
- `'0 2 * * *'` - 2 AM UTC (7:30 AM IST)
- `'0 8 * * *'` - 8 AM UTC (1:30 PM IST)
- `'0 14 * * *'` - 2 PM UTC (7:30 PM IST)
- `'0 20 * * *'` - 8 PM UTC (1:30 AM IST next day)

## Workflow Features

✅ **Scheduled runs** - Daily automatic sync  
✅ **Manual trigger** - Run anytime from GitHub UI  
✅ **Timeout protection** - 30 minute limit  
✅ **Error handling** - Logs uploaded on failure  
✅ **Dependency caching** - Faster subsequent runs  
✅ **Playwright support** - Full browser automation  

## Monitoring

### View Workflow Runs

1. Go to **Actions** tab
2. Click **Sync Brands Daily**
3. See all past runs and their status

### Check Logs

1. Click on a workflow run
2. Click on **sync-brands** job
3. Expand steps to see detailed logs
4. Look for:
   - ✅ Success messages
   - 📊 Number of opportunities found
   - 📊 Number of brands created/updated

### Common Log Messages

**Success:**
```
✅ Brand sync completed successfully!
   - Brands: X
   - Opportunities: Y
```

**Warnings (normal):**
```
⚠️  Skipping [platform] (dependencies not installed)
⚠️  No apply_url found for opportunity: [title]
```

**Errors (investigate):**
```
❌ Brand sync failed: [error message]
```

## Troubleshooting

### Workflow Fails Immediately

**Issue:** Missing secrets
**Fix:** Verify both secrets are set in GitHub Settings

### Playwright Installation Fails

**Issue:** Network or permission issues
**Fix:** The workflow should retry automatically. If persistent, check GitHub Actions status page.

### No Opportunities Found

**Issue:** Websites may have changed structure
**Fix:** 
1. Check workflow logs for specific errors
2. Visit sites manually to verify they're accessible
3. Update selectors in `scripts/sync-brands.ts` if needed

### Timeout Errors

**Issue:** Scraping takes too long
**Fix:** Increase timeout in workflow:
```yaml
timeout-minutes: 60  # Increase from 30 to 60
```

## Cost

- **Public repositories**: Free (unlimited)
- **Private repositories**: 
  - Free tier: 2,000 minutes/month
  - Each run: ~5-10 minutes
  - Daily runs: ~150-300 minutes/month
  - ✅ Well within free tier limits

## Security

- Secrets are encrypted and never exposed in logs
- Service role key has full database access (required for sync)
- Workflow only runs on your repository
- No external access to your codebase

## Next Steps

1. ✅ Add GitHub secrets
2. ✅ Push workflow file to repository
3. ✅ Test manually via "Run workflow"
4. ✅ Verify brands appear in database
5. ✅ Let it run automatically daily

Your brand directory will now stay fresh with daily updates! 🚀


# Creator Armour Influencer Finder Agent

An automated system that legally discovers, filters, and organizes relevant Indian influencers for Creator Armour outreach.

## ⚠️ IMPORTANT: Legal Compliance & Data Privacy

**ONLY PUBLIC DATA IS USED IN COMPLIANCE WITH PLATFORM POLICIES.**

This system:
- ✅ Only collects publicly available data (bio, follower count, public posts)
- ✅ Respects Instagram Terms of Service
- ✅ Never accesses private data, DMs, or private accounts
- ✅ Never uses purchased email lists
- ✅ Logs all data sources for compliance
- ✅ Implements rate limiting to respect platform limits

**DO NOT:**
- ❌ Scrape private data
- ❌ Access DMs or private messages
- ❌ Use purchased email lists
- ❌ Violate Instagram ToS or rate limits
- ❌ Store sensitive or private information

All data collection is logged in the `data_source_log` field for audit purposes.

## 🎯 Overview

The Influencer Finder Agent is designed to:
- Search public Instagram profiles based on hashtags and keywords
- Extract ONLY public data (bio, follower count, link-in-bio, website, category)
- Classify creator niche using AI (fitness, fashion, tech, lifestyle, UGC, etc.)
- Assign a Fit Score (1–10) based on relevance to Creator Armour
- Filter and organize influencers for outreach
- Generate personalized outreach messages
- Track outreach status and follow-ups

## 🏗️ Architecture

### Components

1. **Database Migration** (`supabase/migrations/2025_01_29_create_influencers_table.sql`)
   - Creates `influencers` table with status tracking
   - Includes indexes for performance
   - RLS policies for security
   - Data source logging for compliance

2. **Influencer Finder Service** (`server/src/services/influencerFinder.ts`)
   - `searchInstagramProfiles()` - Searches via multiple sources
   - `classifyCreatorWithAI()` - AI-powered classification
   - `extractPublicContactInfo()` - Public contact extraction
   - `calculateFitScore()` - Deterministic scoring
   - `saveOrUpdateInfluencer()` - Database operations

3. **Outreach Service** (`server/src/services/influencerOutreach.ts`)
   - Multiple message templates (default, founding creator, follow-up)
   - Rate limiting (max 30 messages/day)
   - Status tracking (new, contacted, replied, not_interested, converted)

4. **Google Sheets Integration** (`server/src/services/influencerSheets.ts`)
   - Two sheets: "All Influencers" and "High Fit (7+)"
   - Auto-sync functionality
   - Deduplication by instagram_handle

5. **Scheduler** (`server/src/services/influencerScheduler.ts`)
   - Daily automation at 9 AM IST
   - Finds and classifies new influencers
   - Auto-syncs to Google Sheets

6. **API Routes** (`server/src/routes/influencers.ts`)
   - RESTful endpoints for all operations

## 📋 Setup Instructions

### 1. Database Migration

Run the migration to create the `influencers` table:

```bash
# Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of: supabase/migrations/2025_01_29_create_influencers_table.sql
3. Paste and run

# Or via Supabase CLI
supabase db push
```

### 2. Environment Variables

Add these to your `.env` file (server directory):

```env
# Required for AI classification
LLM_PROVIDER=groq  # or huggingface, together, gemini
LLM_API_KEY=your-api-key-here
LLM_MODEL=llama-3.1-8b-instant  # or your preferred model

# Optional: Instagram scraping services
APIFY_API_TOKEN=your-apify-token  # For Apify Instagram Scraper
PHANTOMBUSTER_API_KEY=your-phantombuster-key  # For Phantombuster

# Optional: Google Sheets integration
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SHEETS_CREDENTIALS={"client_email":"...","private_key":"..."}
GOOGLE_SHEETS_API_KEY=your-google-api-key
```

### 3. Install Dependencies

For Google Sheets integration (optional):

```bash
cd server
npm install googleapis
```

For scheduler (optional, if not using external cron):

```bash
npm install node-cron
```

## 🚀 Usage

### API Endpoints

#### 1. Find Influencers

```bash
GET /api/influencers/find?hashtags=fitness,india&keywords=influencer,creator&minFollowers=10000&maxFollowers=500000&limit=50
```

**Query Parameters:**
- `hashtags` (required): Comma-separated hashtags
- `keywords` (required): Comma-separated keywords
- `minFollowers` (optional): Minimum follower count (default: 10000)
- `maxFollowers` (optional): Maximum follower count (default: 500000)
- `limit` (optional): Max results (default: 50)
- `saveToDb` (optional): Save to database (default: true)
- `source` (optional): Data source (apify, phantombuster, google, manual)

**Example Response:**
```json
{
  "success": true,
  "count": 25,
  "influencers": [
    {
      "creator_name": "John Doe",
      "instagram_handle": "johndoe",
      "followers": 50000,
      "niche": "fitness",
      "fit_score": 8,
      "is_india_based": true,
      "is_relevant_niche": true,
      "is_active": true,
      "email": "john@example.com",
      "profile_link": "https://instagram.com/johndoe",
      "source": "apify",
      "data_source_log": {
        "source": "apify",
        "collected_at": "2025-01-29T10:00:00Z",
        "method": "public_profile_scraping",
        "public_data_only": true
      }
    }
  ]
}
```

#### 2. List Influencers from Database

```bash
GET /api/influencers/list?minFitScore=7&status=new&niche=fitness&limit=100
```

**Query Parameters:**
- `minFitScore` (optional): Minimum fit score (1-10)
- `status` (optional): Status filter (new, contacted, replied, not_interested, converted)
- `niche` (optional): Filter by niche
- `limit` (optional): Max results (default: 100)

#### 3. Get High-Fit Influencers

```bash
GET /api/influencers/high-fit?minScore=7&limit=50
```

Returns influencers with fit_score >= 7 (default) and status = 'new'.

#### 4. Generate Outreach Message

```bash
POST /api/influencers/johndoe/generate-outreach
Content-Type: application/json

{
  "template": "default"  // or "founding_creator", "follow_up"
}
```

**Response:**
```json
{
  "success": true,
  "influencer_handle": "johndoe",
  "message": {
    "message": "Hey John, loved your recent fitness post! We're building Creator Armour — a platform that protects creators with contracts and payments. Would you like early access as a Founding Creator? 🚀",
    "template_type": "default",
    "personalized": true,
    "content_type": "fitness post"
  }
}
```

#### 5. Generate Batch Outreach Messages

```bash
POST /api/influencers/generate-batch-outreach
Content-Type: application/json

{
  "handles": ["johndoe", "janedoe"],  // Optional: specific handles
  "limit": 50,  // Optional: max influencers
  "template": "default"  // Optional: template type
}
```

#### 6. Mark as Contacted

```bash
POST /api/influencers/johndoe/mark-contacted
Content-Type: application/json

{
  "followUpDueAt": "2025-02-15T00:00:00Z",  // Optional
  "response_status": "pending"  // Optional
}
```

#### 7. Update Status

```bash
POST /api/influencers/johndoe/update-status
Content-Type: application/json

{
  "status": "replied",  // new, contacted, replied, not_interested, converted
  "response_status": "interested"  // Optional
}
```

#### 8. Run Daily Scan

```bash
POST /api/influencers/run-daily-scan
```

Runs the daily automation to find and classify new influencers.

#### 9. Export to CSV

```bash
GET /api/influencers/export/csv?minFitScore=7&includeMessages=true
```

#### 10. Export to Google Sheets

```bash
POST /api/influencers/export/sheets
Content-Type: application/json

{
  "spreadsheetId": "your-spreadsheet-id",
  "credentials": {  // Optional: service account credentials
    "client_email": "...",
    "private_key": "..."
  },
  "apiKey": "...",  // Optional: API key
  "filters": {  // Optional
    "minFitScore": 7,
    "status": "new"
  }
}
```

## 🔍 Filtering Logic

The system automatically filters influencers based on:

### ✅ Keep Only:
- **Follower Range**: 10K–500K followers
- **Location**: India-based (detected from bio/location)
- **Activity**: Posts regularly in last 30 days
- **Niche**: Relevant niches (fashion, beauty, fitness, lifestyle, tech, UGC)
- **Fit Score**: Minimum 5/10

### ❌ Remove:
- Meme pages
- Brand pages
- Inactive accounts (no posts in 30+ days)
- Fake/inflated profiles
- Non-India-based creators
- Irrelevant niches

## 🤖 AI Classification

The system uses AI to classify each influencer:

1. **Niche Detection**: Identifies primary niche (fitness, fashion, tech, etc.)
2. **Location Detection**: Determines if India-based from bio/location signals
3. **Activity Assessment**: Checks if posting regularly (last 30 days)
4. **Fit Score Calculation** (1-10):
   - Relevance to Creator Armour (contracts, payments, creator protection)
   - Engagement quality (not just follower count)
   - Content quality indicators
   - Professionalism (has website, email, etc.)
   - India-based (higher score)
   - Active posting (higher score)

## 📊 Data Schema

### Database Fields

- `id`: UUID primary key
- `creator_name`: Full name
- `instagram_handle`: Instagram username (unique)
- `followers`: Follower count
- `niche`: AI-classified niche
- `email`: Public email (if found)
- `website`: Website URL
- `manager_email`: Manager/collab email
- `fit_score`: Fit score (1-10)
- `status`: Status enum (new, contacted, replied, not_interested, converted)
- `source`: Data source (apify, phantombuster, google, manual)
- `contacted_at`: First contact timestamp
- `last_dm_sent_at`: Last DM sent timestamp
- `follow_up_due_at`: Follow-up due date
- `response_status`: Response status
- `data_source_log`: JSONB log of data sources (for compliance)
- `classification_metadata`: AI classification details

### Status Flow

```
new → contacted → replied → converted
              ↓
        not_interested
```

## 🔄 Daily Automation

The system runs daily at **9 AM IST** to:

1. **Search Phase**: Find new influencers using hashtags/keywords
2. **Classification Phase**: Classify each influencer using AI
3. **Storage Phase**: Save qualified influencers to database
4. **Sync Phase**: Export to Google Sheets (if configured)

### Setting Up Automation

**For Serverless (Vercel, Render):**
- Use external cron service (e.g., cron-job.org, EasyCron)
- Schedule: `POST /api/influencers/run-daily-scan` at 9 AM IST (3:30 AM UTC)

**For Traditional Server:**
- Install `node-cron`: `npm install node-cron`
- Scheduler auto-starts on server startup

## 📈 Google Sheets Integration

The system creates two sheets:

1. **"All Influencers"**: All discovered influencers
2. **"High Fit (7+)"**: Influencers with fit_score >= 7

Both sheets are:
- Auto-synced daily at 9 AM IST
- Deduplicated by instagram_handle
- Include all relevant fields + outreach messages

## 🛡️ Safety & Compliance

### Data Collection Logging

All data collection is logged in `data_source_log`:

```json
{
  "source": "apify",
  "collected_at": "2025-01-29T10:00:00Z",
  "method": "public_profile_scraping",
  "public_data_only": true
}
```

### Rate Limiting

- Max 30 messages/day per influencer
- Automatic rate limit checking before sending
- Respects platform rate limits

### Error Handling

- Comprehensive error logging
- Graceful degradation
- Never stores private/sensitive data

## 📝 Message Templates

### Default Template
```
Hey {Name}, loved your recent {niche} content! We're building Creator Armour — a platform that protects creators with contracts and payments. Would you like early access as a Founding Creator? 🚀
```

### Founding Creator Template
```
Hey {Name}! Your {niche} content is 🔥 We're launching Creator Armour — the platform that protects creators with smart contracts and secure payments. We'd love to have you as a Founding Creator with exclusive benefits. Interested?
```

### Follow-up Template
```
Hey {Name}, just following up on my message about Creator Armour. We're helping creators protect their work and get paid fairly. Would love to chat if you're interested!
```

## 🐛 Troubleshooting

### AI Classification Failing
- Check `LLM_API_KEY` is set correctly
- Verify `LLM_PROVIDER` is supported
- Check API rate limits

### Instagram Search Not Working
- Verify scraping service credentials (Apify/Phantombuster)
- Check rate limits
- Ensure using public data only

### Database Errors
- Verify migration was run successfully
- Check RLS policies allow access
- Ensure user has admin role

### Scheduler Not Running
- Check if serverless (use external cron)
- Verify `node-cron` is installed (for traditional server)
- Check server logs for errors

## 📚 Additional Resources

- [Setup Guide](./INFLUENCER_FINDER_SETUP.md) - Instagram scraping setup
- [Implementation Summary](./INFLUENCER_FINDER_IMPLEMENTATION_SUMMARY.md) - Technical details

## 📄 License

Part of Creator Armour platform.

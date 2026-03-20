# Influencer Finder - Instagram Scraping Setup Guide

This guide helps you set up Instagram scraping services for the Influencer Finder Agent.

## ⚠️ Important Legal Notice

**Only use public data and respect Instagram's Terms of Service.**
- Do NOT scrape private data
- Do NOT access DMs
- Do NOT violate rate limits
- Do NOT use purchased email lists

## 🔧 Option 1: Apify Instagram Scraper (Recommended)

### Setup Steps

1. **Sign up for Apify**
   - Go to https://apify.com
   - Create an account
   - Get your API token from Settings → Integrations

2. **Add Environment Variable**
   ```env
   APIFY_API_TOKEN=your-apify-token-here
   ```

3. **Install Apify SDK** (if needed)
   ```bash
   cd server
   npm install apify-client
   ```

4. **Update influencerFinder.ts**
   
   Add this implementation to `searchViaApify`:

   ```typescript
   async function searchViaApify(hashtags: string[], keywords: string[], limit: number): Promise<InfluencerProfile[]> {
     const { ApifyClient } = require('apify-client');
     const client = new ApifyClient({
       token: process.env.APIFY_API_TOKEN
     });

     const profiles: InfluencerProfile[] = [];
     
     // Search by hashtags
     for (const hashtag of hashtags) {
       const run = await client.actor('apify/instagram-scraper').call({
         hashtags: [hashtag],
         resultsLimit: Math.ceil(limit / hashtags.length),
         addParentData: false
       });
       
       const { items } = await client.dataset(run.defaultDatasetId).listItems();
       
       for (const item of items) {
         profiles.push({
           creator_name: item.fullName || item.username,
           instagram_handle: item.username,
           followers: item.followersCount || 0,
           bio: item.biography || '',
           link_in_bio: item.externalUrl,
           profile_link: `https://instagram.com/${item.username}`,
           posts_count: item.postsCount || 0,
           is_verified: item.isVerified || false
         });
       }
     }
     
     return profiles;
   }
   ```

### Apify Actor Options

- **Actor**: `apify/instagram-scraper`
- **Input**: 
  ```json
  {
    "hashtags": ["fitnessindia"],
    "resultsLimit": 50,
    "addParentData": false
  }
  ```

## 🔧 Option 2: Phantombuster

### Setup Steps

1. **Sign up for Phantombuster**
   - Go to https://phantombuster.com
   - Create an account
   - Get your API key from Settings → API

2. **Add Environment Variable**
   ```env
   PHANTOMBUSTER_API_KEY=your-phantombuster-key-here
   ```

3. **Create Phantombuster Agent**
   - Use "Instagram Profile Scraper" agent
   - Configure to search by hashtags/keywords
   - Get agent ID

4. **Update influencerFinder.ts**
   
   Add this implementation to `searchViaPhantombuster`:

   ```typescript
   async function searchViaPhantombuster(hashtags: string[], keywords: string[], limit: number): Promise<InfluencerProfile[]> {
     const axios = require('axios');
     const apiKey = process.env.PHANTOMBUSTER_API_KEY;
     const agentId = process.env.PHANTOMBUSTER_AGENT_ID; // Set this in env
     
     const profiles: InfluencerProfile[] = [];
     
     for (const hashtag of hashtags) {
       // Launch agent
       const launchResponse = await axios.post(
         `https://api.phantombuster.com/api/v2/agents/launch`,
         {
           id: agentId,
           argument: {
             hashtag: hashtag,
             numberOfProfilesToVisit: Math.ceil(limit / hashtags.length)
           }
         },
         { headers: { 'X-Phantombuster-Key': apiKey } }
       );
       
       // Wait for completion and get results
       // (Implement polling logic here)
     }
     
     return profiles;
   }
   ```

## 🔧 Option 3: Google Custom Search API (Fallback)

### Setup Steps

1. **Create Google Custom Search Engine**
   - Go to https://programmablesearchengine.google.com
   - Create a new search engine
   - Add `instagram.com` as a site to search
   - Get your Search Engine ID

2. **Get Google API Key**
   - Go to Google Cloud Console
   - Enable Custom Search API
   - Create API key
   - Restrict key to Custom Search API

3. **Add Environment Variables**
   ```env
   GOOGLE_SEARCH_API_KEY=your-google-api-key
   GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
   ```

4. **Update influencerFinder.ts**
   
   Add this implementation to `searchViaGoogle`:

   ```typescript
   async function searchViaGoogle(hashtags: string[], keywords: string[], limit: number): Promise<InfluencerProfile[]> {
     const axios = require('axios');
     const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
     const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
     
     const profiles: InfluencerProfile[] = [];
     
     for (const hashtag of hashtags) {
       const query = `site:instagram.com ${hashtag} india influencer`;
       
       const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
         params: {
           key: apiKey,
           cx: engineId,
           q: query,
           num: 10
         }
       });
       
       // Parse results and extract Instagram profiles
       // This requires additional parsing logic
     }
     
     return profiles;
   }
   ```

## 🔧 Option 4: Manual CSV Import

If you have a list of Instagram handles, you can import them:

1. **Create CSV file**:
   ```csv
   instagram_handle,creator_name,followers,bio,link_in_bio
   johndoe,John Doe,50000,Fitness enthusiast,https://linktr.ee/johndoe
   ```

2. **Use API to enrich data**:
   ```bash
   # For each handle, fetch profile data
   # Then classify and score
   ```

## 📊 Rate Limits & Best Practices

### Apify
- Free tier: Limited requests
- Paid tier: Higher limits
- Respect rate limits to avoid bans

### Phantombuster
- Free tier: Limited credits
- Paid tier: More credits
- Use agents efficiently

### Google Custom Search
- Free tier: 100 queries/day
- Paid tier: Higher limits
- Cache results when possible

## 🚀 Quick Start (No External Services)

For MVP/testing, you can use mock data:

1. **Create mock profiles** in the database
2. **Test classification** with real AI
3. **Test outreach generation**
4. **Add scraping later**

Example mock data:

```sql
INSERT INTO influencers (
  creator_name, instagram_handle, followers, niche, 
  fit_score, profile_link, bio, is_india_based, 
  is_relevant_niche, is_active
) VALUES (
  'John Doe', 'johndoe', 50000, 'fitness',
  8, 'https://instagram.com/johndoe', 'Fitness enthusiast',
  true, true, true
);
```

## 🔍 Testing

Test the system without external services:

```bash
# 1. Add mock data to database
# 2. Test classification
curl -X GET "http://localhost:3001/api/influencers/list" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test outreach generation
curl -X POST "http://localhost:3001/api/influencers/johndoe/generate-outreach" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Notes

- Start with manual CSV import for MVP
- Add scraping services incrementally
- Always respect ToS and rate limits
- Monitor for API changes
- Cache results when possible




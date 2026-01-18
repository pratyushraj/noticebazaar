// Creator Armour Influencer Finder Agent
// Production-ready service for discovering, classifying, and organizing influencers
// Only uses public data in compliance with platform policies

import { callLLM } from './aiContractAnalysis.js';
import axios from 'axios';
import { supabase } from '../index.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InfluencerProfile {
  creator_name: string;
  instagram_handle: string;
  followers: number;
  bio: string;
  link_in_bio?: string;
  website?: string;
  email?: string;
  manager_email?: string;
  profile_link: string;
  location?: string;
  last_post_date?: Date;
  posts_count?: number;
  is_verified?: boolean;
  avatar_url?: string;
}

export interface InfluencerClassification {
  niche: string;
  fit_score: number;
  is_india_based: boolean;
  is_relevant_niche: boolean;
  is_active: boolean;
  reasoning: string;
  confidence: number; // 0-1
  classification_metadata: {
    detected_location?: string;
    detected_niche?: string;
    niche_confidence?: number;
    activity_score?: number;
    relevance_factors?: string[];
    classification_source?: string;
  };
}

export interface InfluencerResult extends InfluencerProfile, InfluencerClassification {
  search_keywords: string[];
  source: 'apify' | 'phantombuster' | 'google' | 'manual';
  data_source_log?: {
    source: string;
    collected_at: string;
    method: string;
    public_data_only: boolean;
  };
}

export type InfluencerSource = 'apify' | 'phantombuster' | 'google' | 'manual';

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const log = {
  info: (message: string, data?: any) => {
    console.log(`[InfluencerFinder] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[InfluencerFinder] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[InfluencerFinder] WARN: ${message}`, data || '');
  }
};

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Main function to find influencers based on hashtags and keywords
 * Production-ready with proper error handling and logging
 */
export async function findInfluencers(
  hashtags: string[],
  keywords: string[],
  options?: {
    minFollowers?: number;
    maxFollowers?: number;
    limit?: number;
    source?: InfluencerSource;
  }
): Promise<InfluencerResult[]> {
  const minFollowers = options?.minFollowers || 10000;
  const maxFollowers = options?.maxFollowers || 500000;
  const limit = options?.limit || 50;
  const source = options?.source || 'manual';

  log.info('Starting influencer search', { hashtags, keywords, minFollowers, maxFollowers, limit, source });

  try {
    // Step 1: Search Instagram profiles
    const profiles = await searchInstagramProfiles(hashtags, keywords, limit * 2, source);
    
    log.info(`Found ${profiles.length} profiles, starting classification...`);

    // Step 2: Classify and score each profile
    const results: InfluencerResult[] = [];
    let classificationErrors = 0;
    
    for (const profile of profiles) {
      try {
        // Quick filter by follower count
        if (profile.followers < minFollowers || profile.followers > maxFollowers) {
          continue;
        }

        // Classify using AI
        const classification = await classifyCreatorWithAI(profile);
        
        // Apply filters
        if (!classification.is_india_based || !classification.is_relevant_niche || !classification.is_active) {
          log.info(`Filtered out @${profile.instagram_handle}`, {
            is_india_based: classification.is_india_based,
            is_relevant_niche: classification.is_relevant_niche,
            is_active: classification.is_active,
            fit_score: classification.fit_score
          });
          continue;
        }

        // Only keep if fit score is >= 5
        if (classification.fit_score < 5) {
          log.info(`Filtered out @${profile.instagram_handle} - low fit score`, { fit_score: classification.fit_score });
          continue;
        }

        // Try to find contact info (public data only)
        const contactInfo = await extractPublicContactInfo(profile);
        
        // Calculate final fit score (can be adjusted based on contact info)
        const finalFitScore = calculateFitScore(profile, classification, contactInfo);
        
        results.push({
          ...profile,
          ...classification,
          fit_score: finalFitScore,
          email: contactInfo.email || profile.email,
          manager_email: contactInfo.manager_email || profile.manager_email,
          search_keywords: [...hashtags, ...keywords],
          source,
          data_source_log: {
            source,
            collected_at: new Date().toISOString(),
            method: `public_profile_scraping`,
            public_data_only: true
          }
        });

        // Stop if we have enough results
        if (results.length >= limit) {
          break;
        }
      } catch (error: any) {
        classificationErrors++;
        log.error(`Error processing @${profile.instagram_handle}`, error.message);
        continue;
      }
    }

    log.info(`Search complete`, {
      total_profiles: profiles.length,
      qualified_results: results.length,
      classification_errors: classificationErrors
    });

    return results;
  } catch (error: any) {
    log.error('Fatal error in findInfluencers', error);
    throw error;
  }
}

// ============================================================================
// MODULE 1: SEARCH INSTAGRAM PROFILES
// ============================================================================

/**
 * Search Instagram profiles using public data sources
 * Supports multiple sources: Apify, Phantombuster, Google, Manual
 * Only collects public data in compliance with platform policies
 */
async function searchInstagramProfiles(
  hashtags: string[],
  keywords: string[],
  limit: number,
  preferredSource: InfluencerSource
): Promise<InfluencerProfile[]> {
  log.info('Searching Instagram profiles', { hashtags, keywords, limit, preferredSource });

  // Try sources in order of preference
  const sources: InfluencerSource[] = [preferredSource, 'apify', 'phantombuster', 'google', 'manual'];
  
  for (const source of sources) {
    try {
      let profiles: InfluencerProfile[] = [];
      
      switch (source) {
        case 'apify':
          if (process.env.APIFY_API_TOKEN) {
            profiles = await searchViaApify(hashtags, keywords, limit);
            if (profiles.length > 0) {
              log.info(`Found ${profiles.length} profiles via Apify`);
              return profiles;
            }
          }
          break;
          
        case 'phantombuster':
          if (process.env.PHANTOMBUSTER_API_KEY) {
            profiles = await searchViaPhantombuster(hashtags, keywords, limit);
            if (profiles.length > 0) {
              log.info(`Found ${profiles.length} profiles via Phantombuster`);
              return profiles;
            }
          }
          break;
          
        case 'google':
          profiles = await searchViaGoogle(hashtags, keywords, limit);
          if (profiles.length > 0) {
            log.info(`Found ${profiles.length} profiles via Google`);
            return profiles;
          }
          break;
          
        case 'manual':
          // Manual import - return empty for now
          log.warn('Manual source selected but no manual data provided');
          break;
      }
    } catch (error: any) {
      log.error(`Error searching via ${source}`, error.message);
      continue;
    }
  }

  log.warn('No profiles found from any source');
  return [];
}

/**
 * Search via Apify Instagram Scraper
 * Uses Apify's Instagram scraper to find profiles by hashtags
 */
async function searchViaApify(hashtags: string[], keywords: string[], limit: number): Promise<InfluencerProfile[]> {
  const apiToken = process.env.APIFY_API_TOKEN;
  
  if (!apiToken) {
    log.warn('APIFY_API_TOKEN not configured');
    return [];
  }

  try {
    // Dynamic import to avoid requiring apify-client if not configured
    const { ApifyClient } = await import('apify-client');
    const client = new ApifyClient({ token: apiToken });

    const profiles: InfluencerProfile[] = [];
    const profilesMap = new Map<string, InfluencerProfile>(); // Deduplicate by handle
    
    log.info('Starting Apify search', { hashtags, keywords, limit });

    // Search by hashtags (more reliable than keywords for Instagram)
    for (const hashtag of hashtags.slice(0, 5)) { // Limit to 5 hashtags to avoid rate limits
      try {
        log.info(`Searching Apify for hashtag: #${hashtag}`);
        
        // Run the Instagram scraper actor
        // Apify Instagram scraper supports hashtag search via directUrls with hashtag URLs
        // Format: https://www.instagram.com/explore/tags/{hashtag}/
        const hashtagUrl = `https://www.instagram.com/explore/tags/${hashtag}/`;
        
        const run = await client.actor('apify/instagram-scraper').call({
          directUrls: [hashtagUrl],
          resultsLimit: Math.min(Math.ceil(limit / hashtags.length), 50), // Max 50 per hashtag
          addParentData: true, // Include owner/profile data
          resultsType: 'posts' // Get posts from hashtag page
        });

        log.info(`Apify run completed for #${hashtag}`, { runId: run.id, status: run.status });

        // Wait for the run to finish (it should be synchronous, but check status)
        if (run.status === 'FAILED' || run.status === 'ABORTED') {
          log.error(`Apify run failed for #${hashtag}`, { status: run.status });
          continue;
        }

        // Get results from the dataset
        const datasetResponse = await client.dataset(run.defaultDatasetId).listItems({
          limit: limit,
          offset: 0
        });

        const items = datasetResponse.items || [];
        log.info(`Found ${items.length} items from Apify for #${hashtag}`);

        if (items.length === 0) {
          log.warn(`No items returned from Apify for #${hashtag}`);
          continue;
        }

        // Log first item structure for debugging
        if (items.length > 0) {
          log.info(`Sample Apify item structure for #${hashtag}:`, JSON.stringify(items[0], null, 2).substring(0, 500));
        }

        // Process each item
        for (const item of items) {
          try {
            // Type assertion for Apify item (can be post or profile data)
            const apifyItem = item as any;
            
            // Apify Instagram scraper returns posts, we need to extract unique profiles
            // Try multiple possible field names for username
            const username = apifyItem.ownerUsername || 
                           apifyItem.username || 
                           apifyItem.owner?.username ||
                           apifyItem.user?.username ||
                           apifyItem.author?.username ||
                           apifyItem.profile?.username ||
                           (apifyItem.url && typeof apifyItem.url === 'string' && apifyItem.url.match(/instagram\.com\/([^\/\?]+)/)?.[1]);
            
            if (!username || typeof username !== 'string') {
              log.warn(`Skipping item - no username found`, { 
                itemKeys: Object.keys(apifyItem),
                itemUrl: apifyItem.url 
              });
              continue;
            }

            if (profilesMap.has(username)) {
              continue; // Skip duplicates
            }

            // Extract profile data from post data - try multiple field variations
            const followers = apifyItem.ownerFollowersCount || 
                            apifyItem.followersCount || 
                            apifyItem.owner?.followersCount ||
                            apifyItem.user?.followersCount ||
                            apifyItem.author?.followersCount ||
                            apifyItem.profile?.followersCount ||
                            0;

            const profile: InfluencerProfile = {
              creator_name: apifyItem.ownerFullName || 
                           apifyItem.fullName || 
                           apifyItem.owner?.fullName ||
                           apifyItem.user?.fullName ||
                           apifyItem.author?.fullName ||
                           username || 
                           'Unknown',
              instagram_handle: username,
              followers: typeof followers === 'number' ? followers : 0,
              bio: apifyItem.ownerBiography || 
                   apifyItem.biography || 
                   apifyItem.owner?.biography ||
                   apifyItem.user?.biography ||
                   apifyItem.author?.biography ||
                   '',
              link_in_bio: apifyItem.ownerExternalUrl || 
                          apifyItem.externalUrl || 
                          apifyItem.owner?.externalUrl ||
                          apifyItem.user?.externalUrl ||
                          undefined,
              profile_link: `https://instagram.com/${username}`,
              posts_count: apifyItem.ownerPostsCount || 
                          apifyItem.postsCount || 
                          apifyItem.owner?.postsCount ||
                          apifyItem.user?.postsCount ||
                          0,
              is_verified: apifyItem.ownerIsVerified || 
                          apifyItem.isVerified || 
                          apifyItem.owner?.isVerified ||
                          apifyItem.user?.isVerified ||
                          false,
              avatar_url: apifyItem.ownerProfilePicUrl || 
                         apifyItem.profilePicUrl || 
                         apifyItem.owner?.profilePicUrl ||
                         apifyItem.user?.profilePicUrl ||
                         undefined,
              location: apifyItem.locationName || 
                       apifyItem.location?.name ||
                       undefined
            };

            // Log extraction attempt
            log.info(`Extracted profile from Apify item: @${username}`, {
              followers: profile.followers,
              hasBio: !!profile.bio,
              hasLink: !!profile.link_in_bio
            });

            // Only add if has minimum followers (even 0 is okay, we'll filter later)
            profilesMap.set(username, profile);
            log.info(`Added profile from Apify: @${username} (${profile.followers} followers)`);

            // Stop if we have enough profiles
            if (profilesMap.size >= limit) {
              break;
            }
          } catch (itemError: any) {
            log.error(`Error processing Apify item`, {
              message: itemError.message,
              stack: itemError.stack,
              itemKeys: item ? Object.keys(item) : 'null'
            });
            continue;
          }
        }

        // Stop if we have enough profiles
        if (profilesMap.size >= limit) {
          break;
        }
      } catch (error: any) {
        log.error(`Error searching Apify for hashtag #${hashtag}`, {
          message: error.message,
          stack: error.stack,
          details: error
        });
        // Continue with next hashtag
        continue;
      }
    }

    const finalProfiles = Array.from(profilesMap.values()).slice(0, limit);
    log.info(`Apify search completed: found ${finalProfiles.length} unique profiles`);
    
    return finalProfiles;
  } catch (error: any) {
    log.error('Apify integration error', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    return [];
  }
}

/**
 * Search via Phantombuster
 */
async function searchViaPhantombuster(hashtags: string[], keywords: string[], limit: number): Promise<InfluencerProfile[]> {
  // TODO: Implement Phantombuster integration
  log.info('Phantombuster integration not yet implemented');
  return [];
}

/**
 * Search via Google (fallback method)
 * Uses Google search to find Instagram profiles
 */
async function searchViaGoogle(hashtags: string[], keywords: string[], limit: number): Promise<InfluencerProfile[]> {
  const profiles: InfluencerProfile[] = [];
  
  // Search queries like: "site:instagram.com #fitnessindia" or "site:instagram.com fitness influencer india"
  const searchQueries = [
    ...hashtags.map(h => `site:instagram.com ${h} india`),
    ...keywords.map(k => `site:instagram.com ${k} influencer india`)
  ];

  log.info('Google search integration - placeholder', { searchQueries });
  
  // TODO: Implement actual Google Custom Search API
  // You would use Google Custom Search API or scraping (respecting ToS)
  
  return profiles;
}

// ============================================================================
// MODULE 2: CLASSIFY CREATOR WITH AI
// ============================================================================

/**
 * Classify influencer using AI
 * Determines niche, fit score, location, and relevance
 * Production-ready with deterministic scoring where possible
 */
async function classifyCreatorWithAI(profile: InfluencerProfile): Promise<InfluencerClassification> {
  log.info(`Classifying @${profile.instagram_handle}`);

  const prompt = `You are an AI assistant helping Creator Armour find relevant Indian influencers.

Analyze this Instagram profile and classify it:

Profile Details:
- Username: @${profile.instagram_handle}
- Name: ${profile.creator_name}
- Bio: ${profile.bio || 'Not provided'}
- Followers: ${profile.followers.toLocaleString()}
- Link in bio: ${profile.link_in_bio || 'Not provided'}
- Location: ${profile.location || 'Not specified'}
- Last post: ${profile.last_post_date ? profile.last_post_date.toISOString().split('T')[0] : 'Unknown'}
- Posts count: ${profile.posts_count || 'Unknown'}

Your tasks:
1. Classify the niche (fitness, fashion, beauty, tech, lifestyle, UGC, food, travel, comedy, education, etc.)
2. Determine if they are India-based (check bio, location, content language)
3. Check if they are in a relevant niche for Creator Armour (fashion, beauty, fitness, lifestyle, tech, UGC)
4. Assess if they are active (posting regularly in last 30 days)
5. Calculate a Fit Score (1-10) based on:
   - Relevance to Creator Armour (contracts, payments, creator protection)
   - Engagement quality (not just follower count)
   - Content quality indicators
   - Professionalism (has website, email, etc.)
   - India-based (higher score if India-based)
   - Active posting (higher score if active)

Exclude:
- Meme pages
- Brand pages
- Inactive accounts (no posts in 30+ days)
- Fake/inflated profiles (suspicious follower-to-engagement ratio)

Return ONLY a valid JSON object with this exact structure:
{
  "niche": "<niche category>",
  "fit_score": <number 1-10>,
  "is_india_based": <boolean>,
  "is_relevant_niche": <boolean>,
  "is_active": <boolean>,
  "reasoning": "<brief explanation of classification>",
  "confidence": <number 0-1>,
  "classification_metadata": {
    "detected_location": "<location if detected>",
    "detected_niche": "<niche>",
    "niche_confidence": <number 0-1>,
    "activity_score": <number 0-1>,
    "relevance_factors": ["<factor1>", "<factor2>"],
    "classification_source": "ai"
  }
}`;

  try {
    const response = await callLLM(prompt);
    
    // Extract JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const classification = JSON.parse(jsonMatch[0]) as InfluencerClassification;
    
    // Validate and normalize
    if (!classification.niche || !classification.fit_score) {
      throw new Error('Invalid classification response');
    }
    
    // Ensure fit_score is between 1-10 (deterministic normalization)
    classification.fit_score = Math.max(1, Math.min(10, Math.round(classification.fit_score)));
    
    // Ensure booleans are set
    classification.is_india_based = Boolean(classification.is_india_based);
    classification.is_relevant_niche = Boolean(classification.is_relevant_niche);
    classification.is_active = Boolean(classification.is_active);
    
    // Ensure confidence is 0-1
    classification.confidence = Math.max(0, Math.min(1, classification.confidence || 0.5));
    
    log.info(`Classification complete for @${profile.instagram_handle}`, {
      niche: classification.niche,
      fit_score: classification.fit_score,
      confidence: classification.confidence
    });
    
    return classification;
  } catch (error: any) {
    log.error(`AI classification error for @${profile.instagram_handle}`, error.message);
    
    // Fallback classification (deterministic)
    return {
      niche: 'unknown',
      fit_score: 5,
      is_india_based: false,
      is_relevant_niche: false,
      is_active: true,
      reasoning: 'AI classification failed, using fallback',
      confidence: 0.0,
      classification_metadata: {
        relevance_factors: [],
        classification_source: 'fallback'
      }
    };
  }
}

// ============================================================================
// MODULE 3: EXTRACT PUBLIC CONTACT INFO
// ============================================================================

/**
 * Find contact information (email, manager email) from public sources only
 * Never accesses private data or DMs
 */
async function extractPublicContactInfo(profile: InfluencerProfile): Promise<{ email?: string; manager_email?: string }> {
  log.info(`Extracting contact info for @${profile.instagram_handle}`);
  
  const contactInfo: { email?: string; manager_email?: string } = {};
  
  // Check link-in-bio for contact info (public data)
  if (profile.link_in_bio) {
    try {
      const linkInfo = await extractContactFromLink(profile.link_in_bio);
      if (linkInfo.email) contactInfo.email = linkInfo.email;
      if (linkInfo.manager_email) contactInfo.manager_email = linkInfo.manager_email;
    } catch (error) {
      log.warn(`Error extracting contact from link for @${profile.instagram_handle}`, error);
    }
  }
  
  // Check website if available (public data)
  if (profile.website) {
    try {
      const websiteInfo = await extractContactFromWebsite(profile.website);
      if (websiteInfo.email && !contactInfo.email) contactInfo.email = websiteInfo.email;
      if (websiteInfo.manager_email && !contactInfo.manager_email) contactInfo.manager_email = websiteInfo.manager_email;
    } catch (error) {
      log.warn(`Error extracting contact from website for @${profile.instagram_handle}`, error);
    }
  }
  
  // Try Google search for email (public data only)
  if (!contactInfo.email) {
    try {
      const email = await searchEmailViaGoogle(profile.instagram_handle, profile.creator_name);
      if (email) contactInfo.email = email;
    } catch (error) {
      log.warn(`Error searching email via Google for @${profile.instagram_handle}`, error);
    }
  }
  
  log.info(`Contact info extracted for @${profile.instagram_handle}`, {
    has_email: !!contactInfo.email,
    has_manager_email: !!contactInfo.manager_email
  });
  
  return contactInfo;
}

/**
 * Extract contact info from link-in-bio (Linktree, Beacons, etc.)
 * Only accesses public pages
 */
async function extractContactFromLink(linkUrl: string): Promise<{ email?: string; manager_email?: string }> {
  try {
    const response = await axios.get(linkUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreatorArmour/1.0; +https://creatorarmour.com)'
      }
    });
    
    const html = response.data;
    
    // Extract email patterns (public data only)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = html.match(emailRegex) || [];
    
    // Filter out common non-contact emails
    const contactEmails = emails.filter(email => 
      !email.includes('example.com') &&
      !email.includes('test.com') &&
      !email.includes('placeholder')
    );
    
    // Look for manager/collaboration emails
    const managerEmailRegex = /(collab|manager|business|contact|work|pr)[\s:]*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const managerMatches = html.match(managerEmailRegex) || [];
    
    return {
      email: contactEmails[0] || undefined,
      manager_email: managerMatches.length > 0 ? managerMatches[0].split(/[\s:]+/)[1] : undefined
    };
  } catch (error) {
    return {};
  }
}

/**
 * Extract contact info from website (public pages only)
 */
async function extractContactFromWebsite(websiteUrl: string): Promise<{ email?: string; manager_email?: string }> {
  try {
    // Try common contact page URLs (public pages only)
    const contactUrls = [
      `${websiteUrl}/contact`,
      `${websiteUrl}/collab`,
      `${websiteUrl}/collaborate`,
      `${websiteUrl}/work-with-me`,
      websiteUrl
    ];
    
    for (const url of contactUrls) {
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CreatorArmour/1.0)'
          }
        });
        
        const html = response.data;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const emails = html.match(emailRegex) || [];
        
        if (emails.length > 0) {
          return {
            email: emails[0],
            manager_email: emails.find(e => e.includes('collab') || e.includes('manager') || e.includes('business'))
          };
        }
      } catch (error) {
        continue;
      }
    }
    
    return {};
  } catch (error) {
    return {};
  }
}

/**
 * Search for email via Google (public data only)
 */
async function searchEmailViaGoogle(instagramHandle: string, creatorName: string): Promise<string | undefined> {
  // Use Google Custom Search API or similar
  // Queries like: "site:instagram.com @username email"
  // This is a placeholder - implement with actual Google Search API
  
  log.info('Google email search - placeholder', { instagramHandle, creatorName });
  return undefined;
}

// ============================================================================
// MODULE 4: CALCULATE FIT SCORE
// ============================================================================

/**
 * Calculate final fit score based on profile, classification, and contact info
 * Deterministic scoring where possible
 */
function calculateFitScore(
  profile: InfluencerProfile,
  classification: InfluencerClassification,
  contactInfo: { email?: string; manager_email?: string }
): number {
  let score = classification.fit_score;
  
  // Adjustments based on contact info availability (deterministic)
  if (contactInfo.email) {
    score += 0.5; // Bonus for having email
  }
  if (contactInfo.manager_email) {
    score += 0.3; // Bonus for having manager email
  }
  if (profile.website) {
    score += 0.2; // Bonus for having website
  }
  
  // Normalize back to 1-10 range
  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  
  return score;
}

// ============================================================================
// MODULE 5: SAVE OR UPDATE INFLUENCER
// ============================================================================

/**
 * Save or update influencer in database
 * Handles deduplication by instagram_handle
 */
export async function saveOrUpdateInfluencer(influencer: InfluencerResult): Promise<void> {
  try {
    const { error } = await supabase
      .from('influencers')
      .upsert({
        instagram_handle: influencer.instagram_handle,
        creator_name: influencer.creator_name,
        followers: influencer.followers,
        niche: influencer.niche,
        email: influencer.email,
        website: influencer.website,
        manager_email: influencer.manager_email,
        fit_score: influencer.fit_score,
        profile_link: influencer.profile_link,
        bio: influencer.bio,
        link_in_bio: influencer.link_in_bio,
        location: influencer.location,
        last_post_date: influencer.last_post_date 
          ? (influencer.last_post_date instanceof Date 
              ? influencer.last_post_date.toISOString().split('T')[0] 
              : influencer.last_post_date)
          : null,
        is_active: influencer.is_active,
        is_india_based: influencer.is_india_based,
        is_relevant_niche: influencer.is_relevant_niche,
        source: influencer.source,
        search_keywords: influencer.search_keywords,
        classification_metadata: influencer.classification_metadata,
        data_source_log: influencer.data_source_log,
        last_checked_at: new Date().toISOString(),
        last_classification_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instagram_handle'
      });

    if (error) {
      log.error(`Error saving @${influencer.instagram_handle}`, error);
      throw error;
    }
    
    log.info(`Saved/updated @${influencer.instagram_handle}`);
  } catch (error: any) {
    log.error(`Error saving influencer`, error);
    throw error;
  }
}

/**
 * Save multiple influencers to database
 */
export async function saveInfluencersToDatabase(influencers: InfluencerResult[]): Promise<void> {
  log.info(`Saving ${influencers.length} influencers to database`);
  
  for (const influencer of influencers) {
    try {
      await saveOrUpdateInfluencer(influencer);
    } catch (error: any) {
      log.error(`Error saving @${influencer.instagram_handle}`, error);
      // Continue with next influencer
    }
  }
  
  log.info(`Saved ${influencers.length} influencers to database`);
}

/**
 * Get influencers from database
 */
export async function getInfluencersFromDatabase(filters?: {
  minFitScore?: number;
  status?: 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted';
  alreadyContacted?: boolean;
  niche?: string;
  limit?: number;
}): Promise<InfluencerResult[]> {
  let query = supabase
    .from('influencers')
    .select('*')
    .order('fit_score', { ascending: false });

  if (filters?.minFitScore) {
    query = query.gte('fit_score', filters.minFitScore);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.alreadyContacted !== undefined) {
    query = query.eq('already_contacted', filters.alreadyContacted);
  }

  if (filters?.niche) {
    query = query.eq('niche', filters.niche);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Error getting influencers from database', error);
    throw error;
  }

  return (data || []) as InfluencerResult[];
}

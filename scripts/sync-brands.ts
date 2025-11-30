/**
 * Brand Directory Sync Script
 * 
 * This script syncs brands from various sources:
 * 1. Marketplace scraping (influencer.in, Winkl, Collabstr)
 * 2. Public brand data (web scraping)
 * 3. Self-signup brands (already in database)
 * 
 * Run this script periodically (daily/weekly) to keep the brand directory fresh.
 * 
 * Usage:
 *   npm run sync-brands
 *   or
 *   tsx scripts/sync-brands.ts
 * 
 * Dependencies:
 *   npm install cheerio playwright @types/cheerio --save-dev
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Dynamic imports for optional dependencies
let cheerio: any;
let chromium: any;

const require = createRequire(import.meta.url);
try {
  cheerio = require('cheerio');
  const playwright = require('playwright');
  chromium = playwright.chromium;
} catch (error) {
  console.warn('⚠️  Scraping dependencies not installed. Run: npm install cheerio playwright @types/cheerio --save-dev');
  console.warn('   Continuing without scraping functionality...\n');
}

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Security: Validate that URLs are external (not pointing to our own servers)
function isValidExternalUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Block internal/localhost URLs and our own domains
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'noticebazaar.com',
      'noticebazaar.vercel.app',
      'noticebazaar.netlify.app',
      'supabase.co' // Block Supabase admin URLs
    ];
    const hostname = parsed.hostname.toLowerCase();
    return !blockedHosts.some(blocked => hostname.includes(blocked));
  } catch {
    return false;
  }
}

interface BrandSource {
  name: string;
  industry: string;
  description?: string;
  website_url?: string;
  budget_min?: number;
  budget_max?: number;
  verified?: boolean;
  source: 'marketplace' | 'scraped' | 'self-signup' | 'manual';
  external_id?: string;
}

interface OpportunitySource {
  brand_name: string;
  brand_industry: string;
  title: string;
  description?: string;
  deliverable_type: string;
  payout_min: number;
  payout_max: number;
  deadline: string;
  min_followers?: number;
  required_platforms?: string[];
  required_categories?: string[];
  campaign_start_date?: string;
  campaign_end_date?: string;
  deliverables_description?: string;
  source: 'influencer.in' | 'winkl' | 'collabstr';
  external_id: string;
  apply_url?: string; // URL to original marketplace where creator can apply
}

// Helper functions

function extractDate(text: string): string | null {
  if (!text) return null;
  
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  return null;
}

function parseAmount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[₹Rs.,INRUSD$]/gi, '').trim().toLowerCase();
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return 0;
  
  const num = parseFloat(numMatch[1]);
  const multiplier = cleaned.includes('k') ? 1000 : 
                    cleaned.includes('m') ? 1000000 : 
                    cleaned.includes('l') ? 100000 : 1;
  return Math.round(num * multiplier);
}

function parseFollowers(text: string): number | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(/,/g, '').toLowerCase();
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return undefined;
  
  const num = parseFloat(numMatch[1]);
  const multiplier = cleaned.includes('k') ? 1000 : 
                    cleaned.includes('m') ? 1000000 : 1;
  return Math.round(num * multiplier);
}

function extractDeliverableType(text: string): string {
  if (!text) return 'post';
  const lower = text.toLowerCase();
  if (lower.includes('reel')) return 'reel';
  if (lower.includes('story') || lower.includes('stories')) return 'story';
  if (lower.includes('video')) return 'video';
  if (lower.includes('blog') || lower.includes('article')) return 'blog';
  if (lower.includes('integration') || lower.includes('affiliate')) return 'integration';
  return 'post'; // Default
}

function extractIndustry(brandName: string, description: string): string {
  const text = `${brandName} ${description || ''}`.toLowerCase();
  
  if (text.match(/\b(fashion|clothing|apparel|style|wear)\b/)) return 'Fashion';
  if (text.match(/\b(beauty|skincare|cosmetic|makeup)\b/)) return 'Beauty & Skincare';
  if (text.match(/\b(fitness|gym|workout|health|sport)\b/)) return 'Sports & Fitness';
  if (text.match(/\b(tech|electronics|gadget|software|phone|mobile)\b/)) return 'Electronics';
  if (text.match(/\b(food|restaurant|cafe|recipe|beverage)\b/)) return 'Food & Beverage';
  if (text.match(/\b(travel|hotel|trip|tourism)\b/)) return 'Travel';
  if (text.match(/\b(education|course|learning|online)\b/)) return 'Education';
  if (text.match(/\b(ecommerce|shopping|retail)\b/)) return 'E-commerce';
  
  return 'General';
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Scrape influencer.in campaigns
 */
async function scrapeInfluencerIn(): Promise<OpportunitySource[]> {
  if (!cheerio || !chromium) {
    console.log('⏭️  Skipping influencer.in (dependencies not installed)');
    return [];
  }
  
  console.log('🕷️  Scraping influencer.in...');
  const opportunities: OpportunitySource[] = [];
  
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    // Navigate to campaigns page
    await page.goto('https://influencer.in/campaigns', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(3000);
    
    // Try multiple selectors for campaign cards
    const selectors = [
      '.campaign-card',
      '[class*="campaign"]',
      '[data-testid*="campaign"]',
      'article',
      '.card'
    ];
    
    let found = false;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        found = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!found) {
      console.warn('⚠️  Could not find campaign elements on influencer.in');
      await browser.close();
      return [];
    }
    
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Extract campaigns with multiple selector strategies
    const campaignSelectors = [
      '.campaign-card',
      '[class*="campaign-card"]',
      '[data-testid*="campaign"]',
      'article',
      '.card'
    ];
    
    campaignSelectors.forEach(selector => {
      $(selector).each((_: any, element: any) => {
        try {
          const $el = $(element);
          const text = $el.text();
          
          // Skip if too short (likely not a campaign)
          if (text.length < 50) return;
          
          // Extract brand name
          const brandName = $el.find('.brand-name, [class*="brand"], h3, h4, h2').first().text().trim() || 
                          text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)?.[0] || 
                          'Unknown Brand';
          
          // Extract title
          const title = $el.find('.campaign-title, .title, [class*="title"], h2, h3').first().text().trim() || 
                       brandName;
          
          // Extract description
          const description = $el.find('.description, [class*="description"], p').first().text().trim() || 
                            text.substring(0, 200);
          
          // Extract budget (look for ₹, $, or numbers)
          const budgetText = $el.find('.budget, [class*="budget"], [class*="price"], [class*="amount"]').text() || text;
          const budgetMatch = budgetText.match(/(?:₹|Rs\.?|INR|USD|\$)\s*(\d+(?:,\d+)*(?:K|k|L|l)?)\s*(?:-|to|–)?\s*(?:₹|Rs\.?|INR|USD|\$)?\s*(\d+(?:,\d+)*(?:K|k|L|l)?)/gi);
          let payoutMin = 0;
          let payoutMax = 0;
          
          if (budgetMatch && budgetMatch.length > 0) {
            const amounts = budgetMatch.map(m => parseAmount(m));
            payoutMin = Math.min(...amounts.filter(a => a > 0));
            payoutMax = Math.max(...amounts.filter(a => a > 0));
          }
          
          // Extract deadline
          const deadlineText = $el.find('.deadline, [class*="deadline"], [class*="date"], [class*="end"]').text() || text;
          const deadline = extractDate(deadlineText) || addDays(new Date(), 30).toISOString().split('T')[0];
          
          // Extract platforms
          const platforms: string[] = [];
          const platformText = text.toLowerCase();
          if (platformText.includes('instagram') || platformText.includes('ig')) platforms.push('instagram');
          if (platformText.includes('youtube') || platformText.includes('yt')) platforms.push('youtube');
          if (platformText.includes('tiktok')) platforms.push('tiktok');
          if (platformText.includes('twitter') || platformText.includes('x.com')) platforms.push('twitter');
          
          // Extract deliverable type
          const deliverableType = extractDeliverableType(text);
          
          // Extract min followers
          const followersText = $el.find('[class*="follower"], [class*="reach"], [class*="audience"]').text() || text;
          const followersMatch = followersText.match(/(\d+(?:,\d+)*(?:K|k|M|m)?)\s*(?:followers|subscribers|audience)/i);
          const minFollowers = followersMatch ? parseFollowers(followersMatch[1]) : undefined;
          
          // Get external ID and apply URL from link
          const link = $el.find('a').attr('href');
          let applyUrl: string | undefined;
          let externalId: string;
          
          if (link) {
            // Make absolute URL if relative
            const candidateUrl = link.startsWith('http') ? link : `https://influencer.in${link.startsWith('/') ? link : '/' + link}`;
            // Validate it's external and safe
            if (isValidExternalUrl(candidateUrl)) {
              applyUrl = candidateUrl;
            } else {
              console.warn(`⚠️  Skipping internal/blocked URL: ${candidateUrl}`);
            }
            externalId = `influencer_in_${link.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '_')}`;
          } else {
            externalId = `influencer_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          // Log warning if apply_url missing
          if (!applyUrl && title.length > 3) {
            console.warn(`⚠️  No apply_url found for opportunity: ${title}`);
          }
          
          // Only add if we have meaningful data
          if (brandName !== 'Unknown Brand' && title.length > 3) {
            opportunities.push({
              brand_name: brandName,
              brand_industry: extractIndustry(brandName, description),
              title,
              description: description.length > 0 ? description : undefined,
              deliverable_type: deliverableType,
              payout_min: payoutMin,
              payout_max: payoutMax || payoutMin,
              deadline,
              min_followers: minFollowers,
              required_platforms: platforms.length > 0 ? platforms : undefined,
              source: 'influencer.in',
              external_id: externalId,
              apply_url: applyUrl
            });
          }
        } catch (error) {
          // Skip this element if parsing fails
        }
      });
    });
    
    await browser.close();
    console.log(`✅ Found ${opportunities.length} campaigns from influencer.in`);
  } catch (error: any) {
    console.error('❌ Error scraping influencer.in:', error.message);
  }
  
  return opportunities;
}

/**
 * Scrape Winkl campaigns
 */
async function scrapeWinkl(): Promise<OpportunitySource[]> {
  if (!cheerio || !chromium) {
    console.log('⏭️  Skipping Winkl (dependencies not installed)');
    return [];
  }
  
  console.log('🕷️  Scraping Winkl...');
  const opportunities: OpportunitySource[] = [];
  
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    await page.goto('https://winkl.co/campaigns', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    const selectors = [
      '.campaign',
      '[class*="campaign"]',
      '[data-cy*="campaign"]',
      'article',
      '.card'
    ];
    
    let found = false;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        found = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!found) {
      console.warn('⚠️  Could not find campaign elements on Winkl');
      await browser.close();
      return [];
    }
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const campaignSelectors = [
      '.campaign',
      '[class*="campaign-item"]',
      '[data-cy*="campaign"]',
      'article',
      '.card'
    ];
    
    campaignSelectors.forEach(selector => {
      $(selector).each((_: any, element: any) => {
        try {
          const $el = $(element);
          const text = $el.text();
          
          if (text.length < 50) return;
          
          const brandName = $el.find('.brand, [class*="brand-name"], h2, h3').first().text().trim() || 
                          text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)?.[0] || 
                          'Unknown Brand';
          
          const title = $el.find('.title, h2, h3, [class*="campaign-title"]').first().text().trim() || brandName;
          const description = $el.find('.description, [class*="desc"], p').first().text().trim() || text.substring(0, 200);
          
          // Extract budget
          const budgetText = $el.find('.budget, [class*="budget"], [class*="price"]').text() || text;
          const budgetMatch = budgetText.match(/(?:₹|Rs\.?|INR|USD|\$)\s*(\d+(?:,\d+)*(?:K|k|L|l)?)\s*(?:-|to|–)\s*(?:₹|Rs\.?|INR|USD|\$)?\s*(\d+(?:,\d+)*(?:K|k|L|l)?)/i);
          let payoutMin = 0;
          let payoutMax = 0;
          
          if (budgetMatch) {
            payoutMin = parseAmount(budgetMatch[1]);
            payoutMax = parseAmount(budgetMatch[2] || budgetMatch[1]);
          } else {
            const singleMatch = budgetText.match(/(?:₹|Rs\.?|INR|USD|\$)\s*(\d+(?:,\d+)*(?:K|k|L|l)?)/i);
            if (singleMatch) {
              payoutMin = parseAmount(singleMatch[1]);
              payoutMax = payoutMin;
            }
          }
          
          const deadlineText = $el.find('.deadline, [class*="deadline"], [class*="end-date"]').text() || text;
          const deadline = extractDate(deadlineText) || addDays(new Date(), 30).toISOString().split('T')[0];
          
          const platforms: string[] = [];
          const platformText = text.toLowerCase();
          if (platformText.includes('instagram')) platforms.push('instagram');
          if (platformText.includes('youtube')) platforms.push('youtube');
          if (platformText.includes('tiktok')) platforms.push('tiktok');
          
          const deliverableType = extractDeliverableType(text);
          
          const link = $el.find('a').attr('href');
          let applyUrl: string | undefined;
          let externalId: string;
          
          if (link) {
            const candidateUrl = link.startsWith('http') ? link : `https://winkl.co${link.startsWith('/') ? link : '/' + link}`;
            if (isValidExternalUrl(candidateUrl)) {
              applyUrl = candidateUrl;
            } else {
              console.warn(`⚠️  Skipping internal/blocked URL: ${candidateUrl}`);
            }
            externalId = `winkl_${link.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '_')}`;
          } else {
            externalId = `winkl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          if (!applyUrl && title.length > 3) {
            console.warn(`⚠️  No apply_url found for opportunity: ${title}`);
          }
          
          if (brandName !== 'Unknown Brand' && title.length > 3) {
            opportunities.push({
              brand_name: brandName,
              brand_industry: extractIndustry(brandName, description),
              title,
              description: description.length > 0 ? description : undefined,
              deliverable_type: deliverableType,
              payout_min: payoutMin,
              payout_max: payoutMax || payoutMin,
              deadline,
              required_platforms: platforms.length > 0 ? platforms : undefined,
              source: 'winkl',
              external_id: externalId,
              apply_url: applyUrl
            });
          }
        } catch (error) {
          // Skip this element
        }
      });
    });
    
    await browser.close();
    console.log(`✅ Found ${opportunities.length} campaigns from Winkl`);
  } catch (error: any) {
    console.error('❌ Error scraping Winkl:', error.message);
  }
  
  return opportunities;
}

/**
 * Scrape Collabstr campaigns
 */
async function scrapeCollabstr(): Promise<OpportunitySource[]> {
  if (!cheerio || !chromium) {
    console.log('⏭️  Skipping Collabstr (dependencies not installed)');
    return [];
  }
  
  console.log('🕷️  Scraping Collabstr...');
  const opportunities: OpportunitySource[] = [];
  
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    await page.goto('https://collabstr.com/campaigns', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Scroll to load more (if infinite scroll)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    const selectors = [
      '.campaign-card',
      '[class*="CampaignCard"]',
      '[data-testid*="campaign"]',
      'article',
      '.card'
    ];
    
    let found = false;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        found = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!found) {
      console.warn('⚠️  Could not find campaign elements on Collabstr');
      await browser.close();
      return [];
    }
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const campaignSelectors = [
      '.campaign-card',
      '[class*="CampaignCard"]',
      '[class*="campaign-card"]',
      'article',
      '.card'
    ];
    
    campaignSelectors.forEach(selector => {
      $(selector).each((_: any, element: any) => {
        try {
          const $el = $(element);
          const text = $el.text();
          
          if (text.length < 50) return;
          
          const brandName = $el.find('.brand-name, [class*="Brand"], h3, h4').first().text().trim() || 
                          text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)?.[0] || 
                          'Unknown Brand';
          
          const title = $el.find('.title, h2, h3, [class*="Title"]').first().text().trim() || brandName;
          const description = $el.find('.description, [class*="Description"], p').first().text().trim() || text.substring(0, 200);
          
          // Collabstr usually shows budget clearly
          const budgetText = $el.find('.budget, [class*="Budget"], [class*="Price"]').text() || text;
          const budgetMatch = budgetText.match(/(\d+(?:,\d+)*(?:K|k|M|m)?)\s*(?:-|to|–)\s*(\d+(?:,\d+)*(?:K|k|M|m)?)/i) ||
                            budgetText.match(/(?:₹|Rs\.?|INR|USD|\$)\s*(\d+(?:,\d+)*(?:K|k|M|m)?)/i);
          
          let payoutMin = 0;
          let payoutMax = 0;
          
          if (budgetMatch) {
            if (budgetMatch[2]) {
              payoutMin = parseAmount(budgetMatch[1]);
              payoutMax = parseAmount(budgetMatch[2]);
            } else {
              payoutMin = parseAmount(budgetMatch[1]);
              payoutMax = payoutMin;
            }
          }
          
          const deadlineText = $el.find('.deadline, [class*="Deadline"], [class*="Date"]').text() || text;
          const deadline = extractDate(deadlineText) || addDays(new Date(), 30).toISOString().split('T')[0];
          
          const platforms: string[] = [];
          const platformText = text.toLowerCase();
          if (platformText.includes('instagram')) platforms.push('instagram');
          if (platformText.includes('youtube')) platforms.push('youtube');
          if (platformText.includes('tiktok')) platforms.push('tiktok');
          if (platformText.includes('twitter')) platforms.push('twitter');
          
          const deliverableType = extractDeliverableType(text);
          
          const link = $el.find('a').attr('href');
          let applyUrl: string | undefined;
          let externalId: string;
          
          if (link) {
            const candidateUrl = link.startsWith('http') ? link : `https://collabstr.com${link.startsWith('/') ? link : '/' + link}`;
            if (isValidExternalUrl(candidateUrl)) {
              applyUrl = candidateUrl;
            } else {
              console.warn(`⚠️  Skipping internal/blocked URL: ${candidateUrl}`);
            }
            externalId = `collabstr_${link.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '_')}`;
          } else {
            externalId = `collabstr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          if (!applyUrl && title.length > 3) {
            console.warn(`⚠️  No apply_url found for opportunity: ${title}`);
          }
          
          if (brandName !== 'Unknown Brand' && title.length > 3) {
            opportunities.push({
              brand_name: brandName,
              brand_industry: extractIndustry(brandName, description),
              title,
              description: description.length > 0 ? description : undefined,
              deliverable_type: deliverableType,
              payout_min: payoutMin,
              payout_max: payoutMax || payoutMin,
              deadline,
              required_platforms: platforms.length > 0 ? platforms : undefined,
              source: 'collabstr',
              external_id: externalId,
              apply_url: applyUrl
            });
          }
        } catch (error) {
          // Skip this element
        }
      });
    });
    
    await browser.close();
    console.log(`✅ Found ${opportunities.length} campaigns from Collabstr`);
  } catch (error: any) {
    console.error('❌ Error scraping Collabstr:', error.message);
  }
  
  return opportunities;
}

/**
 * Process and deduplicate brands
 */
function deduplicateBrands(brands: BrandSource[]): BrandSource[] {
  const seen = new Map<string, BrandSource>();
  
  for (const brand of brands) {
    const key = brand.name.toLowerCase().trim();
    
    if (!seen.has(key)) {
      seen.set(key, brand);
    } else {
      // Merge data if we have more complete info
      const existing = seen.get(key)!;
      if (!existing.description && brand.description) {
        existing.description = brand.description;
      }
      if (!existing.website_url && brand.website_url) {
        existing.website_url = brand.website_url;
      }
      // Prefer verified status
      if (brand.verified && !existing.verified) {
        existing.verified = brand.verified;
      }
      // Expand budget range
      if (brand.budget_min && (!existing.budget_min || brand.budget_min < existing.budget_min)) {
        existing.budget_min = brand.budget_min;
      }
      if (brand.budget_max && (!existing.budget_max || brand.budget_max > existing.budget_max)) {
        existing.budget_max = brand.budget_max;
      }
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Get or create brand from opportunity data
 */
async function getOrCreateBrand(brandData: {
  name: string;
  industry: string;
  source: 'scraped' | 'marketplace';
  external_id: string;
  budget_min?: number;
  budget_max?: number;
}): Promise<string> {
  // Check if brand exists by name
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .eq('name', brandData.name)
    .single();
  
  if (existing) {
    // Update budget range if wider
    if (brandData.budget_min || brandData.budget_max) {
      const { data: current } = await supabase
        .from('brands')
        .select('budget_min, budget_max')
        .eq('id', existing.id)
        .single();
      
      if (current) {
        const updateData: any = {};
        if (brandData.budget_min && (!current.budget_min || brandData.budget_min < current.budget_min)) {
          updateData.budget_min = brandData.budget_min;
        }
        if (brandData.budget_max && (!current.budget_max || brandData.budget_max > current.budget_max)) {
          updateData.budget_max = brandData.budget_max;
        }
        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('brands')
            .update(updateData)
            .eq('id', existing.id);
        }
      }
    }
    return existing.id;
  }
  
  // Create new brand
  const { data: newBrand, error } = await supabase
    .from('brands')
    .insert({
      name: brandData.name,
      industry: brandData.industry,
      source: brandData.source,
      external_id: brandData.external_id,
      budget_min: brandData.budget_min || null,
      budget_max: brandData.budget_max || null,
      status: 'active',
      verified: false
    })
    .select('id')
    .single();
  
  if (error || !newBrand) {
    throw new Error(`Failed to create brand: ${brandData.name} - ${error?.message}`);
  }
  
  return newBrand.id;
}

/**
 * Upsert brands into database
 */
async function upsertBrands(brands: BrandSource[]): Promise<void> {
  console.log(`💾 Upserting ${brands.length} brands...`);
  
  for (const brand of brands) {
    try {
      // Check if brand exists
      const { data: existing } = await supabase
        .from('brands')
        .select('id')
        .eq('name', brand.name)
        .single();
      
      if (existing) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update({
            industry: brand.industry,
            description: brand.description || null,
            website_url: brand.website_url || null,
            budget_min: brand.budget_min || null,
            budget_max: brand.budget_max || null,
            verified: brand.verified || false,
            source: brand.source,
            external_id: brand.external_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) {
          console.error(`❌ Failed to update brand ${brand.name}:`, error.message);
        } else {
          console.log(`✅ Updated: ${brand.name}`);
        }
      } else {
        // Insert new brand
        const { error } = await supabase
          .from('brands')
          .insert({
            name: brand.name,
            industry: brand.industry,
            description: brand.description || null,
            website_url: brand.website_url || null,
            budget_min: brand.budget_min || null,
            budget_max: brand.budget_max || null,
            verified: brand.verified || false,
            source: brand.source,
            external_id: brand.external_id || null,
            status: 'active',
          });
        
        if (error) {
          console.error(`❌ Failed to insert brand ${brand.name}:`, error.message);
        } else {
          console.log(`✅ Added: ${brand.name}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing brand ${brand.name}:`, error.message);
    }
  }
}

/**
 * Upsert opportunities from scraped data
 */
async function upsertOpportunities(opportunities: OpportunitySource[]): Promise<void> {
  console.log(`💾 Upserting ${opportunities.length} opportunities...`);
  
  for (const opp of opportunities) {
    try {
      // Get or create brand
      const brandId = await getOrCreateBrand({
        name: opp.brand_name,
        industry: opp.brand_industry,
        source: 'scraped',
        external_id: `${opp.source}_brand_${opp.brand_name.toLowerCase().replace(/\s+/g, '_')}`,
        budget_min: opp.payout_min,
        budget_max: opp.payout_max
      });
      
      // Check if opportunity exists (by brand_id + title + deadline)
      const { data: existing } = await supabase
        .from('opportunities')
        .select('id')
        .eq('brand_id', brandId)
        .eq('title', opp.title)
        .eq('deadline', opp.deadline)
        .single();
      
      if (existing) {
        // Update existing opportunity
        const { error } = await supabase
          .from('opportunities')
          .update({
            description: opp.description || null,
            deliverable_type: opp.deliverable_type,
            payout_min: opp.payout_min,
            payout_max: opp.payout_max,
            min_followers: opp.min_followers || null,
            required_platforms: opp.required_platforms || null,
            required_categories: opp.required_categories || null,
            campaign_start_date: opp.campaign_start_date || null,
            campaign_end_date: opp.campaign_end_date || null,
            deliverables_description: opp.deliverables_description || null,
            apply_url: opp.apply_url || null,
            updated_at: new Date().toISOString(),
            // Reset status to 'open' if it was expired but deadline is still valid
            status: new Date(opp.deadline) >= new Date() ? 'open' : 'expired'
          })
          .eq('id', existing.id);
        
        if (error) {
          console.error(`❌ Failed to update opportunity ${opp.title}:`, error.message);
        } else {
          console.log(`✅ Updated: ${opp.title}`);
        }
      } else {
        // Insert new opportunity
        const { error } = await supabase
          .from('opportunities')
          .insert({
            brand_id: brandId,
            title: opp.title,
            description: opp.description || null,
            deliverable_type: opp.deliverable_type,
            payout_min: opp.payout_min,
            payout_max: opp.payout_max,
            deadline: opp.deadline,
            status: new Date(opp.deadline) >= new Date() ? 'open' : 'expired',
            min_followers: opp.min_followers || null,
            required_platforms: opp.required_platforms || null,
            required_categories: opp.required_categories || null,
            campaign_start_date: opp.campaign_start_date || null,
            campaign_end_date: opp.campaign_end_date || null,
            deliverables_description: opp.deliverables_description || null,
            apply_url: opp.apply_url || null
          });
        
        if (error) {
          console.error(`❌ Failed to insert opportunity ${opp.title}:`, error.message);
        } else {
          console.log(`✅ Added: ${opp.title}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing opportunity ${opp.title}:`, error.message);
    }
  }
}

/**
 * Mark stale brands as inactive
 */
async function markStaleBrands(): Promise<void> {
  console.log('🔄 Marking stale brands as inactive...');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { error } = await supabase
    .from('brands')
    .update({ status: 'inactive' })
    .eq('status', 'active')
    .lt('updated_at', thirtyDaysAgo.toISOString())
    .in('source', ['scraped', 'marketplace']);
  
  if (error) {
    console.error('❌ Failed to mark stale brands:', error.message);
  } else {
    console.log('✅ Stale brands marked as inactive');
  }
}

/**
 * Main sync function
 */
async function syncBrands() {
  console.log('🚀 Starting brand directory sync...\n');
  
  try {
    // 1. Scrape opportunities from all platforms
    const [influencerInOpps, winklOpps, collabstrOpps] = await Promise.all([
      scrapeInfluencerIn(),
      scrapeWinkl(),
      scrapeCollabstr()
    ]);
    
    const allOpportunities = [...influencerInOpps, ...winklOpps, ...collabstrOpps];
    console.log(`\n📊 Found ${allOpportunities.length} total opportunities\n`);
    
    // 2. Extract unique brands from opportunities
    const brandMap = new Map<string, BrandSource>();
    
    for (const opp of allOpportunities) {
      const key = opp.brand_name.toLowerCase().trim();
      
      if (!brandMap.has(key)) {
        brandMap.set(key, {
          name: opp.brand_name,
          industry: opp.brand_industry,
          description: `${opp.title}${opp.description ? ` - ${opp.description}` : ''}`,
          budget_min: opp.payout_min,
          budget_max: opp.payout_max,
          verified: false,
          source: 'scraped',
          external_id: `${opp.source}_brand_${key.replace(/\s+/g, '_')}`
        });
      } else {
        // Update budget range if wider
        const existing = brandMap.get(key)!;
        if (opp.payout_min < (existing.budget_min || 0)) {
          existing.budget_min = opp.payout_min;
        }
        if (opp.payout_max > (existing.budget_max || 0)) {
          existing.budget_max = opp.payout_max;
        }
      }
    }
    
    const scrapedBrands = Array.from(brandMap.values());
    console.log(`📊 Found ${scrapedBrands.length} unique brands\n`);
    
    // 3. Upsert brands
    if (scrapedBrands.length > 0) {
      await upsertBrands(scrapedBrands);
    }
    
    // 4. Upsert opportunities
    if (allOpportunities.length > 0) {
      await upsertOpportunities(allOpportunities);
    }
    
    // 5. Mark stale brands
    await markStaleBrands();
    
    // 6. Update expired opportunities (if function exists)
    try {
      const { error: rpcError } = await supabase.rpc('update_expired_opportunities');
      if (rpcError && !rpcError.message.includes('does not exist')) {
        console.warn('⚠️  Could not update expired opportunities:', rpcError.message);
      }
    } catch (e) {
      // Function might not exist yet, that's okay
    }
    
    console.log('\n✅ Brand sync completed successfully!');
    console.log(`   - Brands: ${scrapedBrands.length}`);
    console.log(`   - Opportunities: ${allOpportunities.length}`);
  } catch (error: any) {
    console.error('\n❌ Brand sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : null;

// Run if called directly via `node`/`tsx`
if (entryFile && entryFile === __filename) {
  syncBrands();
}

export { syncBrands };

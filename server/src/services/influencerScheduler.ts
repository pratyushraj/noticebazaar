// Influencer Finder Scheduler
// Daily automation job that runs at 9 AM IST
// Finds, classifies, and stores new influencers

import { findInfluencers, saveInfluencersToDatabase } from './influencerFinder.js';
import { autoSyncToSheets } from './influencerSheets.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DailyScanResult {
  success: boolean;
  influencersFound: number;
  influencersSaved: number;
  errors: string[];
  timestamp: string;
  duration_ms: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Default search parameters
const DEFAULT_HASHTAGS = [
  'fitnessindia',
  'fashionindia',
  'techcreator',
  'lifestyleindia',
  'beautyindia',
  'ugccreator'
];

const DEFAULT_KEYWORDS = [
  'influencer',
  'content creator',
  'creator',
  'indian creator'
];

const DEFAULT_OPTIONS = {
  minFollowers: 10000,
  maxFollowers: 500000,
  limit: 30 // Reduced from 50 to prevent timeouts (30 profiles ≈ 2-3 minutes)
};

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (message: string, data?: any) => {
    console.log(`[InfluencerScheduler] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[InfluencerScheduler] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[InfluencerScheduler] WARN: ${message}`, data || '');
  }
};

// ============================================================================
// DAILY SCAN FUNCTION
// ============================================================================

/**
 * Run daily scan to find and classify new influencers
 * This is the main automation function
 */
export async function runDailyScan(
  hashtags?: string[],
  keywords?: string[],
  options?: {
    minFollowers?: number;
    maxFollowers?: number;
    limit?: number;
    source?: 'apify' | 'phantombuster' | 'google' | 'manual';
  }
): Promise<DailyScanResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  log.info('Starting daily scan', {
    hashtags: hashtags || DEFAULT_HASHTAGS,
    keywords: keywords || DEFAULT_KEYWORDS,
    options: options || DEFAULT_OPTIONS
  });

  try {
    // Step 1: Find influencers
    const searchHashtags = hashtags || DEFAULT_HASHTAGS;
    const searchKeywords = keywords || DEFAULT_KEYWORDS;
    const searchOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    const influencers = await findInfluencers(
      searchHashtags,
      searchKeywords,
      searchOptions
    );

    log.info(`Found ${influencers.length} qualified influencers`);

    // Step 2: Save to database
    let savedCount = 0;
    try {
      await saveInfluencersToDatabase(influencers);
      savedCount = influencers.length;
      log.info(`Saved ${savedCount} influencers to database`);
    } catch (error: any) {
      const errorMsg = `Error saving to database: ${error.message}`;
      errors.push(errorMsg);
      log.error(errorMsg, error);
    }

    // Step 3: Sync to Google Sheets (if configured)
    if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      try {
        const sheetsConfig = {
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          credentials: process.env.GOOGLE_SHEETS_CREDENTIALS 
            ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
            : undefined,
          apiKey: process.env.GOOGLE_SHEETS_API_KEY
        };

        await autoSyncToSheets(sheetsConfig);
        log.info('Synced to Google Sheets');
      } catch (error: any) {
        const errorMsg = `Error syncing to Google Sheets: ${error.message}`;
        errors.push(errorMsg);
        log.error(errorMsg, error);
        // Don't fail the whole scan if sheets sync fails
      }
    }

    const duration = Date.now() - startTime;

    const result: DailyScanResult = {
      success: errors.length === 0,
      influencersFound: influencers.length,
      influencersSaved: savedCount,
      errors,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    };

    log.info('Daily scan completed', result);
    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    errors.push(`Fatal error: ${error.message}`);
    
    log.error('Daily scan failed', error);

    return {
      success: false,
      influencersFound: 0,
      influencersSaved: 0,
      errors,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    };
  }
}

// ============================================================================
// SCHEDULER SETUP
// ============================================================================

/**
 * Setup daily scheduler (runs at 9 AM IST)
 * IST is UTC+5:30, so 9 AM IST = 3:30 AM UTC
 */
export function setupDailyScheduler(): void {
  // Check if we're in a serverless environment (Vercel, etc.)
  // In serverless, use external cron service instead
  if (process.env.VERCEL || process.env.RENDER) {
    log.info('Serverless environment detected - use external cron service');
    log.info('Set up cron job to call: POST /api/influencers/run-daily-scan');
    return;
  }

  // For traditional server environments, use node-cron
  try {
    // Dynamic import to avoid requiring node-cron in base dependencies
    import('node-cron').then((cron) => {
      // Schedule for 9 AM IST (3:30 AM UTC)
      // Format: minute hour day month day-of-week
      cron.default.schedule('30 3 * * *', async () => {
        log.info('Running scheduled daily scan');
        try {
          await runDailyScan();
        } catch (error: any) {
          log.error('Scheduled daily scan failed', error);
        }
      }, {
        timezone: 'Asia/Kolkata'
      });

      log.info('Daily scheduler set up - will run at 9 AM IST');
    }).catch(() => {
      log.warn('node-cron not installed - scheduler not started');
      log.warn('Install with: npm install node-cron');
      log.warn('Or use external cron service to call POST /api/influencers/run-daily-scan');
    });
  } catch (error: any) {
    log.error('Error setting up scheduler', error);
  }
}

/**
 * Initialize scheduler on module load (if not serverless)
 */
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && !process.env.RENDER) {
  // Don't auto-start in test environment or serverless
  // Call setupDailyScheduler() manually in server startup
}


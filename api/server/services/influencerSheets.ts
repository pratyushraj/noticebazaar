// @ts-nocheck
// Google Sheets Integration for Influencer Finder
// Production-ready export to Google Sheets with deduplication and auto-sync
// Creates two sheets: "All Influencers" and "High Fit (7+)"

import type { InfluencerResult } from './influencerFinder';
import type { OutreachMessage } from './influencerOutreach';
import { getInfluencersFromDatabase } from './influencerFinder';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SheetsConfig {
  spreadsheetId: string;
  sheetName?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
  apiKey?: string; // Alternative: use API key for public sheets
}

// ============================================================================
// LOGGING
// ============================================================================

const log = {
  info: (message: string, data?: any) => {
    console.log(`[InfluencerSheets] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[InfluencerSheets] ERROR: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[InfluencerSheets] WARN: ${message}`, data || '');
  }
};

// ============================================================================
// SHEET NAMES
// ============================================================================

const SHEET_ALL_INFLUENCERS = 'All Influencers';
const SHEET_HIGH_FIT = 'High Fit (7+)';

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export influencers to Google Sheets
 * Creates/updates two sheets: "All Influencers" and "High Fit (7+)"
 * Deduplicates by instagram_handle
 */
export async function exportToGoogleSheets(
  influencers: InfluencerResult[],
  outreachMessages?: Map<string, OutreachMessage>,
  config?: SheetsConfig
): Promise<void> {
  if (!config?.spreadsheetId) {
    log.warn('No spreadsheet ID provided, skipping export');
    return;
  }

  log.info('Exporting to Google Sheets', { count: influencers.length, spreadsheetId: config.spreadsheetId });

  // Deduplicate by instagram_handle
  const deduplicated = deduplicateInfluencers(influencers);
  log.info(`Deduplicated ${influencers.length} to ${deduplicated.length} influencers`);

  // Split into all influencers and high fit (7+)
  const highFit = deduplicated.filter(i => i.fit_score >= 7);

  // If using Google Sheets API with service account
  if (config.credentials) {
    await exportViaServiceAccount(deduplicated, highFit, outreachMessages, config);
    return;
  }

  // If using API key (for public sheets)
  if (config.apiKey) {
    await exportViaApiKey(deduplicated, highFit, outreachMessages, config);
    return;
  }

  // Fallback: Generate CSV for manual import
  log.info('No credentials provided, generating CSV instead');
  const csvAll = generateCSV(deduplicated, outreachMessages);
  const csvHighFit = generateCSV(highFit, outreachMessages);
  
  log.info('CSV data generated', {
    all_influencers_rows: deduplicated.length,
    high_fit_rows: highFit.length
  });
  
  // Log CSV (in production, you might want to save to file or return)
  console.log('\n=== All Influencers CSV ===');
  console.log(csvAll);
  console.log('\n=== High Fit (7+) CSV ===');
  console.log(csvHighFit);
}

/**
 * Export via Google Sheets API using service account
 */
async function exportViaServiceAccount(
  allInfluencers: InfluencerResult[],
  highFit: InfluencerResult[],
  outreachMessages: Map<string, OutreachMessage> | undefined,
  config: SheetsConfig
): Promise<void> {
  try {
    // Dynamic import to avoid requiring googleapis in base dependencies
    const { google } = await import('googleapis');
    
    const auth = new google.auth.JWT({
      email: config.credentials!.client_email,
      key: config.credentials!.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Ensure sheets exist and clear old data
    await ensureSheetsExist(sheets, config.spreadsheetId);
    
    // Export all influencers
    await writeToSheet(sheets, config.spreadsheetId, SHEET_ALL_INFLUENCERS, allInfluencers, outreachMessages);
    
    // Export high fit influencers
    await writeToSheet(sheets, config.spreadsheetId, SHEET_HIGH_FIT, highFit, outreachMessages);
    
    log.info('Successfully exported to Google Sheets');
  } catch (error: any) {
    log.error('Error exporting via service account', error.message);
    
    // Check if googleapis is installed
    if (error.message?.includes('Cannot find module')) {
      log.error('googleapis not installed. Run: npm install googleapis');
    }
    
    throw error;
  }
}

/**
 * Ensure sheets exist, create if they don't
 */
async function ensureSheetsExist(sheets: any, spreadsheetId: string): Promise<void> {
  try {
    const { google } = await import('googleapis');
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets.map((s: any) => s.properties.title);
    
    const sheetsToCreate = [SHEET_ALL_INFLUENCERS, SHEET_HIGH_FIT].filter(
      name => !existingSheets.includes(name)
    );
    
    if (sheetsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: sheetsToCreate.map((title: string) => ({
            addSheet: {
              properties: { title }
            }
          }))
        }
      });
      log.info(`Created sheets: ${sheetsToCreate.join(', ')}`);
    }
  } catch (error: any) {
    log.error('Error ensuring sheets exist', error.message);
    throw error;
  }
}

/**
 * Write data to a specific sheet
 */
async function writeToSheet(
  sheets: any,
  spreadsheetId: string,
  sheetName: string,
  influencers: InfluencerResult[],
  outreachMessages?: Map<string, OutreachMessage>
): Promise<void> {
  const headers = getSheetHeaders();
  const rows = influencers.map(influencer => {
    const message = outreachMessages?.get(influencer.instagram_handle);
    return influencerToRow(influencer, message);
  });

  // Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:Z`
  });

  // Write headers and data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers, ...rows]
    }
  });

  log.info(`Wrote ${rows.length} rows to sheet: ${sheetName}`);
}

/**
 * Export via API key (for public sheets)
 */
async function exportViaApiKey(
  allInfluencers: InfluencerResult[],
  highFit: InfluencerResult[],
  outreachMessages: Map<string, OutreachMessage> | undefined,
  config: SheetsConfig
): Promise<void> {
  // TODO: Implement API key-based export
  log.info('API key export - not yet implemented');
  throw new Error('API key export not yet implemented');
}

// ============================================================================
// CSV GENERATION (Fallback)
// ============================================================================

/**
 * Generate CSV data for manual import
 */
export function generateCSV(
  influencers: InfluencerResult[],
  outreachMessages?: Map<string, OutreachMessage>
): string {
  const headers = getSheetHeaders();
  const rows = influencers.map(influencer => {
    const message = outreachMessages?.get(influencer.instagram_handle);
    return influencerToRow(influencer, message);
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Get sheet headers
 */
function getSheetHeaders(): string[] {
  return [
    'creator_name',
    'instagram_handle',
    'followers',
    'niche',
    'fit_score',
    'email',
    'website',
    'manager_email',
    'profile_link',
    'bio',
    'link_in_bio',
    'location',
    'is_india_based',
    'is_relevant_niche',
    'is_active',
    'status',
    'source',
    'contacted_at',
    'last_dm_sent_at',
    'follow_up_due_at',
    'response_status',
    'outreach_message',
    'search_keywords',
    'last_checked_at',
    'created_at'
  ];
}

/**
 * Convert influencer to row data
 */
function influencerToRow(influencer: InfluencerResult, message?: OutreachMessage): string[] {
  return [
    escapeCSV(influencer.creator_name),
    escapeCSV(influencer.instagram_handle),
    influencer.followers.toString(),
    escapeCSV(influencer.niche || ''),
    influencer.fit_score.toString(),
    escapeCSV(influencer.email || ''),
    escapeCSV(influencer.website || ''),
    escapeCSV(influencer.manager_email || ''),
    escapeCSV(influencer.profile_link),
    escapeCSV(influencer.bio || ''),
    escapeCSV(influencer.link_in_bio || ''),
    escapeCSV(influencer.location || ''),
    influencer.is_india_based ? 'TRUE' : 'FALSE',
    influencer.is_relevant_niche ? 'TRUE' : 'FALSE',
    influencer.is_active ? 'TRUE' : 'FALSE',
    escapeCSV((influencer as any).status || 'new'),
    escapeCSV(influencer.source || 'manual'),
    escapeCSV((influencer as any).contacted_at || ''),
    escapeCSV((influencer as any).last_dm_sent_at || ''),
    escapeCSV((influencer as any).follow_up_due_at || ''),
    escapeCSV((influencer as any).response_status || ''),
    escapeCSV(message?.message || ''),
    escapeCSV((influencer.search_keywords || []).join(', ')),
    escapeCSV((influencer as any).last_checked_at || ''),
    escapeCSV((influencer as any).created_at || '')
  ];
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string | undefined | null): string {
  if (!value) return '';
  
  // Replace newlines and escape quotes
  const escaped = value.replace(/"/g, '""').replace(/\n/g, ' ');
  
  // Wrap in quotes if contains comma, quote, or space
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes(' ')) {
    return `"${escaped}"`;
  }
  
  return escaped;
}

/**
 * Deduplicate influencers by instagram_handle
 * Keeps the one with highest fit_score
 */
function deduplicateInfluencers(influencers: InfluencerResult[]): InfluencerResult[] {
  const seen = new Map<string, InfluencerResult>();
  
  for (const influencer of influencers) {
    const handle = influencer.instagram_handle.toLowerCase();
    const existing = seen.get(handle);
    
    if (!existing || influencer.fit_score > existing.fit_score) {
      seen.set(handle, influencer);
    }
  }
  
  return Array.from(seen.values());
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync database influencers to Google Sheets
 * Useful for keeping sheets up-to-date
 * Auto-syncs both "All Influencers" and "High Fit (7+)" sheets
 */
export async function syncDatabaseToSheets(
  config: SheetsConfig,
  filters?: {
    minFitScore?: number;
    status?: 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted';
  }
): Promise<void> {
  log.info('Syncing database to Google Sheets', { filters });

  // Get influencers from database
  const influencers = await getInfluencersFromDatabase({
    minFitScore: filters?.minFitScore,
    status: filters?.status,
    limit: 10000 // Large limit for sync
  });

  // Get outreach messages for contacted influencers (optional)
  const outreachMessages = new Map<string, OutreachMessage>();
  if (filters?.status === 'contacted') {
    const { generateBatchOutreachMessages } = await import('./influencerOutreach.js');
    const messages = await generateBatchOutreachMessages(influencers);
    messages.forEach((msg, handle) => outreachMessages.set(handle, msg));
  }

  // Export to sheets
  await exportToGoogleSheets(influencers, outreachMessages, config);
  
  log.info('Sync complete', { count: influencers.length });
}

/**
 * Auto-sync job (to be called by scheduler)
 * Runs daily at 9 AM IST
 */
export async function autoSyncToSheets(config: SheetsConfig): Promise<void> {
  log.info('Starting auto-sync to Google Sheets');
  
  try {
    // Sync all influencers
    await syncDatabaseToSheets(config);
    
    // Also sync high fit separately (will be in separate sheet)
    await syncDatabaseToSheets(config, { minFitScore: 7 });
    
    log.info('Auto-sync complete');
  } catch (error: any) {
    log.error('Auto-sync failed', error);
    throw error;
  }
}

/**
 * Read influencers from Google Sheets
 * Useful for importing existing data
 */
export async function importFromGoogleSheets(config: SheetsConfig): Promise<InfluencerResult[]> {
  // TODO: Implement Google Sheets import
  log.info('Import from sheets - not yet implemented');
  return [];
}

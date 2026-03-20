// @ts-nocheck
// Influencer Finder API Routes
// Production-ready endpoints for discovering and managing influencers

import express from 'express';
import { findInfluencers, saveInfluencersToDatabase, getInfluencersFromDatabase } from '../services/influencerFinder.js';
import { generateOutreachMessage, generateBatchOutreachMessages, markAsContacted, updateInfluencerStatus, getInfluencersDueForFollowUp, getUncontactedInfluencers } from '../services/influencerOutreach.js';
import { exportToGoogleSheets, generateCSV, syncDatabaseToSheets, autoSyncToSheets } from '../services/influencerSheets.js';
import { runDailyScan } from '../services/influencerScheduler.js';

const router = express.Router();

// ============================================================================
// SEARCH & DISCOVERY
// ============================================================================

/**
 * GET /api/influencers/find
 * Find influencers based on hashtags and keywords
 */
router.get('/find', async (req: express.Request, res: express.Response) => {
  try {
    const hashtags = req.query.hashtags 
      ? (req.query.hashtags as string).split(',').map(h => h.trim()).filter(Boolean)
      : [];
    
    const keywords = req.query.keywords
      ? (req.query.keywords as string).split(',').map(k => k.trim()).filter(Boolean)
      : [];

    if (hashtags.length === 0 && keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one hashtag or keyword is required'
      });
    }

    const minFollowers = req.query.minFollowers 
      ? parseInt(req.query.minFollowers as string, 10)
      : 10000;
    
    const maxFollowers = req.query.maxFollowers
      ? parseInt(req.query.maxFollowers as string, 10)
      : 500000;
    
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;
    
    const saveToDb = req.query.saveToDb !== 'false';
    const source = (req.query.source as 'apify' | 'phantombuster' | 'google' | 'manual') || 'manual';

    // Find influencers
    const influencers = await findInfluencers(hashtags, keywords, {
      minFollowers,
      maxFollowers,
      limit,
      source
    });

    // Save to database if requested
    if (saveToDb && influencers.length > 0) {
      await saveInfluencersToDatabase(influencers);
    }

    res.json({
      success: true,
      count: influencers.length,
      influencers
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error finding influencers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find influencers'
    });
  }
});

/**
 * GET /api/influencers/list
 * Get influencers from database with filters
 */
router.get('/list', async (req: express.Request, res: express.Response) => {
  try {
    const minFitScore = req.query.minFitScore
      ? parseInt(req.query.minFitScore as string, 10)
      : undefined;
    
    const status = req.query.status as 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted' | undefined;
    
    const alreadyContacted = req.query.alreadyContacted
      ? req.query.alreadyContacted === 'true'
      : undefined;
    
    const niche = req.query.niche as string | undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;

    const influencers = await getInfluencersFromDatabase({
      minFitScore,
      status,
      alreadyContacted,
      niche,
      limit
    });

    res.json({
      success: true,
      count: influencers.length,
      influencers
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error listing influencers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list influencers'
    });
  }
});

/**
 * GET /api/influencers/high-fit
 * Get high-fit influencers (fit_score >= 7 by default)
 */
router.get('/high-fit', async (req: express.Request, res: express.Response) => {
  try {
    const minScore = req.query.minScore
      ? parseInt(req.query.minScore as string, 10)
      : 7;
    
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;

    const influencers = await getInfluencersFromDatabase({
      minFitScore: minScore,
      status: 'new',
      limit
    });

    res.json({
      success: true,
      count: influencers.length,
      min_score: minScore,
      influencers
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error getting high-fit influencers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get high-fit influencers'
    });
  }
});

// ============================================================================
// OUTREACH
// ============================================================================

/**
 * POST /api/influencers/:handle/generate-outreach
 * Generate outreach message for a specific influencer
 */
router.post('/:handle/generate-outreach', async (req: express.Request, res: express.Response) => {
  try {
    const handle = req.params.handle.replace('@', '');
    const template = (req.body.template as 'default' | 'founding_creator' | 'follow_up') || 'default';
    
    // Get influencer from database
    const influencers = await getInfluencersFromDatabase({ limit: 1000 });
    const influencer = influencers.find(i => i.instagram_handle === handle);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        error: `Influencer @${handle} not found`
      });
    }

    const message = await generateOutreachMessage(influencer, template);

    res.json({
      success: true,
      influencer_handle: handle,
      message
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error generating outreach:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate outreach message'
    });
  }
});

/**
 * POST /api/influencers/generate-batch-outreach
 * Generate outreach messages for multiple influencers
 */
router.post('/generate-batch-outreach', async (req: express.Request, res: express.Response) => {
  try {
    const handles = req.body.handles as string[] | undefined;
    const limit = req.body.limit || 50;
    const template = (req.body.template as 'default' | 'founding_creator' | 'follow_up') || 'default';

    let influencers: Awaited<ReturnType<typeof getInfluencersFromDatabase>>;
    
    if (handles && handles.length > 0) {
      // Get specific influencers
      const allInfluencers = await getInfluencersFromDatabase({ limit: 1000 });
      influencers = allInfluencers.filter(i => 
        handles.includes(i.instagram_handle) || handles.includes(`@${i.instagram_handle}`)
      ).slice(0, limit);
    } else {
      // Get uncontacted influencers
      influencers = await getUncontactedInfluencers(limit);
    }

    const messages = await generateBatchOutreachMessages(influencers, template);

    res.json({
      success: true,
      count: messages.size,
      template,
      messages: Object.fromEntries(messages)
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error generating batch outreach:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate batch outreach messages'
    });
  }
});

/**
 * POST /api/influencers/:handle/mark-contacted
 * Mark an influencer as contacted
 */
router.post('/:handle/mark-contacted', async (req: express.Request, res: express.Response) => {
  try {
    const handle = req.params.handle.replace('@', '');
    const followUpDueAt = req.body.followUpDueAt 
      ? new Date(req.body.followUpDueAt)
      : undefined;
    const responseStatus = req.body.response_status || 'pending';

    await markAsContacted(handle, new Date(), followUpDueAt, responseStatus);

    res.json({
      success: true,
      message: `@${handle} marked as contacted`
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error marking as contacted:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark influencer as contacted'
    });
  }
});

/**
 * POST /api/influencers/:handle/update-status
 * Update influencer status
 */
router.post('/:handle/update-status', async (req: express.Request, res: express.Response) => {
  try {
    const handle = req.params.handle.replace('@', '');
    const status = req.body.status as 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted';
    const responseStatus = req.body.response_status;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required'
      });
    }

    await updateInfluencerStatus(handle, status, responseStatus);

    res.json({
      success: true,
      message: `@${handle} status updated to ${status}`
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error updating status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update influencer status'
    });
  }
});

/**
 * GET /api/influencers/follow-ups
 * Get influencers due for follow-up
 */
router.get('/follow-ups', async (req: express.Request, res: express.Response) => {
  try {
    const influencers = await getInfluencersDueForFollowUp();

    res.json({
      success: true,
      count: influencers.length,
      influencers
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error getting follow-ups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get follow-ups'
    });
  }
});

// ============================================================================
// AUTOMATION
// ============================================================================

/**
 * POST /api/influencers/run-daily-scan
 * Run daily scan to find and classify new influencers
 * This is the main automation endpoint
 */
router.post('/run-daily-scan', async (req: express.Request, res: express.Response) => {
  try {
    // Extract parameters from request body
    const hashtags = req.body.hashtags || undefined;
    const keywords = req.body.keywords || undefined;
    const options = {
      minFollowers: req.body.minFollowers,
      maxFollowers: req.body.maxFollowers,
      limit: req.body.limit,
      source: req.body.source
    };

    // Start scan in background (don't await - this prevents timeout)
    // The scan will run asynchronously and save results to database
    runDailyScan(hashtags, keywords, options).catch((error: any) => {
      console.error('[InfluencersAPI] Background scan error:', error);
      // Log error but don't fail the request since it's already returned
    });

    // Return immediately with success status
    res.json({
      success: true,
      message: 'Discovery scan started in background',
      status: 'running',
      note: 'Check the influencers list in a few minutes to see results'
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error starting daily scan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start daily scan'
    });
  }
});

// ============================================================================
// EXPORT
// ============================================================================

/**
 * GET /api/influencers/export/csv
 * Export influencers to CSV
 */
router.get('/export/csv', async (req: express.Request, res: express.Response) => {
  try {
    const minFitScore = req.query.minFitScore
      ? parseInt(req.query.minFitScore as string, 10)
      : undefined;
    
    const status = req.query.status as 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted' | undefined;
    
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 1000;

    const influencers = await getInfluencersFromDatabase({
      minFitScore,
      status,
      limit
    });

    // Generate outreach messages if requested
    let outreachMessages: Map<string, Awaited<ReturnType<typeof generateOutreachMessage>>> | undefined;
    if (req.query.includeMessages === 'true') {
      const messages = await generateBatchOutreachMessages(influencers);
      outreachMessages = messages;
    }

    const csv = generateCSV(influencers, outreachMessages);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="influencers-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('[InfluencersAPI] Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export CSV'
    });
  }
});

/**
 * POST /api/influencers/export/sheets
 * Export influencers to Google Sheets
 */
router.post('/export/sheets', async (req: express.Request, res: express.Response) => {
  try {
    const { spreadsheetId, sheetName, filters, credentials, apiKey } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'spreadsheetId is required'
      });
    }

    await syncDatabaseToSheets({
      spreadsheetId,
      sheetName,
      credentials,
      apiKey
    }, filters);

    res.json({
      success: true,
      message: 'Influencers exported to Google Sheets'
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error exporting to sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export to Google Sheets'
    });
  }
});

/**
 * POST /api/influencers/auto-sync-sheets
 * Trigger auto-sync to Google Sheets (normally called by scheduler)
 */
router.post('/auto-sync-sheets', async (req: express.Request, res: express.Response) => {
  try {
    const { spreadsheetId, credentials, apiKey } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'spreadsheetId is required'
      });
    }

    await autoSyncToSheets({
      spreadsheetId,
      credentials,
      apiKey
    });

    res.json({
      success: true,
      message: 'Auto-sync to Google Sheets completed'
    });
  } catch (error: any) {
    console.error('[InfluencersAPI] Error auto-syncing to sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-sync to Google Sheets'
    });
  }
});

export default router;

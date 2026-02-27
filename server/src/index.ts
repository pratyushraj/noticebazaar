import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types/supabase.js';
import conversationsRouter from './routes/conversations.js';
import messagesRouter from './routes/messages.js';
import attachmentsRouter from './routes/attachments.js';
import paymentsRouter from './routes/payments.js';
import protectionRouter, { viewContractHandler, downloadContractDocxHandler } from './routes/protection.js';
import adminRouter from './routes/admin.js';
import brandResponseRouter from './routes/brandResponse.js';
import brandReplyTokensRouter from './routes/brandReplyTokens.js';
import dealDetailsTokensRouter from './routes/dealDetailsTokens.js';
import contractReadyTokensRouter from './routes/contractReadyTokens.js';
import gstRouter from './routes/gst.js';
import aiRouter from './routes/ai.js';
import esignRouter from './routes/esign.js';
import dealsRouter from './routes/deals.js';
import complaintsRouter from './routes/complaints.js';
import influencersRouter from './routes/influencers.js';
import collabRequestsRouter from './routes/collabRequests.js';
import collabAnalyticsRouter from './routes/collabAnalytics.js';
import collabActionRouter from './routes/collabAction.js';
import creatorsRouter from './routes/creators.js';
import pushNotificationsRouter from './routes/pushNotifications.js';
import shippingRouter from './routes/shipping.js';
import cronDealRemindersRouter from './routes/cronDealReminders.js';
import cronInstagramSyncRouter from './routes/cronInstagramSync.js';
import creatorSignRouter from './routes/creatorSign.js';
import otpRouter from './routes/otp.js';
import contractsRouter from './routes/contracts.js';
import feedbackRouter from './routes/feedback.js';
import profileRouter from './routes/profile.js';
import instagramOAuthRouter from './routes/instagramOAuth.js';

const app = express();

const PORT = process.env.PORT || 3001; // Fly.io uses 8080, but we keep 3001 for local dev

import axios from 'axios';
import { supabase, supabaseInitialized, supabaseConfig } from './lib/supabase.js';
export { supabase, supabaseInitialized, supabaseConfig };

// Verify service role key is being used (for debugging)
if (supabaseInitialized && supabaseConfig.serviceKey && supabaseConfig.serviceKey.length > 50) {
  console.log('✅ Supabase client initialized with service role key (length:', supabaseConfig.serviceKey.length, ')');
} else if (supabaseInitialized) {
  console.warn('⚠️ Supabase client may not be using service role key. Key length:', supabaseConfig.serviceKey?.length || 0);
}

// Middleware
// Configure Helmet for API server (disable CSP since APIs don't serve HTML/scripts)
app.use(helmet({
  contentSecurityPolicy: false, // APIs don't need CSP - they don't serve HTML
}));
// CORS configuration - allow all localhost and common development/production origins
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      console.log('[CORS] Allowing request with no origin');
      return callback(null, true);
    }

    console.log('[CORS] Checking origin:', origin);

    // Normalize origin for comparison
    const normalizedOrigin = origin.toLowerCase().trim();

    // Allow any localhost port for development
    if (normalizedOrigin.startsWith('http://localhost:') ||
      normalizedOrigin.startsWith('http://127.0.0.1:') ||
      normalizedOrigin.startsWith('https://localhost:') ||
      normalizedOrigin.startsWith('https://127.0.0.1:') ||
      // Allow common local network IPs (192.168.x.x, 172.16-31.x.x, 10.x.x.x)
      /^https?:\/\/192\.168\./.test(normalizedOrigin) ||
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalizedOrigin) ||
      /^https?:\/\/10\./.test(normalizedOrigin)) {
      console.log('[CORS] ✓ Allowing localhost or local network origin:', origin);
      return callback(null, true);
    }

    // Allow Render frontend URLs
    if (normalizedOrigin.includes('onrender.com')) {
      console.log('[CORS] ✓ Allowing Render origin:', origin);
      return callback(null, true);
    }

    // Allow Vercel frontend URLs
    if (normalizedOrigin.includes('vercel.app')) {
      console.log('[CORS] ✓ Allowing Vercel origin:', origin);
      return callback(null, true);
    }

    // Allow Netlify frontend URLs
    if (normalizedOrigin.includes('netlify.app')) {
      console.log('[CORS] ✓ Allowing Netlify origin:', origin);
      return callback(null, true);
    }

    // Allow cloudflared tunnel URLs
    if (normalizedOrigin.includes('trycloudflare.com') || normalizedOrigin.includes('creatorarmour.com')) {
      console.log('[CORS] ✓ Allowing cloudflared/creatorarmour origin:', origin);
      return callback(null, true);
    }

    // Explicit allowed origins list
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8084',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8084',
      'http://127.0.0.1:5173',
      'https://www.creatorarmour.com',
      'https://creatorarmour.com',
      'https://api.creatorarmour.com'
    ].map(o => o.toLowerCase());

    if (allowedOrigins.includes(normalizedOrigin)) {
      console.log('[CORS] ✓ Allowing origin from allowed list:', origin);
      return callback(null, true);
    }

    console.warn('[CORS] ✗ Blocking origin:', origin);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  // Reflect requested headers so Supabase client headers are always allowed
  // (e.g. apikey, x-client-info, x-supabase-api-version, prefer, range, etc).
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes (backup in case cors middleware doesn't catch it)
app.options('*', cors(corsOptions));
// Request logging middleware (for debugging CORS issues)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`[Request] ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50)
  });
  next();
});


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Supabase Proxy to bypass ISP blocks (Jio/Airtel/ACT) in India.
 * This routes client-side Supabase traffic through the backend server,
 * making the requests appear as if they are coming from noticebazaar.com/creatorarmour.com.
 */
app.all('/supabase-proxy/*', async (req: express.Request, res: express.Response) => {
  const targetPath = req.params[0];
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    console.error('[SupabaseProxy] Missing SUPABASE_URL in env');
    return res.status(500).json({ error: 'Database URL not configured' });
  }

  // Build the target Supabase URL (e.g., https://xyz.supabase.co/rest/v1/...)
  const targetUrl = `${supabaseUrl}/${targetPath}`;

  // Clean headers to avoid host/origin conflicts
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers.origin;
  delete headers.referer;
  delete headers['content-length'];

  // Ensure the base token is set if not provided by client
  if (!headers.apikey && process.env.SUPABASE_ANON_KEY) {
    headers.apikey = process.env.SUPABASE_ANON_KEY;
  }

  try {
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      params: req.query,
      data: req.method !== 'GET' ? req.body : undefined,
      headers: headers as any,
      validateStatus: () => true, // Forward all status codes
      responseType: 'arraybuffer' // Preserve original format (JSON, binary, etc.)
    });

    // Mirror status and headers
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      // Skip headers that node/express should manage or that might break the response
      if (['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'content-length'].includes(lowerKey)) return;
      res.setHeader(key, value as string);
    });

    return res.send(response.data);
  } catch (error: any) {
    console.error(`[SupabaseProxy] Proxy failed for ${targetUrl}:`, error.message);
    return res.status(500).json({
      error: 'ISP Bypass Proxy Error',
      details: error.message,
      target: targetUrl.split('.co/')[0] + '.co/...' // Hide sensitive path info in logs
    });
  }
});


// Root route - API information
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    name: 'CreatorArmour API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/*'
    },
    documentation: 'See API documentation for available endpoints'
  });
});

// Health check - must be simple and never fail
app.get('/health', (req: express.Request, res: express.Response) => {
  try {
    const llmProvider = process.env.LLM_PROVIDER || 'huggingface';
    const llmModel = process.env.LLM_MODEL || 'not set';
    const hasLLMKey = !!process.env.LLM_API_KEY;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabaseInitialized: supabaseInitialized,
      nodeEnv: process.env.NODE_ENV || 'not set',
      llm: {
        provider: llmProvider,
        model: llmModel,
        apiKeyConfigured: hasLLMKey,
        status: hasLLMKey || llmProvider === 'huggingface' ? 'configured' : 'missing_api_key'
      }
    });
  } catch (error: any) {
    // Even if something fails, return a response
    console.error('Health check error:', error);
    res.status(200).json({
      status: 'error',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Consolidated API Routes
// Public API Routes (no auth required)

app.use('/api/brand-response', brandResponseRouter);
app.use('/api/deal-details-tokens', dealDetailsTokensRouter); // Public routes (auth handled internally)
app.use('/api/contract-ready-tokens', contractReadyTokensRouter); // Public routes for contract ready page
app.use('/api/creator-sign', creatorSignRouter); // Public creator signing magic link routes
app.use('/api/gst', gstRouter); // Public GST lookup route
app.use('/api/otp', rateLimitMiddleware, otpRouter); // Public OTP routes for brand response page

// IMPORTANT: Specific paths must come BEFORE generic prefixes to avoid shadowing
// e.g., /api/collab-requests (protected) and /api/collab-analytics must be BEFORE /api/collab (public prefix)
app.use('/api/collab-requests', authMiddleware, rateLimitMiddleware, collabRequestsRouter); // Protected collab request management routes
app.use('/api/collab-analytics', collabAnalyticsRouter); // Public analytics tracking + authenticated analytics endpoints
app.use('/api/collab', collabRequestsRouter); // Public collab link routes (/:username and /:username/submit)
app.use('/api/collab-action', collabActionRouter); // Public token-based collab actions (accept/decline/counter)
app.use('/api/creators', creatorsRouter); // Public creator directory routes
app.use('/api/shipping', shippingRouter); // Public shipping update (brand, no auth)
app.use('/api/cron', cronDealRemindersRouter); // Cron: deal reminders (protected by CRON_SECRET in route)
app.use('/api/cron', cronInstagramSyncRouter); // Cron: weekly instagram sync (protected by CRON_SECRET in route)
app.use('/api/contracts', contractsRouter); // Contract signed URL generation (handles auth internally)
app.use('/api/instagram', instagramOAuthRouter); // Instagram Graph OAuth + insights sync

// Public routes for protection features (no auth required) - must be before protected routes
app.get('/api/protection/contracts/:dealId/view', viewContractHandler);
app.get('/api/protection/contracts/:dealId/download-docx', downloadContractDocxHandler);

// API Routes (protected)
app.use('/api/brand-reply-tokens', authMiddleware, rateLimitMiddleware, brandReplyTokensRouter);
app.use('/api/esign', authMiddleware, rateLimitMiddleware, esignRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, conversationsRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, messagesRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, attachmentsRouter);
app.use('/api/payments', authMiddleware, rateLimitMiddleware, paymentsRouter);
app.use('/api/protection', authMiddleware, rateLimitMiddleware, protectionRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/ai', authMiddleware, rateLimitMiddleware, aiRouter);
app.use('/api/deals', authMiddleware, rateLimitMiddleware, dealsRouter);
app.use('/api/complaints', authMiddleware, rateLimitMiddleware, complaintsRouter);
app.use('/api/influencers', authMiddleware, rateLimitMiddleware, influencersRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/profile', authMiddleware, rateLimitMiddleware, profileRouter);
app.use('/api/push', authMiddleware, rateLimitMiddleware, pushNotificationsRouter);

// Demo email (only when ALLOW_DEMO_EMAIL=true; restricted to *@yopmail.com)
app.post('/api/demo-email/barter-accepted', async (req: express.Request, res: express.Response) => {
  if (process.env.ALLOW_DEMO_EMAIL !== 'true') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  const to = (req.body?.to || 'notice@yopmail.com').trim().toLowerCase();
  if (!to.endsWith('@yopmail.com')) {
    return res.status(400).json({ success: false, error: 'Demo emails only allowed to *@yopmail.com' });
  }
  try {
    const result = await sendCollabRequestAcceptedEmail(to, {
      creatorName: 'Demo Creator',
      brandName: 'Demo Brand',
      dealType: 'barter',
      deliverables: ['1 Instagram Reel', '1 Story', 'Usage Rights: 90 days'],
      contractReadyToken: 'demo-token-for-preview',
      contractUrl: undefined,
      barterValue: 999,
    });
    if (result.success) {
      return res.json({ success: true, emailId: result.emailId, to });
    }
    return res.status(500).json({ success: false, error: result.error });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to send' });
  }
});

// Demo: creator notification (barter collab request) — sent TO creator
app.post('/api/demo-email/creator-barter', async (req: express.Request, res: express.Response) => {
  if (process.env.ALLOW_DEMO_EMAIL !== 'true') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  const to = (req.body?.to || 'notice@yopmail.com').trim().toLowerCase();
  if (!to.endsWith('@yopmail.com')) {
    return res.status(400).json({ success: false, error: 'Demo emails only allowed to *@yopmail.com' });
  }
  try {
    // Inline SVG so the image shows even when email clients block remote images (no "Show pictures" needed)
    const barterProductSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e2e8f0" width="120" height="120" rx="10"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="Arial,sans-serif" font-size="14">Product</text></svg>';
    const barterProductImageUrl = 'data:image/svg+xml,' + encodeURIComponent(barterProductSvg);

    const result = await sendCollabRequestCreatorNotificationEmail(to, {
      creatorName: 'Demo Creator',
      brandName: 'Demo Brand',
      collabType: 'barter',
      deliverables: ['1 Instagram Reel', '1 Story', 'Usage Rights: 90 days'],
      requestId: 'demo-request-barter',
      barterValue: 999,
      barterDescription: 'Skincare product bundle',
      barterProductImageUrl,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (result.success) {
      return res.json({ success: true, emailId: result.emailId, to });
    }
    return res.status(500).json({ success: false, error: result.error });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to send' });
  }
});

// Demo: brand acceptance (paid collab) — sent TO brand when creator accepts paid deal
app.post('/api/demo-email/paid-accepted', async (req: express.Request, res: express.Response) => {
  if (process.env.ALLOW_DEMO_EMAIL !== 'true') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  const to = (req.body?.to || 'notice@yopmail.com').trim().toLowerCase();
  if (!to.endsWith('@yopmail.com')) {
    return res.status(400).json({ success: false, error: 'Demo emails only allowed to *@yopmail.com' });
  }
  try {
    const result = await sendCollabRequestAcceptedEmail(to, {
      creatorName: 'Demo Creator',
      brandName: 'Demo Brand',
      dealType: 'paid',
      dealAmount: 15000,
      deliverables: ['1 Instagram Reel', '2 Stories', 'Usage Rights: 90 days'],
      contractReadyToken: 'demo-token-paid-preview',
      contractUrl: undefined,
    });
    if (result.success) {
      return res.json({ success: true, emailId: result.emailId, to });
    }
    return res.status(500).json({ success: false, error: result.error });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to send' });
  }
});

// Demo: send brand contract-signing email for an existing deal (so you can test brand signing)
app.post('/api/demo-email/send-brand-contract-for-deal', async (req: express.Request, res: express.Response) => {
  if (process.env.ALLOW_DEMO_EMAIL !== 'true') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  const dealId = (req.body?.dealId || '').trim();
  const to = (req.body?.to || 'notice@yopmail.com').trim().toLowerCase();
  if (!dealId) {
    return res.status(400).json({ success: false, error: 'dealId is required' });
  }
  if (!to.endsWith('@yopmail.com')) {
    return res.status(400).json({ success: false, error: 'Demo emails only allowed to *@yopmail.com' });
  }
  try {
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, brand_name, brand_email, deal_type, deal_amount, deliverables')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', deal.creator_id)
      .maybeSingle();

    const creatorName = profile
      ? `${(profile.first_name || '').trim()} ${(profile.last_name || '').trim()}`.trim() || 'Creator'
      : 'Creator';

    let deliverablesArray: string[] = [];
    try {
      const d = (deal as any).deliverables;
      deliverablesArray = typeof d === 'string'
        ? (d.includes('[') ? JSON.parse(d) : d.split(',').map((s: string) => s.trim()))
        : (Array.isArray(d) ? d : []);
    } catch {
      deliverablesArray = [(deal as any).deliverables].filter(Boolean);
    }
    if (deliverablesArray.length === 0) deliverablesArray = ['As per agreement'];

    const token = await createContractReadyToken({
      dealId: deal.id,
      creatorId: deal.creator_id,
      expiresAt: null,
    });

    const dealType = (deal as any).deal_type === 'barter' ? 'barter' : 'paid';
    const result = await sendCollabRequestAcceptedEmail(to, {
      creatorName,
      brandName: (deal as any).brand_name || 'Brand',
      dealType,
      dealAmount: dealType === 'paid' ? (deal as any).deal_amount : undefined,
      barterValue: dealType === 'barter' ? (deal as any).deal_amount : undefined,
      deliverables: deliverablesArray,
      contractReadyToken: token.id,
      contractUrl: undefined,
    });

    if (result.success) {
      return res.json({
        success: true,
        emailId: result.emailId,
        to,
        contractReadyToken: token.id,
        contractReadyUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/contract-ready/${token.id}`,
      });
    }
    return res.status(500).json({ success: false, error: result.error });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Failed to send' });
  }
});

// Error handler
app.use(errorHandler);
// Note: /api/collab-analytics is already mounted as public route above (line 284)
// OTP routes - protected routes require auth
// app.use('/api/otp', authMiddleware, rateLimitMiddleware, otpRouter); // Disabled: all OTP routes are now public via magic link

// 404 handler for API routes (must be before error handler)
app.use('/api/*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.path}`,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
});

// Error handler
app.use(errorHandler);

// Export for Vercel serverless functions
export default app;

// Check Puppeteer availability on startup
async function checkPuppeteerAvailability() {
  try {
    const puppeteerCore = (await import('puppeteer-core')).default;
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
      console.warn('⚠️ Puppeteer availability check skipped (PUPPETEER_EXECUTABLE_PATH not set)');
      return;
    }
    const browser = await puppeteerCore.launch({
      executablePath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      timeout: 10000, // 10 second timeout for startup check
    });
    await browser.close();
    console.log('✅ Puppeteer/Chrome is available for contract PDF generation');
  } catch (error: any) {
    console.error('❌ FATAL: Puppeteer/Chrome is NOT available!');
    console.error('   Contract PDF generation will FAIL.');
    console.error('   Error:', error.message);
    console.error('');
    if (error.message?.includes('Could not find Chrome')) {
      console.error('   Chrome is not installed. To fix this, run:');
      console.error('   cd server && npx puppeteer browsers install chrome');
    } else if (error.message?.includes('Failed to launch')) {
      console.error('   Chrome is installed but failing to launch.');
      console.error('   This may be a macOS compatibility issue.');
      console.error('   Try: cd server && npx puppeteer browsers install chrome@latest');
      console.error('   Or check Chrome binary permissions.');
    } else {
      console.error('   To fix this, run:');
      console.error('   cd server && npx puppeteer browsers install chrome');
    }
    console.error('');
    console.error('   Or set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false in your environment.');
    console.error('');
    // Don't exit - allow server to start, but contracts will fail
  }
}

// For local development, start the server
let server: any = null;

if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  server = app.listen(PORT, async () => {
    console.log(`🚀 CreatorArmour API server running on port ${PORT}`);

    // Check Puppeteer after server starts
    await checkPuppeteerAvailability();

    // Setup influencer finder daily scheduler (if not serverless)
    try {
      const { setupDailyScheduler } = await import('./services/influencerScheduler.js');
      setupDailyScheduler();
    } catch (error: any) {
      console.warn('⚠️ Could not setup influencer scheduler:', error.message);
    }
  });

  // Graceful shutdown handlers for tsx watch
  const gracefulShutdown = (signal: string) => {
    console.log(`\n${signal} received. Closing server gracefully...`);
    if (server) {
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });

      // Force close after 5 seconds
      setTimeout(() => {
        console.log('Forcing server shutdown...');
        process.exit(1);
      }, 5000);
    } else {
      process.exit(0);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

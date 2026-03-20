// @ts-nocheck
// CreatorArmour Backend API Server
// Express server with Supabase auth, rate limiting, and all messaging endpoints

// Load environment variables
import dotenv from 'dotenv';

// Load environment variables
// In Vercel, environment variables are already set, so dotenv is only needed for local dev
// Try to load .env files, but don't fail if they don't exist (Vercel provides env vars directly)
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

let serverDir = '';
try {
  // ESM-native way to get __dirname
  const __filename = fileURLToPath(import.meta.url);
  serverDir = dirname(__filename);
} catch (error) {
  // Fallback for environments where import.meta.url is not available
  console.log('[Server] Note: import.meta.url not available, using process.cwd()');
  serverDir = process.cwd();
}

try {
  // Load from server directory (where .env file is located)
  // We use multiple potential paths to be resilient to different deployment layouts
  if (serverDir) {
    dotenv.config({ path: resolve(serverDir, '../.env') });
    dotenv.config({ path: resolve(serverDir, '.env') });
  }
  // Also try root as fallback
  dotenv.config();
} catch (error) {
  // In Vercel serverless, env vars are provided directly, so this is fine
  console.log('⚠️ Could not load .env files (this is normal in Vercel)');
}

// Debug: Log if RESEND_API_KEY is loaded (only first few chars for security)
if (process.env.RESEND_API_KEY) {
  console.log('[Server] RESEND_API_KEY loaded:', process.env.RESEND_API_KEY.substring(0, 8) + '...');
} else {
  console.warn('[Server] ⚠️ RESEND_API_KEY not found in environment variables');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';
import conversationsRouter from './routes/conversations';
import messagesRouter from './routes/messages';
import attachmentsRouter from './routes/attachments';
import paymentsRouter from './routes/payments';
import protectionRouter, { viewContractHandler, downloadContractDocxHandler } from './routes/protection';
import adminRouter from './routes/admin';
import brandResponseRouter from './routes/brandResponse';
import brandReplyTokensRouter from './routes/brandReplyTokens';
import dealDetailsTokensRouter from './routes/dealDetailsTokens';
import contractReadyTokensRouter from './routes/contractReadyTokens';
import gstRouter from './routes/gst';
import aiRouter from './routes/ai';
import otpRouter, { publicRouter as otpPublicRouter } from './routes/otp';
import dealsRouter from './routes/deals';
import complaintsRouter from './routes/complaints';
import influencersRouter from './routes/influencers';
import collabRequestsRouter from './routes/collabRequests';
import collabAnalyticsRouter from './routes/collabAnalytics';
import creatorsRouter from './routes/creators';
import shippingRouter from './routes/shipping';
import cronDealRemindersRouter from './routes/cronDealReminders';
import pushNotificationsRouter from './routes/pushNotifications';
import { sendCollabRequestAcceptedEmail, sendCollabRequestCreatorNotificationEmail } from './services/collabRequestEmailService';
import { createContractReadyToken } from './services/contractReadyTokenService';
// Log router import for debugging
console.log('[Server] Influencers router imported:', typeof influencersRouter, influencersRouter ? '✓' : '✗');
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001; // Fly.io uses 8080, but we keep 3001 for local dev

// Initialize Supabase client
// Use VITE_SUPABASE_URL if SUPABASE_URL is not set or is a variable reference (for local dev)
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
// If SUPABASE_URL looks like a variable reference (${...}), use VITE_SUPABASE_URL instead
if (supabaseUrl.startsWith('${') || supabaseUrl === '') {
  supabaseUrl = process.env.VITE_SUPABASE_URL || '';
}

let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
// If SERVICE_ROLE_KEY looks like a variable reference, try to find it
if (supabaseServiceKey.startsWith('${') || supabaseServiceKey === '') {
  // Try to find the service role key - it might be in a different env var name
  supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_KEY
    || '';
}

// Initialize Supabase client with error handling
// Don't throw errors during module initialization (crashes Vercel serverless functions)
let supabase: ReturnType<typeof createClient<Database>>;
let supabaseInitialized = false;

try {
  // Check if we have valid credentials (not placeholders)
  const hasValidCredentials =
    supabaseUrl &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseServiceKey &&
    supabaseServiceKey !== 'placeholder-key';

  if (hasValidCredentials) {
    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    supabaseInitialized = true;
    console.log('✅ Supabase client initialized successfully');
  } else {
    // Create a dummy client to prevent crashes (will fail on actual use)
    supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.warn('⚠️ Supabase client initialized with placeholder values. API calls will fail.');
  }
} catch (error: any) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  // Create a dummy client to prevent crashes
  supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export { supabase, supabaseInitialized };

// Export resolved config for use in other services (e.g., REST API calls)
export const supabaseConfig = {
  url: supabaseUrl,
  serviceRoleKey: supabaseServiceKey
};

// Verify service role key is being used (for debugging)
if (supabaseInitialized && supabaseServiceKey && supabaseServiceKey.length > 50) {
  console.log('✅ Supabase client initialized with service role key (length:', supabaseServiceKey.length, ')');
} else if (supabaseInitialized) {
  console.warn('⚠️ Supabase client may not be using service role key. Key length:', supabaseServiceKey?.length || 0);
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
      normalizedOrigin.startsWith('https://127.0.0.1:')) {
      console.log('[CORS] ✓ Allowing localhost origin:', origin);
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
  // Reflect Access-Control-Request-Headers so Supabase client headers are allowed
  // (apikey, x-client-info, x-supabase-api-version, prefer, range, etc).
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
 * Supabase proxy to bypass ISP DNS/hostname blocks in India.
 * Routes frontend Supabase traffic through api.creatorarmour.com.
 */
app.all('/supabase-proxy/*', async (req: express.Request, res: express.Response) => {
  const targetPath = req.params[0];
  const baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

  if (!baseUrl) {
    return res.status(500).json({ error: 'Database URL not configured' });
  }

  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${targetPath}`;

  const headers = { ...req.headers } as Record<string, string>;
  delete headers.host;
  delete headers.connection;
  delete headers.origin;
  delete headers.referer;
  delete headers['content-length'];

  if (!headers.apikey && process.env.SUPABASE_ANON_KEY) {
    headers.apikey = process.env.SUPABASE_ANON_KEY;
  }

  try {
    const upstream = await fetch(targetUrl + (Object.keys(req.query || {}).length ? `?${new URLSearchParams(req.query as Record<string, string>).toString()}` : ''), {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'content-length'].includes(k)) return;
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (error: any) {
    console.error('[SupabaseProxy] error:', error?.message || error);
    return res.status(500).json({ error: 'ISP Bypass Proxy Error' });
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

// Public API Routes (no auth required)
app.use('/api/brand-response', brandResponseRouter);
app.use('/api/deal-details-tokens', dealDetailsTokensRouter); // Public routes (auth handled internally)
app.use('/api/contract-ready-tokens', contractReadyTokensRouter); // Public routes for contract ready page
app.use('/api/gst', gstRouter); // Public GST lookup route
app.use('/api/otp', otpPublicRouter); // Public OTP routes for brand response page
app.use('/api/collab', collabRequestsRouter); // Public collab link routes (/:username and /:username/submit)
app.use('/api/collab-analytics', collabAnalyticsRouter); // Public analytics tracking + authenticated analytics endpoints
app.use('/api/creators', creatorsRouter); // Public creator directory routes
app.use('/api/shipping', shippingRouter); // Public shipping update (brand, no auth)
app.use('/api/cron', cronDealRemindersRouter); // Cron: deal reminders (protected by CRON_SECRET in route)

// API Routes (protected)
app.use('/api/brand-reply-tokens', authMiddleware, rateLimitMiddleware, brandReplyTokensRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, conversationsRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, messagesRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, attachmentsRouter);
app.use('/api/payments', authMiddleware, rateLimitMiddleware, paymentsRouter);

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

// Public routes for contracts (no auth required) - must be before protected routes
app.get('/api/protection/contracts/:dealId/view', viewContractHandler);
app.get('/api/protection/contracts/:dealId/download-docx', downloadContractDocxHandler);

// Protected routes for protection features
app.use('/api/protection', authMiddleware, rateLimitMiddleware, protectionRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/ai', authMiddleware, rateLimitMiddleware, aiRouter);
app.use('/api/deals', authMiddleware, rateLimitMiddleware, dealsRouter);
app.use('/api/complaints', authMiddleware, rateLimitMiddleware, complaintsRouter);
app.use('/api/influencers', authMiddleware, rateLimitMiddleware, influencersRouter);
app.use('/api/collab-requests', authMiddleware, rateLimitMiddleware, collabRequestsRouter); // Protected collab request management routes
// Note: /api/collab-analytics is already mounted as public route above (line 284)
// OTP routes - protected routes require auth
app.use('/api/otp', authMiddleware, rateLimitMiddleware, otpRouter);
app.use('/api/push', authMiddleware, rateLimitMiddleware, pushNotificationsRouter);

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

// CreatorArmour Backend API Server
// Express server with Supabase auth, rate limiting, and all messaging endpoints

// Load environment variables
import dotenv from 'dotenv';

// Load environment variables
// In Vercel, environment variables are already set, so dotenv is only needed for local dev
// Try to load .env files, but don't fail if they don't exist (Vercel provides env vars directly)
try {
  dotenv.config();
  // Also try server-specific .env if it exists
  dotenv.config({ path: '.env' });
} catch (error) {
  // In Vercel serverless, env vars are provided directly, so this is fine
  console.log('⚠️ Could not load .env files (this is normal in Vercel)');
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import conversationsRouter from './routes/conversations.js';
import messagesRouter from './routes/messages.js';
import attachmentsRouter from './routes/attachments.js';
import paymentsRouter from './routes/payments.js';
import protectionRouter from './routes/protection.js';
import adminRouter from './routes/admin.js';
import brandResponseRouter from './routes/brandResponse.js';
import brandReplyTokensRouter from './routes/brandReplyTokens.js';
import aiRouter from './routes/ai.js';
import otpRouter, { publicRouter as otpPublicRouter } from './routes/otp.js';
import dealsRouter from './routes/deals.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

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
let supabase: ReturnType<typeof createClient>;
let supabaseInitialized = false;

try {
  // Check if we have valid credentials (not placeholders)
  const hasValidCredentials = 
    supabaseUrl && 
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseServiceKey && 
    supabaseServiceKey !== 'placeholder-key';
  
  if (hasValidCredentials) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    supabaseInitialized = true;
    console.log('✅ Supabase client initialized successfully');
  } else {
    // Create a dummy client to prevent crashes (will fail on actual use)
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
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
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
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
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or cloudflared tunnel)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:8080',
      'http://localhost:8080',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
      'https://www.creatorarmour.com',
      'https://creatorarmour.com',
      'https://api.creatorarmour.com'
    ];
    
    // Allow Render frontend URLs
    if (origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Allow Netlify frontend URLs
    if (origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    // Allow cloudflared tunnel URLs (trycloudflare.com)
    if (origin.includes('trycloudflare.com') || origin.includes('creatorarmour.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/otp', otpPublicRouter); // Public OTP routes for brand response page

// API Routes (protected)
app.use('/api/brand-reply-tokens', authMiddleware, rateLimitMiddleware, brandReplyTokensRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, conversationsRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, messagesRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, attachmentsRouter);
app.use('/api/payments', authMiddleware, rateLimitMiddleware, paymentsRouter);
app.use('/api/protection', authMiddleware, rateLimitMiddleware, protectionRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/ai', authMiddleware, rateLimitMiddleware, aiRouter);
app.use('/api/deals', authMiddleware, rateLimitMiddleware, dealsRouter);
// OTP routes - protected routes require auth
app.use('/api/otp', authMiddleware, rateLimitMiddleware, otpRouter);

// 404 handler for API routes (must be before error handler)
app.use('/api/*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`
  });
});

// Error handler
app.use(errorHandler);

// Export for Vercel serverless functions
export default app;

// For local development, start the server
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 CreatorArmour API server running on port ${PORT}`);
  });
}


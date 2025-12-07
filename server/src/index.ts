// NoticeBazaar Backend API Server
// Express server with Supabase auth, rate limiting, and all messaging endpoints

// Load environment variables
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load both root .env and server/.env
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import conversationsRouter from './routes/conversations';
import messagesRouter from './routes/messages';
import attachmentsRouter from './routes/attachments';
import paymentsRouter from './routes/payments';
import protectionRouter from './routes/protection';
import adminRouter from './routes/admin';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

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

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is missing! Please set SUPABASE_URL or VITE_SUPABASE_URL in your .env file');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing!');
  console.error('   Please add SUPABASE_SERVICE_ROLE_KEY to your server/.env file');
  console.error('   You can find it in your Supabase dashboard: Settings > API > service_role key');
  console.error('   For now, using anon key (limited functionality)...');
  // Use anon key as fallback (will have limited permissions)
  supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!supabaseServiceKey) {
    console.error('   ❌ VITE_SUPABASE_ANON_KEY also not found. Server cannot start.');
    process.exit(1);
  }
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Export resolved config for use in other services (e.g., REST API calls)
export const supabaseConfig = {
  url: supabaseUrl,
  serviceRoleKey: supabaseServiceKey
};

// Verify service role key is being used (for debugging)
if (supabaseServiceKey && supabaseServiceKey.length > 50) {
  console.log('✅ Supabase client initialized with service role key (length:', supabaseServiceKey.length, ')');
} else {
  console.warn('⚠️ Supabase client may not be using service role key. Key length:', supabaseServiceKey?.length || 0);
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://www.noticebazaar.com',
    'https://noticebazaar.com',
    'https://api.noticebazaar.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (protected)
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, conversationsRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, messagesRouter);
app.use('/api/conversations', authMiddleware, rateLimitMiddleware, attachmentsRouter);
app.use('/api/payments', authMiddleware, rateLimitMiddleware, paymentsRouter);
app.use('/api/protection', authMiddleware, rateLimitMiddleware, protectionRouter);
app.use('/api/admin', authMiddleware, adminRouter);

// 404 handler for API routes (must be before error handler)
app.use('/api/*', (req, res) => {
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
    console.log(`🚀 NoticeBazaar API server running on port ${PORT}`);
  });
}


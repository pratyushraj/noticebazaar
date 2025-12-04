// NoticeBazaar Backend API Server
// Express server with Supabase auth, rate limiting, and all messaging endpoints

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
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 NoticeBazaar API server running on port ${PORT}`);
});


# NoticeBazaar Messaging System - Complete Implementation

This document describes the complete messaging, advisor dashboard, payments, protection, and contract analysis implementation for NoticeBazaar.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend API](#backend-api)
4. [Frontend Components](#frontend-components)
5. [Realtime Implementation](#realtime-implementation)
6. [Services](#services)
7. [Testing](#testing)
8. [Deployment](#deployment)

## 🏗️ Architecture Overview

### Tech Stack
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Supabase)
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage (with signed URLs)
- **PDF Generation**: Puppeteer
- **Frontend**: React + TypeScript + Tailwind CSS

### Key Features
- ✅ 1:1 creator↔advisor messaging
- ✅ Advisor Dashboard with inbox, filters, quick replies
- ✅ Contract analysis with PDF report generation
- ✅ Tax inference from contracts/invoices
- ✅ Attachment handling with virus scanning
- ✅ Real-time message delivery
- ✅ RLS security policies
- ✅ Audit logging

## 🗄️ Database Schema

### Tables Created

1. **conversations** - Conversation metadata
2. **conversation_participants** - Many-to-many user-conversation relationship
3. **messages** - Message content with soft delete
4. **message_attachments** - File attachments with virus scan status
5. **message_audit_logs** - Audit trail for all message actions
6. **presence** - Real-time presence and typing indicators
7. **protection_reports** - Contract analysis results
8. **protection_issues** - Normalized issues from analysis
9. **protection_verified** - Verified positive clauses

### Migrations

Run migrations in order:
```bash
# Apply migrations
supabase db push

# Or manually:
psql $DATABASE_URL -f supabase/migrations/2025_01_28_messaging_system.sql
psql $DATABASE_URL -f supabase/migrations/2025_01_28_protection_reports.sql
```

## 🔌 Backend API

### Setup

```bash
cd server
npm install
npm run dev  # Development
npm run build && npm start  # Production
```

### Environment Variables

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
STORAGE_BUCKET=creator-assets
NODE_ENV=development
```

### API Endpoints

#### Conversations
- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation details

#### Messages
- `GET /api/conversations/:id/messages` - Get messages (paginated)
- `POST /api/conversations/:id/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark as read

#### Attachments
- `POST /api/conversations/:id/attachments/request-upload` - Get signed upload URL
- `POST /api/conversations/:id/attachments/confirm` - Confirm upload + trigger scan

#### Payments
- `GET /api/payments/recent` - Get recent payments
- `POST /api/payments/request` - Request payment
- `POST /api/payments/mark-received` - Mark payment received

#### Protection
- `POST /api/protection/analyze` - Analyze contract
- `GET /api/protection/:id/report.pdf` - Download PDF report

#### Admin
- `GET /api/admin/conversations` - List all conversations (admin only)
- `POST /api/admin/messages/:id/flag` - Flag message for review

### Authentication

All endpoints require JWT token in `Authorization: Bearer <token>` header.

## 🎨 Frontend Components

### Advisor Dashboard

**File**: `src/pages/AdvisorDashboard.tsx`

Features:
- Left sidebar with filters (All, High Risk, Payment, Tax)
- Search functionality
- Conversation list with unread counts
- Right panel: conversation view with messages
- Quick reply templates
- Attachment preview and download

### Realtime Hooks

**File**: `src/hooks/useRealtimeMessages.ts`

```typescript
import { useRealtimeMessages, useRealtimePresence } from '@/hooks/useRealtimeMessages';

// In component:
const { isConnected } = useRealtimeMessages(conversationId);
useRealtimePresence(conversationId, userId);
```

## ⚡ Realtime Implementation

### Supabase Realtime Setup

Migrations automatically enable realtime for:
- `messages` table
- `conversations` table
- `presence` table

### Client Subscription

```typescript
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

## 🔧 Services

### Contract Analysis

**File**: `server/src/services/contractAnalysis.ts`

- Extracts text from PDF using PDF.js
- Analyzes clauses for risk factors
- Returns protection score, issues, verified items, key terms

### PDF Generator

**File**: `server/src/services/pdfGenerator.ts`

- Uses Puppeteer to generate PDF from HTML template
- Matches NoticeBazaar design (purple gradient, glass cards)
- Includes protection score, issues, recommendations

### Tax Inference

**File**: `server/src/services/taxInference.ts`

- Extracts tax information from contracts/invoices
- Detects GSTIN, TDS, tax amounts
- Provides suggestions when tax not mentioned
- Returns UX hints for frontend display

### Virus Scanning

**File**: `server/src/services/virusScan.ts`

- Stub implementation ready for ClamAV integration
- Marks files as `pending`, `clean`, `infected`, or `error`
- Updates attachment record with scan result

## 🧪 Testing

### Unit Tests

```bash
cd server
npm test
```

### Integration Tests

Test RLS policies:
```bash
npm run test:integration
```

### E2E Tests

```bash
# Playwright tests
npx playwright test

# Or Cypress
npm run test:e2e
```

## 🚀 Deployment

### Backend

1. Build:
```bash
cd server
npm run build
```

2. Deploy to Vercel/Railway/Render:
```bash
vercel deploy
```

### Database

1. Run migrations:
```bash
supabase db push
```

2. Seed demo data:
```bash
psql $DATABASE_URL -f scripts/seed-demo-data.sql
```

### Environment Variables

Set in your hosting platform:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `STORAGE_BUCKET`

## 📝 Postman Collection

See `postman/NoticeBazaar_API.postman_collection.json` for:
- All API endpoints
- Sample requests/responses
- Authentication setup

## 🎯 Next Steps

1. **Integrate ClamAV** for virus scanning
2. **Add FCM/APNs** for push notifications
3. **Implement rate limiting** per user (currently global)
4. **Add message search** with full-text search
5. **Implement typing indicators** using presence table
6. **Add contract annotation tool** in advisor dashboard

## 📚 Additional Documentation

- [RLS Policies Guide](./docs/RLS_POLICIES.md)
- [Attachment Flow](./docs/ATTACHMENT_FLOW.md)
- [Tax Inference Logic](./docs/TAX_INFERENCE.md)
- [PDF Report Template](./docs/PDF_TEMPLATE.md)

## 🐛 Troubleshooting

### Realtime not working
- Check Supabase Realtime is enabled in dashboard
- Verify `ALTER PUBLICATION` statements in migration ran successfully
- Check browser console for subscription errors

### PDF generation fails
- Ensure Puppeteer dependencies installed: `apt-get install -y chromium-browser` (Linux)
- Check `NODE_ENV` is set correctly
- Verify storage bucket permissions

### RLS blocking access
- Check user is participant in conversation
- Verify `auth.uid()` matches participant `user_id`
- Test with admin role to bypass RLS

## 📄 License

Copyright © 2025 NoticeBazaar. All rights reserved.


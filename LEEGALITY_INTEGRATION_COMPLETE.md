# ✅ Leegality eSign Integration - Complete

## 🎯 What Was Fixed

### 1. **Corrected API Endpoints**
- ✅ Changed from `/documents/upload` → `/upload`
- ✅ Changed from `/documents` → `/invite`
- ✅ Added `/invite/{invitationId}` for status checks
- ✅ Added `/invite/{invitationId}/signedDocument` for downloading signed PDF

### 2. **Rewritten Service Functions** (`server/src/services/leegalityService.ts`)
- ✅ `uploadPDF(buffer, fileName)` → Returns `fileId`
- ✅ `createInvite(fileId, signers, callbackUrl)` → Returns `{ invitationId, signUrl }`
- ✅ `getInviteStatus(invitationId)` → Returns status
- ✅ `downloadSignedPDF(invitationId)` → Returns PDF buffer
- ✅ `verifyWebhookSignature(req, body)` → Verifies webhook authenticity
- ✅ `downloadPDFFromUrl(url)` → Downloads contract PDF from Supabase Storage

### 3. **Updated API Routes** (`server/src/routes/esign.ts`)
- ✅ `POST /api/esign/send` - Complete workflow:
  1. Downloads contract PDF
  2. Uploads to Leegality
  3. Creates invitation
  4. Saves `esign_invitation_id`, `esign_url`, `esign_status = 'sent'`

- ✅ `POST /api/esign/webhook` - Handles webhook:
  1. Verifies signature
  2. Downloads signed PDF when status = 'SIGNED'
  3. Uploads to Supabase Storage
  4. Updates deal: `signed_pdf_url`, `esign_status = 'signed'`, `signed_at`
  5. Auto-generates invoice

- ✅ `GET /api/esign/status/:dealId` - Returns invitation status and signed PDF URL

### 4. **Database Migration**
- ✅ Created migration: `2025_12_12_add_esign_invitation_id_to_brand_deals.sql`
- ✅ Adds `esign_invitation_id` column
- ✅ Adds index for faster queries

### 5. **Frontend** (`src/pages/DealDetailPage.tsx`)
- ✅ Shows "Send for Legal eSign" button when brand accepted
- ✅ Shows status chips: "🕒 Awaiting Signatures", "✅ Legally Signed", "❌ Signing Failed"
- ✅ Shows "View Signing Link" button when `esign_url` exists
- ✅ Shows "Download Signed Contract" button when `signed_pdf_url` exists

## 📋 Required Environment Variables

```env
LEEGALITY_AUTH_TOKEN=your_auth_token
LEEGALITY_PRIVATE_SALT=your_private_salt
LEEGALITY_WEBHOOK_SECRET=your_webhook_secret
LEEGALITY_BASE_URL=https://sandbox.leegality.com/api/v3
```

## 🗄️ Database Fields

The following fields are used in `brand_deals` table:
- `esign_provider` (default: 'leegality')
- `esign_invitation_id` (NEW - stores Leegality invitation ID)
- `esign_document_id` (stores file ID from upload)
- `esign_status` (ENUM: 'pending', 'sent', 'signed', 'failed')
- `esign_url` (signing URL)
- `signed_pdf_url` (URL of signed PDF after completion)
- `signed_at` (timestamp when signed)

## 🚀 Next Steps

1. **Apply Database Migration:**
   ```sql
   -- Run this in Supabase Dashboard SQL Editor:
   -- File: supabase/migrations/2025_12_12_add_esign_invitation_id_to_brand_deals.sql
   ```

2. **Restart Backend Server:**
   ```bash
   cd server && pnpm dev
   ```

3. **Test the Integration:**
   - Upload a contract
   - Get brand acceptance
   - Click "Send for Legal eSign"
   - Check backend logs for detailed workflow
   - Test webhook (when document is signed)

## 🔍 API Workflow

### Sending for eSign:
1. Frontend calls `POST /api/esign/send` with `dealId` and `pdfUrl`
2. Backend downloads PDF from Supabase Storage
3. Backend uploads PDF to Leegality → gets `fileId`
4. Backend creates invitation → gets `invitationId` and `signUrl`
5. Backend saves to database:
   - `esign_invitation_id = invitationId`
   - `esign_url = signUrl`
   - `esign_status = 'sent'`

### Webhook Processing:
1. Leegality calls `POST /api/esign/webhook` when document is signed
2. Backend verifies webhook signature
3. Backend downloads signed PDF from Leegality
4. Backend uploads signed PDF to Supabase Storage
5. Backend updates deal:
   - `signed_pdf_url = new_url`
   - `esign_status = 'signed'`
   - `signed_at = now()`
6. Backend auto-generates invoice

## ✅ Testing Checklist

- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Backend server restarted
- [ ] "Send for Legal eSign" button appears when brand accepted
- [ ] PDF uploads to Leegality successfully
- [ ] Invitation created successfully
- [ ] Signing URL saved to database
- [ ] Status chip shows "Awaiting Signatures"
- [ ] Webhook receives signed event
- [ ] Signed PDF downloads and uploads to Supabase
- [ ] Deal status updates to "signed"
- [ ] Invoice auto-generates
- [ ] "Download Signed Contract" button appears

## 🐛 Troubleshooting

### 404 Error on Upload:
- Check `LEEGALITY_BASE_URL` is correct
- Verify endpoint is `/upload` (not `/documents/upload`)
- Check auth token and salt are correct

### Webhook Not Working:
- Verify `LEEGALITY_WEBHOOK_SECRET` is set
- Check webhook URL is accessible (not localhost in production)
- Verify signature verification logic

### PDF Download Fails:
- Check `contract_file_url` exists in deal
- Verify Supabase Storage URL is accessible
- Check file permissions in Supabase Storage


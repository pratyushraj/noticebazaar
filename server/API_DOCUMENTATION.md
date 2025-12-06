# Contract Protection API Documentation

## Overview
Production-ready backend APIs for Contract Analysis Result action buttons in the Legal-Tech SaaS platform.

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

## Endpoints

### 1. Generate Safe Contract (Auto-Fixed)
**POST** `/api/protection/generate-safe-contract`

Generates a new contract PDF with risky clauses replaced by AI-generated safe clauses.

**Request Body:**
```json
{
  "reportId": "uuid",
  "originalFilePath": "path/to/original/contract.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "safeContractUrl": "https://storage.supabase.co/..."
}
```

**Error Responses:**
- `400`: Missing required fields
- `403`: Access denied
- `404`: Report not found
- `500`: Server error

---

### 2. Generate Fix (Per Issue Button)
**POST** `/api/protection/generate-fix`

Generates a safe, creator-friendly replacement clause for a specific issue using Gemini AI.

**Request Body:**
```json
{
  "issueId": "uuid",
  "originalClause": "The original risky clause text..."
}
```

**Response:**
```json
{
  "success": true,
  "safeClause": "The rewritten safe clause...",
  "explanation": "Brief explanation of changes made"
}
```

**Error Responses:**
- `400`: Missing required fields
- `403`: Access denied
- `404`: Issue not found
- `500`: Server error

---

### 3. Generate Negotiation Message
**POST** `/api/protection/generate-negotiation-message`

Generates a professional legal negotiation message requesting changes for multiple issues.

**Request Body:**
```json
{
  "issues": [
    {
      "title": "Issue Title",
      "description": "Issue description..."
    }
  ],
  "brandName": "Brand Name (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Professional negotiation message text..."
}
```

**Error Responses:**
- `400`: Missing or invalid issues array
- `500`: Server error

---

### 4. Send for Legal Review
**POST** `/api/protection/send-for-legal-review`

Submits a contract report for lawyer review and triggers notifications.

**Request Body:**
```json
{
  "reportId": "uuid",
  "userEmail": "user@example.com (optional)",
  "userPhone": "+1234567890 (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Legal review request submitted successfully"
}
```

**Error Responses:**
- `400`: Missing reportId
- `403`: Access denied
- `404`: Report not found
- `500`: Server error

---

### 5. Save Report to Dashboard
**POST** `/api/protection/save-report`

Saves a contract analysis report to the user's dashboard.

**Request Body:**
```json
{
  "reportId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report saved successfully"
}
```

**Error Responses:**
- `400`: Missing reportId
- `403`: Access denied
- `404`: Report not found
- `500`: Server error

---

### 6. Download Analysis Report
**GET** `/api/protection/download-report/:reportId`

Downloads the PDF analysis report for a contract.

**URL Parameters:**
- `reportId`: UUID of the report

**Response:**
- Redirects to signed download URL (valid for 1 hour)

**Error Responses:**
- `403`: Access denied
- `404`: Report or PDF not found
- `500`: Server error

---

## Database Tables

### Required Tables:
1. **protection_reports** - Contract analysis reports
2. **protection_issues** - Issues found in contracts
3. **safe_clauses** - AI-generated safe clause replacements
4. **saved_reports** - User-saved reports
5. **legal_review_requests** - Lawyer review requests

See `server/database/migrations/protection_tables.sql` for schema.

---

## Environment Variables

Required for AI features:
```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=your_gemini_api_key
```

---

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Security

- All routes require authentication via `authMiddleware`
- Row Level Security (RLS) policies enforce data access
- Users can only access their own reports and data
- Admin users have elevated access where applicable

---

## Notes

- Safe clause generation uses Gemini AI for high-quality legal text
- PDF generation requires Puppeteer (Chrome/Chromium)
- All file operations use Supabase Storage
- Database operations are optional (graceful degradation if tables don't exist)


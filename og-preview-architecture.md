# OG Preview Architecture - CreatorArmour

## Overview

This document describes the server-rendered Open Graph (OG) preview system for CreatorArmour. The system ensures that when deal links are shared on WhatsApp, Instagram, Facebook, LinkedIn, and Twitter, they display rich previews with correct metadata.

## Problem Statement

**Original Issue**: OG meta tags were being injected via JavaScript (`useEffect`), which doesn't work because social media crawlers (WhatsApp, Facebook, Instagram, etc.) do NOT execute JavaScript. They only read static HTML.

**Solution**: Implement server-rendered OG preview endpoints that return static HTML with proper meta tags, which crawlers can read immediately.

## Architecture

### Stack Detection

- **Project Type**: Vite React SPA (Single Page Application)
- **Backend**: Express.js server (`server/src/index.ts`)
- **Solution**: Server-side OG route that returns static HTML

### Endpoints

#### 1. `/og/deal/:dealId` - Deal-Specific OG Preview

**Purpose**: Returns HTML with OG meta tags for specific deals or tokens.

**Behavior**:
- First attempts to fetch deal data from `brand_deals` table
- If not found, attempts to fetch token data from `deal_details_tokens` table
- If neither found, returns generic OG preview
- Returns static HTML with proper meta tags
- Includes redirect to actual deal page for human users

**OG Meta Tags Generated**:
```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CreatorArmour" />
<meta property="og:title" content="CreatorArmour — Deal Under Protection" />
<meta property="og:description" content="₹50,000 · XYZ Brand · Secure Contract · Payment Monitoring Enabled" />
<meta property="og:image" content="https://creatorarmour.com/og-generated/[dealId].png" />
<meta property="og:url" content="https://creatorarmour.com/deal/[dealId]" />
<meta name="twitter:card" content="summary_large_image" />
```

**Example URLs**:
- `https://creatorarmour.com/og/deal/53219ab0-150d-4b23-85bc-af9cb6f284bf`
- `https://api.creatorarmour.com/og/deal/53219ab0-150d-4b23-85bc-af9cb6f284bf`

#### 2. `/og` - Generic OG Preview

**Purpose**: Returns generic OG preview for homepage and other non-deal pages.

**OG Meta Tags**:
```html
<meta property="og:title" content="CreatorArmour — Protect Your Brand Deals" />
<meta property="og:description" content="Generate contracts, track payments & stay protected — built for creators." />
<meta property="og:image" content="https://creatorarmour.com/og-preview.png" />
```

## Implementation Details

### File Structure

```
server/
  src/
    routes/
      og.ts              # OG preview routes
    index.ts             # Server entry (registers OG routes)
```

### Data Fetching

**Deal Data** (Safe Fields Only):
- `id`
- `brand_name`
- `deal_amount`
- `deal_execution_status`
- `brand_response_status`
- `analysis_report_id`
- `deal_type`

**Security**: 
- ❌ NEVER exposes: creator email, phone, private contract terms
- ✅ ONLY exposes: safe structured info (brand name, amount, status)

### OG Description Generation

The system generates dynamic descriptions based on deal data:

**Format**: `[Amount] · [Brand Name] · [Status Indicators]`

**Examples**:
- `₹50,000 · XYZ Brand · Secure Contract · Payment Monitoring Enabled`
- `Barter Deal · ABC Company · Active Collaboration`
- `₹25,000 · Brand Name · Deal Under Protection`

### Status Text Mapping

| Deal State | OG Title |
|------------|----------|
| `accepted_verified` | "Deal Accepted & Verified" |
| `negotiation_requested` | "Negotiation in Progress" |
| `rejected` | "Deal Rejected" |
| `completed` | "Deal Completed" |
| `cancelled` | "Deal Cancelled" |
| Has `analysis_report_id` | "Deal Under Protection" |
| Default | "Deal Active" |

## Frontend Integration

### Link Generation

**Before** (JavaScript-injected meta tags - doesn't work):
```typescript
const link = `${baseUrl}/deal/${tokenId}`;
// Meta tags added via useEffect - crawlers can't see them
```

**After** (Server-rendered OG - works):
```typescript
const link = `${baseUrl}/og/deal/${tokenId}`;
// OG endpoint returns static HTML with meta tags
```

### Sharing Flow

1. User clicks "Request Collaboration Details"
2. Backend generates token
3. Frontend creates link: `https://creatorarmour.com/og/deal/[tokenId]`
4. User shares link on WhatsApp/Instagram/etc.
5. Crawler fetches `/og/deal/[tokenId]`
6. Server returns static HTML with OG meta tags
7. Social platform displays rich preview
8. When user clicks preview, redirects to actual deal page

## Testing

### Manual Testing

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
   - Enter: `https://creatorarmour.com/og/deal/[dealId]`
   - Click "Scrape Again"
   - Verify OG tags appear correctly

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter: `https://creatorarmour.com/og/deal/[dealId]`
   - Verify card preview appears

3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
   - Enter: `https://creatorarmour.com/og/deal/[dealId]`
   - Verify preview appears

4. **WhatsApp/Instagram**: Share link in DM and verify preview appears

### Expected Results

✅ **Pass Criteria**:
- OG title appears correctly
- OG description shows deal info (amount, brand, status)
- OG image loads (or falls back to default)
- Preview looks professional
- No sensitive data exposed

❌ **Fail Criteria**:
- Generic preview when deal exists
- Missing or incorrect metadata
- Sensitive data (emails, phone numbers) exposed
- Broken images

## OG Image Generation (Future Enhancement)

**Current**: Uses placeholder image path: `https://creatorarmour.com/og-generated/[dealId].png`

**Recommended**: Implement dynamic OG image generation using:
- `@vercel/og` (Vercel Edge Functions)
- `puppeteer` (screenshot of styled HTML)
- `node-canvas` (canvas-based rendering)

**Design Spec**:
- Purple gradient background
- Shield icon
- Deal name
- Amount (big + bold)
- Status badge
- CreatorArmour branding

**Endpoint**: `/og-image/deal/:dealId` (to be implemented)

## Deployment Considerations

### Server Configuration

The OG routes are registered as **public routes** (no authentication required) because:
1. Social media crawlers don't send auth tokens
2. OG previews should be publicly accessible
3. Only safe, non-sensitive data is exposed

### Caching

**Recommendation**: Add caching headers for OG responses:
```typescript
res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
```

This reduces database load and improves response time for crawlers.

### CDN Integration

For production, consider:
- Serving OG images via CDN
- Caching OG HTML responses at CDN level
- Using edge functions for OG generation (Vercel, Cloudflare Workers)

## Security Checklist

- ✅ No creator emails exposed
- ✅ No phone numbers exposed
- ✅ No private contract terms exposed
- ✅ Only safe structured info (brand name, amount, status)
- ✅ Public routes don't require authentication (by design)
- ✅ Input validation on dealId/tokenId
- ✅ HTML escaping to prevent XSS
- ✅ Error handling returns generic preview (no stack traces)

## Troubleshooting

### Issue: Preview shows generic OG instead of deal-specific

**Possible Causes**:
1. Deal/token not found in database
2. Database connection issue
3. Invalid dealId format

**Solution**: Check server logs, verify deal exists, check database connection

### Issue: Preview image doesn't load

**Possible Causes**:
1. OG image not generated yet
2. Image path incorrect
3. CORS issue

**Solution**: Use default OG image as fallback, verify image path, check CORS headers

### Issue: Crawler shows old preview

**Possible Causes**:
1. Social platform cached old preview
2. Cache headers not set

**Solution**: 
- Use Facebook Debugger "Scrape Again" to clear cache
- Add cache headers to OG responses
- Wait for cache to expire (usually 24 hours)

## Future Enhancements

1. **Dynamic OG Image Generation**: Generate custom images per deal
2. **OG Analytics**: Track which deals are shared most
3. **A/B Testing**: Test different OG descriptions for engagement
4. **Multi-language Support**: OG descriptions in multiple languages
5. **Rich Snippets**: Add structured data (Schema.org) for better SEO

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Acceptance Criteria

✅ WhatsApp preview works  
✅ Instagram DM preview works  
✅ FB Messenger preview works  
✅ LinkedIn preview works  
✅ Twitter card works  
✅ No JS-required rendering  
✅ Loads instantly  
✅ Handles deals with payment amount  
✅ Handles deals without payment amount  
✅ Handles barter deals  
✅ Does NOT leak personal names or emails  
✅ Safe + compliant language  

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Author**: CreatorArmour Development Team


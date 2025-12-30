// OG Preview Routes
// Server-rendered Open Graph meta tags for social media sharing
// These routes return static HTML with meta tags (no JS) so crawlers can read them

import { Router, Request, Response } from 'express';
import { supabase } from '../index.js';

const router = Router();

// Helper function to format currency
function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '';
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Helper function to get deal status text
function getDealStatusText(deal: any): string {
  const status = deal.deal_execution_status || deal.status || 'active';
  const brandResponseStatus = deal.brand_response_status;
  
  if (brandResponseStatus === 'accepted_verified') {
    return 'Deal Accepted & Verified';
  } else if (brandResponseStatus === 'negotiation_requested') {
    return 'Negotiation in Progress';
  } else if (brandResponseStatus === 'rejected') {
    return 'Deal Rejected';
  } else if (status === 'completed') {
    return 'Deal Completed';
  } else if (status === 'cancelled') {
    return 'Deal Cancelled';
  } else if (deal.analysis_report_id) {
    return 'Deal Under Protection';
  } else {
    return 'Deal Active';
  }
}

// Helper function to generate OG description
function generateOGDescription(deal: any): string {
  const brandName = deal.brand_name || 'Brand';
  const amount = deal.deal_amount;
  const status = getDealStatusText(deal);
  
  const parts: string[] = [];
  
  if (amount) {
    parts.push(formatCurrency(amount));
  }
  
  parts.push(brandName);
  
  if (deal.analysis_report_id) {
    parts.push('Secure Contract');
    parts.push('Payment Monitoring Enabled');
  } else {
    parts.push('Active Collaboration');
  }
  
  return parts.join(' · ');
}

// GET /og/deal/:dealId
// Returns HTML with OG meta tags for deal sharing
router.get('/deal/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    if (!dealId) {
      return res.status(400).send('Invalid deal ID');
    }

    // First, try to fetch as a deal
    let deal: any = null;
    let dealError: any = null;
    
    const { data: dealData, error: dealErr } = await supabase
      .from('brand_deals')
      .select('id, brand_name, deal_amount, deal_execution_status, brand_response_status, analysis_report_id, deal_type')
      .eq('id', dealId)
      .maybeSingle();

    deal = dealData;
    dealError = dealErr;

    // If not found as deal, try as token (for deal details collection links)
    if (dealError || !deal) {
      const { data: tokenData, error: tokenErr } = await supabase
        .from('deal_details_tokens')
        .select('id, creator_id, used_at')
        .eq('id', dealId)
        .maybeSingle();

      if (!tokenErr && tokenData) {
        // It's a token - return generic preview for deal details collection
        const ogTitle = 'CreatorArmour — Share Deal Details';
        const ogDescription = 'Help finalize collaboration details. Secure form powered by CreatorArmour.';
        const ogImage = 'https://creatorarmour.com/og-preview.png';
        
        // Determine frontend URL based on environment
        const frontendUrl = process.env.FRONTEND_URL || 
                           (process.env.NODE_ENV === 'development' 
                             ? 'http://localhost:8080' 
                             : 'https://creatorarmour.com');
        
        // Use HashRouter format for frontend redirect
        const ogUrl = `${frontendUrl}/#/deal-details/${dealId}`;
        
        return res.send(generateOGHTML(ogTitle, ogDescription, ogImage, ogUrl));
      }
      
      // Neither deal nor token found - return generic OG preview but still redirect to deal page
      // This allows the frontend to handle the 404 gracefully
      const frontendUrl = process.env.FRONTEND_URL || 
                         (process.env.NODE_ENV === 'development' 
                           ? 'http://localhost:8080' 
                           : 'https://creatorarmour.com');
      const ogUrl = `${frontendUrl}/#/deal-details/${dealId}`;
      return res.send(generateOGHTML(
        'CreatorArmour — Deal Details',
        'View deal details on CreatorArmour.',
        'https://creatorarmour.com/og-preview.png',
        ogUrl
      ));
    }

    // Generate OG data
    const ogTitle = `CreatorArmour — ${getDealStatusText(deal)}`;
    const ogDescription = generateOGDescription(deal);
    // Use default OG image (dynamic image generation to be implemented later)
    // TODO: Implement /og-image/deal/:dealId for dynamic image generation
    const ogImage = 'https://creatorarmour.com/og-preview.png';
    
    // Determine frontend URL based on environment
    const frontendUrl = process.env.FRONTEND_URL || 
                       (process.env.NODE_ENV === 'development' 
                         ? 'http://localhost:8080' 
                         : 'https://creatorarmour.com');
    
    // Use HashRouter format for frontend redirect (or BrowserRouter if configured)
    // For now, redirect to deal-details page - frontend will handle routing
    const ogUrl = `${frontendUrl}/#/deal-details/${dealId}`;
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(generateOGHTML(ogTitle, ogDescription, ogImage, ogUrl));
  } catch (error: any) {
    console.error('[OG] Error generating deal OG:', error);
    // Return generic OG on error
    return res.send(generateGenericOGHTML());
  }
});

// GET /og
// Generic OG preview for homepage and other pages
router.get('/', async (req: Request, res: Response) => {
  return res.send(generateGenericOGHTML());
});

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper function to generate OG HTML
function generateOGHTML(title: string, description: string, image: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="CreatorArmour" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${url}" />
  <script>
    window.location.href = "${url}";
  </script>
</head>
<body>
  <p>Redirecting to <a href="${url}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;
}

// Helper function to generate generic OG HTML
function generateGenericOGHTML(): string {
  const ogTitle = 'CreatorArmour — Protect Your Brand Deals';
  const ogDescription = 'Generate contracts, track payments & stay protected — built for creators.';
  const ogImage = 'https://creatorarmour.com/og-preview.png';
  
  // Determine frontend URL based on environment
  const frontendUrl = process.env.FRONTEND_URL || 
                     (process.env.NODE_ENV === 'development' 
                       ? 'http://localhost:8080' 
                       : 'https://creatorarmour.com');
  
  return generateOGHTML(ogTitle, ogDescription, ogImage, frontendUrl);
}

export default router;


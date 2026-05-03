import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

router.get('/collab/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Basic fallback tags
    let title = 'Creator Armour - Protect Creator Deals & Save Time';
    let description = 'Say goodbye to delayed payments, scope creep, and unstructured DMs. Create a free collab link to protect your deals.';
    let imageUrl = 'https://creatorarmour.com/og-preview.png';

    if (username && username !== 'undefined') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, minimum_rate, barter_enabled')
        .eq('collab_username', username)
        .maybeSingle();

      if (profile) {
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator';
        
        let pricingInfo = '';
        if (profile.minimum_rate && profile.minimum_rate > 0) {
          pricingInfo = ` | Starting at ₹${profile.minimum_rate}`;
        } else if (profile.barter_enabled) {
          pricingInfo = ` | Accepting Barter Deals`;
        }

        title = `Book ${name} for a Collab${pricingInfo}`;
        description = `Submit your collab offer to ${name} directly. Secured by Creator Armour to protect deliverables and ensure timely payments.`;
        
        if (profile.avatar_url) {
          // If using a custom dynamic OG image service later, you could pass the avatar_url. 
          // For now, using the avatar directly works well as a square thumbnail for bots like WhatsApp.
          imageUrl = profile.avatar_url;
        }
      }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="https://creatorarmour.com/${username}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://creatorarmour.com/${username}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <meta name="robots" content="noindex, follow">
</head>
<body>
  <p>Redirecting to ${title}...</p>
  <script>
    // For any browser that accidentally hits this page instead of the SPA, redirect them.
    window.location.replace("/${username}");
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (error) {
    console.error('[OG] Error generating tags:', error);
    return res.status(500).send('Server Error');
  }
});

export default router;

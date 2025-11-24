import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Vercel Serverless Function for SSR of dashboard-preview
 * This provides server-side rendering for the preview page
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Get the HTML template
    // In Vercel, the dist folder is available at process.cwd()
    const htmlPath = join(process.cwd(), 'dist', 'index.html');
    
    let html: string;
    try {
      html = readFileSync(htmlPath, 'utf-8');
    } catch (error) {
      // Fallback: return a basic HTML structure if file not found
      html = `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NoticeBazaar Dashboard Preview</title>
  <style>
    body { 
      margin: 0; 
      font-family: system-ui, -apple-system, sans-serif;
      background: #0B1325;
      color: #E6EEF8;
    }
    #root { 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .loading {
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <h1>Loading Dashboard Preview...</h1>
      <p>Please wait while the dashboard loads.</p>
    </div>
  </div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;
    }
    
    // Inject meta tags for better SEO/crawling
    const metaTags = `
    <meta name="description" content="Preview the NoticeBazaar Creator Dashboard - Manage deals, payments, and content protection" />
    <meta property="og:title" content="NoticeBazaar Creator Dashboard Preview" />
    <meta property="og:description" content="Preview the NoticeBazaar Creator Dashboard" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    `;
    
    html = html.replace('</head>', `${metaTags}</head>`);
    
    // Ensure the root div exists
    if (!html.includes('<div id="root">')) {
      html = html.replace('<body>', '<body><div id="root"></div>');
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Server Error</h1>
        <p>Unable to render dashboard preview. Please try again later.</p>
      </body>
      </html>
    `);
  }
}


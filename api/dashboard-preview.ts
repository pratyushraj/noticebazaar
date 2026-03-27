// @ts-nocheck
// Vercel Serverless Function for SSR of dashboard-preview
// This provides server-side rendering for the preview page

import { readFileSync } from 'fs';
import { join } from 'path';

// Type definitions for Vercel (available at runtime)
type VercelRequest = {
  url?: string;
  query?: Record<string, string | string[]>;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  send: (body: string) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('SSR Function called:', req.url, req.query);
  
  try {
    // Try multiple possible paths for the HTML file
    // Vercel may use different paths depending on build output
    const possiblePaths = [
      join(process.cwd(), 'dist', 'index.html'),
      join(process.cwd(), '.vercel', 'output', 'static', 'index.html'),
      join(process.cwd(), '.next', 'static', 'index.html'),
      join(process.cwd(), 'index.html'),
      // Vercel's serverless function environment
      join('/var/task', 'dist', 'index.html'),
      join('/var/task', 'index.html'),
    ];
    
    let html: string | null = null;
    let htmlPath: string | null = null;
    
    for (const path of possiblePaths) {
      try {
        html = readFileSync(path, 'utf-8');
        htmlPath = path;
        console.log('Found HTML at:', path);
        break;
      } catch (error) {
        // Try next path
        continue;
      }
    }
    
    if (!html) {
      console.log('HTML file not found in any expected location, using fallback');
      // Fallback HTML with proper meta tags
      html = `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NoticeBazaar Dashboard Preview</title>
  <meta name="description" content="Preview the NoticeBazaar Creator Dashboard - Manage deals, payments, and content protection" />
  <meta property="og:title" content="NoticeBazaar Creator Dashboard Preview" />
  <meta property="og:description" content="Preview the NoticeBazaar Creator Dashboard" />
  <meta property="og:type" content="website" />
  <meta name="robots" content="index, follow" />
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
    } else {
      // Inject meta tags for better SEO/crawling
      const metaTags = `
    <meta name="description" content="Preview the NoticeBazaar Creator Dashboard - Manage deals, payments, and content protection" />
    <meta property="og:title" content="NoticeBazaar Creator Dashboard Preview" />
    <meta property="og:description" content="Preview the NoticeBazaar Creator Dashboard" />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    `;
      
      // Only add meta tags if they don't already exist
      if (!html.includes('og:title')) {
        html = html.replace('</head>', `${metaTags}</head>`);
      }
    }
    
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
      <head>
        <title>Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <h1>Server Error</h1>
        <p>Unable to render dashboard preview. Please try again later.</p>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      </body>
      </html>
    `);
  }
}

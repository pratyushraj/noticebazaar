// Safe Contract Generator Service
// Generates a new contract PDF with risky clauses replaced by safe clauses

import { supabase, supabaseConfig } from '../index.js';
import { generateSafeClause } from './clauseGenerator.js';
import * as pdfjsLib from 'pdfjs-dist';
import { generateReportPdf } from './pdfGenerator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get resolved Supabase URL and service role key from the main client
// The supabase client in index.ts already has these resolved correctly
function getSupabaseConfig() {
  // Get from environment with proper resolution (same logic as index.ts)
  let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  
  // If SUPABASE_URL contains a variable reference (${...}), resolve it
  if (supabaseUrl && supabaseUrl.startsWith('${') && supabaseUrl.endsWith('}')) {
    const varName = supabaseUrl.slice(2, -1); // Extract variable name (e.g., "VITE_SUPABASE_URL")
    supabaseUrl = process.env[varName] || process.env.VITE_SUPABASE_URL || '';
  }
  
  // Fallback to VITE_SUPABASE_URL if still empty or contains unresolved variables
  if (!supabaseUrl || supabaseUrl.trim() === '' || supabaseUrl.includes('${')) {
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  }
  
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
  
  // If SERVICE_ROLE_KEY contains a variable reference, resolve it
  if (serviceRoleKey && serviceRoleKey.startsWith('${') && serviceRoleKey.endsWith('}')) {
    const varName = serviceRoleKey.slice(2, -1); // Extract variable name
    serviceRoleKey = process.env[varName] || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
  }
  
  // Fallback to VITE_SUPABASE_SERVICE_ROLE_KEY if still empty or contains unresolved variables
  // Use same fallback chain as index.ts
  if (!serviceRoleKey || serviceRoleKey.trim() === '' || serviceRoleKey.includes('${')) {
    serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY 
      || process.env.SUPABASE_SERVICE_KEY
      || process.env.SUPABASE_KEY
      || '';
  }
  
  return { supabaseUrl, serviceRoleKey };
}

// Define AnalysisResult interface locally
interface AnalysisResult {
  protectionScore: number;
  negotiationPowerScore?: number;
  overallRisk: 'low' | 'medium' | 'high';
  issues: Array<{
    severity: 'high' | 'medium' | 'low' | 'warning';
    category: string;
    title: string;
    description: string;
    clause?: string;
    recommendation: string;
  }>;
  verified: Array<{
    category: string;
    title: string;
    description: string;
    clause?: string;
  }>;
  keyTerms: {
    dealValue?: string;
    duration?: string;
    deliverables?: string;
    paymentSchedule?: string;
    exclusivity?: string;
    payment?: string;
  };
  recommendations: string[];
}

// Set up PDF.js worker for Node.js - disable worker (not needed in Node.js)
try {
  if (pdfjsLib.GlobalWorkerOptions) {
    // Disable worker for Node.js - pdfjs-dist works fine without it
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    console.log('[SafeContractGenerator] Node.js environment - worker disabled (not needed)');
  }
} catch (error: any) {
  console.warn('[SafeContractGenerator] Error setting PDF.js worker (non-critical):', error.message);
  // Continue - pdfjs-dist should still work
}

export interface SafeContractRequest {
  reportId: string;
  originalFilePath: string;
  userId: string;
}

export interface SafeContractResponse {
  safeContractUrl?: string; // Optional - only if uploaded to storage
  safeContractPath?: string; // Optional - only if uploaded to storage
  fileBuffer?: Buffer; // Direct file buffer for download (bypasses storage)
  fileName?: string; // Suggested filename
  contentType?: string; // Content type (application/pdf or text/plain)
}

/**
 * Generate a safe contract by replacing risky clauses with safe clauses
 */
export async function generateSafeContract(
  request: SafeContractRequest
): Promise<SafeContractResponse> {
  const { reportId, originalFilePath, userId } = request;

  // 1. Fetch original contract from Supabase Storage
  // originalFilePath might be in format "bucket/path" or just "path"
  // Also might be a full URL - handle all cases
  let filePath = originalFilePath;
  
  // If it's a full URL, extract the path
  if (originalFilePath.startsWith('http')) {
    // Extract path from Supabase storage URL
    const urlMatch = originalFilePath.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    if (urlMatch) {
      filePath = urlMatch[1];
    } else {
      // Try to extract from other URL formats
      const pathMatch = originalFilePath.match(/creator-assets\/(.+)$/);
      if (pathMatch) {
        filePath = pathMatch[1];
      }
    }
  } else if (originalFilePath.includes('/')) {
    // If it's "bucket/path", extract just the path
    const parts = originalFilePath.split('/');
    if (parts.length > 1 && parts[0] === 'creator-assets') {
      filePath = parts.slice(1).join('/');
    } else if (parts.length > 1) {
      // Assume first part is bucket, rest is path
      filePath = parts.slice(1).join('/');
    }
  }

  console.log('[SafeContractGenerator] Downloading contract from path:', filePath);
  
  const { data: contractData, error: downloadError } = await supabase.storage
    .from('creator-assets')
    .download(filePath);

  if (downloadError || !contractData) {
    console.error('[SafeContractGenerator] Download error:', downloadError);
    console.error('[SafeContractGenerator] Original path:', originalFilePath);
    console.error('[SafeContractGenerator] Processed path:', filePath);
    throw new Error(`Failed to download original contract: ${JSON.stringify(downloadError) || 'File not found'}`);
  }

  const contractBuffer = Buffer.from(await contractData.arrayBuffer());

  // 2. Extract text from original contract
  const contractText = await extractTextFromPdf(contractBuffer);

  // 3. Fetch all issues and safe clauses for this report (if reportId is valid)
  let issues: any[] = [];
  let existingSafeClauses: any[] = [];
  
  // Only fetch from database if reportId is not 'temp' (meaning it's a real report)
  if (reportId && reportId !== 'temp') {
    const { data: issuesData, error: issuesError } = await supabase
      .from('protection_issues')
      .select('*')
      .eq('report_id', reportId);

    if (issuesError) {
      console.warn('[SafeContractGenerator] Failed to fetch issues, continuing without them:', issuesError.message);
      // Continue without issues - we'll generate a basic safe contract
    } else {
      issues = issuesData || [];
    }

    // 4. Fetch existing safe clauses or generate new ones
    const { data: safeClausesData } = await supabase
      .from('safe_clauses')
      .select('*')
      .eq('report_id', reportId);
    
    existingSafeClauses = safeClausesData || [];
  } else {
    console.warn('[SafeContractGenerator] No reportId provided, generating basic safe contract without issue-specific fixes');
  }

  const safeClausesMap = new Map<string, string>();
  
  // Use existing safe clauses or generate new ones (only if we have issues)
  if (issues && issues.length > 0) {
    for (const issue of issues) {
      const existingClause = existingSafeClauses?.find(
        sc => sc.issue_id === issue.id
      );

      if (existingClause?.safe_clause) {
        safeClausesMap.set(issue.clause_reference || issue.title, existingClause.safe_clause);
      } else {
        // Generate new safe clause
        try {
          const generated = await generateSafeClause({
            originalClause: issue.clause_reference || '',
            issueContext: issue.description,
            issueCategory: issue.category
          });

          // Save to database (only if reportId is valid)
          if (reportId && reportId !== 'temp') {
            const insertData: any = {
              report_id: reportId,
              issue_id: issue.id,
              original_clause: issue.clause_reference || '',
              safe_clause: generated.safeClause,
              explanation: generated.explanation || ''
            };
            await (supabase as any).from('safe_clauses').insert(insertData);
          }

          safeClausesMap.set(issue.clause_reference || issue.title, generated.safeClause);
        } catch (error) {
          console.warn(`[SafeContractGenerator] Failed to generate clause for issue ${issue.id}:`, error);
          // Continue with other clauses
        }
      }
    }
  } else {
    console.log('[SafeContractGenerator] No issues found, generating basic safe contract without clause replacements');
  }

  // 5. Replace risky clauses with safe clauses in contract text
  let safeContractText = contractText;
  for (const [originalClause, safeClause] of safeClausesMap.entries()) {
    if (originalClause && safeClause) {
      // Replace the original clause with safe clause
      safeContractText = safeContractText.replace(
        new RegExp(escapeRegex(originalClause), 'gi'),
        safeClause
      );
    }
  }

  // 6. Generate new PDF from safe contract text
  // For now, we'll create a simple PDF with the safe contract text
  // In production, you might want to use a more sophisticated PDF generation library
  const safeContractBuffer = await generateSafeContractPdf(safeContractText, reportId);

  // 7. Return file directly (bypassing storage upload due to RLS issues)
  // Determine file extension based on content (PDF or text fallback)
  const isTextFile = !safeContractBuffer.toString('utf-8', 0, 4).startsWith('%PDF');
  const fileExtension = isTextFile ? '.txt' : '.pdf';
  const contentType = isTextFile ? 'text/plain' : 'application/pdf';
  const fileName = `safe-contract-version-${Date.now()}${fileExtension}`;
  
  console.log('[SafeContractGenerator] Returning safe contract directly (bypassing storage upload)');
  console.log('[SafeContractGenerator] File size:', safeContractBuffer.length, 'bytes');
  console.log('[SafeContractGenerator] Content type:', contentType);
  console.log('[SafeContractGenerator] File name:', fileName);
  
  // Return file directly instead of uploading to storage (bypasses RLS issues)
  return {
    fileBuffer: safeContractBuffer,
    fileName,
    contentType
  };
}

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Generate PDF from safe contract text
 * Falls back to text file if Puppeteer is unavailable
 */
/**
 * Convert plain text contract to structured HTML
 * Preserves sections, headings, lists, and formatting
 */
function convertTextToStructuredHtml(text: string): string {
  let html = '';
  const lines = text.split('\n');
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // Skip empty lines (will be handled by spacing)
    if (!line) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }
    
    // Main title
    if (line.includes('CREATOR–BRAND COLLABORATION AGREEMENT')) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<h1>${escapeHtml(line)}</h1>\n`;
      continue;
    }
    
    // Section headings (numbered sections like "1. Scope of Work")
    if (/^\d+\.\s+[A-Z]/.test(line)) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<div class="section"><h2>${escapeHtml(line)}</h2>\n`;
      continue;
    }
    
    // Subheadings (like "Late Payment Protection" - all caps or title case, short)
    if (line.length < 60 && /^[A-Z][a-zA-Z\s]+$/.test(line) && !line.includes(':') && !line.includes('•')) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += `<h3>${escapeHtml(line)}</h3>\n`;
      continue;
    }
    
    // Bullet points
    if (line.startsWith('•') || line.startsWith('-')) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      const listItem = line.substring(1).trim();
      html += `<li>${escapeHtml(listItem)}</li>\n`;
      continue;
    }
    
    // Close list if we hit a non-list item
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
    
    // Regular paragraphs
    html += `<p>${escapeHtml(line)}</p>\n`;
  }
  
  // Close any open list
  if (inList) {
    html += '</ul>\n';
  }
  
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function generateSafeContractPdf(text: string, reportId: string): Promise<Buffer> {
  // CRITICAL: Contracts MUST use Puppeteer only - PDFKit is not acceptable for legal documents
  // PDFKit destroys formatting (line breaks, headings, lists) and is only suitable for invoices/receipts
  
  // SAFETY ASSERTION: Verify contract text structure before generation
  if (!text || text.length < 500) {
    throw new Error('Contract text is too short or empty. Cannot generate PDF.');
  }
  
  // Assert that text contains newlines (structure indicator)
  if (!text.includes('\n')) {
    throw new Error('Contract text appears malformed (no line breaks). Cannot generate PDF.');
  }
  
  // Assert that key sections exist
  const requiredSections = [
    'CREATOR–BRAND COLLABORATION AGREEMENT',
    'Scope of Work',
    'Compensation & Payment Terms'
  ];
  
  const missingSections = requiredSections.filter(section => !text.includes(section));
  if (missingSections.length > 0) {
    throw new Error(`Contract text is missing required sections: ${missingSections.join(', ')}`);
  }
  
  // POST-PROCESSING: Clean artifacts before HTML conversion
  let processedText = text
    // Remove .; artifacts
    .replace(/\.\s*;\s*(\d)/g, '$1') // Remove .; before numbers
    .replace(/([a-zA-Z0-9])\s*\.\s*;\s*/g, '$1.') // Remove .; after text
    .replace(/\.\s*;\s*/g, '.') // Remove any remaining .;
    // Normalize newlines (ensure double breaks between sections)
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .replace(/\n\n\n/g, '\n\n') // Triple -> double
    // Fix currency
    .replace(/\bRs\.\s*(\d[\d,]*)/g, '₹$1')
    .replace(/\bRs\s+(\d[\d,]*)/g, '₹$1')
    .replace(/¹/g, '₹');
  
  // Convert plain text to structured HTML
  const structuredHtml = convertTextToStructuredHtml(processedText);
  
  // Try Puppeteer (REQUIRED - no fallback)
  try {
    const puppeteer = await import('puppeteer');
    
    // Try to find Chrome executable path
    let executablePath: string | undefined = process.env.PUPPETEER_EXECUTABLE_PATH;
    
    // If not set, try to use Puppeteer's default executable path
    if (!executablePath) {
      try {
        // Use Puppeteer's executablePath() method to find installed Chrome
        executablePath = puppeteer.default.executablePath();
        console.log('[SafeContractGenerator] Using Chrome executable:', executablePath);
        
        // Verify the executable exists and is executable
        const fs = await import('fs');
        if (!fs.existsSync(executablePath)) {
          console.warn('[SafeContractGenerator] Chrome executable not found at:', executablePath);
          executablePath = undefined; // Let Puppeteer find it
        }
      } catch (e) {
        console.warn('[SafeContractGenerator] Could not find Chrome executable path:', (e as Error).message);
        // Will try default launch without explicit path
        executablePath = undefined;
      }
    }
    
    const browser = await puppeteer.default.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        // Remove --single-process as it can cause crashes on macOS
        // Add macOS-specific flags
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
      timeout: 30000, // 30 second timeout
    });

    try {
      // Wrap structured HTML in full document
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.7;
      padding: 40px;
      color: #333;
      font-size: 11pt;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #667eea;
      font-size: 18pt;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p {
      margin: 12px 0;
      text-align: justify;
    }
    ul, ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    li {
      margin: 6px 0;
      line-height: 1.7;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10pt;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Safe Contract Version</h1>
    <p>Report ID: ${reportId}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  ${structuredHtml}
  <div class="footer">
    <p>This agreement was generated using the CreatorArmour Contract Scanner based on information provided by the Parties. CreatorArmour is not a party to this agreement and does not provide legal representation.</p>
    <p style="margin-top: 8px; font-weight: 500;">The Parties are advised to independently review this agreement before execution.</p>
  </div>
</body>
</html>
      `;

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();
      return Buffer.from(pdf);
    } catch (error) {
      await browser.close().catch(() => {});
      throw error;
    }
  } catch (puppeteerError: any) {
    // CRITICAL: Do NOT fallback to PDFKit for contracts
    // PDFKit destroys formatting and is unacceptable for legal documents
    console.error('[SafeContractGenerator] Puppeteer failed:', puppeteerError.message);
    
    // Provide helpful error message
    if (puppeteerError.message?.includes('Could not find Chrome')) {
      throw new Error(
        'Contract PDF generation failed. Chrome/Puppeteer is required.\n\n' +
        'To fix this, run: npx puppeteer browsers install chrome\n\n' +
        'PDFKit fallback is disabled for legal contracts to ensure proper formatting.'
      );
    }
    
    throw new Error(
      `Contract PDF generation failed. Puppeteer is required for legal documents.\n\n` +
      `Error: ${puppeteerError.message}\n\n` +
      `PDFKit fallback is intentionally disabled to prevent formatting corruption.`
    );
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


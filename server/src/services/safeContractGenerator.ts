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

// Set up PDF.js worker for Node.js
const pdfjsWorkerPath = path.join(
  __dirname,
  '../../node_modules/pdfjs-dist/build/pdf.worker.min.js'
);
if (fs.existsSync(pdfjsWorkerPath)) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerPath;
} else {
  // Fallback to CDN if local file doesn't exist
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
async function generateSafeContractPdf(text: string, reportId: string): Promise<Buffer> {
  // Try to use Puppeteer first (better quality PDF)
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      // Create a simple HTML representation of the safe contract
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      padding: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #667eea;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .content {
      white-space: pre-wrap;
      text-align: justify;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 2px 4px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Safe Contract Version</h1>
    <p>Report ID: ${reportId}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  <div class="content">${text}</div>
  <div class="footer">
    <p>This contract has been reviewed and modified to include creator-friendly clauses.</p>
    <p>Generated by NoticeBazaar AI Contract Protection Service</p>
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
    // Fallback: Return error if Puppeteer fails
    console.error('[SafeContractGenerator] Puppeteer failed:', puppeteerError.message);
    throw new Error('PDF generation failed. Please ensure Puppeteer dependencies are installed.');
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// Document Text Extraction Service
// Supports PDF, DOC, and DOCX files

import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

export type DocumentType = 'pdf' | 'doc' | 'docx';

/**
 * Detect document type from buffer or URL
 */
export function detectDocumentType(buffer: Buffer, url?: string): DocumentType {
  // Check file signature (magic bytes)
  const signature = buffer.slice(0, 8);
  
  // PDF signature: %PDF
  if (signature[0] === 0x25 && signature[1] === 0x50 && signature[2] === 0x44 && signature[3] === 0x46) {
    return 'pdf';
  }
  
  // DOCX signature: PK (ZIP archive) - DOCX is a ZIP file
  if (signature[0] === 0x50 && signature[1] === 0x4B) {
    return 'docx';
  }
  
  // DOC signature: Microsoft Office Compound Document
  // Starts with D0 CF 11 E0 A1 B1 1A E1
  if (signature[0] === 0xD0 && signature[1] === 0xCF && signature[2] === 0x11 && signature[3] === 0xE0) {
    return 'doc';
  }
  
  // Fallback: Check URL extension
  if (url) {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.pdf')) return 'pdf';
    if (urlLower.endsWith('.docx')) return 'docx';
    if (urlLower.endsWith('.doc')) return 'doc';
  }
  
  // Default to PDF (most common)
  return 'pdf';
}

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Set up PDF.js worker
  try {
    if (pdfjsLib.GlobalWorkerOptions) {
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        console.log('[DocumentExtractor] Node.js environment - worker disabled');
      }
    }
  } catch (error: any) {
    console.warn('[DocumentExtractor] Error setting PDF.js worker (non-critical):', error.message);
  }

  const uint8Array = new Uint8Array(buffer);
  
  if (uint8Array.length === 0) {
    throw new Error('PDF buffer is empty');
  }

  // Load PDF
  let pdf;
  try {
    let getDocument = (pdfjsLib as any).getDocument;
    if (!getDocument || typeof getDocument !== 'function') {
      getDocument = (pdfjsLib as any).default?.getDocument;
    }
    if (!getDocument || typeof getDocument !== 'function') {
      const lib: any = pdfjsLib;
      if (lib.getDocument) getDocument = lib.getDocument;
      else if (lib.default?.getDocument) getDocument = lib.default.getDocument;
    }
    
    if (!getDocument || typeof getDocument !== 'function') {
      throw new Error('pdfjsLib.getDocument is not a function');
    }
    
    const loadingTask = getDocument({ 
      data: uint8Array,
      verbosity: 0,
      stopAtErrors: false,
      maxImageSize: 1024 * 1024 * 10
    });
    pdf = await loadingTask.promise;
  } catch (error: any) {
    console.error('[DocumentExtractor] PDF loading error:', error);
    if (error.name === 'InvalidPDFException' || error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF structure. Please ensure the file is a valid PDF document.');
    }
    throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
  }
  
  // Extract text from all pages
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => (item as TextItem).str)
      .join(' ');
    fullText += pageText + '\n';
  }

  if (!fullText || fullText.trim().length === 0) {
    throw new Error('No text could be extracted from PDF. The PDF may contain only images.');
  }

  return fullText;
}

/**
 * Extract text from DOCX buffer using mammoth
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues if mammoth is not installed
    const mammoth = await import('mammoth');
    
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from DOCX file.');
    }
    
    return text;
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('DOCX support requires mammoth package. Run: pnpm add mammoth');
    }
    throw new Error(`Failed to extract text from DOCX: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Extract text from DOC buffer
 * Note: DOC (old format) is harder to parse. We'll try to use mammoth or provide a helpful error.
 */
async function extractTextFromDOC(buffer: Buffer): Promise<string> {
  // DOC files (old Microsoft Word format) are binary and harder to parse
  // Mammoth doesn't support DOC, only DOCX
  // We could use libraries like 'textract' or 'antiword', but they require system dependencies
  
  // For now, provide a helpful error message
  throw new Error(
    'DOC files (old Microsoft Word format) are not fully supported. ' +
    'Please convert your document to DOCX or PDF format. ' +
    'You can do this by opening the file in Microsoft Word and saving as DOCX or PDF.'
  );
}

/**
 * Extract text from document buffer (auto-detects type)
 */
export async function extractTextFromDocument(buffer: Buffer, url?: string): Promise<string> {
  const docType = detectDocumentType(buffer, url);
  console.log('[DocumentExtractor] Detected document type:', docType);
  
  switch (docType) {
    case 'pdf':
      return await extractTextFromPDF(buffer);
    case 'docx':
      return await extractTextFromDOCX(buffer);
    case 'doc':
      return await extractTextFromDOC(buffer);
    default:
      throw new Error(`Unsupported document type: ${docType}`);
  }
}


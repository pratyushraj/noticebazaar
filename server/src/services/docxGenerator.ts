// DOCX Generator Service
// Converts HTML contracts to DOCX format for Word compatibility

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

/**
 * Generate DOCX from HTML contract
 * Converts clean HTML to editable Word document using docx library
 * 
 * @param htmlContent - The HTML contract content (should be clean, structured HTML)
 * @returns Buffer containing the DOCX file
 */
export async function generateContractDocx(htmlContent: string): Promise<Buffer> {
  try {
    // Extract contract content from HTML
    const contractContent = extractContractContent(htmlContent);
    
    // Parse HTML and convert to docx elements
    const docxElements = parseHtmlToDocx(contractContent);
    
    // Create DOCX document
    const doc = new Document({
      sections: [{
        children: docxElements,
      }],
    });
    
    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error: any) {
    console.error('[DocxGenerator] Error generating DOCX:', error);
    
    // If package is not installed, provide helpful error
    if (error.message?.includes('Cannot find module') || error.code === 'MODULE_NOT_FOUND') {
      throw new Error('DOCX generation requires docx package. Please run: npm install docx');
    }
    
    throw new Error(`Failed to generate DOCX: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Extract contract content from full HTML document
 */
function extractContractContent(htmlContent: string): string {
  // Remove print-specific styles and actions
  let cleanHtml = htmlContent
    // Remove print actions button
    .replace(/<div class="print-actions[^"]*">[\s\S]*?<\/div>/gi, '')
    // Remove no-print class elements
    .replace(/<[^>]*class="[^"]*no-print[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
    // Remove script tags
    .replace(/<script[\s\S]*?<\/script>/gi, '');
    // NOTE: We preserve style tags and inline styles for better DOCX formatting
    // The docx library can handle some CSS, and we'll convert classes to inline styles where needed

  // Extract content from contract-container if it exists
  const containerMatch = cleanHtml.match(/<div class="contract-container">([\s\S]*?)<\/div>/);
  if (containerMatch) {
    cleanHtml = containerMatch[1];
  } else {
    // Extract body content
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    if (bodyMatch) {
      cleanHtml = bodyMatch[1];
    }
  }

  return cleanHtml;
}

/**
 * Parse HTML and convert to docx elements
 * Handles headings, paragraphs, lists, and basic formatting
 */
function parseHtmlToDocx(html: string): (Paragraph | any)[] {
  const elements: (Paragraph | any)[] = [];
  
  // Split by block-level elements
  const blocks = html.split(/(<(?:h[1-6]|p|ul|ol|div)[^>]*>)/i);
  
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    
    if (!block || block.trim() === '') {
      i++;
      continue;
    }
    
    // Handle headings
    const h1Match = block.match(/<h1[^>]*>(.*?)<\/h1>/is);
    if (h1Match) {
      elements.push(new Paragraph({
        text: stripHtml(h1Match[1]),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 240 }, // Top margin 40px (30pt), after 12px (9pt)
      }));
      i++;
      continue;
    }
    
    const h2Match = block.match(/<h2[^>]*>(.*?)<\/h2>/is);
    if (h2Match) {
      elements.push(new Paragraph({
        text: stripHtml(h2Match[1]),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 720, after: 360 }, // 36px before (27pt), 18px after (13.5pt) - matches refactored template
      }));
      i++;
      continue;
    }
    
    const h3Match = block.match(/<h3[^>]*>(.*?)<\/h3>/is);
    if (h3Match) {
      elements.push(new Paragraph({
        text: stripHtml(h3Match[1]),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 150 },
      }));
      i++;
      continue;
    }
    
    // Handle lists
    const ulMatch = block.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (ulMatch) {
      const listItems = ulMatch[1].match(/<li[^>]*>(.*?)<\/li>/gis) || [];
      listItems.forEach((item: string) => {
        const itemText = stripHtml(item.replace(/<li[^>]*>|<\/li>/gi, ''));
        if (itemText.trim()) {
          elements.push(new Paragraph({
            text: `• ${itemText}`,
            spacing: { after: 100 },
            indent: { left: 360 }, // 0.25 inch
          }));
        }
      });
      i++;
      continue;
    }
    
    const olMatch = block.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
    if (olMatch) {
      const listItems = olMatch[1].match(/<li[^>]*>(.*?)<\/li>/gis) || [];
      listItems.forEach((item: string, index: number) => {
        const itemText = stripHtml(item.replace(/<li[^>]*>|<\/li>/gi, ''));
        if (itemText.trim()) {
          elements.push(new Paragraph({
            text: `${index + 1}. ${itemText}`,
            spacing: { after: 100 },
            indent: { left: 360 },
          }));
        }
      });
      i++;
      continue;
    }
    
    // Handle section separator paragraphs
    const separatorMatch = block.match(/<p[^>]*class="[^"]*section-separator-line[^"]*"[^>]*>/i);
    if (separatorMatch) {
      // Add a paragraph with border and extra spacing for section separation (matches 36px spacing)
      elements.push(new Paragraph({
        text: '',
        spacing: { before: 720, after: 720 }, // 36px = 27pt = 540 twentieths, using 720 for better visibility
        border: {
          top: {
            color: 'CCCCCC',
            size: 240, // 2px border (120 twentieths per point, so 2px ≈ 240)
            style: 'single',
          },
        },
      }));
      i++;
      continue;
    }
    
    // Handle paragraphs
    const pMatch = block.match(/<p[^>]*>(.*?)<\/p>/is);
    if (pMatch) {
      const text = stripHtml(pMatch[1]);
      if (text.trim()) {
        elements.push(new Paragraph({
          text: text,
          spacing: { after: 280 }, // 14px = 10.5pt = 210 twentieths, using 280 for better readability
        }));
      }
      i++;
      continue;
    }
    
    // Handle plain text (content between tags)
    const text = stripHtml(block);
    if (text.trim() && !text.match(/^<[^>]+>$/)) {
      elements.push(new Paragraph({
        text: text,
        spacing: { after: 200 },
      }));
    }
    
    i++;
  }
  
  return elements;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Prepare HTML for DOCX conversion
 * Ensures the HTML uses only Word-compatible elements (headings, paragraphs, lists)
 */
export function prepareHtmlForDocx(htmlContent: string): string {
  // Extract only the contract content (inside .contract-container)
  const containerMatch = htmlContent.match(/<div class="contract-container">([\s\S]*?)<\/div>/);
  const contractContent = containerMatch ? containerMatch[1] : htmlContent;

  // Create a clean HTML document with DOCX-compatible styling
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.8;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    p {
      margin: 12px 0;
      text-align: left;
    }
    ul, ol {
      margin: 12px 0;
      padding-left: 36px;
    }
    li {
      margin: 6px 0;
    }
  </style>
</head>
<body>
  ${contractContent}
</body>
</html>`;
}

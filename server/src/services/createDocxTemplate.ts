// Create DOCX Template with proper Word styles and docxtemplater placeholders
// This creates a base template that can be customized

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a DOCX template file with proper Word styles and docxtemplater placeholders
 * This template uses:
 * - Heading 1: Agreement Title
 * - Heading 2: Section titles
 * - Normal: Clause text
 * - List Paragraph: Bullet clauses
 */
export async function createDocxTemplate(): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch = 1440 twips
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Title (Heading 1, Centered)
        new Paragraph({
          text: 'CREATOR–BRAND COLLABORATION AGREEMENT',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // Date
        new Paragraph({
          text: 'Date: {contract_date}',
          spacing: { after: 400 },
        }),
        
        // Parties Section (Heading 2)
        new Paragraph({
          text: 'PARTIES',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'This Agreement is entered into between:',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Brand: {brand_name}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Address: {brand_address}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Email: {brand_email}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Creator: {creator_name}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Address: {creator_address}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Email: {creator_email}',
          spacing: { after: 400 },
        }),
        
        // Scope of Work (Heading 2)
        new Paragraph({
          text: 'SCOPE OF WORK',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'The Creator agrees to deliver the following:',
          spacing: { after: 200 },
        }),
        
        // Deliverables list (will be replaced by docxtemplater)
        new Paragraph({
          text: '{#deliverables}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: '• {.}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: '{/deliverables}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Delivery Deadline: {delivery_deadline}',
          spacing: { after: 400 },
        }),
        
        // Compensation (Heading 2)
        new Paragraph({
          text: 'COMPENSATION & PAYMENT TERMS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'Total Compensation: {deal_amount_formatted}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Payment Method: {payment_method}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Payment Timeline: {payment_timeline}',
          spacing: { after: 400 },
        }),
        
        // Usage Rights (Heading 2)
        new Paragraph({
          text: 'USAGE RIGHTS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'Usage Type: {usage_type}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Platforms: {usage_platforms}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Duration: {usage_duration}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Paid Ads Allowed: {paid_ads_allowed}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'Whitelisting Allowed: {whitelisting_allowed}',
          spacing: { after: 400 },
        }),
        
        // Exclusivity (Heading 2)
        new Paragraph({
          text: 'EXCLUSIVITY',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: '{exclusivity_clause}',
          spacing: { after: 400 },
        }),
        
        // Termination (Heading 2)
        new Paragraph({
          text: 'TERMINATION',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: `Either party may terminate this Agreement with {termination_notice_days} days written notice.`,
          spacing: { after: 400 },
        }),
        
        // Jurisdiction (Heading 2)
        new Paragraph({
          text: 'GOVERNING LAW & JURISDICTION',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'This Agreement shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of {jurisdiction_city}, India.',
          spacing: { after: 400 },
        }),
        
        // Additional Terms (conditional)
        new Paragraph({
          text: '{#has_additional_terms}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: 'ADDITIONAL TERMS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: '{additional_terms}',
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: '{/has_additional_terms}',
          spacing: { after: 400 },
        }),
        
        // Signatures (Heading 2)
        new Paragraph({
          text: 'IN WITNESS WHEREOF',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'The Parties hereto have executed this Agreement on the date and place first written above.',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          text: 'BRAND',
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'Signature: _________________',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Printed Name: {brand_name}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Date: _________________',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Place of Execution: _________________',
          spacing: { after: 400 },
        }),
        
        new Paragraph({
          text: 'CREATOR',
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: 'Signature: _________________',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Printed Name: {creator_name}',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Date: _________________',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: 'Place of Execution: _________________',
          spacing: { after: 400 },
        }),
        
        // Disclaimer (single footer)
        new Paragraph({
          text: '{disclaimer}',
          spacing: { before: 400, after: 200 },
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  
  // Save template for future use
  const templateDir = path.join(__dirname, '../templates');
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }
  const templatePath = path.join(templateDir, 'contract-template.docx');
  fs.writeFileSync(templatePath, buffer);
  
  console.log('[CreateDocxTemplate] Template created at:', templatePath);
  return buffer;
}


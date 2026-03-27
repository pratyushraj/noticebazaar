// @ts-nocheck
// Professional DOCX Contract Generator
// Generates court-grade DOCX contracts with modern legal document styling
// Visual style matches DocuSign / Ironclad professional agreements

import { ContractSchema } from './contractSchema.js';

/**
 * Generate professional DOCX contract from ContractSchema
 * Output: Clean, styled DOCX suitable for lawyers, courts, and enterprise clients
 * 
 * Visual Hierarchy:
 * - Title: 16-18pt, ALL CAPS, bold, centered
 * - Section headers: 12-13pt, uppercase, bold, blue/dark gray
 * - Body text: Times New Roman, 11pt, 1.5 line spacing, justified
 * - Margins: 1.25 inch (legal standard)
 */
export async function generateContractDocx(schema: ContractSchema): Promise<Buffer> {
  try {
    let Document: any, Packer: any, Paragraph: any, TextRun: any, HeadingLevel: any, AlignmentType: any, UnderlineType: any;
    
    try {
      const docxModule = await import('docx');
      Document = docxModule.Document;
      Packer = docxModule.Packer;
      Paragraph = docxModule.Paragraph;
      TextRun = docxModule.TextRun;
      HeadingLevel = docxModule.HeadingLevel;
      AlignmentType = docxModule.AlignmentType;
      UnderlineType = docxModule.UnderlineType;
    } catch (importError: any) {
      console.error('[ContractDocxGenerator] Failed to import docx module:', importError);
      throw new Error(`Failed to import docx library: ${importError.message}. Please ensure 'docx' package is installed.`);
    }
    
    // Helper functions
    const inchesToTwips = (inches: number): number => inches * 1440;
    const ptToHalfPt = (pt: number): number => pt * 2;
    
    // Styling constants
    const LEGAL_MARGIN = inchesToTwips(1.25); // 1.25 inch margins (legal standard)
    const BODY_FONT_SIZE = ptToHalfPt(11); // 11pt body text
    const TITLE_FONT_SIZE = ptToHalfPt(17); // 17pt title (between 16-18pt)
    const SECTION_HEADER_SIZE = ptToHalfPt(12.5); // 12.5pt section headers (between 12-13pt)
    const LINE_SPACING = 360; // 1.5 line spacing (240 * 1.5 = 360)
    const PARAGRAPH_SPACING_AFTER = 120; // 6pt after paragraphs
    const PARAGRAPH_SPACING_BEFORE = 120; // 6pt before paragraphs
    const SECTION_HEADER_COLOR = '2F4F4F'; // Dark gray (slate gray)
    
    // Validate required fields - reject missing data (no placeholders)
    if (!schema.brand_name || schema.brand_name.trim() === '') {
      throw new Error('Brand legal name is required');
    }
    if (!schema.brand_address || schema.brand_address.trim() === '' || 
        isPlaceholder(schema.brand_address)) {
      throw new Error('Brand full address is required');
    }
    if (!schema.creator_name || schema.creator_name.trim() === '') {
      throw new Error('Creator name is required');
    }
    if (!schema.creator_address || schema.creator_address.trim() === '' ||
        isPlaceholder(schema.creator_address)) {
      throw new Error('Creator address is required');
    }
    if (!schema.jurisdiction_city || schema.jurisdiction_city.trim() === '') {
      throw new Error('Jurisdiction is required');
    }
    
    // Prepare clean data (remove placeholders, format properly)
    const deliverablesArray = parseDeliverablesList(schema.deliverables_list);
    
    const data = {
      contract_date: formatDate(schema.contract_date),
      brand_name: schema.brand_name.trim(),
      brand_address: schema.brand_address.trim(),
      brand_email: schema.brand_email?.trim() || '',
      brand_gstin: (schema as any).brand_gstin?.trim() || '',
      creator_name: schema.creator_name.trim(),
      creator_address: (schema.creator_address && typeof schema.creator_address === 'string') 
        ? schema.creator_address.trim() 
        : '',
      creator_email: schema.creator_email?.trim() || '',
      deliverables: formatDeliverables(deliverablesArray),
      delivery_deadline: formatDate(schema.delivery_deadline) || 'As mutually agreed',
      deal_amount_formatted: schema.deal_amount_formatted,
      payment_method: schema.payment_method || 'Bank Transfer',
      payment_timeline: schema.payment_timeline || 'Within 7 days of content delivery',
      late_payment_clause: 'If payment is delayed beyond 7 days from the due date, the Brand shall be liable to pay interest at 18% per annum, calculated daily until settlement. The Creator reserves the right to initiate legal recovery proceedings for unpaid dues.',
      usage_type: schema.usage_type || 'Non-exclusive',
      usage_platforms: schema.usage_platforms || 'Instagram',
      usage_duration: schema.usage_duration || '6 months',
      paid_ads_allowed: schema.paid_ads_allowed || 'No',
      whitelisting_allowed: schema.whitelisting_allowed || 'No',
      exclusivity_clause: schema.exclusivity_clause || 'No exclusivity period applies.',
      termination_notice_days: schema.termination_notice_days || 30,
      termination_clause: `Either party may terminate this Agreement with ${schema.termination_notice_days || 30} days written notice.`,
      jurisdiction_city: schema.jurisdiction_city.trim(),
      governing_law_clause: `This Agreement shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of ${schema.jurisdiction_city.trim()}, India.`,
      additional_terms: schema.additional_terms?.trim() || '',
      has_additional_terms: !!(schema.additional_terms && schema.additional_terms.trim().length > 0),
      disclaimer: schema.disclaimer || 'This agreement was generated using the CreatorArmour Contract Scanner based on information provided by the Parties. CreatorArmour is not a party to this agreement and does not provide legal representation. The Parties are advised to independently review this agreement before execution.',
    };
    
    // Build document with professional legal styling
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: LEGAL_MARGIN,
              right: LEGAL_MARGIN,
              bottom: LEGAL_MARGIN,
              left: LEGAL_MARGIN,
            },
          },
        },
        children: [
          // TITLE - 17pt, ALL CAPS, bold, centered
          new Paragraph({
            children: [
              new TextRun({
                text: 'CREATOR–BRAND COLLABORATION AGREEMENT',
                font: 'Times New Roman',
                size: TITLE_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2 },
          }),
          
          // Date - 11pt body text
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${data.contract_date}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // PARTIES SECTION
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: 'PARTIES',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'This Agreement is entered into between:',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          // Brand Section
          new Paragraph({
            children: [
              new TextRun({
                text: 'Brand:',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE, after: PARAGRAPH_SPACING_AFTER / 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'Name: ',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: data.brand_name,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true, // Brand name bolded where first introduced
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Address: ${data.brand_address}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${data.brand_email || 'Not provided'}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
          }),
          ...(data.brand_gstin ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `GSTIN: ${data.brand_gstin}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          ] : []),
          
          // AND separator
          new Paragraph({
            children: [
              new TextRun({
                text: 'AND',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: PARAGRAPH_SPACING_BEFORE, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          // Creator Section
          new Paragraph({
            children: [
              new TextRun({
                text: 'Creator:',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'Name: ',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: data.creator_name,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true, // Creator name bolded where first introduced
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Address: ${data.creator_address}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${data.creator_email || 'Not provided'}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // 1. SCOPE OF WORK
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: '1. ',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'SCOPE OF WORK',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Creator agrees to deliver the following content ("Deliverables"):',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          // Deliverables as formatted list
          ...data.deliverables.map((item: string) => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
              indent: { left: 360 }, // 0.25 inch indent
            })
          ),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Content shall be delivered on or before ${data.delivery_deadline}, unless otherwise mutually agreed in writing.`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // 2. COMPENSATION & PAYMENT TERMS
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: '2. ',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'COMPENSATION & PAYMENT TERMS',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Compensation: ${data.deal_amount_formatted}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Payment Method: ${data.payment_method}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Payment Timeline: ${data.payment_timeline}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          // Sub-clause: Late Payment Protection
          new Paragraph({
            children: [
              new TextRun({
                text: '2.1 ',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'Late Payment Protection',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE, after: PARAGRAPH_SPACING_AFTER / 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: data.late_payment_clause,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // 3. USAGE RIGHTS
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: '3. ',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'USAGE RIGHTS',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `The Creator grants the Brand a ${data.usage_type} license to use the content under the following conditions:`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          // Usage rights as formatted list
          new Paragraph({
            children: [
              new TextRun({
                text: `• Platforms: ${data.usage_platforms}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
            indent: { left: 360 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Duration: ${data.usage_duration}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
            indent: { left: 360 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Paid Advertising: ${data.paid_ads_allowed}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER / 2, line: LINE_SPACING },
            indent: { left: 360 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Whitelisting: ${data.whitelisting_allowed}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
            indent: { left: 360 },
          }),
          
          // ============================================
          // 4. EXCLUSIVITY
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: '4. ',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'EXCLUSIVITY',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: data.exclusivity_clause,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // 5. TERMINATION
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: '5. ',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'TERMINATION',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: data.termination_clause,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // 6. GOVERNING LAW & JURISDICTION
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: '6. ',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
              new TextRun({
                text: 'GOVERNING LAW & JURISDICTION',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: data.governing_law_clause,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          // ============================================
          // 7. ADDITIONAL TERMS (conditional)
          // ============================================
          ...(data.has_additional_terms ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: '7. ',
                  font: 'Times New Roman',
                  size: SECTION_HEADER_SIZE,
                  bold: true,
                  color: SECTION_HEADER_COLOR,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
                new TextRun({
                  text: 'ADDITIONAL TERMS',
                  font: 'Times New Roman',
                  size: SECTION_HEADER_SIZE,
                  bold: true,
                  color: SECTION_HEADER_COLOR,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: data.additional_terms,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
            }),
          ] : []),
          
          // ============================================
          // DIGITAL ACCEPTANCE & EXECUTION
          // ============================================
          // Page break before execution section (using large spacing)
          new Paragraph({
            children: [
              new TextRun({
                text: 'DIGITAL ACCEPTANCE & EXECUTION',
                font: 'Times New Roman',
                size: SECTION_HEADER_SIZE,
                bold: true,
                color: SECTION_HEADER_COLOR,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 6, after: PARAGRAPH_SPACING_AFTER * 2 }, // Large spacing for page break effect
          }),
          
          // Legal notice about electronic execution
          new Paragraph({
            children: [
              new TextRun({
                text: 'This Agreement has been executed electronically by both Parties through OTP verification and click-to-accept confirmation. Under the Information Technology Act, 2000 (IT Act, 2000), electronic signatures are legally valid and binding. No physical or handwritten signature is required.',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER * 2, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Parties acknowledge that:',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 2, after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• This Agreement is executed electronically and constitutes a valid legal signature under Section 3A of the IT Act, 2000.',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• OTP verification and click-to-accept confirmation constitute valid electronic authentication.',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• No physical signature is required for this Agreement to be legally binding.',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER * 3, line: LINE_SPACING },
          }),
          
          // BRAND Digital Acceptance Details
          new Paragraph({
            children: [
              new TextRun({
                text: 'BRAND',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 3, after: PARAGRAPH_SPACING_AFTER * 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${(schema as any).brand_signature?.signer_name || data.brand_name || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${(schema as any).brand_signature?.signer_email || data.brand_email || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          ...((schema as any).brand_signature?.otp_verified_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `OTP Verified: ${new Date((schema as any).brand_signature.otp_verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
            }),
          ] : []),
          
          ...((schema as any).brand_signature?.ip_address ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `IP Address: ${(schema as any).brand_signature.ip_address}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
            }),
          ] : []),
          
          ...((schema as any).brand_signature?.user_agent ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Device: ${(schema as any).brand_signature.user_agent}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
            }),
          ] : []),
          
          ...((schema as any).brand_signature?.signed_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Executed At: ${new Date((schema as any).brand_signature.signed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER * 3, line: LINE_SPACING },
            }),
          ] : [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Status: Pending signature',
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  italics: true,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER * 3, line: LINE_SPACING },
            }),
          ]),
          
          // CREATOR Digital Acceptance Details
          new Paragraph({
            children: [
              new TextRun({
                text: 'CREATOR',
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                bold: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 3, after: PARAGRAPH_SPACING_AFTER * 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${(schema as any).creator_signature?.signer_name || data.creator_name || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${(schema as any).creator_signature?.signer_email || data.creator_email || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: BODY_FONT_SIZE,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
          }),
          
          ...((schema as any).creator_signature?.otp_verified_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `OTP Verified: ${new Date((schema as any).creator_signature.otp_verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
            }),
          ] : []),
          
          ...((schema as any).creator_signature?.ip_address ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `IP Address: ${(schema as any).creator_signature.ip_address}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
            }),
          ] : []),
          
          ...((schema as any).creator_signature?.user_agent ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Device: ${(schema as any).creator_signature.user_agent}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER, line: LINE_SPACING },
            }),
          ] : []),
          
          ...((schema as any).creator_signature?.signed_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Executed At: ${new Date((schema as any).creator_signature.signed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER * 3, line: LINE_SPACING },
            }),
          ] : [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Status: Pending signature',
                  font: 'Times New Roman',
                  size: BODY_FONT_SIZE,
                  italics: true,
                  underline: {
                    type: UnderlineType.NONE,
                  },
                }),
              ],
              spacing: { after: PARAGRAPH_SPACING_AFTER * 3, line: LINE_SPACING },
            }),
          ]),
          
          // ============================================
          // FOOTER DISCLAIMER
          // ============================================
          new Paragraph({
            children: [
              new TextRun({
                text: data.disclaimer,
                font: 'Times New Roman',
                size: ptToHalfPt(9), // 9pt (smaller text)
                italics: true,
                underline: {
                  type: UnderlineType.NONE,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: PARAGRAPH_SPACING_BEFORE * 3, after: PARAGRAPH_SPACING_AFTER },
          }),
        ],
      }],
    });

    // Generate DOCX buffer
    console.log('[ContractDocxGenerator] Generating professional DOCX contract...');
    const buffer = await Packer.toBuffer(doc);
    console.log('[ContractDocxGenerator] DOCX generated successfully, size:', buffer.length, 'bytes');
    return buffer;
  } catch (error: any) {
    console.error('[ContractDocxGenerator] Error generating DOCX:', error);
    console.error('[ContractDocxGenerator] Error stack:', error.stack);
    
    // Provide helpful error messages
    if (error.properties && error.properties.errors instanceof Array) {
      const errors = error.properties.errors
        .map((e: any) => `${e.name}: ${e.message}`)
        .join(', ');
      throw new Error(`DOCX template error: ${errors}`);
    }
    
    throw new Error(`Failed to generate DOCX: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Check if a string is a placeholder value
 */
function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return normalized === 'n/a' || 
         normalized === 'not specified' || 
         normalized === 'na' ||
         normalized === '' ||
         normalized.startsWith('not provided');
}

/**
 * Format date as "DD Month YYYY" (e.g., "22 December 2024")
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if invalid
    }
    
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Parse deliverables_list string into array
 */
function parseDeliverablesList(deliverablesList: string): string[] {
  if (!deliverablesList || deliverablesList.trim() === '') {
    return [];
  }
  
  // Split by newlines or bullet points
  return deliverablesList
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[•\-\*]\s*/, '')) // Remove bullet markers
    .filter(line => !isPlaceholder(line));
}

/**
 * Format deliverables array - clean and remove placeholders
 */
function formatDeliverables(deliverables: string[]): string[] {
  if (!deliverables || deliverables.length === 0) {
    return ['As per agreement'];
  }
  
  return deliverables
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter(item => !isPlaceholder(item))
    .map(item => {
      // Remove .; artifacts and clean up
      return item
        .replace(/\.\s*;\s*/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();
    });
}


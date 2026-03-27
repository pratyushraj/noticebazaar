// DOCX Contract Generator Service
// Generates law-firm grade DOCX contracts with professional formatting

import { ContractSchema } from './contractSchema';

/**
 * Generate DOCX contract from ContractSchema
 * Output: Clean, professional DOCX suitable for lawyers, courts, and enterprise clients
 */
export async function generateContractDocx(schema: ContractSchema): Promise<Buffer> {
  try {
    let Document: any, Packer: any, Paragraph: any, TextRun: any, HeadingLevel: any, AlignmentType: any;
    
    try {
      const docxModule = await import('docx');
      Document = docxModule.Document;
      Packer = docxModule.Packer;
      Paragraph = docxModule.Paragraph;
      TextRun = docxModule.TextRun;
      HeadingLevel = docxModule.HeadingLevel;
      AlignmentType = docxModule.AlignmentType;
    } catch (importError: any) {
      console.error('[DocxContractGenerator] Failed to import docx module:', importError);
      throw new Error(`Failed to import docx library: ${importError.message}. Please ensure 'docx' package is installed.`);
    }
    
    // Helper function: 1 inch = 1440 twips
    const inchesToTwips = (inches: number): number => inches * 1440;
    // Helper function: points to half-points (docx uses half-points)
    const ptToHalfPt = (pt: number): number => pt * 2;
    // Line spacing: 1.15 = 276 (240 * 1.15)
    const lineSpacing = 276;
    // Paragraph spacing: 6 pt = 120 twips
    const paragraphSpacing = 120;
    
    // Validate required fields - reject missing data (no placeholders allowed)
    if (!schema.brand_name || schema.brand_name.trim() === '') {
      throw new Error('Brand legal name is required');
    }
    if (!schema.brand_address || schema.brand_address.trim() === '' || 
        schema.brand_address.toLowerCase() === 'n/a' || 
        schema.brand_address.toLowerCase() === 'not specified') {
      throw new Error('Brand full address is required');
    }
    if (!schema.creator_name || schema.creator_name.trim() === '') {
      throw new Error('Creator name is required');
    }
    if (!schema.creator_address || schema.creator_address.trim() === '' ||
        schema.creator_address.toLowerCase() === 'n/a' ||
        schema.creator_address.toLowerCase() === 'not specified') {
      throw new Error('Creator address is required');
    }
    if (!schema.jurisdiction_city || schema.jurisdiction_city.trim() === '') {
      throw new Error('Jurisdiction is required');
    }
    
    // Prepare clean data (remove placeholders, format properly)
    // Parse deliverables_list string into array
    const deliverablesArray = parseDeliverablesList(schema.deliverables_list);
    
    const cleanData = {
      contract_date: formatDate(schema.contract_date),
      brand_name: schema.brand_name.trim(),
      brand_address: schema.brand_address.trim(),
      brand_email: schema.brand_email?.trim() || '',
      creator_name: schema.creator_name.trim(),
      creator_address: schema.creator_address.trim(),
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
      // Include signature data if available
      brand_signature: (schema as any).brand_signature,
      creator_signature: (schema as any).creator_signature,
    };
    
    // Build document with law-firm grade formatting
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: inchesToTwips(1), // 1 inch margins
              right: inchesToTwips(1),
              bottom: inchesToTwips(1),
              left: inchesToTwips(1),
            },
          },
        },
        children: [
          // Main Title - 16 pt, ALL CAPS, bold, centered
          new Paragraph({
            children: [
              new TextRun({
                text: 'CREATOR–BRAND COLLABORATION AGREEMENT',
                font: 'Times New Roman',
                size: ptToHalfPt(16), // 16 pt
                bold: true,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: paragraphSpacing },
          }),
          
          // Date - 12 pt body text
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${cleanData.contract_date}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12), // 12 pt
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing, line: lineSpacing },
          }),
          
          // PARTIES Section - 12 pt, bold, ALL CAPS, left-aligned
          new Paragraph({
            children: [
              new TextRun({
                text: 'PARTIES',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'This Agreement is entered into between:',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          // Brand Section
          new Paragraph({
            children: [
              new TextRun({
                text: 'Brand:',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${cleanData.brand_name}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Address: ${cleanData.brand_address}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${cleanData.brand_email || 'Not provided'}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          // AND separator
          new Paragraph({
            children: [
              new TextRun({
                text: 'AND',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          // Creator Section
          new Paragraph({
            children: [
              new TextRun({
                text: 'Creator:',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${cleanData.creator_name}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Address: ${cleanData.creator_address}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${cleanData.creator_email || 'Not provided'}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          // 1. SCOPE OF WORK - Section header: 12 pt, bold, ALL CAPS
          new Paragraph({
            children: [
              new TextRun({
                text: '1. ',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
              new TextRun({
                text: 'SCOPE OF WORK',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Creator agrees to deliver the following content ("Deliverables"):',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          // Deliverables as formatted list with proper indentation
          ...cleanData.deliverables.map((item: string) => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(12),
                }),
              ],
              spacing: { after: paragraphSpacing / 2, line: lineSpacing },
              indent: { left: 360 }, // 0.25 inch indent for list items
            })
          ),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Content shall be delivered on or before ${cleanData.delivery_deadline}, unless otherwise mutually agreed in writing.`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          // 2. COMPENSATION & PAYMENT TERMS
          new Paragraph({
            children: [
              new TextRun({
                text: '2. ',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
              new TextRun({
                text: 'COMPENSATION & PAYMENT TERMS',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Compensation: ${cleanData.deal_amount_formatted}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Payment Method: ${cleanData.payment_method}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Payment Timeline: ${cleanData.payment_timeline}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'Late Payment Protection:',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing / 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: cleanData.late_payment_clause,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          // 3. USAGE RIGHTS
          new Paragraph({
            children: [
              new TextRun({
                text: '3. ',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
              new TextRun({
                text: 'USAGE RIGHTS',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `The Creator grants the Brand a ${cleanData.usage_type} license to use the content under the following conditions:`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          // Usage rights as formatted list
          new Paragraph({
            children: [
              new TextRun({
                text: `• Platforms: ${cleanData.usage_platforms}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing / 2, line: lineSpacing },
            indent: { left: 360 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Duration: ${cleanData.usage_duration}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing / 2, line: lineSpacing },
            indent: { left: 360 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Paid Advertising: ${cleanData.paid_ads_allowed}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing / 2, line: lineSpacing },
            indent: { left: 360 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `• Whitelisting: ${cleanData.whitelisting_allowed}`,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
            indent: { left: 360 },
          }),
          
          // 4. EXCLUSIVITY
          new Paragraph({
            children: [
              new TextRun({
                text: '4. ',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
              new TextRun({
                text: 'EXCLUSIVITY',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: cleanData.exclusivity_clause,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          // 5. TERMINATION
          new Paragraph({
            children: [
              new TextRun({
                text: '5. ',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
              new TextRun({
                text: 'TERMINATION',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: cleanData.termination_clause,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          // 6. GOVERNING LAW & JURISDICTION
          new Paragraph({
            children: [
              new TextRun({
                text: '6. ',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
              new TextRun({
                text: 'GOVERNING LAW & JURISDICTION',
                font: 'Times New Roman',
                size: ptToHalfPt(12),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing, after: paragraphSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: cleanData.governing_law_clause,
                font: 'Times New Roman',
                size: ptToHalfPt(12),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          // Additional Terms (conditional)
          ...(cleanData.has_additional_terms ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: '7. ',
                  font: 'Times New Roman',
                  size: ptToHalfPt(12),
                  bold: true,
                }),
                new TextRun({
                  text: 'ADDITIONAL TERMS',
                  font: 'Times New Roman',
                  size: ptToHalfPt(12),
                  bold: true,
                }),
              ],
              spacing: { before: paragraphSpacing, after: paragraphSpacing },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanData.additional_terms,
                  font: 'Times New Roman',
                  size: ptToHalfPt(12),
                }),
              ],
              spacing: { after: paragraphSpacing * 2, line: lineSpacing },
            }),
          ] : []),
          
          // DIGITAL ACCEPTANCE & EXECUTION Section
          new Paragraph({
            children: [
              new TextRun({
                text: 'DIGITAL ACCEPTANCE & EXECUTION',
                font: 'Times New Roman',
                size: ptToHalfPt(12.5),
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: paragraphSpacing * 3, after: paragraphSpacing * 2 },
          }),
          
          // Legal notice about electronic execution
          new Paragraph({
            children: [
              new TextRun({
                text: 'This Agreement has been executed electronically by both Parties through OTP verification and click-to-accept confirmation. Under the Information Technology Act, 2000 (IT Act, 2000), electronic signatures are legally valid and binding. No physical or handwritten signature is required.',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing * 2, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: 'The Parties acknowledge that:',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing * 2, after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• This Agreement is executed electronically and constitutes a valid legal signature under Section 3A of the IT Act, 2000.',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• OTP verification and click-to-accept confirmation constitute valid electronic authentication.',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '• No physical signature is required for this Agreement to be legally binding.',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing * 3, line: lineSpacing },
          }),
          
          // BRAND Digital Acceptance Details
          new Paragraph({
            children: [
              new TextRun({
                text: 'BRAND',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing * 3, after: paragraphSpacing * 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${(cleanData as any).brand_signature?.signer_name || cleanData.brand_name || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${(cleanData as any).brand_signature?.signer_email || cleanData.brand_email || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          ...((cleanData as any).brand_signature?.otp_verified_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `OTP Verified At: ${new Date((cleanData as any).brand_signature.otp_verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing, line: lineSpacing },
            }),
          ] : []),
          
          ...((cleanData as any).brand_signature?.ip_address ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `IP Address: ${(cleanData as any).brand_signature.ip_address}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing, line: lineSpacing },
            }),
          ] : []),
          
          ...((cleanData as any).brand_signature?.user_agent ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Device / Browser: ${(cleanData as any).brand_signature.user_agent}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing, line: lineSpacing },
            }),
          ] : []),
          
          ...((cleanData as any).brand_signature?.signed_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Executed At: ${new Date((cleanData as any).brand_signature.signed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing * 3, line: lineSpacing },
            }),
          ] : [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Status: Pending signature',
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                  italics: true,
                }),
              ],
              spacing: { after: paragraphSpacing * 3, line: lineSpacing },
            }),
          ]),
          
          // CREATOR Digital Acceptance Details
          new Paragraph({
            children: [
              new TextRun({
                text: 'CREATOR',
                font: 'Times New Roman',
                size: ptToHalfPt(11),
                bold: true,
              }),
            ],
            spacing: { before: paragraphSpacing * 3, after: paragraphSpacing * 2 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Name: ${(cleanData as any).creator_signature?.signer_name || cleanData.creator_name || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${(cleanData as any).creator_signature?.signer_email || cleanData.creator_email || 'Not yet signed'}`,
                font: 'Times New Roman',
                size: ptToHalfPt(11),
              }),
            ],
            spacing: { after: paragraphSpacing, line: lineSpacing },
          }),
          
          ...((cleanData as any).creator_signature?.otp_verified_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `OTP Verified At: ${new Date((cleanData as any).creator_signature.otp_verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing, line: lineSpacing },
            }),
          ] : []),
          
          ...((cleanData as any).creator_signature?.ip_address ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `IP Address: ${(cleanData as any).creator_signature.ip_address}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing, line: lineSpacing },
            }),
          ] : []),
          
          ...((cleanData as any).creator_signature?.user_agent ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Device / Browser: ${(cleanData as any).creator_signature.user_agent}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing, line: lineSpacing },
            }),
          ] : []),
          
          ...((cleanData as any).creator_signature?.signed_at ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Executed At: ${new Date((cleanData as any).creator_signature.signed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}`,
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                }),
              ],
              spacing: { after: paragraphSpacing * 3, line: lineSpacing },
            }),
          ] : [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Status: Pending signature',
                  font: 'Times New Roman',
                  size: ptToHalfPt(11),
                  italics: true,
                }),
              ],
              spacing: { after: paragraphSpacing * 3, line: lineSpacing },
            }),
          ]),
          
          // Footer Disclaimer - 9 pt, centered, only once
          new Paragraph({
            children: [
              new TextRun({
                text: cleanData.disclaimer,
                font: 'Times New Roman',
                size: ptToHalfPt(9), // 9 pt
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: paragraphSpacing * 2, after: paragraphSpacing },
          }),
        ],
      }],
    });

    // Generate DOCX buffer
    console.log('[DocxContractGenerator] Generating law-firm grade DOCX...');
    const buffer = await Packer.toBuffer(doc);
    console.log('[DocxContractGenerator] DOCX generated successfully, size:', buffer.length, 'bytes');
    return buffer;
  } catch (error: any) {
    console.error('[DocxContractGenerator] Error generating DOCX:', error);
    console.error('[DocxContractGenerator] Error stack:', error.stack);
    
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
    .filter(line => 
      line.toLowerCase() !== 'n/a' && 
      line.toLowerCase() !== 'not specified' &&
      line.toLowerCase() !== 'na'
    );
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
    .filter(item => 
      item.toLowerCase() !== 'n/a' && 
      item.toLowerCase() !== 'not specified' &&
      item.toLowerCase() !== 'na'
    )
    .map(item => {
      // Remove .; artifacts and clean up
      return item
        .replace(/\.\s*;\s*/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();
    });
}

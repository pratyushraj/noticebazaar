// @ts-nocheck
// Invoice Generation Service
// Automatically generates invoices after contract signing

import { supabase } from '../lib/supabase.js';
import { recordMarketplaceEvent } from '../shared/lib/marketplaceAnalytics.js';

const CREATOR_ASSETS_BUCKET = 'creator-assets';

interface InvoiceData {
  dealId: string;
  brandName: string;
  creatorName: string;
  creatorEmail: string;
  dealAmount: number;
  dueDate: string;
  paymentExpectedDate?: string;
  deliverables: string;
  invoiceNumber: string;
  signedAt?: string;
}

/**
 * Generate invoice PDF and save to storage
 */
export async function generateInvoice(dealId: string): Promise<{ success: boolean; invoiceUrl?: string; invoiceNumber?: string; error?: string }> {
  try {
    // Check if invoice already exists (idempotent)
    const result = await supabase
      .from('brand_deals')
      .select('invoice_url, invoice_number')
      .eq('id', dealId)
      .single();
    
    const existingDeal = result.data as { invoice_url: string | null; invoice_number: string | null } | null;

    if (existingDeal && existingDeal.invoice_url && existingDeal.invoice_number) {
      console.log(`[InvoiceService] Invoice already exists for deal ${dealId}`);
      return {
        success: true,
        invoiceUrl: existingDeal.invoice_url,
        invoiceNumber: existingDeal.invoice_number,
      };
    }

    // Fetch deal details
    const dealResult = await supabase
      .from('brand_deals')
      .select(`
        id,
        brand_name,
        deal_amount,
        deliverables,
        due_date,
        payment_expected_date,
        creator_id,
        otp_verified_at
      `)
      .eq('id', dealId)
      .single();
    
    const deal = dealResult.data as {
      id: string;
      brand_name: string | null;
      deal_amount: number | null;
      deliverables: string | null;
      due_date: string | null;
      payment_expected_date: string | null;
      creator_id: string;
      otp_verified_at: string | null;
    } | null;
    const dealError = dealResult.error;

    if (dealError || !deal) {
      return {
        success: false,
        error: 'Deal not found',
      };
    }

    // Fetch creator profile
    const profileResult = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, gst_number, pan_number, bank_account_name, bank_account_number, bank_ifsc')
      .eq('id', deal.creator_id)
      .single();
    
    const creatorProfile = profileResult.data as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      gst_number: string | null;
      pan_number: string | null;
      bank_account_name: string | null;
      bank_account_number: string | null;
      bank_ifsc: string | null;
    } | null;
    const creatorError = profileResult.error;

    if (creatorError || !creatorProfile) {
      return {
        success: false,
        error: 'Creator profile not found',
      };
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const shortDealId = dealId.substring(0, 8).toUpperCase();
    const invoiceNumber = `INV-${year}-${shortDealId}`;

    const creatorName = `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator';

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      dealId,
      brandName: deal.brand_name,
      creatorName,
      creatorEmail: creatorProfile.email || '',
      dealAmount: deal.deal_amount || 0,
      dueDate: deal.due_date || '',
      paymentExpectedDate: deal.payment_expected_date || undefined,
      deliverables: deal.deliverables || '',
      invoiceNumber,
      signedAt: deal.otp_verified_at || undefined,
    });

    // Upload to Supabase storage
    const fileName = `invoice-${dealId}-${Date.now()}.pdf`;
    const filePath = `${deal.creator_id}/invoices/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(CREATOR_ASSETS_BUCKET)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[InvoiceService] Upload error:', uploadError);
      return {
        success: false,
        error: `Failed to upload invoice: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CREATOR_ASSETS_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to get public URL for invoice',
      };
    }

    // Update deal with invoice information
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        invoice_url: urlData.publicUrl,
        invoice_number: invoiceNumber,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) {
      console.error('[InvoiceService] Update error:', updateError);
      // Don't fail if update fails, invoice is already uploaded
    }

    await recordMarketplaceEvent(supabase as any, {
      eventName: 'invoice_generated',
      userId: deal.creator_id,
      creatorId: deal.creator_id,
      dealId,
      metadata: {
        creator_id: deal.creator_id,
        deal_id: dealId,
        invoice_number: invoiceNumber,
        deal_value: deal.deal_amount || 0,
      },
    });

    return {
      success: true,
      invoiceUrl: urlData.publicUrl,
      invoiceNumber,
    };
  } catch (error: any) {
    console.error('[InvoiceService] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate invoice',
    };
  }
}

/**
 * Generate invoice PDF using PDFKit
 */
async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // Dynamic import for PDFKit
  const PDFDocument = (await import('pdfkit')).default;
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#7C3AED').text('CreatorArmour', 50, 50);
      doc.fontSize(12).fillColor('#666').text('Legal Invoice & Receipt', 50, 80);

      // Invoice Number and Date
      doc.fontSize(10).fillColor('#000').text(`Invoice Number: ${data.invoiceNumber}`, 400, 50, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, 70, { align: 'right' });

      // From (Creator)
      doc.fontSize(14).fillColor('#000').text('From:', 50, 130);
      doc.fontSize(12).text(data.creatorName, 50, 150);
      if (data.creatorEmail) {
        doc.fontSize(10).fillColor('#666').text(data.creatorEmail, 50, 170);
      }

      // To (Brand)
      doc.fontSize(14).fillColor('#000').text('To:', 350, 130);
      doc.fontSize(12).text(data.brandName, 350, 150);

      // Line
      doc.moveTo(50, 220).lineTo(550, 220).stroke();

      // Invoice Details
      doc.fontSize(16).fillColor('#000').text('Invoice Details', 50, 240);

      // Deliverables
      doc.fontSize(12).fillColor('#000').text('Description:', 50, 270);
      doc.fontSize(11).fillColor('#333').text(data.deliverables || 'Brand collaboration services', 50, 290, { width: 500 });

      // Amount
      const yPos = 350;
      doc.fontSize(12).fillColor('#000').text('Amount:', 50, yPos);
      doc.fontSize(16).fillColor('#7C3AED').text(`₹${data.dealAmount.toLocaleString('en-IN')}`, 400, yPos, { align: 'right' });

      // Payment Terms
      if (data.paymentExpectedDate) {
        doc.fontSize(10).fillColor('#666').text(
          `Payment Due: ${new Date(data.paymentExpectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          50,
          yPos + 40
        );
      }

      // Footer
      doc.fontSize(9).fillColor('#999').text(
        'This invoice is generated automatically after contract acceptance via OTP verification.',
        50,
        700,
        { align: 'center', width: 500 }
      );

      if (data.signedAt) {
        doc.text(
          `Contract signed on: ${new Date(data.signedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          50,
          720,
          { align: 'center', width: 500 }
        );
      }

      doc.text('CreatorArmour • Secure Legal Portal', 50, 750, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a Payment Receipt for Escrow Funding
 */
export async function generateEscrowReceipt(dealId: string): Promise<{ success: boolean; url?: string }> {
  try {
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*, creator:creator_id(display_name, email)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) throw new Error('Deal not found');

    // Generate receipt number
    const receiptNumber = `REC-ESC-${dealId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Branding
      doc.fontSize(24).fillColor('#10b981').text('CreatorArmour', 50, 50);
      doc.fontSize(10).fillColor('#64748b').text('Official Payment Receipt', 50, 80);
      
      // Right side details
      doc.fontSize(10).fillColor('#1e293b').text(`Receipt No: ${receiptNumber}`, 400, 50, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 65, { align: 'right' });
      doc.text(`Status: SECURED IN ESCROW`, 400, 80, { align: 'right', color: '#10b981' });

      doc.moveTo(50, 110).lineTo(550, 110).stroke('#e2e8f0');

      // Brand Info
      doc.fontSize(12).fillColor('#64748b').text('BILLED TO:', 50, 140);
      doc.fontSize(14).fillColor('#1e293b').text(deal.brand_name || 'Brand Partner', 50, 160);
      
      // Collaboration Info
      doc.fontSize(12).fillColor('#64748b').text('COLLABORATION WITH:', 300, 140);
      doc.fontSize(14).fillColor('#1e293b').text(deal.creator?.display_name || 'Creator', 300, 160);

      doc.rect(50, 200, 500, 100).fill('#f8fafc');
      doc.fillColor('#1e293b').fontSize(12).text('Collaboration Details', 70, 220);
      doc.fontSize(10).fillColor('#475569').text(deal.deliverables || 'Content Creation Services', 70, 245, { width: 460 });

      // Financials
      doc.moveTo(50, 320).lineTo(550, 320).stroke('#e2e8f0');
      doc.fontSize(12).fillColor('#1e293b').text('Transaction Summary', 50, 340);
      
      const y = 370;
      doc.fontSize(10).fillColor('#64748b').text('Escrow Deposit Amount:', 50, y);
      doc.fontSize(14).fillColor('#1e293b').text(`₹${Number(deal.deal_amount).toLocaleString('en-IN')}`, 400, y, { align: 'right' });

      doc.fontSize(10).fillColor('#64748b').text('Platform Fees:', 50, y + 25);
      doc.text('Included', 400, y + 25, { align: 'right' });

      doc.fontSize(12).fillColor('#10b981').text('Total Paid:', 50, y + 60);
      doc.fontSize(16).text(`₹${Number(deal.deal_amount).toLocaleString('en-IN')}`, 400, y + 60, { align: 'right' });

      // Security Note
      doc.rect(50, 500, 500, 80).stroke('#10b981');
      doc.fontSize(10).fillColor('#166534').text('🛡️ CreatorArmour Escrow Protection', 70, 520);
      doc.fontSize(9).fillColor('#15803d').text('This payment is securely held in our escrow account. Funds will only be released to the creator after you approve the delivered content or after the 72-hour review period expires.', 70, 540, { width: 460 });

      doc.fontSize(8).fillColor('#94a3b8').text('This is a computer-generated receipt and does not require a physical signature.', 50, 750, { align: 'center', width: 500 });
      doc.text('CreatorArmour by CreatorArmour', 50, 765, { align: 'center', width: 500 });

      doc.end();
    });

    const fileName = `receipt-${dealId}-${Date.now()}.pdf`;
    const filePath = `escrow-receipts/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf' });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
    
    // Save to deal record
    await supabase.from('brand_deals').update({
      escrow_receipt_url: urlData.publicUrl,
      updated_at: new Date().toISOString()
    } as any).eq('id', dealId);

    return { success: true, url: urlData.publicUrl };

  } catch (err) {
    console.error('[InvoiceService] Escrow receipt failed:', err);
    return { success: false };
  }
}

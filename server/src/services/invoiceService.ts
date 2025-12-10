// Invoice Generation Service
// Automatically generates invoices after contract signing

import { supabase } from '../index.js';

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
    const { data: existingDeal } = await supabase
      .from('brand_deals')
      .select('invoice_url, invoice_number')
      .eq('id', dealId)
      .single();

    if (existingDeal?.invoice_url && existingDeal?.invoice_number) {
      console.log(`[InvoiceService] Invoice already exists for deal ${dealId}`);
      return {
        success: true,
        invoiceUrl: existingDeal.invoice_url,
        invoiceNumber: existingDeal.invoice_number,
      };
    }

    // Fetch deal details
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select(`
        id,
        brand_name,
        deal_amount,
        deliverables,
        due_date,
        payment_expected_date,
        creator_id,
        signed_at
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return {
        success: false,
        error: 'Deal not found',
      };
    }

    // Fetch creator profile
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, gst_number, pan_number, bank_account_name, bank_account_number, bank_ifsc')
      .eq('id', deal.creator_id)
      .single();

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
      signedAt: deal.signed_at || undefined,
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
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[InvoiceService] Update error:', updateError);
      // Don't fail if update fails, invoice is already uploaded
    }

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
      doc.fontSize(24).fillColor('#7C3AED').text('NoticeBazaar', 50, 50);
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
        'This invoice is generated automatically after contract signing via Leegality eSign.',
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

      doc.text('NoticeBazaar • Secure Legal Portal', 50, 750, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Invoice Worker
 * 
 * Handles invoice processing jobs.
 * 
 * @module shared/workers/invoiceWorker
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Invoice processing options
 */
interface InvoiceOptions {
  invoiceId: string;
  action: 'generate' | 'send' | 'mark_paid';
}

/**
 * Invoice processing result
 */
interface InvoiceResult {
  invoiceId: string;
  action: string;
  status: string;
  fileUrl?: string;
}

/**
 * Supabase client (lazy initialized)
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Supabase client
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabaseClient;
}

/**
 * Process an invoice action
 */
export async function processInvoice(options: InvoiceOptions): Promise<InvoiceResult> {
  const { invoiceId, action } = options;
  const supabase = getSupabaseClient();

  // Fetch invoice details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      collaboration:collaborations(
        *,
        creator:profiles!collaborations_creator_id_fkey(*),
        brand:profiles!collaborations_brand_id_fkey(*)
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  switch (action) {
    case 'generate':
      return generateInvoicePdf(invoice, supabase);
    case 'send':
      return sendInvoice(invoice, supabase);
    case 'mark_paid':
      return markInvoicePaid(invoice, supabase);
    default:
      throw new Error(`Unknown invoice action: ${action}`);
  }
}

/**
 * Generate invoice PDF
 */
async function generateInvoicePdf(invoice: any, supabase: any): Promise<InvoiceResult> {
  // Import PDF generator
  const { generateInvoicePdf: generatePdf } = await import('../../services/invoiceService');

  const pdfBuffer = await generatePdf(invoice);
  const fileName = `invoice_${invoice.invoice_number || invoice.id}_${Date.now()}.pdf`;
  const filePath = `invoices/${invoice.user_id}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload invoice: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('invoices')
    .getPublicUrl(filePath);

  // Update invoice record
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      file_path: filePath,
      file_url: urlData.publicUrl,
      status: 'generated',
    })
    .eq('id', invoice.id);

  if (updateError) {
    throw new Error(`Failed to update invoice: ${updateError.message}`);
  }

  return {
    invoiceId: invoice.id,
    action: 'generate',
    status: 'completed',
    fileUrl: urlData.publicUrl,
  };
}

/**
 * Send invoice to recipient
 */
async function sendInvoice(invoice: any, supabase: any): Promise<InvoiceResult> {
  // Ensure invoice PDF exists
  if (!invoice.file_url) {
    // Generate first
    await generateInvoicePdf(invoice, supabase);
    
    // Refetch invoice
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice.id)
      .single();
    
    if (updatedInvoice) {
      invoice = updatedInvoice;
    }
  }

  // Get recipient email
  const recipient = invoice.collaboration?.brand || invoice.collaboration?.creator;
  if (!recipient?.email) {
    throw new Error('Invoice recipient email not found');
  }

  // Send email with invoice
  const { queueEmail } = await import('../lib/queue');
  await queueEmail({
    to: recipient.email,
    subject: `Invoice #${invoice.invoice_number || invoice.id} from Creator Armour`,
    template: 'invoice',
    data: {
      invoiceNumber: invoice.invoice_number || invoice.id,
      amount: invoice.amount,
      dueDate: invoice.due_date,
      recipientName: recipient.full_name || recipient.company_name,
      senderName: invoice.collaboration?.creator?.full_name || 'Creator',
    },
    attachments: invoice.file_url ? [{
      filename: `invoice_${invoice.invoice_number || invoice.id}.pdf`,
      content: invoice.file_url,
      contentType: 'application/pdf',
    }] : undefined,
  });

  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  return {
    invoiceId: invoice.id,
    action: 'send',
    status: 'completed',
    fileUrl: invoice.file_url,
  };
}

/**
 * Mark invoice as paid
 */
async function markInvoicePaid(invoice: any, supabase: any): Promise<InvoiceResult> {
  // Update invoice status
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  if (updateError) {
    throw new Error(`Failed to mark invoice as paid: ${updateError.message}`);
  }

  // Notify the creator
  const creator = invoice.collaboration?.creator;
  if (creator?.id) {
    const { queueNotification } = await import('../lib/queue');
    await queueNotification({
      userId: creator.id,
      type: 'in_app',
      title: 'Invoice Paid',
      message: `Invoice #${invoice.invoice_number || invoice.id} has been marked as paid`,
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
      },
    });
  }

  return {
    invoiceId: invoice.id,
    action: 'mark_paid',
    status: 'completed',
  };
}

export default {
  processInvoice,
};

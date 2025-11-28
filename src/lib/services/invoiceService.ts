/**
 * Invoice Generation Service
 * 
 * Generates professional invoices as PDFs using jsPDF
 */

import jsPDF from 'jspdf';
import { BrandDeal } from '@/types';

export interface InvoiceData {
  deal: BrandDeal;
  creatorName: string;
  creatorEmail?: string;
  creatorPhone?: string;
  creatorAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  taxRate?: number; // GST rate (e.g., 18 for 18%)
  notes?: string;
}

/**
 * Generate invoice number from deal ID and date
 */
export function generateInvoiceNumber(dealId: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = dealId.slice(-6).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
}

/**
 * Generate PDF invoice
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const { deal, creatorName, invoiceNumber, invoiceDate, dueDate, taxRate = 18, notes } = data;

  // Create PDF document (A4 size)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, fontSize: number = 12, color: string = '#000000', maxWidth?: number) => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color);
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * (fontSize * 0.4); // Return height used
    } else {
      pdf.text(text, x, y);
      return fontSize * 0.4;
    }
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number, color: string = '#000000') => {
    pdf.setDrawColor(color);
    pdf.line(x1, y1, x2, y2);
  };

  // Header Section
  pdf.setFillColor(139, 92, 246); // Purple
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  addText('INVOICE', margin, 30, 24, '#FFFFFF');
  addText(invoiceNumber, pageWidth - margin - 40, 30, 14, '#FFFFFF');

  yPos = 60;

  // From Section (Creator)
  addText('From:', margin, yPos, 10, '#666666');
  yPos += 8;
  addText(creatorName, margin, yPos, 14, '#000000');
  yPos += 8;
  if (data.creatorEmail) {
    addText(`Email: ${data.creatorEmail}`, margin, yPos, 10, '#666666');
    yPos += 6;
  }
  if (data.creatorPhone) {
    addText(`Phone: ${data.creatorPhone}`, margin, yPos, 10, '#666666');
    yPos += 6;
  }
  if (data.creatorAddress) {
    const addressHeight = addText(data.creatorAddress, margin, yPos, 10, '#666666', pageWidth - margin - 100);
    yPos += addressHeight + 4;
  }

  // To Section (Brand)
  const toX = pageWidth / 2;
  addText('To:', toX, 60, 10, '#666666');
  yPos = 68;
  addText(deal.brand_name || 'Brand Name', toX, yPos, 14, '#000000');
  yPos += 8;
  if (deal.contact_person) {
    addText(`Contact: ${deal.contact_person}`, toX, yPos, 10, '#666666');
    yPos += 6;
  }
  if (deal.brand_email) {
    addText(`Email: ${deal.brand_email}`, toX, yPos, 10, '#666666');
    yPos += 6;
  }

  // Invoice Details
  yPos = 110;
  addText('Invoice Details', margin, yPos, 12, '#000000');
  yPos += 10;

  // Table Header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
  addText('Date', margin + 5, yPos, 10, '#000000');
  addText('Due Date', margin + 50, yPos, 10, '#000000');
  addText('Platform', margin + 100, yPos, 10, '#000000');
  yPos += 12;

  // Invoice Info Row
  addText(invoiceDate, margin + 5, yPos, 10, '#333333');
  addText(dueDate, margin + 50, yPos, 10, '#333333');
  addText(deal.platform || 'Multiple', margin + 100, yPos, 10, '#333333');
  yPos += 15;

  // Line Items Header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
  addText('Description', margin + 5, yPos, 10, '#000000');
  addText('Amount', pageWidth - margin - 40, yPos, 10, '#000000');
  yPos += 12;

  // Deliverables
  const deliverables = deal.deliverables 
    ? (typeof deal.deliverables === 'string' ? JSON.parse(deal.deliverables) : deal.deliverables)
    : ['Content Creation Services'];
  
  const deliverablesList = Array.isArray(deliverables) ? deliverables : [deliverables];
  
  deliverablesList.forEach((item: string) => {
    addText(`• ${item}`, margin + 5, yPos, 10, '#333333', pageWidth - margin - 60);
    yPos += 8;
  });

  yPos += 5;
  addLine(margin, yPos, pageWidth - margin, yPos, '#CCCCCC');
  yPos += 10;

  // Subtotal
  const subtotal = deal.deal_amount || 0;
  addText('Subtotal:', pageWidth - margin - 60, yPos, 10, '#333333');
  addText(`₹${subtotal.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPos, 10, '#333333');
  yPos += 8;

  // Tax (GST)
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  addText(`GST (${taxRate}%):`, pageWidth - margin - 60, yPos, 10, '#333333');
  addText(`₹${taxAmount.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPos, 10, '#333333');
  yPos += 8;

  // Total
  const total = subtotal + taxAmount;
  pdf.setFillColor(139, 92, 246);
  pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  addText('Total Amount:', pageWidth - margin - 60, yPos + 2, 12, '#FFFFFF');
  pdf.setFont('helvetica', 'bold');
  addText(`₹${total.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPos + 2, 14, '#FFFFFF');
  pdf.setFont('helvetica', 'normal');
  yPos += 20;

  // Payment Terms
  if (notes || deal.status === 'Payment Pending') {
    addText('Payment Terms:', margin, yPos, 10, '#666666');
    yPos += 8;
    const paymentNote = notes || `Payment is due by ${dueDate}. Please transfer the amount to the bank account details provided.`;
    const noteHeight = addText(paymentNote, margin, yPos, 10, '#333333', pageWidth - 2 * margin);
    yPos += noteHeight + 10;
  }

  // Footer
  yPos = pageHeight - 30;
  addLine(margin, yPos, pageWidth - margin, yPos, '#CCCCCC');
  yPos += 8;
  addText('Thank you for your business!', margin, yPos, 10, '#666666');
  yPos += 6;
  addText('Generated by NoticeBazaar', margin, yPos, 8, '#999999');

  // Convert to blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

/**
 * Download invoice PDF
 */
export async function downloadInvoice(data: InvoiceData): Promise<void> {
  const pdfBlob = await generateInvoicePDF(data);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Upload invoice to Supabase Storage
 */
export async function uploadInvoiceToStorage(
  pdfBlob: Blob,
  dealId: string,
  creatorId: string,
  supabase: any
): Promise<string> {
  const fileName = `invoice-${dealId}-${Date.now()}.pdf`;
  const filePath = `${creatorId}/invoices/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('creator-assets')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload invoice: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('creator-assets')
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded invoice');
  }

  return publicUrlData.publicUrl;
}


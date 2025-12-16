/**
 * Contract Summary PDF Generator
 * Creates a comprehensive PDF summarizing contract analysis, risks, and recommendations
 */

import { jsPDF } from 'jspdf';

export interface ContractSummaryData {
  // Deal Information
  dealValue: number | string | null;
  brandName: string;
  deliverables: string[];
  
  // Brand Contact Info
  brandEmail?: string | null;
  brandPhone?: string | null;
  brandLegalContact?: string | null;
  brandAddress?: string | null;
  
  // Risks and Issues
  risks: Array<{
    severity: 'high' | 'medium' | 'low' | 'warning';
    title: string;
    description: string;
    category: string;
  }>;
  
  // Missing Clauses
  missingClauses: Array<{
    title: string;
    description: string;
    category: string;
  }>;
  
  // AI Recommendations
  aiRecommendations: string[];
  
  // Creator's Fix Requests
  creatorFixRequests: Array<{
    title: string;
    description: string;
    issueType: string;
  }>;
  
  // Additional Info
  protectionScore?: number;
  overallRisk?: 'low' | 'medium' | 'high';
  analyzedAt?: string;
}

/**
 * Extract brand contact information from contract analysis
 */
export function extractBrandContactInfo(analysisData: any): {
  brandEmail?: string;
  brandLegalContact?: string;
  brandAddress?: string;
} {
  const contactInfo: {
    brandEmail?: string;
    brandLegalContact?: string;
    brandAddress?: string;
  } = {};

  if (!analysisData) return contactInfo;

  // Extract from parties
  const parties = analysisData.parties || {};
  if (parties.brandEmail) {
    contactInfo.brandEmail = parties.brandEmail;
  }

  // Extract from extractedTerms or keyTerms
  const extractedTerms = analysisData.extractedTerms || {};
  const keyTerms = analysisData.keyTerms || {};

  // Look for email patterns in various fields
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const allText = JSON.stringify(analysisData);
  const emails = allText.match(emailPattern);
  if (emails && emails.length > 0) {
    // Filter out common non-brand emails
    const brandEmails = emails.filter(
      email => 
        !email.includes('noticebazaar') && 
        !email.includes('example.com') &&
        !email.includes('test.com')
    );
    if (brandEmails.length > 0 && !contactInfo.brandEmail) {
      contactInfo.brandEmail = brandEmails[0];
    }
  }

  // Extract legal contact (look for "legal", "attorney", "lawyer" patterns)
  const legalPatterns = [
    /legal\s+contact[:\s]+([^\n,]+)/i,
    /attorney[:\s]+([^\n,]+)/i,
    /lawyer[:\s]+([^\n,]+)/i,
    /legal\s+representative[:\s]+([^\n,]+)/i,
  ];
  
  for (const pattern of legalPatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      contactInfo.brandLegalContact = match[1].trim();
      break;
    }
  }

  // Extract address (look for address patterns)
  const addressPatterns = [
    /address[:\s]+([^\n]{20,200})/i,
    /registered\s+address[:\s]+([^\n]{20,200})/i,
    /corporate\s+address[:\s]+([^\n]{20,200})/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      // Clean up the address
      let address = match[1].trim();
      // Remove common trailing punctuation
      address = address.replace(/[,;]+$/, '');
      if (address.length > 10 && address.length < 200) {
        contactInfo.brandAddress = address;
        break;
      }
    }
  }

  return contactInfo;
}

/**
 * Generate Contract Summary PDF
 */
export async function generateContractSummaryPDF(data: ContractSummaryData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return lines.length * (fontSize * 0.4); // Approximate line height
  };

  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(100, 50, 150); // Purple color
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contract Summary Report', margin, yPosition);
  yPosition += 10;

  // Deal Information Section
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Deal Information', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Brand Name
  pdf.setFont('helvetica', 'bold');
  pdf.text('Brand Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.brandName || 'Not specified', margin + 40, yPosition);
  yPosition += 6;

  // Deal Value
  pdf.setFont('helvetica', 'bold');
  pdf.text('Deal Value:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  const dealValueText = data.dealValue 
    ? (typeof data.dealValue === 'number' 
        ? `₹${Number(data.dealValue).toLocaleString('en-IN')}` 
        : String(data.dealValue))
    : 'Not specified';
  pdf.text(dealValueText, margin + 40, yPosition);
  yPosition += 6;

  // Brand Contact Information
  if (data.brandEmail || data.brandPhone || data.brandLegalContact || data.brandAddress) {
    yPosition += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Brand Contact Information:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    
    if (data.brandEmail) {
      pdf.text(`Email: ${data.brandEmail}`, margin + 5, yPosition);
      yPosition += 5;
    }
    if (data.brandPhone) {
      pdf.text(`Phone: ${data.brandPhone}`, margin + 5, yPosition);
      yPosition += 5;
    }
    if (data.brandLegalContact) {
      pdf.text(`Legal Contact: ${data.brandLegalContact}`, margin + 5, yPosition);
      yPosition += 5;
    }
    if (data.brandAddress) {
      const addressHeight = addWrappedText(`Address: ${data.brandAddress}`, margin + 5, yPosition, contentWidth - 5, 10);
      yPosition += addressHeight + 2;
    }
  }

  // Deliverables
  yPosition += 4;
  checkNewPage(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Deliverables:', margin, yPosition);
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  
  if (data.deliverables && data.deliverables.length > 0) {
    data.deliverables.forEach((deliverable, index) => {
      checkNewPage(6);
      const deliverableText = typeof deliverable === 'string' ? deliverable : (deliverable.title || deliverable.name || String(deliverable));
      pdf.text(`${index + 1}. ${deliverableText}`, margin + 5, yPosition);
      yPosition += 5;
    });
  } else {
    pdf.text('No deliverables specified', margin + 5, yPosition);
    yPosition += 5;
  }

  // Protection Score & Risk
  if (data.protectionScore !== undefined || data.overallRisk) {
    yPosition += 6;
    checkNewPage(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Protection Assessment:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    
    if (data.protectionScore !== undefined) {
      pdf.text(`Protection Score: ${data.protectionScore}/100`, margin + 5, yPosition);
      yPosition += 5;
    }
    if (data.overallRisk) {
      const riskColor = data.overallRisk === 'high' ? [200, 0, 0] : 
                       data.overallRisk === 'medium' ? [255, 165, 0] : 
                       [0, 150, 0];
      pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      pdf.text(`Overall Risk: ${data.overallRisk.toUpperCase()}`, margin + 5, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 5;
    }
  }

  // Risks Found
  if (data.risks && data.risks.length > 0) {
    yPosition += 6;
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Risks Found', margin, yPosition);
    yPosition += 8;
    pdf.setFontSize(10);
    
    data.risks.forEach((risk, index) => {
      checkNewPage(15);
      const severityColor = risk.severity === 'high' ? [200, 0, 0] : 
                           risk.severity === 'medium' ? [255, 165, 0] : 
                           [100, 100, 100];
      pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. [${risk.severity.toUpperCase()}] ${risk.title}`, margin + 5, yPosition);
      yPosition += 5;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      const descHeight = addWrappedText(risk.description, margin + 10, yPosition, contentWidth - 10, 9);
      yPosition += descHeight + 3;
    });
  }

  // Missing Clauses
  if (data.missingClauses && data.missingClauses.length > 0) {
    yPosition += 6;
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Missing Clauses', margin, yPosition);
    yPosition += 8;
    pdf.setFontSize(10);
    
    data.missingClauses.forEach((clause, index) => {
      checkNewPage(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${clause.title}`, margin + 5, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      if (clause.description) {
        const descHeight = addWrappedText(clause.description, margin + 10, yPosition, contentWidth - 10, 9);
        yPosition += descHeight + 3;
      } else {
        yPosition += 3;
      }
    });
  }

  // AI Recommendations
  if (data.aiRecommendations && data.aiRecommendations.length > 0) {
    yPosition += 6;
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('AI Recommendations', margin, yPosition);
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    data.aiRecommendations.forEach((recommendation, index) => {
      checkNewPage(8);
      pdf.text(`${index + 1}. ${recommendation}`, margin + 5, yPosition);
      yPosition += 6;
    });
  }

  // Creator's Fix Requests
  if (data.creatorFixRequests && data.creatorFixRequests.length > 0) {
    yPosition += 6;
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text("Creator's Fix Requests", margin, yPosition);
    yPosition += 8;
    pdf.setFontSize(10);
    
    data.creatorFixRequests.forEach((request, index) => {
      checkNewPage(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${request.title}`, margin + 5, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      if (request.description) {
        const descHeight = addWrappedText(request.description, margin + 10, yPosition, contentWidth - 10, 9);
        yPosition += descHeight + 3;
      } else {
        yPosition += 3;
      }
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Generated by CreatorArmour on ${new Date().toLocaleDateString('en-IN')} - Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 10
    );
  }

  // Download PDF
  const fileName = `Contract_Summary_${data.brandName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}


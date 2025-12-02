import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Issue {
  id: number;
  severity: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  clause?: string;
  recommendation: string;
}

interface Verified {
  id: number;
  category: string;
  title: string;
  description: string;
  clause?: string;
}

interface KeyTerms {
  dealValue: string;
  duration: string;
  deliverables: string;
  paymentSchedule: string;
  exclusivity?: string;
}

interface AnalysisResults {
  overallRisk: 'low' | 'medium' | 'high';
  score: number;
  issues: Issue[];
  verified: Verified[];
  keyTerms: KeyTerms;
  brandName?: string;
  fileName?: string;
}

export async function generateContractReport(analysisResults: AnalysisResults, fileName?: string): Promise<void> {
  const riskConfig = {
    low: { label: 'LOW RISK', color: '#10b981', bgColor: '#f0fdf4', borderColor: '#10b981' },
    medium: { label: 'MEDIUM RISK', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#f59e0b' },
    high: { label: 'HIGH RISK', color: '#ef4444', bgColor: '#fef3f2', borderColor: '#ef4444' },
  };

  const risk = riskConfig[analysisResults.overallRisk];
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const reportId = `NB-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  // Generate HTML report
  const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contract Analysis Report - NoticeBazaar</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      margin: 0;
      padding: 40px; 
      color: #333; 
      background: #ffffff;
      line-height: 1.6;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      padding: 60px;
    }
    
    /* Header */
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      border-bottom: 4px solid #7c3aed; 
      padding-bottom: 30px; 
    }
    .header h1 { 
      color: #7c3aed; 
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .header .subtitle { 
      color: #666; 
      font-size: 16px;
      margin: 8px 0;
    }
    .header .date {
      color: #999;
      font-size: 14px;
      margin-top: 10px;
    }
    
    /* Score Section */
    .score-section { 
      background: linear-gradient(135deg, ${risk.bgColor} 0%, ${risk.bgColor}dd 100%);
      padding: 30px; 
      border-radius: 15px; 
      margin: 30px 0; 
      text-align: center;
      border: 2px solid ${risk.borderColor};
    }
    .score-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 40px;
      margin-bottom: 20px;
    }
    .score-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 8px solid ${risk.color};
      box-shadow: 0 4px 20px ${risk.color}4d;
    }
    .score { 
      font-size: 56px; 
      font-weight: 900; 
      color: ${risk.color};
      line-height: 1;
    }
    .score-text {
      font-size: 14px;
      color: ${risk.color}dd;
      margin-top: 5px;
      font-weight: 600;
    }
    .risk-badge { 
      display: inline-block; 
      background: ${risk.color};
      color: white; 
      padding: 12px 28px; 
      border-radius: 25px; 
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 4px 10px ${risk.color}4d;
    }
    
    /* Section */
    .section { 
      margin: 40px 0; 
      page-break-inside: avoid;
    }
    .section h2 { 
      color: #7c3aed; 
      border-bottom: 3px solid #e9d5ff; 
      padding-bottom: 12px;
      font-size: 24px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section h2::before {
      content: '';
      width: 4px;
      height: 24px;
      background: #7c3aed;
      display: inline-block;
    }
    
    /* Overview */
    .overview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .overview-item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #7c3aed;
    }
    .overview-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .overview-value {
      font-size: 16px;
      color: #111;
      font-weight: 700;
    }
    
    /* Key Terms */
    .key-terms { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin: 25px 0; 
    }
    .term-box { 
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      padding: 20px; 
      border-radius: 12px; 
      border: 2px solid #e9d5ff;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
    }
    .term-label { 
      font-size: 13px; 
      color: #7c3aed; 
      margin-bottom: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .term-value { 
      font-size: 22px; 
      font-weight: 900; 
      color: #1f2937;
    }
    .term-icon {
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    /* Issues */
    .issue { 
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-left: 5px solid #f59e0b; 
      padding: 20px; 
      margin: 15px 0; 
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .issue-title { 
      font-weight: 700; 
      color: #92400e; 
      font-size: 18px;
      flex: 1;
    }
    .issue-category {
      background: #fbbf24;
      color: #78350f;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .issue-meta {
      color: #92400e;
      font-size: 13px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .issue-description {
      color: #451a03;
      margin-bottom: 15px;
      line-height: 1.7;
    }
    .recommendation { 
      background: white;
      border-left: 4px solid #3b82f6; 
      padding: 15px; 
      margin-top: 15px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
    }
    .recommendation-title {
      color: #1e40af;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
    }
    .recommendation-text {
      color: #1e3a8a;
      line-height: 1.6;
    }
    
    /* Verified */
    .verified { 
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-left: 5px solid #10b981; 
      padding: 20px; 
      margin: 15px 0; 
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
    }
    .verified-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .verified-title { 
      font-weight: 700; 
      color: #065f46; 
      font-size: 18px;
      flex: 1;
    }
    .verified-category {
      background: #34d399;
      color: #064e3b;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .verified-meta {
      color: #065f46;
      font-size: 13px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .verified-description {
      color: #064e3b;
      line-height: 1.7;
    }
    
    /* Next Steps */
    .next-steps {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 25px;
      border-radius: 12px;
      border: 2px solid #93c5fd;
    }
    .next-steps ol {
      margin-left: 20px;
      color: #1e3a8a;
    }
    .next-steps li {
      margin: 12px 0;
      line-height: 1.7;
      font-weight: 500;
    }
    
    /* Footer */
    .footer { 
      margin-top: 60px; 
      padding-top: 30px; 
      border-top: 3px solid #e5e7eb; 
      text-align: center; 
      color: #666; 
      font-size: 13px;
    }
    .footer-logo {
      font-weight: 900;
      color: #7c3aed;
      font-size: 20px;
      margin-bottom: 10px;
    }
    .footer-disclaimer {
      color: #999;
      font-style: italic;
      margin: 10px 0;
      line-height: 1.6;
    }
    .footer-copyright {
      color: #666;
      font-weight: 600;
      margin-top: 10px;
    }
    
    /* Print Styles */
    @media print {
      body { margin: 0; padding: 0; }
      .page { box-shadow: none; padding: 40px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>📄 Contract Analysis Report</h1>
      <div class="subtitle">Generated by NoticeBazaar AI Protection System</div>
      <div class="date">${formattedDate} • ${formattedTime} IST</div>
    </div>

    <!-- Score Section -->
    <div class="score-section">
      <div class="score-container">
        <div class="score-circle">
          <div>
            <div class="score">${analysisResults.score}</div>
            <div class="score-text">/ 100</div>
          </div>
        </div>
        <div>
          <div class="risk-badge">⚠️ ${risk.label}</div>
          <div style="margin-top: 15px; color: ${risk.color}dd; font-weight: 600;">
            ${analysisResults.overallRisk === 'high' ? 'Action Required Before Signing' : 
              analysisResults.overallRisk === 'medium' ? 'Review Recommended' : 
              'Contract Looks Good'}
          </div>
        </div>
      </div>
    </div>

    <!-- Overview -->
    <div class="section">
      <h2>📋 Contract Overview</h2>
      <div class="overview-grid">
        <div class="overview-item">
          <div class="overview-label">File Name</div>
          <div class="overview-value">${fileName || analysisResults.fileName || 'Contract_Agreement.pdf'}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Analysis Date</div>
          <div class="overview-value">${formattedDate} • ${formattedTime}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Issues Found</div>
          <div class="overview-value" style="color: #ef4444;">${analysisResults.issues.length} ${analysisResults.issues.length === 1 ? 'Issue' : 'Issues'}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Verified Items</div>
          <div class="overview-value" style="color: #10b981;">${analysisResults.verified.length} Safe ${analysisResults.verified.length === 1 ? 'Clause' : 'Clauses'}</div>
        </div>
      </div>
    </div>

    <!-- Key Terms -->
    <div class="section">
      <h2>💰 Key Contract Terms</h2>
      <div class="key-terms">
        <div class="term-box">
          <div class="term-icon">💵</div>
          <div class="term-label">Deal Value</div>
          <div class="term-value">${analysisResults.keyTerms.dealValue}</div>
        </div>
        <div class="term-box">
          <div class="term-icon">📅</div>
          <div class="term-label">Duration</div>
          <div class="term-value">${analysisResults.keyTerms.duration}</div>
        </div>
        <div class="term-box">
          <div class="term-icon">🎥</div>
          <div class="term-label">Deliverables</div>
          <div class="term-value">${analysisResults.keyTerms.deliverables}</div>
        </div>
        <div class="term-box">
          <div class="term-icon">💳</div>
          <div class="term-label">Payment</div>
          <div class="term-value">${analysisResults.keyTerms.paymentSchedule}</div>
        </div>
      </div>
    </div>

    <!-- Issues Found -->
    <div class="section">
      <h2>⚠️ Critical Issues Found (${analysisResults.issues.length})</h2>
      ${analysisResults.issues.map(issue => `
      <div class="issue">
        <div class="issue-header">
          <div class="issue-title">${issue.title}</div>
          <div class="issue-category">${issue.category}</div>
        </div>
        ${issue.clause ? `<div class="issue-meta">📍 ${issue.clause}</div>` : ''}
        <div class="issue-description">
          ${issue.description}
        </div>
        <div class="recommendation">
          <div class="recommendation-title">💡 Recommended Action</div>
          <div class="recommendation-text">
            ${issue.recommendation}
          </div>
        </div>
      </div>
      `).join('')}
    </div>

    <!-- Verified Items -->
    <div class="section">
      <h2>✅ Verified Safe Clauses (${analysisResults.verified.length})</h2>
      ${analysisResults.verified.map(item => `
      <div class="verified">
        <div class="verified-header">
          <div class="verified-title">${item.title}</div>
          <div class="verified-category">${item.category}</div>
        </div>
        ${item.clause ? `<div class="verified-meta">📍 ${item.clause}</div>` : ''}
        <div class="verified-description">
          ${item.description}
        </div>
      </div>
      `).join('')}
    </div>

    <!-- Next Steps -->
    <div class="section">
      <h2>🎯 Recommended Next Steps</h2>
      <div class="next-steps">
        <ol>
          ${analysisResults.overallRisk === 'high' ? `
          <li><strong>Do Not Sign Yet:</strong> This contract has ${analysisResults.issues.length} critical issue${analysisResults.issues.length === 1 ? '' : 's'} that put you at financial and legal risk.</li>
          <li><strong>Schedule Legal Review:</strong> Consult with NoticeBazaar's legal advisor to discuss specific changes needed.</li>
          <li><strong>Request Revisions:</strong> Send the brand a list of required changes based on the issues identified above.</li>
          ` : analysisResults.overallRisk === 'medium' ? `
          <li><strong>Review Carefully:</strong> This contract has some areas that need attention before signing.</li>
          <li><strong>Request Clarifications:</strong> Address the issues identified above with the brand.</li>
          ` : `
          <li><strong>Contract Looks Good:</strong> This contract has been reviewed and appears to be in good shape.</li>
          <li><strong>Final Review:</strong> Still recommended to have a legal professional review before signing.</li>
          `}
          <li><strong>Use This Report:</strong> Share this analysis with the brand to justify your requested changes professionally.</li>
          <li><strong>Get Written Confirmation:</strong> Ensure all changes are made in writing before signing the final contract.</li>
          <li><strong>Re-Upload for Review:</strong> Once revised, upload the new contract to NoticeBazaar for verification.</li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">NoticeBazaar</div>
      <div>Legal & Tax Services for Content Creators & Influencers</div>
      <div class="footer-disclaimer">
        This report is generated by AI and should be reviewed by a qualified legal professional before making final decisions. NoticeBazaar provides this analysis as guidance only and does not constitute legal advice.
      </div>
      <div class="footer-copyright">
        © ${currentDate.getFullYear()} NoticeBazaar. All rights reserved. | Report ID: ${reportId}
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Create a temporary div to render the HTML
  const reportDiv = document.createElement('div');
  reportDiv.innerHTML = reportHTML;
  reportDiv.style.position = 'absolute';
  reportDiv.style.left = '-9999px';
  reportDiv.style.width = '800px';
  document.body.appendChild(reportDiv);

  try {
    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert to canvas
    const canvas = await html2canvas(reportDiv.querySelector('.page') as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // Remove temp div
    document.body.removeChild(reportDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgScaledWidth = imgWidth * ratio;
    const imgScaledHeight = imgHeight * ratio;
    const xOffset = (pdfWidth - imgScaledWidth) / 2;
    let yOffset = 0;

    // Add image to PDF (may span multiple pages)
    const pageHeight = pdfHeight;
    let remainingHeight = imgScaledHeight;

    while (remainingHeight > 0) {
      pdf.addImage(
        imgData,
        'PNG',
        xOffset,
        yOffset,
        imgScaledWidth,
        imgScaledHeight
      );
      remainingHeight -= pageHeight;
      yOffset -= pageHeight;

      if (remainingHeight > 0) {
        pdf.addPage();
      }
    }

    // Save PDF
    const safeFileName = (fileName || 'Contract_Report')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    pdf.save(`NoticeBazaar_Contract_Report_${safeFileName}_${reportId}.pdf`);
  } catch (error) {
    // Clean up on error
    if (document.body.contains(reportDiv)) {
      document.body.removeChild(reportDiv);
    }
    throw error;
  }
}


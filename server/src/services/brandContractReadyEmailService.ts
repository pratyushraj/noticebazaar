// @ts-nocheck
// Brand Contract Ready Email Service
// Sends contract to brand after generation

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

import { getCTATrustLine, getEmailLayout, getEmailProgressCue, getEmailSignal, getPrimaryCTA } from './professionalEmailTemplates.js';

interface BrandContractReadyData {
  brandName: string;
  creatorName: string;
  dealAmount?: number;
  dealType: 'paid' | 'barter';
  deliverables: any[];
  deadline?: string;
  contractUrl?: string;
  contractReadyToken: string;
}

/**
 * Send contract to brand via email after generation
 */
export async function sendBrandContractReadyEmail(
  brandEmail: string,
  brandName: string,
  contractData: BrandContractReadyData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[BrandContractReadyEmail] API key not configured');
      return {
        success: false,
        error: 'Resend API key is not configured',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(brandEmail)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';

    const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
    const contractReadyLink = `${frontendUrl}/contract-ready/${contractData.contractReadyToken}`;

    const dealAmount = contractData.dealType === 'paid' && contractData.dealAmount
      ? `₹${parseFloat(contractData.dealAmount.toString()).toLocaleString('en-IN')}`
      : 'As agreed in contract';

    const deliverablesList = contractData.deliverables
      .map((d: any, idx: number) => {
        if (typeof d === 'object' && d.platform && d.contentType) {
          return `${idx + 1}. ${d.quantity || 1} ${d.contentType} on ${d.platform}${d.duration ? ` (${d.duration}s)` : ''}`;
        }
        return `${idx + 1}. ${typeof d === 'string' ? d : JSON.stringify(d)}`;
      })
      .join('<br>');

    const deadlineText = contractData.deadline
      ? new Date(contractData.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Not specified';

    const emailSubject = `Action required: Review & sign agreement with ${contractData.creatorName}`;
    const emailContent = `
      <tr>
        <td style="background-color: #5b21b6; padding: 48px 30px; text-align: center;">
          <div style="width: 70px; height: 70px; margin: 0 auto 16px auto; border-radius: 50%; background-color: rgba(255, 255, 255, 0.16); display: inline-block; line-height: 70px;">
            <span style="font-size: 28px; color: #ffffff;">✍️</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff !important; line-height: 1.3;">
            Agreement ready for signature
          </h1>
          <p style="margin: 0; font-size: 14px; color: #ffffff !important; opacity: 0.95;">
            ${contractData.creatorName} is waiting for your review
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 32px 8px 32px;">
          <p style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937; font-weight: 600;">Hello ${brandName},</p>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
            Your collaboration agreement has been generated and is ready for your signature. Please review the summary below and sign to activate the partnership.
          </p>
        </td>
      </tr>
      ${getEmailSignal({
        type: 'action',
        message: 'Review the agreement and sign to lock in deliverables, payment terms, and timelines.'
      })}
      ${getEmailProgressCue([
        { label: 'Agreement Ready', status: 'current' },
        { label: 'Signed', status: 'upcoming' },
        { label: 'Deliverables Start', status: 'upcoming' }
      ])}
      <tr>
        <td style="padding: 20px 32px 0 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
            <tr>
              <td style="font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 12px;">Agreement Summary</td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; width: 38%; font-weight: 600;">Creator</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600;">${contractData.creatorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Deal type</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px; text-transform: capitalize;">${contractData.dealType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Deal value</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 700;">${dealAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Deadline</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px;">${deadlineText}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 32px 0 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
            <tr>
              <td style="font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 10px;">Deliverables</td>
            </tr>
            <tr>
              <td style="color: #4b5563; font-size: 14px; line-height: 1.7;">
                ${deliverablesList || 'No deliverables specified'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${getPrimaryCTA('Review & Sign Agreement', contractReadyLink)}
      ${getCTATrustLine('Signing typically takes under 2 minutes. No payment is processed until both parties sign.')}
      ${contractData.contractUrl ? `
      <tr>
        <td style="padding: 0 32px 24px 32px; text-align: center;">
          <a href="${contractData.contractUrl}" style="display: inline-block; color: #4f46e5; padding: 10px 18px; text-decoration: none; border: 1px solid #c7d2fe; border-radius: 8px; font-size: 13px; font-weight: 600;">
            Download Contract PDF
          </a>
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 0 32px 24px 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef9c3; border: 1px solid #fde68a; border-radius: 12px; padding: 14px;">
            <tr>
              <td style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 6px;">Status</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #92400e;">AWAITING_BRAND_SIGNATURE</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 32px 32px;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            Identity verification and timestamps are logged for legal enforceability. You can request changes directly on the agreement page before signing.
          </p>
        </td>
      </tr>
    `;
    const emailHtml = getEmailLayout({ content: emailContent, showFooter: true, backgroundStyle: 'purple' });

    const requestBody = {
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to: brandEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    console.log('[BrandContractReadyEmail] Sending contract email:', {
      brandEmail,
      brandName,
      creatorName: contractData.creatorName,
      hasApiKey: !!apiKey,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = `Resend API error: ${response.status} ${response.statusText}`;

      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as-is
      }

      if (response.status === 401) {
        errorMessage = 'Resend API authentication failed. Please check your RESEND_API_KEY';
      } else if (response.status === 403) {
        errorMessage = 'Resend API access forbidden. Please check your API key permissions.';
      } else if (response.status === 422 && parsedError.message) {
        errorMessage = `Resend API validation error: ${parsedError.message}`;
      } else if (parsedError.message) {
        errorMessage = `Resend API error: ${parsedError.message}`;
      }

      console.error('[BrandContractReadyEmail] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: ResendEmailResponse = await response.json();

    console.log('[BrandContractReadyEmail] Email sent successfully:', {
      emailId: data.id,
      brandEmail,
    });

    if (data.id) {
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send contract email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[BrandContractReadyEmail] Exception:', error);
    return {
      success: false,
      error: `Failed to send contract email: ${error.message || 'Unknown error'}`,
    };
  }
}

// @ts-nocheck
// Brand Form Submission Email Service
// Sends email notification to creator when brand submits deal details form

import { getCTATrustLine, getEmailLayout, getEmailProgressCue, getEmailSignal, getPrimaryCTA } from './professionalEmailTemplates.js';

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface BrandFormSubmissionData {
  brandName: string;
  campaignName?: string;
  dealType: 'paid' | 'barter';
  paymentAmount?: number;
  deliverables: any[];
  deadline?: string;
}

/**
 * Send email notification to creator when brand submits deal details form
 * @param creatorEmail - Creator's email address
 * @param creatorName - Creator's name for personalization
 * @param brandData - Brand form submission data
 * @param dealId - Created deal ID (if deal was created)
 * @returns Success status and email ID
 */
export async function sendBrandFormSubmissionEmail(
  creatorEmail: string,
  creatorName: string,
  brandData: BrandFormSubmissionData,
  dealId?: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[BrandFormSubmissionEmail] API key not configured or is placeholder');
      return {
        success: false,
        error: 'Resend API key is not configured. Please set RESEND_API_KEY in server/.env',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(creatorEmail)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';

    // Format deliverables for display
    const deliverablesList = brandData.deliverables
      .map((d: any, idx: number) => {
        if (typeof d === 'object' && d.platform && d.contentType) {
          return `${idx + 1}. ${d.quantity || 1} ${d.contentType} on ${d.platform}${d.duration ? ` (${d.duration}s)` : ''}`;
        }
        return `${idx + 1}. ${typeof d === 'string' ? d : JSON.stringify(d)}`;
      })
      .join('<br>');

    const dealAmount = brandData.dealType === 'paid' && brandData.paymentAmount
      ? `₹${parseFloat(brandData.paymentAmount.toString()).toLocaleString('en-IN')}`
      : brandData.dealType === 'barter'
        ? 'Barter Deal'
        : 'Not specified';

    const deadlineText = brandData.deadline
      ? new Date(brandData.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Not specified';

    const dealLink = dealId
      ? `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`
      : `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts`;

    const emailSubject = `New Collaboration Request from ${brandData.brandName}`;
    const emailContent = `
      <tr>
        <td style="background-color: #5b21b6; padding: 48px 30px; text-align: center;">
          <div style="width: 70px; height: 70px; margin: 0 auto 16px auto; border-radius: 18px; background-color: rgba(255, 255, 255, 0.16); display: inline-block; line-height: 70px;">
            <span style="font-size: 30px; color: #ffffff;">✨</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff !important; line-height: 1.3;">
            New collaboration request
          </h1>
          <p style="margin: 0; font-size: 14px; color: #ffffff !important; opacity: 0.95;">
            ${brandData.brandName} sent you deal details
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 32px 6px 32px;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #111827;">Hello ${creatorName || 'there'},</p>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
            Great news! ${brandData.brandName} submitted their collaboration details through your link. Review the deal and generate a protected contract to move forward.
          </p>
        </td>
      </tr>
      ${getEmailSignal({
        type: 'action',
        message: 'Review the details and generate a contract before the brand loses momentum.'
      })}
      ${getEmailProgressCue([
        { label: 'Request In', status: 'completed' },
        { label: 'Review & Contract', status: 'current' },
        { label: 'Brand Signs', status: 'upcoming' }
      ])}
      <tr>
        <td style="padding: 20px 32px 0 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
            <tr>
              <td style="font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 12px;">Deal Summary</td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; width: 38%; font-weight: 600;">Brand</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600;">${brandData.brandName}</td>
                  </tr>
                  ${brandData.campaignName ? `
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Campaign</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px;">${brandData.campaignName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Deal type</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px; text-transform: capitalize;">${brandData.dealType}</td>
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
      ${getPrimaryCTA('Review & Create Contract', dealLink)}
      ${getCTATrustLine('Contracts are auto-logged and provide legal protection.')}
      <tr>
        <td style="padding: 0 32px 28px 32px;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            Once you generate the contract, we’ll notify the brand instantly. Reply in-app if they request changes.
          </p>
        </td>
      </tr>
    `;
    const emailHtml = getEmailLayout({ content: emailContent, showFooter: true, backgroundStyle: 'purple' });

    const requestBody = {
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to: creatorEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    console.log('[BrandFormSubmissionEmail] Sending notification email:', {
      creatorEmail,
      brandName: brandData.brandName,
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

      console.error('[BrandFormSubmissionEmail] API error:', {
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

    console.log('[BrandFormSubmissionEmail] Email sent successfully:', {
      emailId: data.id,
      creatorEmail,
    });

    if (data.id) {
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send notification email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[BrandFormSubmissionEmail] Exception:', error);
    return {
      success: false,
      error: `Failed to send notification email: ${error.message || 'Unknown error'}`,
    };
  }
}

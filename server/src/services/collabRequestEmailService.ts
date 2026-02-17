// @ts-nocheck
// Collaboration Request Email Service
// Sends transactional emails to brands about collab request status updates

import {
  getCreatorNotificationEmailTemplate,
  getBrandConfirmationEmailTemplate,
  getEmailProgressCue,
  getCTATrustLine,
  getEmailSignal,
  getFirstName,
  getPrimaryCTA,
  getEmailLayout,
} from './professionalEmailTemplates.js';

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface CollabRequestSubmissionData {
  creatorName: string;
  creatorPlatforms?: string[];
  brandName: string;
  collabType: 'paid' | 'barter' | 'both';
  budgetRange?: string | null;
  exactBudget?: number | null;
  barterDescription?: string | null;
  deliverables: string[];
  deadline?: string | null;
  requestId: string;
}

interface CollabRequestAcceptedData {
  creatorName: string;
  brandName: string;
  dealAmount?: number;
  dealType: 'paid' | 'barter';
  deliverables: string[];
  contractReadyToken: string;
  contractUrl?: string;
  /** For barter: product value in INR (optional) */
  barterValue?: number | null;
}

interface CollabRequestCounterData {
  creatorName: string;
  brandName: string;
  originalBudget?: number | null;
  counterPrice?: number | null;
  counterDeliverables?: string | null;
  counterNotes?: string | null;
  requestId: string;
}

interface CollabRequestDeclinedData {
  creatorName: string;
  brandName: string;
  creatorUsername: string;
}

interface CollabRequestCreatorNotificationData {
  creatorName: string;
  creatorCategory?: string;
  followerCount?: number;
  avatarUrl?: string;
  brandName: string;
  brandWebsite?: string;
  campaignGoal?: string;
  collabType: 'paid' | 'barter' | 'both';
  budgetRange?: string | null;
  exactBudget?: number | null;
  barterDescription?: string | null;
  barterValue?: number | null;
  /** Barter: optional product image URL to show in the creator notification email */
  barterProductImageUrl?: string | null;
  deliverables: string[];
  deadline?: string | null;
  timeline?: string;
  notes?: string;
  requestId: string;
  /** Optional: direct link to accept this request (e.g. /collab/accept/:requestToken) */
  acceptUrl?: string;
}

/**
 * Base email sending function
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[CollabRequestEmail] API key not configured');
      return {
        success: false,
        error: 'Resend API key is not configured',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';

    const requestBody = {
      from: process.env.EMAIL_FROM || 'CreatorArmour <noreply@creatorarmour.com>',
      to,
      subject,
      html,
    };

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
        errorMessage = 'Resend API authentication failed';
      } else if (response.status === 403) {
        errorMessage = 'Resend API access forbidden';
      } else if (response.status === 422 && parsedError.message) {
        errorMessage = `Resend API validation error: ${parsedError.message}`;
      } else if (parsedError.message) {
        errorMessage = `Resend API error: ${parsedError.message}`;
      }

      console.error('[CollabRequestEmail] API error:', {
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

    if (data.id) {
      console.log('[CollabRequestEmail] Email sent successfully:', {
        emailId: data.id,
        to,
        subject,
      });
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[CollabRequestEmail] Exception:', error);
    return {
      success: false,
      error: `Failed to send email: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Email template helper
 */
function getEmailTemplate(
  title: string,
  greeting: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  secondaryCtaText?: string,
  secondaryCtaUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${greeting}</h2>
          ${content}
          ${ctaUrl && ctaText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;" target="_blank" rel="noopener noreferrer">
                ${ctaText}
              </a>
            </div>
          ` : ''}
          ${secondaryCtaUrl && secondaryCtaText ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${secondaryCtaUrl}" style="display: inline-block; color: #667eea; padding: 10px 20px; text-decoration: none; border: 1px solid #667eea; border-radius: 8px; font-size: 14px;">
                ${secondaryCtaText}
              </a>
            </div>
          ` : ''}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4;">
              Actions on Creator Armour are recorded, timestamped, and legally enforceable.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
              This is an automated email from CreatorArmour. Please do not reply to this email.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">
              <a href="mailto:support@creatorarmour.com" style="color: #667eea; text-decoration: none;">Need help? Contact us</a> — we’re here before any issue becomes a dispute.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * 1. Send email when collab request is submitted
 */
export async function sendCollabRequestSubmissionEmail(
  brandEmail: string,
  data: CollabRequestSubmissionData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';

  // Format platforms
  const platformsText = data.creatorPlatforms && data.creatorPlatforms.length > 0
    ? data.creatorPlatforms.join(', ')
    : 'Multiple platforms';

  // Format collaboration type
  const collabTypeText = data.collabType === 'paid'
    ? 'Paid'
    : data.collabType === 'barter'
      ? 'Barter'
      : 'Hybrid (Paid + Barter)';

  // Format budget
  let budgetText = 'As agreed in contract';
  if (data.collabType === 'paid' || data.collabType === 'both') {
    if (data.exactBudget) {
      budgetText = `₹${data.exactBudget.toLocaleString('en-IN')}`;
    } else if (data.budgetRange) {
      const ranges: { [key: string]: string } = {
        'under-5000': 'Under ₹5,000',
        '5000-10000': '₹5,000 – ₹10,000',
        '10000-25000': '₹10,000 – ₹25,000',
        '25000+': '₹25,000+',
      };
      budgetText = ranges[data.budgetRange] || data.budgetRange;
    }
  } else if (data.collabType === 'barter' && data.barterDescription) {
    budgetText = 'Barter deal (product value agreed privately)';
  }

  // Format deliverables as bulleted list
  const deliverablesList = data.deliverables.length > 0
    ? data.deliverables.map(d => `<li style="color: #4b5563; font-size: 14px; margin-bottom: 6px;">${d}</li>`).join('')
    : '<li style="color: #9ca3af; font-size: 14px;">No deliverables specified</li>';

  // Format deadline
  const deadlineText = data.deadline
    ? new Date(data.deadline).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    : 'Not specified';

  // Personalized greeting with fallback
  const greeting = data.brandName && data.brandName.trim() !== ''
    ? `Hi ${data.brandName},`
    : 'Hi there,';

  // Use professional email template
  const html = getBrandConfirmationEmailTemplate({
    brandName: data.brandName,
    creatorName: data.creatorName,
    platforms: data.creatorPlatforms,
    collabType: data.collabType,
    budget: budgetText,
    deadline: data.deadline || undefined,
    deliverables: data.deliverables,
  });

  const subject = `Request sent: Working with ${data.creatorName} is one step away`;

  return sendEmail(
    brandEmail,
    subject,
    html
  );
}

/**
 * Barter acceptance email: full HTML (premium, clear, action-oriented)
 */
function getBarterAcceptedEmailHtml(
  data: CollabRequestAcceptedData,
  contractReadyLink: string
): string {
  const productValueText = data.barterValue != null && data.barterValue > 0
    ? `₹${Number(data.barterValue).toLocaleString('en-IN')}`
    : 'As agreed in contract';
  const deliverablesItems = (data.deliverables.length > 0 ? data.deliverables : ['As per agreement'])
    .map((d) => `<li style="color: #4b5563; font-size: 14px; margin-bottom: 6px;">${d}</li>`)
    .join('');
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const barterProtectionUrl = `${frontendUrl}/about`; // or a dedicated /barter-protection page

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
      <tr>
        <td style="background-color: #667eea; padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">Your collaboration is confirmed 🎉</h1>
          <p style="color: #ffffff; margin: 0; font-size: 15px; opacity: 0.95;">The creator has accepted your barter collaboration. One final step remains.</p>
        </td>
      </tr>
      ${getEmailProgressCue([
    { label: 'Request sent', status: 'completed' },
    { label: 'CONTRACT_READY', status: 'completed' },
    { label: 'AWAITING_BRAND_SIGNATURE', status: 'current' },
    { label: 'EXECUTED', status: 'upcoming' },
    { label: 'SHIPPING_IN_PROGRESS', status: 'upcoming' },
  ])}
      <tr>
        <td style="background: #f9fafb; padding: 28px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="color: #1f2937; font-size: 16px; margin-top: 0;">Hello ${data.brandName},</p>

      <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
        <h3 style="color: #065f46; margin: 0 0 6px 0; font-size: 16px; font-weight: 600;">✓ Contract Ready for Review</h3>
        <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.5;">The collaboration is accepted. Please review and sign the contract to make it legally binding and unlock delivery details.</p>
      </div>

      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 600;">Deal Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 38%; vertical-align: top;">Creator</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.creatorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Deal Type</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">Barter Collaboration</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Product Value</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${productValueText}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; margin: 12px 0 6px 0;">Deliverables</p>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
          ${deliverablesItems}
        </ul>
      </div>

      <div style="margin: 24px 0;">
        <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">What happens next:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
          <li>Review and sign the contract</li>
          <li>After signing, you'll receive the creator's delivery address</li>
          <li>Ship the product as agreed</li>
          <li>Creator delivers content as per timeline</li>
        </ol>
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0 10px 0;">
        <tr>
          <td align="center" style="border-radius: 10px; background-color: #10b981;">
            <a href="${contractReadyLink}" style="display: block; width: 100%; color: #ffffff; padding: 16px 24px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;" target="_blank" rel="noopener noreferrer">Review & Sign Contract &gt;</a>
          </td>
        </tr>
      </table>
      ${getCTATrustLine('Shipping details unlock only after signing to protect both parties.')}

      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 20px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb;">
        This collaboration is legally protected by Creator Armour. All actions are timestamped and recorded for transparency.
      </p>

      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated email from Creator Armour. Please do not reply to this email.</p>
        <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;"><a href="mailto:support@creatorarmour.com" style="color: #667eea; text-decoration: none;">Need help? Contact us</a> — we’re here before any issue becomes a dispute.</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
          <a href="${barterProtectionUrl}" style="color: #667eea; text-decoration: none;">Learn how barter protection works</a>
        </p>
      </div>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Plain-text fallback for barter acceptance (for clients that strip HTML)
 */
function getBarterAcceptedEmailPlainText(
  data: CollabRequestAcceptedData,
  contractReadyLink: string
): string {
  const productValueText = data.barterValue != null && data.barterValue > 0
    ? `₹${Number(data.barterValue).toLocaleString('en-IN')}`
    : 'As agreed in contract';
  const deliverablesList = (data.deliverables.length > 0 ? data.deliverables : ['As per agreement'])
    .map((d, i) => `${i + 1}. ${d}`)
    .join('\n');

  return `
Your collaboration is confirmed

The creator has accepted your barter collaboration. One final step remains.

Hello ${data.brandName},

CONTRACT READY FOR REVIEW
The collaboration is accepted. Please review and sign the contract to make it legally binding and unlock delivery details.

DEAL SUMMARY
Creator: ${data.creatorName}
Deal Type: Barter Collaboration
Product Value: ${productValueText}

Deliverables:
${deliverablesList}

WHAT HAPPENS NEXT
1. Review and sign the contract
2. After signing, you'll receive the creator's delivery address
3. Ship the product as agreed
4. Creator delivers content as per timeline

Review & Sign Contract: ${contractReadyLink}

This collaboration is legally protected by Creator Armour. All actions are timestamped and recorded for transparency.

Need help? Contact us: support@creatorarmour.com — we're here before any issue becomes a dispute.

---
This is an automated email from Creator Armour. Please do not reply to this email.
  `.trim();
}

/**
 * Paid acceptance email: same structure as barter (hero, callout, deal summary, what happens next, green CTA)
 */
function getPaidAcceptedEmailHtml(
  data: CollabRequestAcceptedData,
  contractReadyLink: string
): string {
  const dealAmountText = data.dealAmount != null && data.dealAmount > 0
    ? `₹${Number(data.dealAmount).toLocaleString('en-IN')}`
    : 'As agreed in contract';
  const deliverablesItems = (data.deliverables.length > 0 ? data.deliverables : ['As per agreement'])
    .map((d) => `<li style="color: #4b5563; font-size: 14px; margin-bottom: 6px;">${d}</li>`)
    .join('');
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const barterProtectionUrl = `${frontendUrl}/about`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
      <tr>
        <td style="background-color: #667eea; padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">Your collaboration is confirmed</h1>
          <p style="color: #ffffff; margin: 0; font-size: 15px; opacity: 0.95;">The creator has accepted your paid collaboration. One final step remains.</p>
        </td>
      </tr>
      ${getEmailProgressCue([
    { label: 'Request sent', status: 'completed' },
    { label: 'CONTRACT_READY', status: 'completed' },
    { label: 'AWAITING_BRAND_SIGNATURE', status: 'current' },
    { label: 'EXECUTED', status: 'upcoming' },
  ])}
      <tr>
        <td style="background: #f9fafb; padding: 28px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
      <p style="color: #1f2937; font-size: 16px; margin-top: 0;">Hello ${data.brandName},</p>

      <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
        <h3 style="color: #065f46; margin: 0 0 6px 0; font-size: 16px; font-weight: 600;">✓ Contract Ready for Review</h3>
        <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.5;">The collaboration is accepted. Please review and sign the contract to make it legally binding and unlock the work timeline.</p>
      </div>

      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 16px; font-size: 16px; font-weight: 600;">Deal Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 38%; vertical-align: top;">Creator</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.creatorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Deal Type</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">Paid Collaboration</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Deal Value</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${dealAmountText}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 13px; margin: 12px 0 6px 0;">Deliverables</p>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
          ${deliverablesItems}
        </ul>
      </div>

      <div style="margin: 24px 0;">
        <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">What happens next:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
          <li>Review and sign the contract</li>
          <li>After signing, you'll receive a copy of the agreement</li>
          <li>Creator delivers content as per timeline</li>
          <li>Payment tracked through Creator Armour.</li>
        </ol>
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 28px 0 10px 0;">
        <tr>
          <td align="center" style="border-radius: 10px; background-color: #10b981;">
            <a href="${contractReadyLink}" style="display: block; width: 100%; color: #ffffff; padding: 16px 24px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;" target="_blank" rel="noopener noreferrer">Review & Sign Contract &gt;</a>
          </td>
        </tr>
      </table>
      ${getCTATrustLine('Payment terms and delivery security unlock after signing.')}

      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 24px 0 20px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb;">
        This collaboration is legally protected by Creator Armour. All actions are timestamped and recorded for transparency.
      </p>

      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated email from Creator Armour. Please do not reply to this email.</p>
        <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;"><a href="mailto:support@creatorarmour.com" style="color: #667eea; text-decoration: none;">Need help? Contact us</a> — we’re here before any issue becomes a dispute.</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
          <a href="${barterProtectionUrl}" style="color: #667eea; text-decoration: none;">Learn how barter protection works</a>
        </p>
      </div>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * 2. Send email when request is accepted
 */
export async function sendCollabRequestAcceptedEmail(
  brandEmail: string,
  data: CollabRequestAcceptedData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const contractReadyLink = `${frontendUrl}/contract-ready/${data.contractReadyToken}`;

  if (data.dealType === 'barter') {
    const subject = `Action required: Sign contract to ship product to ${data.creatorName}`;
    const html = getBarterAcceptedEmailHtml(data, contractReadyLink);
    return sendEmail(brandEmail, subject, html);
  }

  // Paid deal: same layout as barter (hero, callout, deal summary, what happens next, green CTA)
  const subject = `Action required: Review & sign agreement with ${data.creatorName}`;
  const html = getPaidAcceptedEmailHtml(data, contractReadyLink);
  return sendEmail(brandEmail, subject, html);
}

/**
 * 3. Send email when counter offer is submitted
 */
export async function sendCollabRequestCounterEmail(
  brandEmail: string,
  data: CollabRequestCounterData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';

  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${data.creatorName}</strong> has sent you a counter offer for your collaboration request.
    </p>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>📝 Counter Offer Received</strong> - Review the updated terms below.
      </p>
    </div>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Counter Offer Details:</h3>
      ${data.counterPrice ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Original Price:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.originalBudget ? `₹${data.originalBudget.toLocaleString('en-IN')}` : 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Counter Price:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">₹${data.counterPrice.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      ` : ''}
      ${data.counterDeliverables ? `
        <div style="margin-top: 15px;">
          <strong style="color: #6b7280; font-size: 14px;">Updated Deliverables:</strong>
          <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">${data.counterDeliverables}</p>
        </div>
      ` : ''}
      ${data.counterNotes ? `
        <div style="margin-top: 15px;">
          <strong style="color: #6b7280; font-size: 14px;">Notes:</strong>
          <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">${data.counterNotes}</p>
        </div>
      ` : ''}
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      You can accept this counter offer, propose your own terms, or decline. All communication stays secure on CreatorArmour.
    </p>
  `;

  const html = getEmailTemplate(
    '💼 Counter Offer',
    `Hello ${data.brandName},`,
    content
    // No CTA for counter - brands can respond via CreatorArmour dashboard if they have access
    // In future, could add a public response page
  );

  return sendEmail(
    brandEmail,
    `${data.creatorName} sent a counter offer`,
    html
  );
}

/**
 * 4. Send email when request is declined
 */
export async function sendCollabRequestDeclinedEmail(
  brandEmail: string,
  data: CollabRequestDeclinedData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const collabLink = `${frontendUrl}/collab/${data.creatorUsername}`;

  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${data.creatorName}</strong> has declined your collaboration request.
    </p>
    
    <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #991b1b; font-size: 14px; margin: 0;">
        <strong>Request Declined</strong> - This creator is not available for this collaboration at this time.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Don't worry! This is common in the creator industry. Creators may decline requests due to:
    </p>
    <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
      <li>Current workload or availability</li>
      <li>Brand fit or alignment</li>
      <li>Budget or timeline constraints</li>
    </ul>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      <strong>What's Next?</strong> You can submit a new collaboration request with adjusted terms, or explore other creators on CreatorArmour.
    </p>
  `;

  const html = getEmailTemplate(
    '📋 Request Update',
    `Hello ${data.brandName},`,
    content,
    'Submit New Request',
    collabLink
  );

  return sendEmail(
    brandEmail,
    `${data.creatorName} declined your collaboration request`,
    html
  );
}

/**
 * 5. Send email to creator when new collab request is submitted
 */
export async function sendCollabRequestCreatorNotificationEmail(
  creatorEmail: string,
  data: CollabRequestCreatorNotificationData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const dashboardLink = `${frontendUrl}/creator-dashboard`;

  // Format collaboration type
  const collabTypeText = data.collabType === 'paid'
    ? 'Paid'
    : data.collabType === 'barter'
      ? 'Barter'
      : 'Hybrid (Paid + Barter)';

  // Format budget/barter value for subject line and content
  let budgetText = 'Not specified';
  let budgetForSubject = '';
  if (data.collabType === 'paid' || data.collabType === 'both') {
    if (data.exactBudget) {
      budgetText = `₹${data.exactBudget.toLocaleString('en-IN')}`;
      budgetForSubject = `₹${data.exactBudget.toLocaleString('en-IN')}`;
    } else if (data.budgetRange) {
      const ranges: { [key: string]: string } = {
        'under-5000': 'Under ₹5,000',
        '5000-10000': '₹5,000 – ₹10,000',
        '10000-25000': '₹10,000 – ₹25,000',
        '25000+': '₹25,000+',
      };
      budgetText = ranges[data.budgetRange] || data.budgetRange;
      budgetForSubject = ranges[data.budgetRange] || data.budgetRange;
    }
  } else if (data.collabType === 'barter' || data.collabType === 'both') {
    if (data.barterDescription) {
      budgetText = data.barterValue
        ? `Barter (Value: ₹${data.barterValue.toLocaleString('en-IN')})`
        : 'Barter';
      budgetForSubject = data.barterValue
        ? `₹${data.barterValue.toLocaleString('en-IN')}`
        : 'Barter';
    }
  }

  // Format timeline from deadline if available
  let timelineText: string | undefined = undefined;
  if (data.deadline) {
    try {
      const deadlineDate = new Date(data.deadline);
      if (!isNaN(deadlineDate.getTime())) {
        timelineText = deadlineDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (e) {
      // If date parsing fails, use timeline if provided
      timelineText = data.timeline || undefined;
    }
  } else {
    timelineText = data.timeline || undefined;
  }

  // Calculate total follower count (sum of all platforms)
  let totalFollowers = 0;
  if (data.followerCount) {
    totalFollowers = data.followerCount;
  }

  // Use professional email template (acceptUrl = Accept Deal CTA from email)
  const html = getCreatorNotificationEmailTemplate({
    creatorName: data.creatorName,
    creatorCategory: data.creatorCategory,
    followerCount: totalFollowers > 0 ? totalFollowers : undefined,
    avatarUrl: data.avatarUrl,
    brandName: data.brandName,
    brandWebsite: data.brandWebsite,
    campaignGoal: data.campaignGoal,
    deliverables: data.deliverables,
    budget: budgetText,
    timeline: timelineText,
    notes: data.notes,
    viewRequestUrl: dashboardLink,
    acceptUrl: data.acceptUrl,
    barterProductImageUrl: data.barterProductImageUrl ?? undefined,
    signal: {
      type: 'action',
      message: 'Review the brand\'s proposal and lock in your decision.'
    }
  });

  // Subject line with budget
  const subject = budgetForSubject && budgetForSubject !== 'Not specified'
    ? `New collaboration request from ${data.brandName} (${budgetForSubject})`
    : `New collaboration request from ${data.brandName}`;

  return sendEmail(
    creatorEmail,
    subject,
    html
  );
}

/**
 * 6. Send gentle reminder to creator if they haven't responded to a request
 * Trigger: 24-36 hrs after submission
 */
export async function sendCollabRequestReminderEmail(
  creatorEmail: string,
  data: CollabRequestCreatorNotificationData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const dashboardLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts`;

  const budgetText = (data.exactBudget)
    ? `₹${data.exactBudget.toLocaleString('en-IN')}`
    : (data.budgetRange || 'Not specified');

  const html = getCreatorNotificationEmailTemplate({
    creatorName: data.creatorName,
    creatorCategory: data.creatorCategory,
    followerCount: data.followerCount,
    avatarUrl: data.avatarUrl,
    brandName: data.brandName,
    brandWebsite: data.brandWebsite,
    campaignGoal: data.campaignGoal,
    deliverables: data.deliverables,
    budget: budgetText,
    timeline: data.timeline,
    notes: data.notes,
    viewRequestUrl: dashboardLink,
    acceptUrl: data.acceptUrl,
    barterProductImageUrl: data.barterProductImageUrl ?? undefined,
    signal: {
      type: 'action',
      message: 'Responding keeps your account in good standing with brands. Review the request below.'
    }
  });

  const subject = `Reminder: Collaboration request from ${data.brandName}`;

  return sendEmail(
    creatorEmail,
    subject,
    html
  );
}

/**
 * 6. Send magic link for accept-from-email verification (soft auth)
 */
export async function sendCollabAcceptMagicLinkEmail(
  creatorEmail: string,
  magicLinkUrl: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Verify your identity to accept this collaboration';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">You requested to confirm and generate the contract for this collaboration.</p>
  <p style="margin: 0 0 24px;">This action is legally binding. Click the button below to verify your identity and complete the acceptance.</p>
  <p style="margin: 0 0 24px;">
    <a href="${magicLinkUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify &amp; accept</a>
  </p>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">If you didn't request this, you can ignore this email.</p>
  <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;"><a href="mailto:support@creatorarmour.com" style="color: #667eea; text-decoration: none;">Need help? Contact us</a> — we're here before any issue becomes a dispute.</p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">Creator Armour – Contracts and payments protected.</p>
</body>
</html>`;
  return sendEmail(creatorEmail, subject, html);
}

/**
 * 7. Send confirmation to creator after they accept a request
 * Subject: You accepted the collaboration — contract is being prepared
 */
export async function sendCreatorAcceptanceProcessingEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const dashboardLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`;

  const mainContent = `
    <tr>
      <td style="background-color: #667eea; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Acceptance Confirmed 🎉</h1>
      </td>
    </tr>
    ${getEmailSignal({
    type: 'next',
    message: 'No action needed right now. We’ll notify you once the brand signs.'
  })}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
          Hi ${getFirstName(creatorName)},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          You have successfully accepted the collaboration request from <strong>${brandName}</strong>. 
          We are currently preparing the digital contract for the brand to review and sign.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          Once the brand has signed, you will receive another notification to add your final digital signature and lock in the agreement.
        </p>
        ${getPrimaryCTA('View Deal Progress', dashboardLink)}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });
  const subject = `You accepted the collaboration — contract is being prepared`;

  return sendEmail(creatorEmail, subject, html);
}
/**
 * 7. Send "Continue your collaboration request" email (Save and continue later)
 */
export async function sendCollabDraftResumeEmail(
  brandEmail: string,
  creatorName: string,
  resumeUrl: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = `Continue your collaboration request with ${creatorName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1f2937; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">You started a collaboration request with <strong>${creatorName}</strong> on Creator Armour.</p>
  <p style="margin: 0 0 24px;">Click the button below to continue where you left off. This link expires in 7 days.</p>
  <p style="margin: 0 0 24px;">
    <a href="${resumeUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #8B5CF6, #6366F1); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Continue request</a>
  </p>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">If you didn't request this, you can ignore this email.</p>
  <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;"><a href="mailto:support@creatorarmour.com" style="color: #667eea; text-decoration: none;">Need help? Contact us</a> — we're here before any issue becomes a dispute.</p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">Creator Armour – Contracts and payments protected.</p>
</body>
</html>`;
  return sendEmail(brandEmail, subject, html);
}

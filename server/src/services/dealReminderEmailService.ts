// @ts-nocheck
// Gentle reminder emails for "Brand hasn't signed yet" and "Deal pending for 7 days"
// Nudge both sides to improve completion rates and reduce chargebacks/disputes

import { getCTATrustLine, getEmailLayout, getEmailProgressCue, getEmailSignal, getPrimaryCTA } from './professionalEmailTemplates.js';

const SUPPORT_EMAIL = 'support@creatorarmour.com';

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      return { success: false, error: 'Resend API key is not configured' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return { success: false, error: 'Invalid email address format' };
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to,
        subject,
        html,
      }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { success: false, error: errText || `Resend error: ${response.status}` };
    }
    const data = (await response.json()) as { id?: string; error?: { message: string } };
    if (data.id) return { success: true, emailId: data.id };
    return { success: false, error: data.error?.message || 'Failed to send email' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to send email' };
  }
}

/**
 * Send gentle reminder to brand: "You haven't signed yet — the creator is waiting."
 */
export async function sendBrandSigningReminderEmail(
  brandEmail: string,
  data: { creatorName: string; brandName: string; contractReadyUrl: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Quick reminder: Please sign the collaboration contract';
  const content = `
    <tr>
      <td style="background-color: #5b21b6; padding: 44px 30px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #ffffff !important;">
          Signature reminder
        </h1>
        <p style="margin: 0; font-size: 13px; color: #ffffff !important; opacity: 0.95;">
          Final step to activate your collaboration
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 6px 32px;">
        <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 600; color: #111827;">Hi ${data.brandName || 'there'},</p>
        <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
          ${data.creatorName} is waiting for your signature. Signing keeps both sides protected and starts the collaboration.
        </p>
      </td>
    </tr>
    ${getEmailSignal({
      type: 'action',
      message: 'Review the agreement and sign to confirm deliverables, payment terms, and deadlines.'
    })}
    ${getEmailProgressCue([
      { label: 'Agreement Ready', status: 'current' },
      { label: 'Signed', status: 'upcoming' },
      { label: 'Work Begins', status: 'upcoming' }
    ])}
    ${getPrimaryCTA('Review & Sign Contract', data.contractReadyUrl)}
    ${getCTATrustLine('Signing typically takes under 2 minutes and is fully recorded.')}
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
          Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #4f46e5; text-decoration: none;">${SUPPORT_EMAIL}</a> and we’ll assist before any dispute arises.
        </p>
      </td>
    </tr>
  `;
  const html = getEmailLayout({ content, showFooter: true, backgroundStyle: 'purple' });
  return sendEmail(brandEmail, subject, html);
}

/**
 * Send gentle reminder to brand: "Deal pending for 7 days — here’s the next step."
 */
export async function sendDealPendingReminderToBrand(
  brandEmail: string,
  data: { creatorName: string; brandName: string; contractReadyUrl?: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Your collaboration with ' + (data.creatorName || 'creator') + ' is still pending';
  const ctaBlock = data.contractReadyUrl
    ? getPrimaryCTA('Review & Sign Contract', data.contractReadyUrl)
    : `
      <tr>
        <td style="padding: 12px 32px 24px 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
            <tr>
              <td style="font-size: 13px; color: #4b5563; line-height: 1.6;">
                Check your inbox for the contract link from the creator, or ask them to resend it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  const content = `
    <tr>
      <td style="background-color: #4338ca; padding: 44px 30px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #ffffff !important;">
          Deal still pending
        </h1>
        <p style="margin: 0; font-size: 13px; color: #ffffff !important; opacity: 0.95;">
          A quick step keeps the collaboration moving
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 6px 32px;">
        <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 600; color: #111827;">Hi ${data.brandName || 'there'},</p>
        <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
          Your collaboration with ${data.creatorName} has been pending for about a week. Completing the contract protects both sides and keeps timelines on track.
        </p>
      </td>
    </tr>
    ${getEmailSignal({
      type: 'next',
      message: 'Sign the agreement to activate the deal and confirm the deliverables.'
    })}
    ${getEmailProgressCue([
      { label: 'Agreement Ready', status: 'current' },
      { label: 'Signed', status: 'upcoming' },
      { label: 'Work Begins', status: 'upcoming' }
    ])}
    ${ctaBlock}
    ${data.contractReadyUrl ? getCTATrustLine('Signing typically takes under 2 minutes and is fully recorded.') : ''}
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
          Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #4f46e5; text-decoration: none;">${SUPPORT_EMAIL}</a> and we’ll help before any issue becomes a dispute.
        </p>
      </td>
    </tr>
  `;
  const html = getEmailLayout({ content, showFooter: true, backgroundStyle: 'purple' });
  return sendEmail(brandEmail, subject, html);
}

/**
 * Send gentle reminder to creator: "Deal pending for 7 days — nudge the brand or check in."
 */
export async function sendDealPendingReminderToCreator(
  creatorEmail: string,
  data: { creatorName: string; brandName: string; dashboardUrl: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Deal with ' + (data.brandName || 'brand') + ' is still pending';
  const content = `
    <tr>
      <td style="background-color: #4c1d95; padding: 44px 30px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #ffffff !important;">
          Deal pending reminder
        </h1>
        <p style="margin: 0; font-size: 13px; color: #ffffff !important; opacity: 0.95;">
          Keep momentum and close the agreement
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 6px 32px;">
        <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 600; color: #111827;">Hi ${data.creatorName || 'there'},</p>
        <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
          Your deal with ${data.brandName} has been pending for about a week. A gentle follow-up or resend often helps move things forward.
        </p>
      </td>
    </tr>
    ${getEmailSignal({
      type: 'next',
      message: 'Consider sending the contract link again or checking in with the brand.'
    })}
    ${getEmailProgressCue([
      { label: 'Agreement Ready', status: 'current' },
      { label: 'Signed', status: 'upcoming' },
      { label: 'Work Begins', status: 'upcoming' }
    ])}
    ${getPrimaryCTA('Open Deal in Dashboard', data.dashboardUrl)}
    ${getCTATrustLine('Faster replies increase acceptance and reduce payment delays.')}
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
          Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #4f46e5; text-decoration: none;">${SUPPORT_EMAIL}</a> and we’ll help before any issue becomes a dispute.
        </p>
      </td>
    </tr>
  `;
  const html = getEmailLayout({ content, showFooter: true, backgroundStyle: 'purple' });
  return sendEmail(creatorEmail, subject, html);
}

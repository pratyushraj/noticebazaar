import { Resend } from 'resend';
import { getEmailLayout } from './professionalEmailTemplates.js';

const ADMIN_EMAIL = 'pratyushraj@outlook.com';

export const sendAdminAlert = async (type: 'onboarding' | 'offer', data: any) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('[AdminNotification] Missing RESEND_API_KEY');
    return;
  }

  const resendClient = new Resend(process.env.RESEND_API_KEY);

  let subject = '';
  let content = '';

  if (type === 'onboarding') {
    subject = `New Creator Onboarded: ${data.name}`;
    content = `
      <tr>
        <td style="padding: 32px;">
          <h2 style="color: #111827; margin-bottom: 16px;">New Creator Onboarded! 🚀</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            A new creator has completed their onboarding.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Handle:</strong> @${data.handle}</p>
            <p><strong>Category:</strong> ${data.category || 'N/A'}</p>
            <p><strong>Followers:</strong> ${data.followers || 'N/A'}</p>
          </div>
          <a href="https://creatorarmour.com/discover?search=${data.handle}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Profile</a>
        </td>
      </tr>
    `;
  } else if (type === 'offer') {
    subject = `New Brand Offer Sent to ${data.creatorName}`;
    content = `
      <tr>
        <td style="padding: 32px;">
          <h2 style="color: #111827; margin-bottom: 16px;">New Brand Offer! 💼</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            A brand has sent a new collaboration offer.
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Brand:</strong> ${data.brandName}</p>
            <p><strong>Target Creator:</strong> ${data.creatorName} (@${data.creatorHandle})</p>
            <p><strong>Collab Type:</strong> ${data.collabType}</p>
            <p><strong>Budget/Value:</strong> ${data.value}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Campaign: ${data.description}</p>
        </td>
      </tr>
    `;
  }

  const html = getEmailLayout({ content, showFooter: true, backgroundStyle: 'modern' });

  try {
    await resendClient.emails.send({
      from: 'Creator Armour Alerts <alerts@creatorarmour.com>',
      to: ADMIN_EMAIL,
      subject: subject,
      html: html,
    });
    console.log(`[AdminNotification] Alert sent to ${ADMIN_EMAIL} for ${type}`);
  } catch (error) {
    console.error('[AdminNotification] Failed to send alert:', error);
  }
};

/**
 * Send a test email to verify setup
 */
export const sendTestAdminEmail = async () => {
  return sendAdminAlert('onboarding', {
    name: 'Test Creator',
    handle: 'test.creator',
    category: 'Lifestyle',
    followers: '10k'
  });
};

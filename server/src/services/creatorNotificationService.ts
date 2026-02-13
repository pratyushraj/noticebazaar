// @ts-nocheck
// Creator Notification Service
// Handles reminders, deliverable updates, and completion notifications for creators

import {
  getEmailLayout,
  getFirstName,
  getEmailSignal,
  getPrimaryCTA,
} from './professionalEmailTemplates.js';

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
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
      console.error('[CreatorNotificationEmail] API key not configured');
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data: ResendEmailResponse = await response.json();

    if (!response.ok || data.error) {
      console.error('[CreatorNotificationEmail] Failed to send email:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      emailId: data.id,
    };
  } catch (error: any) {
    console.error('[CreatorNotificationEmail] Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * 8. Deliverable Due Reminder
 * Trigger: 48h before due date
 */
export async function sendCreatorDeliverableDueReminderEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string,
  dueDate: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dashboardLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`;

  const mainContent = `
    <tr>
      <td style="background-color: #667eea; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📅 Upcoming Deadline</h1>
      </td>
    </tr>
    ${getEmailSignal({
    type: 'action',
    message: `Your deliverable for ${brandName} is due on ${formattedDate}.`
  })}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
          Hi ${getFirstName(creatorName)},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          This is a neutral reminder regarding your upcoming deliverable for <strong>${brandName}</strong>. 
          To ensure a smooth collaboration and protect your standing on the platform, please submit your content by the deadline.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          Timeline management is recorded as part of our professional partnership standards.
        </p>
        ${getPrimaryCTA('View & Submit Deliverable', dashboardLink)}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });
  const subject = `Reminder: Deliverable due on ${formattedDate}`;

  return sendEmail(creatorEmail, subject, html);
}

/**
 * 9. Deliverable Marked Complete
 * Trigger: Creator submits content
 */
export async function sendCreatorDeliverableSubmittedEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const dashboardLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`;

  const mainContent = `
    <tr>
      <td style="background-color: #10b981; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Submission Received</h1>
      </td>
    </tr>
    ${getEmailSignal({
    type: 'next',
    message: 'Deliverable submitted — awaiting brand confirmation.'
  })}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
          Hi ${getFirstName(creatorName)},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          You have successfully submitted your deliverable for <strong>${brandName}</strong>. 
          We have notified the brand to review your submission.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #718096; font-style: italic;">
          No further action is required from you at this stage.
        </p>
        ${getPrimaryCTA('View Submission Status', dashboardLink)}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });
  const subject = `Deliverable submitted — awaiting brand confirmation`;

  return sendEmail(creatorEmail, subject, html);
}

/**
 * 10. Brand Viewed Content
 * Trigger: Brand opens submission
 */
export async function sendCreatorContentReviewedEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const dashboardLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`;

  const mainContent = `
    <tr>
      <td style="background-color: #f0f9ff; padding: 40px 30px; text-align: center;">
        <h1 style="color: #0369a1; margin: 0; font-size: 24px;">👀 Submission Reviewed</h1>
      </td>
    </tr>
    ${getEmailSignal({
    type: 'happened',
    message: 'Brand has reviewed your submission.'
  })}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
          Hi ${getFirstName(creatorName)},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          <strong>${brandName}</strong> has just reviewed your content submission.
        </p>
        <p style="margin: 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          We will notify you if they request any revisions or when they mark the deliverable as complete.
        </p>
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #718096; font-style: italic; line-height: 1.6;">
          No further action is required from you at this stage.
        </p>
        ${getPrimaryCTA('Check Latest Status', dashboardLink)}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });
  const subject = `Brand has reviewed your submission`;

  return sendEmail(creatorEmail, subject, html);
}

/**
 * 11. Collaboration Successfully Completed
 * Trigger: All deliverables accepted
 */
export async function sendCreatorCollabCompletedEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const mainContent = `
    <tr>
      <td style="background-color: #7c3aed; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Collaboration Completed!</h1>
      </td>
    </tr>
    ${getEmailSignal({
    type: 'happened',
    message: 'Collaboration completed successfully — you’ve finished all deliverables.'
  })}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
          Hi ${getFirstName(creatorName)},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          Congratulations! Your collaboration with <strong>${brandName}</strong> is now officially complete. 
          Thank you for being a professional partner on Creator Armour.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #718096; font-style: italic;">
          No further action is required from you at this stage.
        </p>
        ${getPrimaryCTA('View Completed Deal', `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`)}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });
  const subject = `Collaboration completed successfully 🎉`;

  return sendEmail(creatorEmail, subject, html);
}

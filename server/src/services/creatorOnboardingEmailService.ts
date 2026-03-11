// @ts-nocheck
// Creator Onboarding Email Service
// Sends a sequence of onboarding emails to maximize creator activation

import { getEmailLayout, getPrimaryCTA, getEmailSignal } from './professionalEmailTemplates.js';

interface CreatorOnboardingData {
    creatorName: string;
    username: string;
    creatorEmail: string;
    profileCompletion?: number;
}

/**
 * EMAIL 1: Welcome + First Action (Immediate)
 * Goal: Get the creator to complete setup immediately.
 */
export async function sendWelcomeActivationEmail(data: CreatorOnboardingData) {
    const setupUrl = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/onboarding`;

    const emailContent = `
    <tr>
      <td style="background-color: #5b21b6; padding: 48px 30px; text-align: center;">
        <div style="width: 70px; height: 70px; margin: 0 auto 16px auto; border-radius: 18px; background-color: rgba(255, 255, 255, 0.16); display: inline-block; line-height: 70px;">
          <span style="font-size: 30px; color: #ffffff;">🛡️</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff !important; line-height: 1.3;">
          Welcome to Creator Armour
        </h1>
        <p style="margin: 0; font-size: 14px; color: #ffffff !important; opacity: 0.95;">
          Your collaboration workspace is ready.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 10px 32px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Hello ${data.creatorName || 'there'},</p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
          Creator Armour helps you receive brand offers, protect deals with contracts, and manage collaborations in one place. Setting up your link only takes 2 minutes.
        </p>
      </td>
    </tr>
    ${getPrimaryCTA('Setup Your Collab Link', setupUrl)}
    <tr>
      <td style="padding: 24px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 32px; vertical-align: top;"><span style="font-size: 20px;">📩</span></td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #1e293b;">Receive brand offers</p>
                    <p style="margin: 0; font-size: 13px; color: #64748b;">Brands can send collaboration proposals directly to your link.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 0; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 32px; vertical-align: top;"><span style="font-size: 20px;">📑</span></td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #1e293b;">Contracts auto-generated</p>
                    <p style="margin: 0; font-size: 13px; color: #64748b;">Every accepted deal creates a secure contract instantly.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 32px; vertical-align: top;"><span style="font-size: 20px;">📊</span></td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #1e293b;">Track your deals</p>
                    <p style="margin: 0; font-size: 13px; color: #64748b;">Manage campaigns, payments, and timelines in one dashboard.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 32px 32px 32px; text-align: center;">
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px dashed #e2e8f0;">
          <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Your Private Collab Link</p>
          <p style="margin: 0; font-size: 15px; font-weight: 700; color: #4f46e5;">creatorarmour.com/${data.username || 'username'}</p>
        </div>
        <p style="margin: 16px 0 0 0; font-size: 13px; color: #64748b; font-style: italic;">
          "Brands can send offers directly to you — no DMs required."
        </p>
      </td>
    </tr>
  `;

    return sendResendEmail({
        to: data.creatorEmail,
        subject: 'Welcome to Creator Armour 🛡️',
        html: getEmailLayout({ content: emailContent, backgroundStyle: 'purple' })
    });
}

/**
 * EMAIL 2: Profile Completion (Day 1)
 * Goal: Push creators to complete profile.
 */
export async function sendProfileCompletionReminderEmail(data: CreatorOnboardingData) {
    const profileUrl = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/settings`;
    const completion = data.profileCompletion || 60;

    const emailContent = `
    <tr>
      <td style="padding: 40px 32px 10px 32px; text-align: center;">
        <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #111827;">Finish setting up your Creator Profile</h1>
        <div style="width: 100%; background-color: #f1f5f9; height: 8px; border-radius: 4px; margin: 20px 0;">
          <div style="width: ${completion}%; background-color: #4f46e5; height: 8px; border-radius: 4px;"></div>
        </div>
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">
          You're ${completion}% ready to receive brand offers
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e1e7ef;">
          <tr>
            <td style="padding-bottom: 12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 24px;"><span style="color: #22c55e; font-weight: bold;">✓</span></td>
                  <td style="padding-left: 10px; font-size: 14px; color: #475569;">Create account</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 24px;"><span style="color: #22c55e; font-weight: bold;">✓</span></td>
                  <td style="padding-left: 10px; font-size: 14px; color: #475569;">Connect Instagram</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 24px; color: #cbd5e1;">⬜</td>
                  <td style="padding-left: 10px; font-size: 14px; color: #1e293b; font-weight: 600;">Add pricing ranges</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 24px; color: #cbd5e1;">⬜</td>
                  <td style="padding-left: 10px; font-size: 14px; color: #1e293b; font-weight: 600;">Set collaboration preferences</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 24px; color: #cbd5e1;">⬜</td>
                  <td style="padding-left: 10px; font-size: 14px; color: #1e293b; font-weight: 600;">Upload brand collaborations</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${getPrimaryCTA('Complete Profile', profileUrl)}
    <tr>
      <td style="padding: 20px 32px 40px 32px; text-align: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px;">
          <tr>
            <td style="text-align: left;">
              <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
                <strong>💡 Tip:</strong> Creators with full profiles receive <strong>3× more brand offers</strong>. Brands look for pricing and category fit before sending requests.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; font-style: italic;">
          "Brands can send offers directly — no DMs required."
        </p>
      </td>
    </tr>
  `;

    return sendResendEmail({
        to: data.creatorEmail,
        subject: 'Complete your Creator Profile',
        html: getEmailLayout({ content: emailContent, backgroundStyle: 'purple' })
    });
}

/**
 * EMAIL 3: Collab Link Ready (Day 3)
 * Goal: Encourage creators to share their link.
 */
export async function sendCollabLinkLiveEmail(data: CreatorOnboardingData) {
    const linkUrl = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/${data.username}?openApp=1&source=email`;

    const emailContent = `
    <tr>
      <td style="background-color: #0f172a; padding: 48px 30px; text-align: center;">
        <div style="width: 70px; height: 70px; margin: 0 auto 16px auto; border-radius: 18px; background-color: rgba(255, 255, 255, 0.1); display: inline-block; line-height: 70px;">
          <span style="font-size: 30px; color: #ffffff;">🚀</span>
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff !important; line-height: 1.3;">
          Your Collab Link is Live
        </h1>
        <p style="margin: 0; font-size: 14px; color: #94a3b8 !important;">
          Ready to receive protected brand offers.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 20px 32px;">
        <div style="background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="background-color: #f8fafc; padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #4f46e5;">creatorarmour.com/${data.username}</p>
          </div>
          <div style="padding: 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding-bottom: 10px; font-size: 14px; color: #475569;"><span style="color: #4f46e5; margin-right: 8px;">✓</span> Receive brand offers</td></tr>
              <tr><td style="padding-bottom: 10px; font-size: 14px; color: #475569;"><span style="color: #4f46e5; margin-right: 8px;">✓</span> Secure collaboration contracts</td></tr>
              <tr><td style="font-size: 14px; color: #475569;"><span style="color: #4f46e5; margin-right: 8px;">✓</span> Manage deals in one place</td></tr>
            </table>
          </div>
        </div>
      </td>
    </tr>
    ${getPrimaryCTA('View Your Collab Page', linkUrl)}
    <tr>
      <td style="padding: 10px 32px 40px 32px; text-align: center;">
        <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #1e293b;">Share your link with brands</p>
        <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; padding: 10px 16px; background: #f1f5f9; border-radius: 10px; margin: 0 4px;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Instagram Bio</p>
          </div>
          <div style="display: inline-block; padding: 10px 16px; background: #f1f5f9; border-radius: 10px; margin: 0 4px;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Email Signature</p>
          </div>
          <div style="display: inline-block; padding: 10px 16px; background: #f1f5f9; border-radius: 10px; margin: 0 4px;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">LinkedIn</p>
          </div>
        </div>
        <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic;">
          "Brands can send offers directly to you — no DMs required."
        </p>
      </td>
    </tr>
  `;

    return sendResendEmail({
        to: data.creatorEmail,
        subject: 'Your Collab Link is Live 🚀',
        html: getEmailLayout({ content: emailContent, backgroundStyle: 'purple' })
    });
}

/**
 * Generic Resend Email Helper
 */
async function sendResendEmail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('[OnboardingEmailService] RESEND_API_KEY missing');
        return { success: false, error: 'API key missing' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'CreatorArmour <noreply@creatorarmour.com>',
                to,
                subject,
                html,
            }),
        });

        const data = await res.json();
        return { success: res.ok, emailId: data.id, error: data.error };
    } catch (err) {
        console.error('[OnboardingEmailService] Error sending email:', err);
        return { success: false, error: err.message };
    }
}

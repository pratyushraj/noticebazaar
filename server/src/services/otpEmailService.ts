// OTP Email Service
// Sends OTP verification emails for contract signing

import { Resend } from 'resend';
import { getEmailLayout, getEmailSignal } from './professionalEmailTemplates.js';

// const resend = new Resend(process.env.RESEND_API_KEY); // Moved to function scope

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        console.error('[OTP Email] Missing RESEND_API_KEY');
        throw new Error('Email service not configured');
    }
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    const content = `
      <tr>
        <td style="background-color: #4c1d95; padding: 48px 30px; text-align: center;">
          <div style="width: 70px; height: 70px; margin: 0 auto 16px auto; border-radius: 16px; background-color: rgba(255, 255, 255, 0.16); display: inline-block; line-height: 70px;">
            <span style="font-size: 28px; color: #ffffff;">🔐</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff !important;">
            Your verification code
          </h1>
          <p style="margin: 0; font-size: 13px; color: #ffffff !important; opacity: 0.95;">
            Use this code to sign the agreement
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 32px 6px 32px;">
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
            Enter the code below to verify your identity and proceed with signing.
          </p>
        </td>
      </tr>
      ${getEmailSignal({
        type: 'action',
        message: 'This code expires in 10 minutes. Do not share it with anyone.'
      })}
      <tr>
        <td style="padding: 18px 32px 12px 32px; text-align: center;">
          <div style="display: inline-block; background: #f4f2ff; border: 2px solid #c7d2fe; border-radius: 16px; padding: 18px 32px;">
            <span style="font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 28px 32px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 12px;">
            <tr>
              <td style="font-size: 12px; color: #9f1239; text-align: center; font-weight: 600;">
                CreatorArmour will never ask for your verification code.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;

    const html = getEmailLayout({ content, showFooter: true, backgroundStyle: 'purple' });

    await resendClient.emails.send({
        from: 'CreatorArmour <contracts@creatorarmour.com>',
        to: email,
        subject: `${otp} is your CreatorArmour verification code`,
        html: html,
    });
}

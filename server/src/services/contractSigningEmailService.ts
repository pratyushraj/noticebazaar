// @ts-nocheck
// Sends email notifications to both brand and creator when contract is signed
import {
  getEmailLayout,
  getEmailHeader,
  getSuccessHeader,
  getPrimaryCTA,
  getCTATrustLine,
  getEmailSignal,
  getFirstName,
} from './professionalEmailTemplates.js';

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface ContractSigningData {
  dealId: string;
  brandName: string;
  creatorName: string;
  brandEmail: string;
  creatorEmail: string;
  dealAmount?: number;
  dealType: 'paid' | 'barter';
  deliverables: string[];
  deadline?: string;
  contractUrl?: string;
}

/**
 * Send email notification to brand after successful signing
 */
export async function sendBrandSigningConfirmationEmail(
  brandEmail: string,
  brandName: string,
  dealData: ContractSigningData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[ContractSigningEmail] API key not configured');
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

    const dealTypeDisplay = dealData.dealType === 'paid' && dealData.dealAmount
      ? `₹${parseFloat(dealData.dealAmount.toString()).toLocaleString('en-IN')}`
      : 'Barter';

    const deliverablesList = dealData.deliverables
      .map((d, idx) => `${idx + 1}. ${d}`)
      .join('<br>');

    const deadlineText = dealData.deadline
      ? new Date(dealData.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Not specified';

    // Construct signed agreement URL
    const signedAgreementUrl = dealData.contractUrl
      ? dealData.contractUrl
      : `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealData.dealId}`;

    const emailSubject = `Agreement Signed Successfully — Creator Armour`;

    // Format deliverables as bullet list
    const deliverablesBullets = dealData.deliverables
      .map((d) => `• ${d}`)
      .join('<br>');

    // Use contractUrl for PDF download, fallback to frontend URL if not available
    const pdfDownloadUrl = dealData.contractUrl || signedAgreementUrl;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agreement Signed Successfully</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            a { text-decoration: none; }
            body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            .button-hover:hover { opacity: 0.9; }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0;">
          
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 20px 0;">
            <tr>
              <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #064e3b; padding: 40px 30px; text-align: center; background-image: url('https://creatorarmour.com/assets/noise.png'); /* subtle texture if available */">
                      <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.1); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2);">
                        <span style="font-size: 32px; line-height: 1;">✅</span>
                      </div>
                      <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Agreement Signed</h1>
                      <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px;">Legally binding & securely recorded</p>
                    </td>
                  </tr>

                  <!-- Content Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      
                      <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151;">
                        <strong>Hi ${getFirstName(brandName)},</strong>
                      </p>
                      
                      <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                        You have successfully signed the collaboration agreement with <strong>${dealData.creatorName}</strong>. This document is now effectively executed and binding.
                      </p>

                      <!-- Trust Badge -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td width="24" valign="top" style="padding-right: 12px; font-size: 18px;">🛡️</td>
                                <td style="font-size: 14px; color: #065f46; font-weight: 500;">
                                  Executed electronically via OTP verification under the Information Technology Act, 2000.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Deal Summary Card -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 32px;">
                        <tr>
                          <td style="background-color: #f9fafb; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
                            <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600;">Agreement Details</h3>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 24px;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding-bottom: 16px; width: 40%; vertical-align: top;">
                                  <span style="font-size: 14px; color: #6b7280;">Value</span>
                                </td>
                                <td style="padding-bottom: 16px; width: 60%; vertical-align: top;">
                                  <span style="font-size: 16px; color: #111827; font-weight: 600;">${dealTypeDisplay}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding-bottom: 16px; width: 40%; vertical-align: top;">
                                  <span style="font-size: 14px; color: #6b7280;">Deliverables</span>
                                </td>
                                <td style="padding-bottom: 16px; width: 60%; vertical-align: top;">
                                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">${deliverablesList}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="width: 40%; vertical-align: top;">
                                  <span style="font-size: 14px; color: #6b7280;">Deadline</span>
                                </td>
                                <td style="width: 60%; vertical-align: top;">
                                  <span style="font-size: 14px; color: #374151;">${deadlineText}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Primary Action Button -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                        <tr>
                          <td align="center">
                            <!-- Button with MSO support -->
                            <div>
                               <!--[if mso]>
                                 <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${pdfDownloadUrl}" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="10%" stroke="f" fillcolor="#10b981">
                                   <w:anchorlock/>
                                   <center>
                                 <![endif]-->
                                     <a href="${pdfDownloadUrl}"
                                        style="background-color:#10b981; border-radius:8px; color:#ffffff; display:inline-block; font-family:sans-serif; font-size:16px; font-weight:bold; line-height:50px; text-align:center; text-decoration:none; width:280px; -webkit-text-size-adjust:none;">
                                        Download Agreement (PDF)
                                     </a>
                                 <!--[if mso]>
                                   </center>
                                 </v:roundrect>
                               <![endif]-->
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Info Sections Grid -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="padding-bottom: 24px;">
                             <div style="border-left: 3px solid #3b82f6; padding-left: 16px;">
                               <h4 style="margin: 0 0 4px 0; color: #1e40af; font-size: 14px;">Audit Confirmation</h4>
                               <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                                 ✓ OTP Verified<br>
                                 ✓ IP &amp; Device Trust Signal Recorded
                               </p>
                             </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                             <div style="border-left: 3px solid #f59e0b; padding-left: 16px;">
                               <h4 style="margin: 0 0 4px 0; color: #92400e; font-size: 14px;">Next Status: Awaiting Counter-Signature</h4>
                               <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                                 The creator has been notified. We will email you the final executed copy once they sign.
                               </p>
                             </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Support Footer -->
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 20px;">
                        <tr>
                          <td align="center" style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
                            <p style="margin: 0 0 10px 0;">Need help? <a href="mailto:support@creatorarmour.com" style="color: #10b981; text-decoration: none;">Contact Support</a></p>
                            <p style="margin: 0;">© ${new Date().getFullYear()} CreatorArmour. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>
                </table>
                
                <!-- Spacer -->
                <div style="height: 40px; line-height: 40px; font-size: 40px;">&nbsp;</div>
                
              </td>
            </tr>
          </table>
          
        </body>
      </html>
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to: [brandEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const data: ResendEmailResponse = await response.json();

    if (!response.ok || data.error) {
      console.error('[ContractSigningEmail] Failed to send brand confirmation:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Failed to send email',
      };
    }

    console.log('[ContractSigningEmail] Brand confirmation email sent:', data.id);
    return {
      success: true,
      emailId: data.id,
    };
  } catch (error: any) {
    console.error('[ContractSigningEmail] Error sending brand confirmation:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send email notification to creator when brand signs contract
 */
export async function sendCreatorSigningNotificationEmail(
  creatorEmail: string,
  creatorName: string,
  dealData: ContractSigningData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[ContractSigningEmail] API key not configured');
      return {
        success: false,
        error: 'Resend API key is not configured',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(creatorEmail)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';

    const dealAmount = dealData.dealType === 'paid' && dealData.dealAmount
      ? `₹${parseFloat(dealData.dealAmount.toString()).toLocaleString('en-IN')}`
      : 'Barter Deal';

    const deliverablesList = dealData.deliverables
      .map((d, idx) => `${idx + 1}. ${d}`)
      .join('<br>');

    const deadlineText = dealData.deadline
      ? new Date(dealData.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Not specified';

    // Use magic link if token is available, otherwise fallback to dashboard link
    const dealLink = dealData.creatorSigningToken
      ? `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-sign/${dealData.creatorSigningToken}`
      : `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealData.dealId}`;

    const emailSubject = `Action required: Sign contract to lock this collaboration`;
    const mainContent = `
      <tr>
        <td style="background-color: #667eea; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Brand Has Signed!</h1>
        </td>
      </tr>
      ${getEmailSignal({
      type: 'action',
      message: 'Sign contract to lock this collaboration. This agreement is legally binding once signed.'
    })}
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
            Hi ${getFirstName(creatorName)},
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
            Great news! <strong>${dealData.brandName}</strong> has reviewed and signed your collaboration agreement.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Agreement Details</h3>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">Deal Value:</strong>
              <span style="color: #059669; font-size: 18px; font-weight: 600; margin-left: 10px;">${dealAmount}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">Deliverables:</strong>
              <div style="color: #4b5563; margin-top: 8px;">${deliverablesList}</div>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">Deadline:</strong>
              <span style="color: #4b5563; margin-left: 10px;">${deadlineText}</span>
            </div>
          </div>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            This action creates a permanent record on the Creator Armour digital ledger, complete with a unique Audit ID and timestamp for your protection.
          </p>
          
          <div style="text-align: center;">
            ${getPrimaryCTA('Sign Agreement to Lock', dealLink)}
          </div>
        </td>
      </tr>
    `;

    const emailHtml = getEmailLayout({ content: mainContent, showFooter: true });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to: [creatorEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const data: ResendEmailResponse = await response.json();

    if (!response.ok || data.error) {
      console.error('[ContractSigningEmail] Failed to send creator notification:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Failed to send email',
      };
    }

    console.log('[ContractSigningEmail] Creator notification email sent:', data.id);
    return {
      success: true,
      emailId: data.id,
    };
  } catch (error: any) {
    console.error('[ContractSigningEmail] Error sending creator notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send confirmation email to creator when they sign contract
 */
export async function sendCreatorSigningConfirmationEmail(
  creatorEmail: string,
  creatorName: string,
  dealData: ContractSigningData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[ContractSigningEmail] API key not configured');
      return {
        success: false,
        error: 'Resend API key is not configured',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(creatorEmail)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';

    const dealAmount = dealData.dealType === 'paid' && dealData.dealAmount
      ? `₹${parseFloat(dealData.dealAmount.toString()).toLocaleString('en-IN')}`
      : 'Barter Deal';

    const deliverablesList = dealData.deliverables
      .map((d, idx) => `${idx + 1}. ${d}`)
      .join('<br>');

    const deadlineText = dealData.deadline
      ? new Date(dealData.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      : 'Not specified';

    const dealLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealData.dealId}`;

    const emailSubject = `Agreement executed — you’re now protected`;
    const mainContent = `
      <tr>
        <td style="background-color: #10b981; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Contract Executed!</h1>
        </td>
      </tr>
      ${getEmailSignal({
      type: 'happened',
      message: 'This agreement is now legally binding. All actions are recorded and timestamped.'
    })}
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
            Hi ${getFirstName(creatorName)},
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
            You have successfully signed the collaboration agreement with <strong>${dealData.brandName}</strong>. 
            The terms are now locked and the agreement is fully active.
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Agreement Details</h3>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">Deal Value:</strong>
              <span style="color: #059669; font-size: 18px; font-weight: 600; margin-left: 10px;">${dealAmount}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">Deliverables:</strong>
              <div style="color: #4b5563; margin-top: 8px;">${deliverablesList}</div>
            </div>
            <div style="margin: 15px 0;">
              <strong style="color: #374151;">Deadline:</strong>
              <span style="color: #4b5563; margin-left: 10px;">${deadlineText}</span>
            </div>
          </div>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            You can download the executed agreement from your dashboard at any time. Your deliverables timeline is now officially active.
          </p>
          
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #718096; font-style: italic;">
            No further action is required from you at this stage.
          </p>
          
          <div style="text-align: center;">
            ${getPrimaryCTA('View Executed Agreement', dealLink)}
          </div>
        </td>
      </tr>
    `;

    const emailHtml = getEmailLayout({ content: mainContent, showFooter: true });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to: [creatorEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const data: ResendEmailResponse = await response.json();

    if (!response.ok || data.error) {
      console.error('[ContractSigningEmail] Failed to send creator confirmation:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Failed to send email',
      };
    }

    console.log('[ContractSigningEmail] Creator confirmation email sent:', data.id);
    return {
      success: true,
      emailId: data.id,
    };
  } catch (error: any) {
    console.error('[ContractSigningEmail] Error sending creator confirmation:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * 1️⃣ Silent Safety Net Email
 * Trigger: Creator hasn’t signed 48h after brand signs
 */
export async function sendCreatorSigningSafetyNetEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const dealLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`;

    const mainContent = `
      <tr>
        <td style="background-color: #667eea; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛡️ Protect Your Collaboration</h1>
        </td>
      </tr>
      ${getEmailSignal({
      type: 'action',
      message: 'Your contract is waiting — sign to ensure you are legally protected before starting work.'
    })}
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
            Hi ${getFirstName(creatorName)},
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
            This is a gentle safety reminder. <strong>${brandName}</strong> signed your collaboration agreement 48 hours ago, but we haven't received your signature yet.
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
            Signing the agreement locks in the terms and activates your legal protections. We recommend signing before you begin any work on the deliverables.
          </p>
          
          <div style="text-align: center;">
            ${getPrimaryCTA('Sign to Stay Protected', dealLink)}
          </div>
          
          ${getCTATrustLine('This action creates a permanent record on the Creator Armour digital ledger, complete with a unique Audit ID and timestamp.')}
        </td>
      </tr>
    `;

    const html = getEmailLayout({ content: mainContent, showFooter: true });
    const subject = `Your contract is waiting — sign to stay protected`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to: [creatorEmail],
        subject: subject,
        html: html,
      }),
    });

    const data: ResendEmailResponse = await response.json();

    if (!response.ok || data.error) {
      return { success: false, error: data.error?.message || 'Failed to send email' };
    }

    return { success: true, emailId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal error' };
  }
}


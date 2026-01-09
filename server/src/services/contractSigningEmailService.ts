// Contract Signing Email Service
// Sends email notifications to both brand and creator when contract is signed

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

    const emailSubject = `✅ Agreement Signed Successfully - ${dealData.creatorName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Agreement Signed</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Congratulations, ${brandName}!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              You have successfully signed the collaboration agreement with <strong>${dealData.creatorName}</strong>.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Agreement Summary</h3>
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

            <p style="color: #4b5563; font-size: 16px;">
              Your signed agreement has been securely stored and ${dealData.creatorName} has been notified. 
              The collaboration timeline is now active.
            </p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>📋 Next Steps:</strong><br>
                • Deliverables timeline is now active<br>
                • Payment protection terms are set<br>
                • Auto reminders are enabled<br>
                • You'll receive updates on the collaboration progress
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact us at <a href="mailto:support@creatorarmour.com" style="color: #3b82f6;">support@creatorarmour.com</a>
            </p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated email from CreatorArmour.<br>
                © ${new Date().getFullYear()} CreatorArmour. All rights reserved.
              </p>
            </div>
          </div>
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

    const dealLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/#/creator-contracts/${dealData.dealId}`;

    const emailSubject = `🎉 ${dealData.brandName} Has Signed Your Collaboration Agreement!`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Agreement Signed!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Great News, ${creatorName}!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              <strong>${dealData.brandName}</strong> has signed your collaboration agreement. The contract is now active!
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

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>✅ What's Active Now:</strong><br>
                • Contract is signed and legally binding<br>
                • Deliverables timeline is activated<br>
                • Auto reminders are enabled<br>
                • Payment protection terms are set
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dealLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Deal Details
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              You can track the collaboration progress, manage deliverables, and monitor payments from your dashboard.
            </p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated email from CreatorArmour.<br>
                © ${new Date().getFullYear()} CreatorArmour. All rights reserved.
              </p>
            </div>
          </div>
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


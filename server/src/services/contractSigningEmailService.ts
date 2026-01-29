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
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Agreement Signed Successfully</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 22px; font-weight: 600;">Congratulations, ${brandName}!</h2>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
              You have successfully signed the collaboration agreement with ${dealData.creatorName}.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-size: 14px; font-weight: 600; line-height: 1.5;">
                Executed electronically via OTP verification under the Information Technology Act, 2000 (India).
              </p>
            </div>
            
            <div style="background: white; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-size: 18px; font-weight: 600;">Agreement Summary</h3>
              <div style="margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: #374151; font-size: 14px; display: block; margin-bottom: 4px;">Deal Type:</strong>
                <span style="color: #059669; font-size: 18px; font-weight: 600;">${dealTypeDisplay}</span>
              </div>
              <div style="margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
                <strong style="color: #374151; font-size: 14px; display: block; margin-bottom: 8px;">Deliverables:</strong>
                <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">${deliverablesBullets}</div>
              </div>
              <div style="margin: 16px 0;">
                <strong style="color: #374151; font-size: 14px; display: block; margin-bottom: 4px;">Deadline:</strong>
                <span style="color: #4b5563; font-size: 14px;">${deadlineText}</span>
              </div>
            </div>

            <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: #0c4a6e; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong style="display: block; margin-bottom: 8px;">Audit Confirmation:</strong>
                • OTP verification completed<br>
                • IP address, device, and timestamp securely recorded<br>
                • ${dealData.creatorName} has been notified of the signed agreement
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${pdfDownloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: transform 0.2s;">
                Download Signed Agreement (PDF)
              </a>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 4px;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 12px; font-size: 16px; font-weight: 600;">What Happens Next</h3>
              <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                <li>Deliverables timeline is now active</li>
                <li>${dealData.dealType === 'paid' ? 'Payment' : 'Barter'} protection terms are locked</li>
                <li>Automated reminders are enabled</li>
                <li>You'll receive updates as the collaboration progresses</li>
              </ul>
              <p style="color: #1e40af; margin-top: 12px; margin-bottom: 0; font-size: 14px; font-weight: 500;">
                No further action is required from you unless changes are requested.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
              If you have any questions, contact <a href="mailto:support@creatorarmour.com" style="color: #3b82f6; text-decoration: none;">support@creatorarmour.com</a>
            </p>

            <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
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

    const dealLink = `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealData.dealId}`;

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

    const emailSubject = `✅ You've Successfully Signed the Agreement with ${dealData.brandName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Agreement Signed!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Congratulations, ${creatorName}!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              You have successfully signed the collaboration agreement with <strong>${dealData.brandName}</strong>. The contract is now fully executed and legally binding!
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

            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                <strong>✅ Contract Status:</strong><br>
                • Both parties have signed<br>
                • Agreement is legally binding<br>
                • Deliverables timeline is active<br>
                • Payment protection is enabled
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dealLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Deal Details
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              You can now proceed with the collaboration. Track progress, manage deliverables, and monitor payments from your dashboard.
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


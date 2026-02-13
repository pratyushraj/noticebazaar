// @ts-nocheck
// Lawyer Notification Service
// Sends email notifications to lawyers when consumer complaints need review

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

/**
 * Send email notification to lawyers about new consumer complaint
 * @param email - Lawyer's email address
 * @param complaintData - Complaint details
 * @returns Success status
 */
export async function sendLawyerComplaintNotification(
  email: string,
  complaintData: {
    companyName: string;
    category: string;
    categoryName?: string | null;
    complaintId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.warn('[LawyerNotification] Resend API key not configured, skipping email');
      return {
        success: false,
        error: 'Email API key not configured',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';
    const dashboardUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
    const complaintLink = `${dashboardUrl}/lawyer/consumer-complaints`;
    
    const emailSubject = 'New Consumer Complaint Needs Review';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CreatorArmour</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">New Consumer Complaint Needs Review</h2>
            <p style="color: #4b5563; font-size: 16px;">
              A new consumer complaint has been submitted and requires lawyer review.
            </p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Company:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${complaintData.companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Category:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${complaintData.categoryName || complaintData.category}</td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${complaintLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View in Dashboard
              </a>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from CreatorArmour. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const requestBody = {
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to: email,
      subject: emailSubject,
      html: emailHtml,
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
      console.error('[LawyerNotification] Resend API error:', response.status, errorText);
      return {
        success: false,
        error: `Email service error: ${response.status}`,
      };
    }

    const result: ResendEmailResponse = await response.json();
    
    if (result.error) {
      console.error('[LawyerNotification] Resend API returned error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Unknown email error',
      };
    }

    console.log('[LawyerNotification] Email sent successfully to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('[LawyerNotification] Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}


// Email OTP Service
// Handles sending OTP via Resend email API

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

/**
 * Send OTP via Resend Email API
 * @param email - Email address to send OTP to
 * @param otp - 6-digit OTP code
 * @param brandName - Brand name for personalization
 * @returns Success status and email ID
 */
export async function sendEmailOTP(
  email: string,
  otp: string,
  brandName?: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[EmailOTP] API key not configured or is placeholder');
      return {
        success: false,
        error: 'Resend API key is not configured. Please set RESEND_API_KEY in server/.env with your actual API key from https://resend.com',
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
    
    const emailSubject = 'Your OTP for CreatorArmour Contract Acceptance';
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
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Your OTP for Contract Acceptance</h2>
            <p style="color: #4b5563; font-size: 16px;">
              ${brandName ? `Hello ${brandName},` : 'Hello,'}
            </p>
            <p style="color: #4b5563; font-size: 16px;">
              You have requested to accept a contract on CreatorArmour. Please use the following OTP to verify your action:
            </p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
              <li>This OTP is valid for <strong>5 minutes</strong> only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you did not request this OTP, please ignore this email</li>
            </ul>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated email from CreatorArmour. Please do not reply to this email.
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

    console.log('[EmailOTP] Sending OTP email:', {
      url,
      email,
      otpLength: otp.length,
      hasApiKey: !!apiKey,
    });

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
      
      // Parse error response for better messages
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as-is
      }
      
      // Provide helpful error messages for common issues
      if (response.status === 401) {
        errorMessage = 'Resend API authentication failed. Please check your RESEND_API_KEY in server/.env. Get your API key from https://resend.com';
      } else if (response.status === 403) {
        errorMessage = 'Resend API access forbidden. Please check your API key permissions and domain verification.';
      } else if (response.status === 422 && parsedError.message) {
        errorMessage = `Resend API validation error: ${parsedError.message}`;
      } else if (parsedError.message) {
        errorMessage = `Resend API error: ${parsedError.message}`;
      }
      
      console.error('[EmailOTP] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'missing',
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: ResendEmailResponse = await response.json();
    
    console.log('[EmailOTP] Response:', data);

    if (data.id) {
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send OTP email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[EmailOTP] Exception:', error);
    return {
      success: false,
      error: `Failed to send OTP email: ${error.message || 'Unknown error'}`,
    };
  }
}


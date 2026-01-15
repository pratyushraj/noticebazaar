// Brand Form Submission Email Service
// Sends email notification to creator when brand submits deal details form

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface BrandFormSubmissionData {
  brandName: string;
  campaignName?: string;
  dealType: 'paid' | 'barter';
  paymentAmount?: number;
  deliverables: any[];
  deadline?: string;
}

/**
 * Send email notification to creator when brand submits deal details form
 * @param creatorEmail - Creator's email address
 * @param creatorName - Creator's name for personalization
 * @param brandData - Brand form submission data
 * @param dealId - Created deal ID (if deal was created)
 * @returns Success status and email ID
 */
export async function sendBrandFormSubmissionEmail(
  creatorEmail: string,
  creatorName: string,
  brandData: BrandFormSubmissionData,
  dealId?: string | null
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[BrandFormSubmissionEmail] API key not configured or is placeholder');
      return {
        success: false,
        error: 'Resend API key is not configured. Please set RESEND_API_KEY in server/.env',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(creatorEmail)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    const url = 'https://api.resend.com/emails';
    
    // Format deliverables for display
    const deliverablesList = brandData.deliverables
      .map((d: any, idx: number) => {
        if (typeof d === 'object' && d.platform && d.contentType) {
          return `${idx + 1}. ${d.quantity || 1} ${d.contentType} on ${d.platform}${d.duration ? ` (${d.duration}s)` : ''}`;
        }
        return `${idx + 1}. ${typeof d === 'string' ? d : JSON.stringify(d)}`;
      })
      .join('<br>');

    const dealAmount = brandData.dealType === 'paid' && brandData.paymentAmount
      ? `₹${parseFloat(brandData.paymentAmount.toString()).toLocaleString('en-IN')}`
      : brandData.dealType === 'barter'
      ? 'Barter Deal'
      : 'Not specified';

    const deadlineText = brandData.deadline
      ? new Date(brandData.deadline).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Not specified';

    const dealLink = dealId
      ? `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/#/creator-contracts/${dealId}`
      : `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/#/creator-contracts`;

    const emailSubject = `New Collaboration Request from ${brandData.brandName}`;
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
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">🎉 New Collaboration Request!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Hello ${creatorName || 'there'},
            </p>
            <p style="color: #4b5563; font-size: 16px;">
              Great news! <strong>${brandData.brandName}</strong> has submitted their collaboration details through your form link.
            </p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Collaboration Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Brand Name:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${brandData.brandName}</td>
                </tr>
                ${brandData.campaignName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Campaign Name:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${brandData.campaignName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Deal Type:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-transform: capitalize;">${brandData.dealType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Deal Value:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${dealAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Deadline:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${deadlineText}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Deliverables:</h3>
              <div style="color: #4b5563; font-size: 14px;">
                ${deliverablesList || 'No deliverables specified'}
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dealLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review & Create Contract
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              <strong>Next Steps:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
              <li>Review the collaboration details in your dashboard</li>
              <li>Generate a protected contract based on these details</li>
              <li>Share the contract with the brand for review</li>
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
      to: creatorEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    console.log('[BrandFormSubmissionEmail] Sending notification email:', {
      creatorEmail,
      brandName: brandData.brandName,
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
      
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as-is
      }
      
      if (response.status === 401) {
        errorMessage = 'Resend API authentication failed. Please check your RESEND_API_KEY';
      } else if (response.status === 403) {
        errorMessage = 'Resend API access forbidden. Please check your API key permissions.';
      } else if (response.status === 422 && parsedError.message) {
        errorMessage = `Resend API validation error: ${parsedError.message}`;
      } else if (parsedError.message) {
        errorMessage = `Resend API error: ${parsedError.message}`;
      }
      
      console.error('[BrandFormSubmissionEmail] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: ResendEmailResponse = await response.json();
    
    console.log('[BrandFormSubmissionEmail] Email sent successfully:', {
      emailId: data.id,
      creatorEmail,
    });

    if (data.id) {
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send notification email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[BrandFormSubmissionEmail] Exception:', error);
    return {
      success: false,
      error: `Failed to send notification email: ${error.message || 'Unknown error'}`,
    };
  }
}


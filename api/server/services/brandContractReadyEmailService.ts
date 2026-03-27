// Brand Contract Ready Email Service
// Sends contract to brand after generation

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface BrandContractReadyData {
  brandName: string;
  creatorName: string;
  dealAmount?: number;
  dealType: 'paid' | 'barter';
  deliverables: any[];
  deadline?: string;
  contractUrl?: string;
  contractReadyToken: string;
}

/**
 * Send contract to brand via email after generation
 */
export async function sendBrandContractReadyEmail(
  brandEmail: string,
  brandName: string,
  contractData: BrandContractReadyData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      console.error('[BrandContractReadyEmail] API key not configured');
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
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
    const contractReadyLink = `${frontendUrl}/contract-ready/${contractData.contractReadyToken}`;
    
    const dealAmount = contractData.dealType === 'paid' && contractData.dealAmount
      ? `₹${parseFloat(contractData.dealAmount.toString()).toLocaleString('en-IN')}`
      : 'Barter Deal';

    const deliverablesList = contractData.deliverables
      .map((d: any, idx: number) => {
        if (typeof d === 'object' && d.platform && d.contentType) {
          return `${idx + 1}. ${d.quantity || 1} ${d.contentType} on ${d.platform}${d.duration ? ` (${d.duration}s)` : ''}`;
        }
        return `${idx + 1}. ${typeof d === 'string' ? d : JSON.stringify(d)}`;
      })
      .join('<br>');

    const deadlineText = contractData.deadline
      ? new Date(contractData.deadline).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Not specified';

    const emailSubject = `Your Collaboration Agreement is Ready - ${contractData.creatorName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📄 Your Agreement is Ready</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Hello ${brandName},</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Your collaboration agreement with <strong>${contractData.creatorName}</strong> has been generated and is ready for your review and signature.
            </p>
            
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Agreement Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Creator:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${contractData.creatorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Deal Type:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-transform: capitalize;">${contractData.dealType}</td>
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
              <a href="${contractReadyLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review & Sign Agreement
              </a>
            </div>

            ${contractData.contractUrl ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${contractData.contractUrl}" style="display: inline-block; color: #667eea; padding: 10px 20px; text-decoration: none; border: 1px solid #667eea; border-radius: 8px; font-size: 14px;">
                Download Contract PDF
              </a>
            </div>
            ` : ''}

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              <strong>Next Steps:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
              <li>Review the agreement terms and conditions</li>
              <li>Verify all details are correct</li>
              <li>Sign the agreement to make it legally binding</li>
            </ul>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you have any questions or need to request changes, you can do so directly on the agreement page.
            </p>

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
      to: brandEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    console.log('[BrandContractReadyEmail] Sending contract email:', {
      brandEmail,
      brandName,
      creatorName: contractData.creatorName,
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
      
      console.error('[BrandContractReadyEmail] API error:', {
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
    
    console.log('[BrandContractReadyEmail] Email sent successfully:', {
      emailId: data.id,
      brandEmail,
    });

    if (data.id) {
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send contract email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[BrandContractReadyEmail] Exception:', error);
    return {
      success: false,
      error: `Failed to send contract email: ${error.message || 'Unknown error'}`,
    };
  }
}


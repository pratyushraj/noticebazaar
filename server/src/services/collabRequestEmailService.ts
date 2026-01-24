// Collaboration Request Email Service
// Sends transactional emails to brands about collab request status updates

import {
  getCreatorNotificationEmailTemplate,
  getBrandConfirmationEmailTemplate,
} from './professionalEmailTemplates.js';

interface ResendEmailResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface CollabRequestSubmissionData {
  creatorName: string;
  creatorPlatforms?: string[];
  brandName: string;
  collabType: 'paid' | 'barter' | 'both';
  budgetRange?: string | null;
  exactBudget?: number | null;
  barterDescription?: string | null;
  deliverables: string[];
  deadline?: string | null;
  requestId: string;
}

interface CollabRequestAcceptedData {
  creatorName: string;
  brandName: string;
  dealAmount?: number;
  dealType: 'paid' | 'barter';
  deliverables: string[];
  contractReadyToken: string;
  contractUrl?: string;
}

interface CollabRequestCounterData {
  creatorName: string;
  brandName: string;
  originalBudget?: number | null;
  counterPrice?: number | null;
  counterDeliverables?: string | null;
  counterNotes?: string | null;
  requestId: string;
}

interface CollabRequestDeclinedData {
  creatorName: string;
  brandName: string;
  creatorUsername: string;
}

interface CollabRequestCreatorNotificationData {
  creatorName: string;
  creatorCategory?: string;
  followerCount?: number;
  avatarUrl?: string;
  brandName: string;
  brandWebsite?: string;
  campaignGoal?: string;
  collabType: 'paid' | 'barter' | 'both';
  budgetRange?: string | null;
  exactBudget?: number | null;
  barterDescription?: string | null;
  barterValue?: number | null;
  deliverables: string[];
  deadline?: string | null;
  timeline?: string;
  notes?: string;
  requestId: string;
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
      console.error('[CollabRequestEmail] API key not configured');
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
    
    const requestBody = {
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to,
      subject,
      html,
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
      let errorMessage = `Resend API error: ${response.status} ${response.statusText}`;
      
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as-is
      }
      
      if (response.status === 401) {
        errorMessage = 'Resend API authentication failed';
      } else if (response.status === 403) {
        errorMessage = 'Resend API access forbidden';
      } else if (response.status === 422 && parsedError.message) {
        errorMessage = `Resend API validation error: ${parsedError.message}`;
      } else if (parsedError.message) {
        errorMessage = `Resend API error: ${parsedError.message}`;
      }
      
      console.error('[CollabRequestEmail] API error:', {
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
    
    if (data.id) {
      console.log('[CollabRequestEmail] Email sent successfully:', {
        emailId: data.id,
        to,
        subject,
      });
      return {
        success: true,
        emailId: data.id,
      };
    } else if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Failed to send email',
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from Resend API',
      };
    }
  } catch (error: any) {
    console.error('[CollabRequestEmail] Exception:', error);
    return {
      success: false,
      error: `Failed to send email: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Email template helper
 */
function getEmailTemplate(
  title: string,
  greeting: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  secondaryCtaText?: string,
  secondaryCtaUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">${greeting}</h2>
          ${content}
          ${ctaUrl && ctaText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;" target="_blank" rel="noopener noreferrer">
                ${ctaText}
              </a>
            </div>
          ` : ''}
          ${secondaryCtaUrl && secondaryCtaText ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${secondaryCtaUrl}" style="display: inline-block; color: #667eea; padding: 10px 20px; text-decoration: none; border: 1px solid #667eea; border-radius: 8px; font-size: 14px;">
                ${secondaryCtaText}
              </a>
            </div>
          ` : ''}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from CreatorArmour. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * 1. Send email when collab request is submitted
 */
export async function sendCollabRequestSubmissionEmail(
  brandEmail: string,
  data: CollabRequestSubmissionData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  
  // Format platforms
  const platformsText = data.creatorPlatforms && data.creatorPlatforms.length > 0
    ? data.creatorPlatforms.join(', ')
    : 'Multiple platforms';

  // Format collaboration type
  const collabTypeText = data.collabType === 'paid' 
    ? 'Paid' 
    : data.collabType === 'barter' 
    ? 'Barter' 
    : 'Hybrid (Paid + Barter)';

  // Format budget
  let budgetText = 'Not specified';
  if (data.collabType === 'paid' || data.collabType === 'both') {
    if (data.exactBudget) {
      budgetText = `₹${data.exactBudget.toLocaleString('en-IN')}`;
    } else if (data.budgetRange) {
      const ranges: { [key: string]: string } = {
        'under-5000': 'Under ₹5,000',
        '5000-10000': '₹5,000 – ₹10,000',
        '10000-25000': '₹10,000 – ₹25,000',
        '25000+': '₹25,000+',
      };
      budgetText = ranges[data.budgetRange] || data.budgetRange;
    }
  } else if (data.collabType === 'barter' && data.barterDescription) {
    budgetText = 'Barter';
  }

  // Format deliverables as bulleted list
  const deliverablesList = data.deliverables.length > 0
    ? data.deliverables.map(d => `<li style="color: #4b5563; font-size: 14px; margin-bottom: 6px;">${d}</li>`).join('')
    : '<li style="color: #9ca3af; font-size: 14px;">No deliverables specified</li>';

  // Format deadline
  const deadlineText = data.deadline
    ? new Date(data.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Not specified';

  // Personalized greeting with fallback
  const greeting = data.brandName && data.brandName.trim() !== ''
    ? `Hi ${data.brandName},`
    : 'Hi there,';

  // Use professional email template
  const html = getBrandConfirmationEmailTemplate({
    brandName: data.brandName,
    creatorName: data.creatorName,
    platforms: data.creatorPlatforms,
    collabType: data.collabType,
    budget: budgetText,
    deadline: data.deadline || undefined,
    deliverables: data.deliverables,
  });

  const subject = `Your collaboration request was sent to ${data.creatorName}`;

  return sendEmail(
    brandEmail,
    subject,
    html
  );
}

/**
 * 2. Send email when request is accepted
 */
export async function sendCollabRequestAcceptedEmail(
  brandEmail: string,
  data: CollabRequestAcceptedData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const contractReadyLink = `${frontendUrl}/#/contract-ready/${data.contractReadyToken}`;

  const dealAmount = data.dealType === 'paid' && data.dealAmount
    ? `₹${parseFloat(data.dealAmount.toString()).toLocaleString('en-IN')}`
    : 'Barter Deal';

  const deliverablesList = data.deliverables
    .map((d, idx) => `${idx + 1}. ${d}`)
    .join('<br>');

  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      Great news! <strong>${data.creatorName}</strong> has accepted your collaboration request.
    </p>
    
    <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #065f46; font-size: 14px; margin: 0;">
        <strong>✓ Request Accepted</strong> - A contract has been generated and is ready for your review and signature.
      </p>
    </div>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Deal Summary:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Creator:</strong></td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.creatorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Deal Value:</strong></td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${dealAmount}</td>
        </tr>
      </table>
    </div>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Deliverables:</h3>
      <div style="color: #4b5563; font-size: 14px;">
        ${deliverablesList || 'As per agreement'}
      </div>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      <strong>Next Steps:</strong> Review the contract terms and sign to make it legally binding. Once signed, you'll receive a copy for your records.
    </p>
  `;

  const html = getEmailTemplate(
    '✅ Request Accepted',
    `Hello ${data.brandName},`,
    content,
    'Review & Sign Contract',
    contractReadyLink,
    data.contractUrl ? 'Download Contract PDF' : undefined,
    data.contractUrl
  );

  return sendEmail(
    brandEmail,
    `${data.creatorName} accepted your collaboration request`,
    html
  );
}

/**
 * 3. Send email when counter offer is submitted
 */
export async function sendCollabRequestCounterEmail(
  brandEmail: string,
  data: CollabRequestCounterData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';

  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${data.creatorName}</strong> has sent you a counter offer for your collaboration request.
    </p>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>📝 Counter Offer Received</strong> - Review the updated terms below.
      </p>
    </div>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">Counter Offer Details:</h3>
      ${data.counterPrice ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;"><strong>Original Price:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.originalBudget ? `₹${data.originalBudget.toLocaleString('en-IN')}` : 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Counter Price:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">₹${data.counterPrice.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      ` : ''}
      ${data.counterDeliverables ? `
        <div style="margin-top: 15px;">
          <strong style="color: #6b7280; font-size: 14px;">Updated Deliverables:</strong>
          <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">${data.counterDeliverables}</p>
        </div>
      ` : ''}
      ${data.counterNotes ? `
        <div style="margin-top: 15px;">
          <strong style="color: #6b7280; font-size: 14px;">Notes:</strong>
          <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">${data.counterNotes}</p>
        </div>
      ` : ''}
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      You can accept this counter offer, propose your own terms, or decline. All communication stays secure on CreatorArmour.
    </p>
  `;

  const html = getEmailTemplate(
    '💼 Counter Offer',
    `Hello ${data.brandName},`,
    content
    // No CTA for counter - brands can respond via CreatorArmour dashboard if they have access
    // In future, could add a public response page
  );

  return sendEmail(
    brandEmail,
    `${data.creatorName} sent a counter offer`,
    html
  );
}

/**
 * 4. Send email when request is declined
 */
export async function sendCollabRequestDeclinedEmail(
  brandEmail: string,
  data: CollabRequestDeclinedData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const collabLink = `${frontendUrl}/#/collab/${data.creatorUsername}`;

  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${data.creatorName}</strong> has declined your collaboration request.
    </p>
    
    <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #991b1b; font-size: 14px; margin: 0;">
        <strong>Request Declined</strong> - This creator is not available for this collaboration at this time.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Don't worry! This is common in the creator industry. Creators may decline requests due to:
    </p>
    <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
      <li>Current workload or availability</li>
      <li>Brand fit or alignment</li>
      <li>Budget or timeline constraints</li>
    </ul>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      <strong>What's Next?</strong> You can submit a new collaboration request with adjusted terms, or explore other creators on CreatorArmour.
    </p>
  `;

  const html = getEmailTemplate(
    '📋 Request Update',
    `Hello ${data.brandName},`,
    content,
    'Submit New Request',
    collabLink
  );

  return sendEmail(
    brandEmail,
    `${data.creatorName} declined your collaboration request`,
    html
  );
}

/**
 * 5. Send email to creator when new collab request is submitted
 */
export async function sendCollabRequestCreatorNotificationEmail(
  creatorEmail: string,
  data: CollabRequestCreatorNotificationData
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const dashboardLink = `${frontendUrl}/#/creator-dashboard`;

  // Format collaboration type
  const collabTypeText = data.collabType === 'paid' 
    ? 'Paid' 
    : data.collabType === 'barter' 
    ? 'Barter' 
    : 'Hybrid (Paid + Barter)';

  // Format budget/barter value for subject line and content
  let budgetText = 'Not specified';
  let budgetForSubject = '';
  if (data.collabType === 'paid' || data.collabType === 'both') {
    if (data.exactBudget) {
      budgetText = `₹${data.exactBudget.toLocaleString('en-IN')}`;
      budgetForSubject = `₹${data.exactBudget.toLocaleString('en-IN')}`;
    } else if (data.budgetRange) {
      const ranges: { [key: string]: string } = {
        'under-5000': 'Under ₹5,000',
        '5000-10000': '₹5,000 – ₹10,000',
        '10000-25000': '₹10,000 – ₹25,000',
        '25000+': '₹25,000+',
      };
      budgetText = ranges[data.budgetRange] || data.budgetRange;
      budgetForSubject = ranges[data.budgetRange] || data.budgetRange;
    }
  } else if (data.collabType === 'barter' || data.collabType === 'both') {
    if (data.barterDescription) {
      budgetText = data.barterValue 
        ? `Barter (Value: ₹${data.barterValue.toLocaleString('en-IN')})`
        : 'Barter';
      budgetForSubject = data.barterValue 
        ? `₹${data.barterValue.toLocaleString('en-IN')}`
        : 'Barter';
    }
  }

  // Format timeline from deadline if available
  let timelineText: string | undefined = undefined;
  if (data.deadline) {
    try {
      const deadlineDate = new Date(data.deadline);
      if (!isNaN(deadlineDate.getTime())) {
        timelineText = deadlineDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (e) {
      // If date parsing fails, use timeline if provided
      timelineText = data.timeline || undefined;
    }
  } else {
    timelineText = data.timeline || undefined;
  }

  // Calculate total follower count (sum of all platforms)
  let totalFollowers = 0;
  if (data.followerCount) {
    totalFollowers = data.followerCount;
  }

  // Use professional email template
  const html = getCreatorNotificationEmailTemplate({
    creatorName: data.creatorName,
    creatorCategory: data.creatorCategory,
    followerCount: totalFollowers > 0 ? totalFollowers : undefined,
    avatarUrl: data.avatarUrl,
    brandName: data.brandName,
    brandWebsite: data.brandWebsite,
    campaignGoal: data.campaignGoal,
    deliverables: data.deliverables,
    budget: budgetText,
    timeline: timelineText,
    notes: data.notes,
    viewRequestUrl: dashboardLink,
    // Secondary action URLs can be added later when we have specific routes
  });

  // Subject line with budget
  const subject = budgetForSubject && budgetForSubject !== 'Not specified'
    ? `New collaboration request from ${data.brandName} (${budgetForSubject})`
    : `New collaboration request from ${data.brandName}`;

  return sendEmail(
    creatorEmail,
    subject,
    html
  );
}


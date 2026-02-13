// @ts-nocheck
// Professional Email Templates for Creator Armour
// Stripe/Upwork-style clean, minimal, professional design

interface EmailLayoutProps {
  content: string;
  showFooter?: boolean;
  backgroundStyle?: 'purple' | 'dark';
}

interface CreatorProfileProps {
  creatorName: string;
  creatorCategory?: string;
  followerCount?: number;
  avatarUrl?: string;
}

interface CollaborationRequestCardProps {
  brandName: string;
  brandWebsite?: string;
  campaignGoal?: string;
  deliverables: string[];
  budget: string;
  timeline?: string;
  notes?: string;
  /** Barter: optional product image URL to show in the request card */
  barterProductImageUrl?: string | null;
}

/**
 * Base email layout - Stripe-style white card on light gray background
 */
function getEmailLayout({ content, showFooter = true, backgroundStyle = 'purple' }: EmailLayoutProps): string {
  const backgroundGradient = backgroundStyle === 'dark'
    ? 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  const boxShadow = backgroundStyle === 'dark'
    ? '0 20px 60px rgba(0, 0, 0, 0.4)'
    : '0 20px 60px rgba(0, 0, 0, 0.3)';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Creator Armour</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: ${backgroundGradient}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${backgroundGradient};">
    <tr>
      <td align="center" style="padding: 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: ${boxShadow}; overflow: hidden;">
          ${content}
          ${showFooter ? getEmailFooter() : ''}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email header with solid color background and brand badge (for creator notification)
 * Uses solid color instead of gradient for email client compatibility
 */
function getEmailHeader(brandName: string, creatorProfile?: CreatorProfileProps): string {
  return `
    <tr>
      <td style="background-color: #667eea; padding: 50px 30px; text-align: center;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #ffffff !important; line-height: 1.3;">
          <span style="color: #ffffff;">New Collaboration Opportunity</span>
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #ffffff !important; opacity: 0.95;">
          <span style="color: #ffffff;">An exciting brand wants to work with you!</span>
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top: 8px;">
          <tr>
            <td style="background-color: rgba(255, 255, 255, 0.25); padding: 8px 20px; border-radius: 20px;">
              <span style="font-size: 14px; font-weight: 500; color: #ffffff !important;">
                <span style="color: #ffffff;">${brandName}</span>
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Success header for brand confirmation email (green solid color for email compatibility)
 */
function getSuccessHeader(): string {
  return `
    <tr>
      <td style="background-color: #11998e; padding: 50px 30px; text-align: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom: 20px;">
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="background-color: #11998e; border-radius: 50%; width: 80px; height: 80px; text-align: center; vertical-align: middle; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);">
                    <span style="font-size: 40px; color: #ffffff; line-height: 80px;">✓</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #ffffff !important; line-height: 1.3;">
          <span style="color: #ffffff;">Request Sent Successfully!</span>
        </h1>
        <p style="margin: 0; font-size: 16px; color: #ffffff !important;">
          <span style="color: #ffffff; opacity: 0.95;">Your collaboration request is on its way</span>
        </p>
      </td>
    </tr>
  `;
}

/**
 * Collaboration Request Card Component
 */
function getCollaborationRequestCard(props: CollaborationRequestCardProps): string {
  const deliverablesList = props.deliverables.length > 0
    ? props.deliverables.map(d => `<li style="color: #4a5568; font-size: 14px; line-height: 1.6; padding: 4px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #667eea; font-weight: bold;">✓</span>${d}</li>`).join('')
    : '<li style="color: #a0aec0; font-size: 14px; padding: 4px 0; padding-left: 20px;">No deliverables specified</li>';

  return `
    <tr>
      <td style="padding: 24px 32px;">
        <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td style="width: 20px; padding-right: 12px; vertical-align: middle;">
                <div style="width: 20px; height: 20px; background-color: #2563eb; border-radius: 4px; text-align: center; line-height: 20px;">
                  <span style="color: white; font-weight: bold; font-size: 12px;">✓</span>
                </div>
              </td>
              <td style="vertical-align: middle;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">Collaboration Request</h3>
              </td>
            </tr>
          </table>
          ${props.barterProductImageUrl ? `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td style="padding: 0 0 16px 0; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #4a5568;">Barter product</p>
                <div style="background-color: #f1f5f9; border-radius: 10px; border: 1px solid #e2e8f0; width: 120px; height: 120px; overflow: hidden; display: inline-block;">
                  <img src="${props.barterProductImageUrl}" alt="Barter product" width="120" height="120" style="display: block; width: 120px; height: 120px; object-fit: cover; border-radius: 10px; background-color: #f1f5f9;" />
                </div>
                <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">Tap &quot;Show pictures&quot; if the image doesn&apos;t load.</p>
              </td>
            </tr>
          </table>
          ` : ''}
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; color: #2d3748; font-size: 14px; width: 35%; vertical-align: top; font-weight: 600; border-bottom: 1px solid #e2e8f0;"><strong>Brand:</strong></td>
              <td style="padding: 12px 0; color: #4a5568; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${props.brandName}</td>
            </tr>
            ${props.brandWebsite ? `
            <tr>
              <td style="padding: 12px 0; color: #2d3748; font-size: 14px; vertical-align: top; font-weight: 600; border-bottom: 1px solid #e2e8f0;"><strong>Website:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <a href="${props.brandWebsite.startsWith('http') ? props.brandWebsite : `https://${props.brandWebsite}`}" style="color: #667eea; text-decoration: none; font-size: 14px;">${props.brandWebsite.replace(/^https?:\/\//, '')}</a>
              </td>
            </tr>
            ` : ''}
            ${props.campaignGoal ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;"><strong>Campaign Goal:</strong></td>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">${truncateText(props.campaignGoal, 150)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px 0; color: #2d3748; font-size: 14px; vertical-align: top; font-weight: 600; border-bottom: 1px solid #e2e8f0;"><strong>Deliverables:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; list-style: none;">
                  ${deliverablesList}
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #2d3748; font-size: 14px; width: 35%; vertical-align: top; font-weight: 600; border-bottom: 1px solid #e2e8f0;"><strong>Budget:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="display: inline-block; background-color: #667eea; color: #ffffff !important; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;"><span style="color: #ffffff;">${props.budget}</span></span>
              </td>
            </tr>
            ${props.timeline ? `
            <tr>
              <td style="padding: 12px 0; color: #2d3748; font-size: 14px; vertical-align: top; font-weight: 600; border-bottom: 1px solid #e2e8f0;"><strong>Timeline:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="display: inline-block; background: #fef5e7; color: #d68910; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;">📅 ${props.timeline}</span>
              </td>
            </tr>
            ` : ''}
            ${props.notes && props.notes !== props.campaignGoal ? `
            <tr>
              <td style="padding: 12px 0; color: #2d3748; font-size: 14px; vertical-align: top; font-weight: 600;"><strong>Notes:</strong></td>
              <td style="padding: 12px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">${truncateText(props.notes, 150)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Primary CTA Button (using solid color for email client compatibility)
 */
function getPrimaryCTA(text: string, url: string): string {
  return `
    <tr>
      <td style="padding: 30px 32px 20px 32px; text-align: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            <td style="background-color: #667eea; border-radius: 8px;">
              <a href="${url}" style="display: inline-block; background-color: #667eea; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; line-height: 1.5; mso-hide: all;" target="_blank" rel="noopener noreferrer">
                <span style="color: #ffffff;">${text}</span>
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Secondary Action Links (styled as buttons for better visibility)
 */
function getSecondaryActions(
  viewRequestUrl: string,
  acceptUrl?: string,
  counterUrl?: string,
  declineUrl?: string
): string {
  const actions = [];
  if (acceptUrl) {
    actions.push({ text: 'Accept', url: acceptUrl, bgColor: '#48bb78', textColor: '#ffffff', borderColor: '#48bb78' });
  }
  if (counterUrl) {
    actions.push({ text: 'Ask for Changes', url: counterUrl, bgColor: '#ffffff', textColor: '#667eea', borderColor: '#667eea' });
  }
  if (declineUrl) {
    actions.push({ text: 'Decline', url: declineUrl, bgColor: '#ffffff', textColor: '#e53e3e', borderColor: '#e53e3e' });
  }

  // If no specific URLs provided, use viewRequestUrl for all (they'll be handled in dashboard)
  const baseUrl = viewRequestUrl;
  if (actions.length === 0) {
    actions.push(
      { text: 'Accept', url: baseUrl, bgColor: '#48bb78', textColor: '#ffffff', borderColor: '#48bb78' },
      { text: 'Ask for Changes', url: baseUrl, bgColor: '#ffffff', textColor: '#667eea', borderColor: '#667eea' },
      { text: 'Decline', url: baseUrl, bgColor: '#ffffff', textColor: '#e53e3e', borderColor: '#e53e3e' }
    );
  }

  const buttons = actions.map(action => `
    <td style="padding: 0 6px;">
      <a href="${action.url}" style="display: inline-block; background-color: ${action.bgColor}; color: ${action.textColor}; border: 2px solid ${action.borderColor}; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 500; font-size: 14px; line-height: 1.5;" target="_blank" rel="noopener noreferrer">${action.text}</a>
    </td>
  `).join('');

  return `
    <tr>
      <td style="padding: 0 32px 24px 32px; text-align: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            ${buttons}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Trust Line
 */
function getTrustLine(): string {
  return `
    <tr>
      <td style="padding: 0 32px 24px 32px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #2d3748;">Protected by Creator Armour</p>
        <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.5;">
          Building authentic brand-creator partnerships with contracts, delivery tracking, and professional dispute handling.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top: 12px;">
          <tr><td style="color: #10b981; font-size: 13px; padding: 2px 8px 2px 0;">✓</td><td style="color: #4a5568; font-size: 13px;">All collaborations include contracts</td></tr>
          <tr><td style="color: #10b981; font-size: 13px; padding: 2px 8px 2px 0;">✓</td><td style="color: #4a5568; font-size: 13px;">Barter deliveries tracked transparently</td></tr>
          <tr><td style="color: #10b981; font-size: 13px; padding: 2px 8px 2px 0;">✓</td><td style="color: #4a5568; font-size: 13px;">Platform handles any disputes professionally</td></tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Urgency Line (subtle, under CTA)
 */
function getUrgencyLine(): string {
  return `
    <tr>
      <td style="padding: 0 32px 16px 32px; text-align: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            <td style="color: #718096; font-size: 13px; line-height: 1.5;">
              ⏱ Reply within 48 hours to increase your chances of a successful collab.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Email Footer (includes help/contact so issues are caught before chargebacks or disputes)
 */
function getEmailFooter(): string {
  const supportEmail = 'support@creatorarmour.com';
  return `
    <tr>
      <td style="padding: 30px; border-top: 1px solid #e2e8f0; background-color: #f7fafc; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4a5568; line-height: 1.5;">
          <a href="mailto:${supportEmail}" style="color: #667eea; text-decoration: none; font-weight: 500;">Need help? Contact us</a> — we’re here to help before any issue becomes a dispute.
        </p>
        <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #2d3748; line-height: 1.5;">
          Secured by Creator Armour
        </p>
        <p style="margin: 0; font-size: 13px; color: #718096; line-height: 1.5;">
          Building authentic brand-creator partnerships with trust and transparency
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #a0aec0; line-height: 1.5;">
          Creator Armour, C 1107, Amarpali Princely Estate, Noida Sector 76, 201306, India
        </p>
      </td>
    </tr>
  `;
}

/**
 * Format follower count (e.g., 150000 -> "150k")
 */
function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}k`;
  }
  return count.toString();
}

/**
 * Truncate text to max length, adding ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extract first name from full name
 */
function getFirstName(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return 'there';
  }
  
  const trimmed = fullName.trim();
  
  // If it looks like an email username (single word, lowercase, contains numbers)
  // use "there" instead to avoid showing email parts
  if (trimmed.split(' ').length === 1) {
    const lowerTrimmed = trimmed.toLowerCase();
    // Check if it's likely an email username (e.g., "notice2", "rahul123")
    if (/^[a-z0-9_]+$/.test(lowerTrimmed) && lowerTrimmed.length < 15) {
      return 'there';
    }
  }
  
  const parts = trimmed.split(' ');
  return parts[0] || 'there';
}

/**
 * A. CREATOR NOTIFICATION EMAIL
 */
export function getCreatorNotificationEmailTemplate(data: {
  creatorName: string;
  creatorCategory?: string;
  followerCount?: number;
  avatarUrl?: string;
  brandName: string;
  brandWebsite?: string;
  campaignGoal?: string;
  deliverables: string[];
  budget: string;
  timeline?: string;
  notes?: string;
  viewRequestUrl: string;
  acceptUrl?: string;
  counterUrl?: string;
  declineUrl?: string;
  barterProductImageUrl?: string | null;
}): string {
  const mainContent = `
    ${getEmailHeader(data.brandName)}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748 !important; line-height: 1.6;">
          <span style="color: #2d3748;">Hi ${getFirstName(data.creatorName)},</span>
        </p>
        <p style="margin: 0 0 30px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          Great news! ${data.brandName} has submitted a collaboration request for you. They're looking to partner with authentic creators like you to bring their vision to life. Review the details below and let them know your decision.
        </p>
    ${getCollaborationRequestCard({
      brandName: data.brandName,
      brandWebsite: data.brandWebsite,
      campaignGoal: data.campaignGoal,
      deliverables: data.deliverables,
      budget: data.budget,
      timeline: data.timeline,
      notes: data.notes,
      barterProductImageUrl: data.barterProductImageUrl,
    })}
    ${getPrimaryCTA('View Full Request', data.viewRequestUrl)}
    ${getUrgencyLine()}
    ${getSecondaryActions(data.viewRequestUrl, data.acceptUrl, data.counterUrl, data.declineUrl)}
    ${getTrustLine()}
  `;

  return getEmailLayout({ content: mainContent, showFooter: true });
}

/**
 * B. BRAND CONFIRMATION EMAIL
 */
export function getBrandConfirmationEmailTemplate(data: {
  brandName: string;
  creatorName: string;
  platforms?: string[];
  collabType: 'paid' | 'barter' | 'both';
  budget: string;
  deadline?: string;
  deliverables: string[];
}): string {
  const platformsText = data.platforms && data.platforms.length > 0
    ? data.platforms.join(', ')
    : 'Multiple platforms';

  const collabTypeText = data.collabType === 'paid' 
    ? 'Paid' 
    : data.collabType === 'barter' 
    ? 'Barter' 
    : 'Hybrid (Paid + Barter)';

  const deadlineText = data.deadline
    ? new Date(data.deadline).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not specified';

  const deliverablesList = data.deliverables.length > 0
    ? data.deliverables.map((d, index) => `
      <tr>
        <td style="padding: 12px; background-color: #f7fafc; border-radius: 8px; margin-bottom: 12px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="width: 32px; vertical-align: middle; padding-right: 12px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width: 32px; height: 32px; background-color: #11998e; border-radius: 50%; text-align: center; vertical-align: middle;">
                      <span style="color: #ffffff; font-weight: 700; font-size: 14px; line-height: 32px;">${index + 1}</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align: middle; color: #2d3748; font-size: 15px; font-weight: 500;">
                ${d}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')
    : '<tr><td style="padding: 12px; color: #a0aec0; font-size: 14px;">No deliverables specified</td></tr>';

  const mainContent = `
    ${getSuccessHeader()}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 16px 0; font-size: 18px; color: #2d3748; font-weight: 600; line-height: 1.6;">
          Hello ${data.brandName},
        </p>
        <p style="margin: 0 0 30px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          Great news! Your collaboration request has been successfully sent to <strong style="color: #2d3748;">${data.creatorName}</strong>. They'll review your proposal and respond within 48 hours.
        </p>
        
        <!-- Request Summary Section -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="padding-bottom: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right: 10px; vertical-align: middle;">
                    <span style="color: #11998e; font-size: 20px;">📋</span>
                  </td>
                  <td style="vertical-align: middle;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #2d3748;">Request Summary</h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Summary Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-left: 4px solid #11998e; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600; min-width: 120px; vertical-align: top;">Creator:</td>
                  <td style="padding: 10px 0; color: #2d3748; font-size: 15px; font-weight: 500;">${data.creatorName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600; vertical-align: top;">Platforms:</td>
                  <td style="padding: 10px 0; color: #2d3748; font-size: 15px; font-weight: 500;">${platformsText}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600; vertical-align: top;">Type:</td>
                  <td style="padding: 10px 0; color: #2d3748; font-size: 15px; font-weight: 500;">${collabTypeText} Collaboration</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600; vertical-align: top;">Budget:</td>
                  <td style="padding: 10px 0; color: #11998e; font-size: 20px; font-weight: 700;">${data.budget}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #4a5568; font-size: 14px; font-weight: 600; vertical-align: top;">Deadline:</td>
                  <td style="padding: 10px 0; color: #d97706; font-size: 15px; font-weight: 600;">${deadlineText}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Deliverables Section -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="padding-bottom: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right: 10px; vertical-align: middle;">
                    <span style="color: #11998e; font-size: 20px;">📄</span>
                  </td>
                  <td style="vertical-align: middle;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #2d3748;">Deliverables</h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Deliverables Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 30px;">
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${deliverablesList}
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Timeline Tracker -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 24px;">
              <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #2d3748; text-align: center;">What Happens Next?</h3>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 12px; vertical-align: top; padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 12px; height: 12px; background-color: #11998e; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #11998e;"></td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align: top; font-size: 14px; color: #4a5568; line-height: 1.6;">
                          <strong style="color: #2d3748; font-weight: 600;">Request Sent</strong> – Your proposal is now with the creator
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 12px; vertical-align: top; padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 12px; height: 12px; background-color: #e2e8f0; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #e2e8f0;"></td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align: top; font-size: 14px; color: #4a5568; line-height: 1.6;">
                          <strong style="color: #2d3748; font-weight: 600;">Creator Reviews</strong> – Expect a response within 48 hours
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 12px; vertical-align: top; padding-right: 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="width: 12px; height: 12px; background-color: #e2e8f0; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #e2e8f0;"></td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align: top; font-size: 14px; color: #4a5568; line-height: 1.6;">
                          <strong style="color: #2d3748; font-weight: 600;">Get Notified</strong> – We'll email you as soon as they respond
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Info Box -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #e0f2f1; border-left: 4px solid #11998e; border-radius: 8px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 24px; vertical-align: top; padding-right: 16px;">
                    <span style="color: #11998e; font-size: 24px;">ℹ️</span>
                  </td>
                  <td style="vertical-align: top; font-size: 14px; color: #2d3748; line-height: 1.6;">
                    You'll be notified when ${data.creatorName} responds to your request. All communication and contracts will be handled securely through CreatorArmour, ensuring a smooth and protected collaboration process.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  return getEmailLayout({ content: mainContent, showFooter: true, backgroundStyle: 'dark' });
}


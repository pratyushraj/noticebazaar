import fetch from 'node-fetch';
import { getEmailLayout, getPrimaryCTA } from './professionalEmailTemplates.js';

const apiKey = process.env.RESEND_API_KEY;

/**
 * Sends an email to the creator when the brand successfully pays into Escrow.
 */
export async function sendEscrowFundedEmailToCreator(deal: any, creator: any) {
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.warn('[EscrowEmailService] RESEND_API_KEY not configured. Skipping email.');
    return { success: false, error: 'API key not configured' };
  }

  const creatorEmail = creator?.email || deal?.creator_email;
  const creatorName = creator?.first_name || creator?.username || 'Creator';
  const brandName = deal?.brand_name || 'The brand';

  if (!creatorEmail) {
    console.warn('[EscrowEmailService] No creator email found.');
    return { success: false, error: 'No creator email' };
  }

  const subject = \`💰 \${brandName} has paid! Time to start creating\`;
  
  const content = \`
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #f0fdf4;">
        <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #166534; line-height: 1.3;">
          Payment Secured in Escrow
        </h1>
        <p style="margin: 0; font-size: 16px; color: #15803d;">
          The funds are safely locked. You can start creating!
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
          Hi \${creatorName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
          Great news! <strong>\${brandName}</strong> has successfully submitted their payment for your collaboration. 
          The funds are now securely held in Escrow by Creator Armour.
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">Next Steps:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Create the content according to the agreed brief.</li>
            <li style="margin-bottom: 8px;">Submit the content link on your Creator Armour dashboard.</li>
            <li>Once the brand approves, the funds will be released to your bank account.</li>
          </ul>
        </div>
        
        \${getPrimaryCTA('View Deal Details', 'https://noticebazaar.com/creator-dashboard')}
      </td>
    </tr>
  \`;

  const html = getEmailLayout({ content, backgroundStyle: 'green', preheaderText: \`\${brandName} has securely funded your escrow.\` });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Creator Armour Escrow <escrow@creatorarmour.com>',
        to: creatorEmail,
        subject,
        html,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(\`Resend API error: \${JSON.stringify(data)}\`);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('[EscrowEmailService] Failed to send email to creator:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to the brand when the creator submits content for review.
 */
export async function sendContentDeliveredEmailToBrand(deal: any) {
  if (!apiKey || apiKey === 'your_resend_api_key_here') return { success: false };

  const brandEmail = deal?.brand_email;
  const brandName = deal?.brand_name || 'Brand';
  const creatorName = deal?.creator_name || 'The creator';

  if (!brandEmail) return { success: false };

  const subject = `👀 ${creatorName} has submitted content for review!`;
  
  const content = `
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #f0fdf4;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎬</div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #166534; line-height: 1.3;">
          Content Ready for Review
        </h1>
        <p style="margin: 0; font-size: 16px; color: #15803d;">
          \${creatorName} has delivered the work.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
          Hi \${brandName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
          <strong>\${creatorName}</strong> has just submitted their content for your collaboration!
        </p>
        
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 15px; color: #9a3412; line-height: 1.6; text-align: center;">
            ⏳ You now have <strong>72 hours</strong> to review the content and either approve it or request changes. If no action is taken, the system may auto-approve the content.
          </p>
        </div>
        
        \${getPrimaryCTA('Review Content Now', 'https://noticebazaar.com/brand-dashboard')}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content, backgroundStyle: 'dark', preheaderText: \`\${creatorName} submitted content. Action required within 72 hours.\` });

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Creator Armour Approvals <approvals@creatorarmour.com>',
        to: brandEmail,
        subject,
        html,
      })
    });
    return { success: true };
  } catch (error) {
    console.error('[EscrowEmailService] Failed to send email to brand:', error);
    return { success: false };
  }
}


/**
 * Notify Creator that their payout has been released by the platform.
 */
export async function sendCreatorPaymentReleasedEmail(
  creatorEmail: string,
  creatorName: string,
  amount: number,
  utrNumber: string
) {
  if (!creatorEmail) return { success: false };

  const subject = `💸 Payout Released! ₹${amount.toLocaleString()} is on its way.`;
  
  const content = `
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #f0fdf4;">
        <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #166534; line-height: 1.3;">
          Money Disbursed!
        </h1>
        <p style="margin: 0; font-size: 16px; color: #15803d;">
          Your payout has been processed successfully.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
          Hi \${creatorName},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
          We have successfully released your payout for the collaboration. The funds should reflect in your registered bank account/UPI shortly.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 8px; font-size: 14px; color: #64748b;">Amount Released:</td>
              <td style="padding-bottom: 8px; font-size: 16px; font-weight: 700; color: #1e293b; text-align: right;">₹\${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; font-size: 14px; color: #64748b;">Reference (UTR):</td>
              <td style="padding-bottom: 8px; font-size: 14px; font-family: monospace; color: #1e293b; text-align: right;">\${utrNumber}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #64748b;">Status:</td>
              <td style="font-size: 14px; font-weight: 600; color: #16a34a; text-align: right;">PAID</td>
            </tr>
          </table>
        </div>
        
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.6; font-style: italic;">
          Note: Depending on your bank, it may take 2-4 hours to reflect in your statement.
        </p>
        
        \${getPrimaryCTA('View Payout History', 'https://noticebazaar.com/dashboard/payouts')}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content, backgroundStyle: 'green', preheaderText: `Your payout of ₹\${amount.toLocaleString()} has been released.` });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer \${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Creator Armour Payouts <payouts@creatorarmour.com>',
        to: creatorEmail,
        subject,
        html,
      })
    });

    return { success: response.ok };
  } catch (err) {
    console.error('[EmailService] Payout release email failed:', err);
    return { success: false };
  }
}

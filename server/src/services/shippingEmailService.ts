// @ts-nocheck
// Shipping email service: brand "update shipping" and creator "product shipped" emails
import {
  getEmailLayout,
  getEmailHeader,
  getPrimaryCTA,
  getEmailSignal,
  getFirstName,
} from './professionalEmailTemplates.js';

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'your_resend_api_key_here' || !apiKey.trim()) {
      console.error('[ShippingEmail] RESEND_API_KEY not configured');
      return { success: false, error: 'Email not configured' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) return { success: false, error: 'Invalid email' };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CreatorArmour <noreply@creatorarmour.com>',
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: (data as any).message || res.statusText };
    }
    return { success: true };
  } catch (e: any) {
    console.error('[ShippingEmail] Exception:', e);
    return { success: false, error: e?.message || 'Send failed' };
  }
}

export interface BrandShippingUpdateData {
  brandName: string;
  creatorName: string;
  productDescription: string;
  shippingLink: string;
}

/**
 * Brand email: "Action required – Ship product for your collaboration"
 * CTA: Update Shipping Details → /ship/{token}
 */
export async function sendBrandShippingUpdateEmail(
  brandEmail: string,
  data: BrandShippingUpdateData
): Promise<{ success: boolean; error?: string }> {
  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      Your barter collaboration with <strong>${data.creatorName}</strong> is confirmed. Please ship the product and update the shipping details so the creator can track the delivery.
    </p>
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>Status: SHIPPING_IN_PROGRESS</strong><br>
        <strong>Product:</strong> ${data.productDescription || 'As per agreement'}
      </p>
    </div>
    <p style="color: #4b5563; font-size: 14px; font-weight: 500;">
      Creators are notified instantly when tracking is added. Delaying shipment may affect delivery timelines and protection status.
    </p>
    <p style="color: #6b7280; font-size: 14px;">
      Use the button below to add courier name, tracking number, and tracking URL.
    </p>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Action required: Ship product</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.brandName},</h2>
          ${content}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.shippingLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;" target="_blank" rel="noopener noreferrer">Update Shipping Details</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    brandEmail,
    `Action required: Ship product to ${data.creatorName} (Collaboration Active)`,
    html
  );
}

export interface CreatorProductShippedData {
  creatorName: string;
  brandName: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
}

/**
 * Creator email: "Your barter product has been shipped"
 */
export async function sendCreatorProductShippedEmail(
  creatorEmail: string,
  data: CreatorProductShippedData
): Promise<{ success: boolean; error?: string }> {
  const mainContent = `
      <tr>
        <td style="background-color: #667eea; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📦 Product Shipped!</h1>
        </td>
      </tr>
      ${getEmailSignal({
    type: 'happened',
    message: 'The brand has shipped your product. Your deliverables timeline will activate once you confirm delivery.'
  })}
      <tr>
        <td style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
            Hi ${getFirstName(data.creatorName)},
          </p>
          <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
            <strong>${data.brandName}</strong> has marked your barter product as shipped. You can track your delivery using the details below.
          </p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="margin-bottom: 12px;">
              <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Courier</strong>
              <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${data.courierName}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</strong>
              <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${data.trackingNumber}</div>
            </div>
            ${data.trackingUrl ? `
            <div style="margin-top: 16px;">
              <a href="${data.trackingUrl}" style="color: #6366f1; text-decoration: none; font-weight: 600; font-size: 14px;">Track Delivery →</a>
            </div>
            ` : ''}
          </div>

          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 24px;">
            Reminder: Confirm receipt of the product in your dashboard as soon as it arrives. This ensures the timer for your deliverables starts accurately.
          </p>
          
          ${getPrimaryCTA('View Collaboration', `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts`)}
        </td>
      </tr>
    `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });

  return sendEmail(
    creatorEmail,
    'Product shipped — track your delivery',
    html
  );
}

/**
 * 7. Creator email: "Delivery confirmed — deliverables timeline activated"
 * Trigger: Creator clicks "Confirm Receipt"
 */
export async function sendCreatorDeliveryConfirmedEmail(
  creatorEmail: string,
  creatorName: string,
  brandName: string,
  dealId: string
): Promise<{ success: boolean; error?: string }> {
  const mainContent = `
    <tr>
      <td style="background-color: #10b981; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚚 Delivery Confirmed!</h1>
      </td>
    </tr>
    ${getEmailSignal({
    type: 'happened',
    message: 'Delivery confirmed — your deliverables timeline is now officially activated.'
  })}
    <tr>
      <td style="padding: 40px 30px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #2d3748; line-height: 1.6;">
          Hi ${getFirstName(creatorName)},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          You've confirmed receipt of the product from <strong>${brandName}</strong>. 
          As per your agreement, the countdown for your deliverables has started.
        </p>
        
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4a5568; line-height: 1.6;">
          Please ensure all content is submitted through the Creator Armour dashboard before the deadline to maintain your standing and protection.
        </p>
        
        ${getPrimaryCTA('View Timeline & Deliverables', `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/creator-contracts/${dealId}`)}
      </td>
    </tr>
  `;

  const html = getEmailLayout({ content: mainContent, showFooter: true });

  return sendEmail(
    creatorEmail,
    'Delivery confirmed — deliverables timeline activated',
    html
  );
}

export interface BrandShippingIssueData {
  brandName: string;
  creatorName: string;
  reason: string;
}

/**
 * Brand email when creator reports a shipping issue
 */
export async function sendBrandShippingIssueEmail(
  brandEmail: string,
  data: BrandShippingIssueData
): Promise<{ success: boolean; error?: string }> {
  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${data.creatorName}</strong> has reported an issue with the barter product shipment.
    </p>
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #991b1b; font-size: 14px; margin: 0;"><strong>Reason:</strong></p>
      <p style="color: #991b1b; font-size: 14px; margin: 8px 0 0 0;">${data.reason || 'No details provided.'}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      Please reach out to the creator to resolve this. You can also use legal support if needed.
    </p>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Shipping issue reported</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.brandName},</h2>
          ${content}
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    brandEmail,
    'Creator reported a shipping issue – barter collaboration',
    html
  );
}

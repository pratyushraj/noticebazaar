// Shipping email service: brand "update shipping" and creator "product shipped" emails

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
        <strong>Product / deal:</strong> ${data.productDescription || 'As per agreement'}
      </p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      Use the button below to add courier name, tracking number, and optional tracking URL. This link is valid for 14 days.
    </p>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Action required – Ship product</h1>
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
    'Action required – Ship product for your collaboration',
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
  const trackingBlock = data.trackingUrl
    ? `<p style="margin: 8px 0;"><a href="${data.trackingUrl}" style="color: #6366f1;">Track package</a></p>`
    : '';

  const content = `
    <p style="color: #4b5563; font-size: 16px;">
      <strong>${data.brandName}</strong> has marked your barter product as shipped.
    </p>
    <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #065f46; font-size: 14px; margin: 0;"><strong>Courier:</strong> ${data.courierName}</p>
      <p style="color: #065f46; font-size: 14px; margin: 8px 0 0 0;"><strong>Tracking:</strong> ${data.trackingNumber}</p>
      ${trackingBlock}
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      When you receive the product, confirm in your Creator Armour dashboard so your deliverables timeline can start.
    </p>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Product shipped</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.creatorName},</h2>
          ${content}
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    creatorEmail,
    'Your barter product has been shipped',
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

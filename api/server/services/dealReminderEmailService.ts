// Gentle reminder emails for "Brand hasn't signed yet" and "Deal pending for 7 days"
// Nudge both sides to improve completion rates and reduce chargebacks/disputes

const SUPPORT_EMAIL = 'support@creatorarmour.com';

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
      return { success: false, error: 'Resend API key is not configured' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return { success: false, error: 'Invalid email address format' };
    }
    const response = await fetch('https://api.resend.com/emails', {
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
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { success: false, error: errText || `Resend error: ${response.status}` };
    }
    const data = (await response.json()) as { id?: string; error?: { message: string } };
    if (data.id) return { success: true, emailId: data.id };
    return { success: false, error: data.error?.message || 'Failed to send email' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to send email' };
  }
}

/**
 * Send gentle reminder to brand: "You haven't signed yet — the creator is waiting."
 */
export async function sendBrandSigningReminderEmail(
  brandEmail: string,
  data: { creatorName: string; brandName: string; contractReadyUrl: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Quick reminder: Please sign the collaboration contract';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">Hi ${data.brandName || 'there'},</p>
  <p style="margin: 0 0 20px;">
    This is a gentle reminder that <strong>${data.creatorName}</strong> is waiting for you to sign the collaboration contract. Once you sign, you’re both protected and can move forward.
  </p>
  <p style="margin: 0 0 24px;">
    <a href="${data.contractReadyUrl}" style="display: inline-block; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Review & sign contract</a>
  </p>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">
    If you have questions or need help, reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea;">${SUPPORT_EMAIL}</a>. We’re here to help before any issue becomes a dispute.
  </p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">Creator Armour – Contracts and payments protected.</p>
</body>
</html>`;
  return sendEmail(brandEmail, subject, html);
}

/**
 * Send gentle reminder to brand: "Deal pending for 7 days — here’s the next step."
 */
export async function sendDealPendingReminderToBrand(
  brandEmail: string,
  data: { creatorName: string; brandName: string; contractReadyUrl?: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Your collaboration with ' + (data.creatorName || 'creator') + ' is still pending';
  const cta = data.contractReadyUrl
    ? `<p style="margin: 0 0 24px;"><a href="${data.contractReadyUrl}" style="display: inline-block; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Review & sign contract</a></p>`
    : '<p style="margin: 0 0 24px;">Check your inbox for the contract link from the creator, or ask them to resend it.</p>';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">Hi ${data.brandName || 'there'},</p>
  <p style="margin: 0 0 20px;">
    Your collaboration with <strong>${data.creatorName}</strong> has been pending for about a week. Completing the contract protects both of you and keeps the deal on track.
  </p>
  ${cta}
  <p style="margin: 0; font-size: 14px; color: #6b7280;">
    Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea;">${SUPPORT_EMAIL}</a> — we’re here before any issue becomes a dispute.
  </p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">Creator Armour – Contracts and payments protected.</p>
</body>
</html>`;
  return sendEmail(brandEmail, subject, html);
}

/**
 * Send gentle reminder to creator: "Deal pending for 7 days — nudge the brand or check in."
 */
export async function sendDealPendingReminderToCreator(
  creatorEmail: string,
  data: { creatorName: string; brandName: string; dashboardUrl: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const subject = 'Deal with ' + (data.brandName || 'brand') + ' is still pending';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="margin: 0 0 16px;">Hi ${data.creatorName || 'there'},</p>
  <p style="margin: 0 0 20px;">
    Your deal with <strong>${data.brandName}</strong> has been pending for about a week. If you haven’t already, consider sending the contract link again or following up with the brand — a gentle nudge often helps.
  </p>
  <p style="margin: 0 0 24px;">
    <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">View deal in dashboard</a>
  </p>
  <p style="margin: 0; font-size: 14px; color: #6b7280;">
    Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea;">${SUPPORT_EMAIL}</a> — we’re here before any issue becomes a dispute.
  </p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">Creator Armour – Contracts and payments protected.</p>
</body>
</html>`;
  return sendEmail(creatorEmail, subject, html);
}

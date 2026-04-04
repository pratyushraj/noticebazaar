import { supabase } from '../lib/supabase.js';
import { getEmailLayout, getEmailSignal, getPrimaryCTA } from './professionalEmailTemplates.js';

const SUPPORT_EMAIL = 'support@creatorarmour.com';

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_resend_api_key_here') {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: 'Invalid email address' };
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
  return { success: true };
}

function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function runPaymentOverdueReminders(opts?: { dryRun?: boolean }) {
  const dryRun = opts?.dryRun === true;
  const frontendUrl = (process.env.FRONTEND_URL || 'https://creatorarmour.com').replace(/\/$/, '');

  const todayIso = new Date().toISOString().slice(0, 10);

  // Deals that are past payment_expected_date and not marked received.
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('id, creator_id, brand_name, brand_email, deal_amount, payment_expected_date, payment_received_date, status')
    .is('payment_received_date', null)
    .lt('payment_expected_date', todayIso)
    .limit(200);

  if (error) throw new Error(error.message);
  const rows = (deals || []) as any[];

  let sent = 0;
  let skipped = 0;

  for (const deal of rows) {
    const brandEmail = String(deal.brand_email || '').trim();
    if (!brandEmail) {
      skipped++;
      continue;
    }

    // Throttle: don't send more than 1 reminder per 24h per deal.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('deal_action_logs')
      .select('id, created_at')
      .eq('deal_id', deal.id)
      .eq('event', 'PAYMENT_OVERDUE_REMINDER_SENT')
      .gte('created_at', since)
      .limit(1);
    if (recentLogs && recentLogs.length > 0) {
      skipped++;
      continue;
    }

    const dealUrl = `${frontendUrl}/deal/${deal.id}`;
    const amount = Number(deal.deal_amount || 0) || 0;
    const due = formatDate(deal.payment_expected_date);

    const subject = `Payment overdue: ${deal.brand_name || 'Brand'} • ₹${amount || ''}`;
    const content = `
      <tr>
        <td style="padding: 24px 32px 8px 32px;">
          <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #111827;">
            Quick payment reminder
          </p>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7;">
            This is a gentle reminder that a payment for your collaboration is overdue${due ? ` (expected by ${due})` : ''}.
          </p>
        </td>
      </tr>
      ${getEmailSignal({
        type: 'action',
        message: 'Please complete the payment or reply with an expected date so both sides stay aligned.',
      })}
      ${getPrimaryCTA('Open Deal Details', dealUrl)}
      <tr>
        <td style="padding: 0 32px 28px 32px;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
            Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #4f46e5; text-decoration: none;">${SUPPORT_EMAIL}</a>.
          </p>
        </td>
      </tr>
    `;
    const html = getEmailLayout({ content, showFooter: true, backgroundStyle: 'purple' });

    if (!dryRun) {
      const result = await sendEmail(brandEmail, subject, html);
      if (result.success) {
        sent++;
        await supabase.from('deal_action_logs').insert({
          deal_id: deal.id,
          user_id: deal.creator_id,
          event: 'PAYMENT_OVERDUE_REMINDER_SENT',
          metadata: { brand_email: brandEmail, payment_expected_date: deal.payment_expected_date },
        });
      } else {
        skipped++;
      }
    } else {
      sent++;
    }
  }

  return { success: true, dryRun, scanned: rows.length, sent, skipped };
}

import express, { Request, Response } from 'express';
import { Resend } from 'resend';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

const NOTIFY_EMAIL = 'creatorarmour07@gmail.com';
const FROM_EMAIL = 'Creator Armour Leads <outreach@creatorarmour.com>';

const cleanText = (value: unknown, max = 1000) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value: unknown) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

router.post('/', async (req: Request, res: Response) => {
  try {
    const brandName = cleanText(req.body?.brandName, 160);
    const workEmail = cleanText(req.body?.workEmail, 220).toLowerCase();
    const website = cleanText(req.body?.website, 300);
    const category = cleanText(req.body?.category, 120);
    const budget = cleanText(req.body?.budget, 120);
    const timeline = cleanText(req.body?.timeline, 120);
    const notes = cleanText(req.body?.notes, 2000);
    const source = cleanText(req.body?.source || 'brands_landing', 80);

    if (!brandName || !workEmail) {
      return res.status(400).json({ success: false, error: 'Brand name and work email are required.' });
    }

    if (!isValidEmail(workEmail)) {
      return res.status(400).json({ success: false, error: 'Enter a valid work email.' });
    }

    const payload = {
      brand_name: brandName,
      work_email: workEmail,
      website: website || null,
      category: category || null,
      budget: budget || null,
      timeline: timeline || null,
      notes: notes || null,
      source,
      status: 'new',
      user_agent: cleanText(req.headers['user-agent'], 500) || null,
      referrer: cleanText(req.headers.referer || req.headers.referrer, 500) || null,
    };

    const { data: inquiry, error: insertError } = await supabase
      .from('brand_inquiries' as any)
      .insert(payload as any)
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('[BrandInquiries] Failed to save inquiry:', insertError);
      return res.status(500).json({ success: false, error: 'Could not save inquiry.' });
    }

    const savedInquiry = inquiry as any;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const rows = [
        ['Brand', brandName],
        ['Work email', workEmail],
        ['Website / Instagram', website || 'Not shared'],
        ['Category', category || 'Not shared'],
        ['Budget', budget || 'Not shared'],
        ['Timeline', timeline || 'Not shared'],
        ['Source', source],
        ['Inquiry ID', savedInquiry?.id || ''],
      ];

      const htmlRows = rows
        .map(([label, value]) => `<tr><td style="padding:8px 12px;color:#64748b;font-weight:700;">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#0f172a;">${escapeHtml(value)}</td></tr>`)
        .join('');

      const { error: emailError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        reply_to: workEmail,
        subject: `New brand inquiry: ${brandName}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.55;color:#0f172a;">
            <h2 style="margin:0 0 12px;">New Creator Armour brand inquiry</h2>
            <table style="border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;">${htmlRows}</table>
            <h3 style="margin:24px 0 8px;">Creator requirement</h3>
            <p style="white-space:pre-wrap;background:#f8fafc;border-radius:12px;padding:14px;">${escapeHtml(notes || 'Not shared')}</p>
          </div>
        `,
      });

      if (emailError) {
        console.error('[BrandInquiries] Failed to send notification email:', emailError);
        return res.status(202).json({
          success: true,
          warning: 'Inquiry saved, but notification email failed.',
          id: savedInquiry?.id,
        });
      }
    } else {
      console.warn('[BrandInquiries] RESEND_API_KEY missing; inquiry saved without email notification.');
    }

    return res.status(201).json({ success: true, id: savedInquiry?.id });
  } catch (error: any) {
    console.error('[BrandInquiries] Unexpected error:', error);
    return res.status(500).json({ success: false, error: 'Could not submit inquiry.' });
  }
});

export default router;

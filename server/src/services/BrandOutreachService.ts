import { Resend } from 'resend';
import { supabase } from '../lib/supabase.js';

export class BrandOutreachService {
  /**
   * Send a personalized D2C pitch to a brand lead
   * Using a high-deliverability "Plain Text" style HTML template
   */
  static async sendD2CPitch(leadId: string) {
    if (!process.env.RESEND_API_KEY) {
        console.error('[Brand Outreach] Missing RESEND_API_KEY');
        throw new Error('Email service not configured');
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: lead, error } = await supabase
      .from('brand_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) throw new Error('Lead not found');

    const firstName = lead.contact_name || 'Team';
    const brandName = lead.brand_name;
    const niche = lead.category || 'D2C';

    // High-deliverability "Personal" template (minimal links, no big buttons)
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #374151; line-height: 1.6;">
        <p>Hi ${firstName},</p>
        
        <p>Came across <strong>${brandName}</strong> and really liked your brand positioning 👀</p>
        
        <p>I'm Pratyush from <strong>Creator Armour</strong>. We've built a curated network of creators specifically for D2C brands to help with:</p>
        
        <ul style="padding-left: 20px; color: #4b5563;">
          <li>High-quality UGC & Reels</li>
          <li>Barter collaborations (product for content)</li>
          <li>Aesthetic ad creatives</li>
        </ul>
        
        <p>Most of our creators are affordable, highly engaged, and comfortable creating authentic content for <strong>${niche}</strong> brands.</p>
        
        <p>Would love to share a few creator profiles that could fit your brand. Do you have a moment to chat or should I send over some profiles here?</p>
        
        <p>Best,<br>
        <strong>Pratyush Raj</strong><br>
        Founder, Creator Armour<br>
        <a href="https://creatorarmour.com" style="color: #10b981; text-decoration: none;">creatorarmour.com</a></p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          If you're not the right person for this, please let me know and I'll stop reaching out.
        </p>
      </div>
    `;

    const { data, error: sendError } = await resend.emails.send({
      from: 'Pratyush from Creator Armour <outreach@creatorarmour.com>',
      to: lead.email,
      reply_to: 'creatorarmour07@gmail.com',
      subject: `Content & UGC for ${brandName}`,
      html: emailHtml,
    });

    if (sendError) throw sendError;

    await supabase
      .from('brand_leads')
      .update({ 
        status: 'contacted', 
        outreach_count: (lead.outreach_count || 0) + 1,
        last_contacted_at: new Date().toISOString() 
      })
      .eq('id', leadId);

    return data;
  }

  /**
   * Daily batch: sends 10 emails
   */
  static async processDailyBatch() {
    const { data: leads } = await supabase
      .from('brand_leads')
      .select('id')
      .eq('status', 'pending')
      .limit(10);

    if (!leads || leads.length === 0) return { count: 0 };

    for (const lead of leads) {
      try {
        await this.sendD2CPitch(lead.id);
      } catch (err) {
        console.error(`Failed to send outreach for lead ${lead.id}:`, err);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    return { count: leads.length };
  }
}

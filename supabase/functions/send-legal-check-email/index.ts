import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the Calendly link once
const CALENDLY_LINK = 'https://calendly.com/noticebazaar/15-minute-legal-consultation';

// Define the personalized email templates
const getPersonalizedEmailTemplate = (companyType: string, firstName: string) => {
  let subject = `✅ We’ve received your Legal Health Check request`;
  let bodyHtml = '';

  switch (companyType) {
    case 'E-Commerce Business':
    case 'Retail / Offline Business':
      subject = `Your Legal Health Report — E-Commerce & Retail Compliance Review Inside`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thanks for completing your Legal Health Check with <strong>NoticeBazaar</strong>. Our experts reviewed your business for retail/e-commerce–specific compliance risks — from <strong>GST and TCS filings</strong> to <strong>consumer protection and trademark health</strong>.</p>
        <p style="font-size: 16px;">Here’s what we’ll share in your personalized report:</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li>Status of <strong>GST, UDYAM & company filings</strong></li>
          <li>Gaps in <strong>vendor contracts, influencer deals, and returns policy</strong></li>
          <li>Steps to protect your <strong>brand IP and trademarks</strong></li>
        </ul>
        <p style="font-size: 16px;">Stop guessing. Start growing — confidently.</p>
      `;
      break;
    case 'Manufacturing / Industrial':
    case 'Import / Export Business':
      subject = `Your Legal Health Report — Factory, Import/Export & Tax Compliance Status`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thank you for using <strong>NoticeBazaar’s Free Legal Health Check</strong>. Our compliance experts analyzed your manufacturing/import unit for potential risks related to:</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li><strong>Factory License, Pollution NOC, and Labour Law filings</strong></li>
          <li><strong>GST, TDS, and IEC compliance</strong></li>
          <li><strong>Vendor & supplier contract gaps</strong></li>
        </ul>
        <p style="font-size: 16px;">Your detailed Legal Health Report is being prepared and will help ensure every license, renewal, and return is in order.</p>
        <p style="font-size: 16px;">Stay compliant. Stay stress-free.</p>
      `;
      break;
    case 'Tech Startup / SaaS':
      subject = `Your Startup Legal Health Report — Funding & IP Compliance`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Congratulations on taking your startup’s legal health seriously! Our experts are reviewing your company across critical areas:</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li><strong>Founder & investor agreements</strong></li>
          <li><strong>IP, NDA, and software licensing</strong></li>
          <li><strong>ROC, GST, and income tax filings</strong></li>
          <li><strong>Data protection readiness</strong></li>
        </ul>
        <p style="font-size: 16px;">Once analyzed, you’ll receive a detailed report highlighting your <strong>funding readiness and compliance health</strong>.</p>
        <p style="font-size: 16px;">Let’s make your startup investor-ready.</p>
      `;
      break;
    case 'Real Estate / Construction':
      subject = `Your Real Estate Legal Health Report — RERA & Contract Review`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">We’ve received your Legal Health Check submission — thank you! Our experts are reviewing your real estate business for:</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li><strong>RERA registration and project compliance</strong></li>
          <li><strong>GST on construction and property sales</strong></li>
          <li><strong>Contract & vendor risk assessment</strong></li>
        </ul>
        <p style="font-size: 16px;">You’ll soon receive your customized report with clear next steps to stay fully compliant.</p>
        <p style="font-size: 16px;">Protect your projects. Protect your brand.</p>
      `;
      break;
    case 'Agency / Freelancer / Service Provider':
    case 'Professional (CA, CS, Doctor, Lawyer, etc.)':
      subject = `Your Legal Health Report — Contracts, GST & Client Safety`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thank you for completing your Legal Health Check! Our experts are reviewing your service-based business across:</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li><strong>Client & freelancer contracts</strong></li>
          <li><strong>GST, TDS, and business filings</strong></li>
          <li><strong>Trademark and brand protection</strong></li>
        </ul>
        <p style="font-size: 16px;">You’ll get a full report outlining gaps and legal fixes to safeguard your business.</p>
        <p style="font-size: 16px;">Secure your business before it scales.</p>
      `;
      break;
    case 'NGO / Non-Profit':
      subject = `Your NGO Legal Check Report – Make Sure You’re 100% Compliant`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thank you for requesting your <strong>Free Legal Check</strong> with <strong>NoticeBazaar</strong>. We noticed your organization is an <strong>NGO / Non-Profit</strong>, so our team has tailored a quick checklist specifically for your sector.</p>
        <p style="font-size: 16px;">Here are a few areas most NGOs miss (and risk penalties or funding issues later):</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li>✅ FCRA registration & renewal compliance</li>
          <li>✅ Annual filing with the NGO Darpan / MCA / Income Tax Department</li>
          <li>✅ Proper donor agreements and fund utilization policies</li>
          <li>✅ Board governance and meeting documentation</li>
          <li>✅ Employee and volunteer agreements</li>
        </ul>
        <p style="font-size: 16px;">We’ve created a <strong>free legal overview</strong> that helps you spot potential red flags before they become problems.</p>
        <p style="font-size: 16px;">If you’d like a quick 15-minute consultation with our legal team to discuss your compliance gaps, you can book it here:</p>
      `;
      break;
    case 'Other':
      subject = `Your Legal Health Check Results — Let’s Personalize It`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thank you for completing your <strong>Free Legal Health Check</strong> with <strong>NoticeBazaar</strong>. We noticed that your business doesn’t fit neatly into one of our predefined categories — and that’s perfectly fine. Every business has unique legal and compliance needs, and we’d love to tailor your report accordingly.</p>
        <p style="font-size: 16px;">To personalize your <strong>Legal Health Report</strong>, please reply with a few quick details:</p>
        <ul style="padding-left: 20px; font-size: 16px;">
          <li>✅ What type of business or activity do you operate?</li>
          <li>✅ Are you registered as a company, LLP, or sole proprietorship?</li>
          <li>✅ Do you currently manage GST, contracts, or employee agreements?</li>
        </ul>
        <p style="font-size: 16px;">Once we have these details, our legal experts will prepare a <strong>customized compliance summary</strong> and share actionable next steps — completely free.</p>
        <p style="font-size: 16px;">You can also book a <strong>15-min consultation</strong> directly here:</p>
      `;
      break;
    default:
      // Default template
      subject = `✅ We’ve received your Legal Health Check request`;
      bodyHtml = `
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thank you for completing your Free Legal Health Check with NoticeBazaar. 🎯</p>
        <p style="font-size: 16px;">Our legal team has received your details and will begin reviewing your company’s compliance across five key pillars:</p>
        <ol style="padding-left: 20px; font-size: 16px;">
          <li><strong>Compliance</strong> — GST, UDYAM, and Company Filings</li>
          <li><strong>Tax</strong> — GST, TDS, and ITR status</li>
          <li><strong>Risk</strong> — Missed deadlines or pending notices</li>
          <li><strong>Agreements</strong> — Key Vendor, Employee, and Client Contracts</li>
          <li><strong>IP Protection</strong> — Trademark & Brand Renewal</li>
        </ol>
        <p style="font-size: 16px;">We will send your Legal Health Report within 24 hours.</p>
        <p style="font-size: 16px;">If you’d like to discuss your report directly with a lawyer, you can also book a free 15-min consultation here:</p>
      `;
      break;
  }

  // Append the common CTA and footer
  const fullHtml = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h1 style="color: #3B82F6; font-size: 24px;">${subject}</h1>
      
      ${bodyHtml}

      <p style="margin-top: 15px; text-align: center;">
        <a href="${CALENDLY_LINK}" style="background-color: #FFD700; color: #1F2125; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">
          👉 Schedule Now
        </a>
      </p>
      
      <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">Thank you for trusting NoticeBazaar.</p>
      <p>We’re here to help you stay compliant and grow confidently.</p>

      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Warm regards,<br>
        <strong>Team NoticeBazaar</strong><br>
        <a href="mailto:support@noticebazaar.com" style="color: #3B82F6;">📩 support@noticebazaar.com</a><br>
        <a href="https://www.noticebazaar.com" style="color: #3B82F6;">🌐 www.noticebazaar.com</a>
      </p>
    </div>
  `;

  return { subject, html: fullHtml };
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    
    // Destructure all new and existing fields
    const { 
      fullName, email, phone, companyName, companyType, 
      businessStage, entityType, hasGst, hasClientVendorAgreements, 
      hasEmployeeAgreements, hasFiledAnnualReturns, ongoingDisputes, 
      debtRecoveryChallenge, preferredContactMethod, wantsConsultation 
    } = formData;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('CRITICAL: RESEND_API_KEY is missing.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Email API key missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const senderEmail = 'onboarding@noticebazaar.com';
    const firstName = fullName.split(' ')[0];

    const sendEmail = async (to: string, subject: string, html: string, isInternal: boolean) => {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `NoticeBazaar Onboarding <${senderEmail}>`,
                to: to,
                subject: subject,
                html: html,
            }),
        });

        const resendBody = await response.json();

        if (!response.ok) {
            console.error(`Resend API Error (${isInternal ? 'Internal' : 'External'}):`, response.status, resendBody);
            throw new Error(`Failed to send ${isInternal ? 'internal' : 'external'} email: ${resendBody.message || 'Unknown error'}`);
        }
        console.log(`Email successfully sent to ${to}.`);
    };

    // --- Email 1: Internal Notification to Legal Team ---
    const recipientEmailInternal = 'noticebazaar.legal@gmail.com';
    const subjectInternal = `🔥 HIGH PRIORITY LEAD: Legal Health Check from ${fullName} (${companyName || 'N/A'})`;
    
    const htmlContentInternal = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>New Legal Health Check Submission (Detailed)</h2>
        <p>A potential client has submitted the Free Legal Health Check form. Please review the details below for immediate follow-up.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; width: 35%;"><strong>Full Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Work Email ID:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Phone Number:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phone}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Company Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${companyName || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Business Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${companyType}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Business Stage:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${businessStage}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Entity Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${entityType}</td></tr>
        </table>

        <h3 style="margin-top: 20px;">Legal Health Snapshot:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; width: 70%;"><strong>Has GST Number?</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${hasGst}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Has Client/Vendor Agreements?</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${hasClientVendorAgreements}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Maintains Employee Agreements/NDAs?</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${hasEmployeeAgreements}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Filed Annual Returns (ITR/MCA/NGO)?</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${hasFiledAnnualReturns}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Debt Recovery Challenges?</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${debtRecoveryChallenge}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Ongoing Legal Issues/Disputes:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${ongoingDisputes || 'None reported'}</td></tr>
        </table>

        <h3 style="margin-top: 20px;">Follow-up Preferences:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2; width: 70%;"><strong>Preferred Contact Method:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${preferredContactMethod}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;"><strong>Wants Free 15-min Consultation?</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${wantsConsultation}</td></tr>
        </table>
        
        <p style="margin-top: 30px;">This lead was captured via the Free Legal Health Check landing page.</p>
      </div>
    `;

    // --- Email 2: External Confirmation to User (Dynamic Template) ---
    const recipientEmailExternal = email;
    const { subject: subjectExternal, html: htmlContentExternal } = getPersonalizedEmailTemplate(companyType, firstName);

    // Send both emails concurrently
    await Promise.all([
        sendEmail(recipientEmailInternal, subjectInternal, htmlContentInternal, true),
        sendEmail(recipientEmailExternal, subjectExternal, htmlContentExternal, false),
    ]);

    return new Response(JSON.stringify({ message: 'Submission received and both emails sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing legal check submission:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
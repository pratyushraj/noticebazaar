// Email service for contract signing notifications

import { supabase } from '../index.js';

export interface SignatureRecord {
  id: string;
  deal_id: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
}

/**
 * Send email notifications after contract is signed
 */
export async function sendContractSignedEmails(
  dealId: string,
  signature: SignatureRecord
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch deal and creator info
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select(`
        *,
        profiles!brand_deals_creator_id_fkey (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      console.error('[ContractSignedEmail] Error fetching deal:', dealError);
      return { success: false, error: 'Deal not found' };
    }

    const creator = (deal as any).profiles;
    if (!creator || !creator.email) {
      console.error('[ContractSignedEmail] Creator email not found');
      return { success: false, error: 'Creator email not found' };
    }

    const creatorName = creator.first_name && creator.last_name
      ? `${creator.first_name} ${creator.last_name}`
      : creator.first_name || 'Creator';

    const brandName = deal.brand_name || 'Brand';
    const dealAmount = deal.deal_amount || 0;
    const signedAt = new Date(signature.signed_at).toLocaleString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });

    // Send email to brand
    try {
      await sendBrandSignedEmail(
        signature.signer_email,
        signature.signer_name,
        brandName,
        creatorName,
        dealAmount,
        signedAt,
        dealId
      );
    } catch (brandEmailError) {
      console.error('[ContractSignedEmail] Failed to send brand email:', brandEmailError);
    }

    // Send email to creator
    try {
      await sendCreatorSignedEmail(
        creator.email,
        creatorName,
        brandName,
        signature.signer_name,
        dealAmount,
        signedAt,
        dealId
      );
    } catch (creatorEmailError) {
      console.error('[ContractSignedEmail] Failed to send creator email:', creatorEmailError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[ContractSignedEmail] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email to brand after signing
 */
async function sendBrandSignedEmail(
  email: string,
  signerName: string,
  brandName: string,
  creatorName: string,
  dealAmount: number,
  signedAt: string,
  dealId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.warn('[ContractSignedEmail] Resend API key not configured');
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CreatorArmour</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Agreement Signed Successfully</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Dear ${signerName},
          </p>
          <p style="color: #4b5563; font-size: 16px;">
            Your collaboration agreement with <strong>${creatorName}</strong> has been successfully signed and is now legally binding.
          </p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Deal Summary</h3>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Brand:</strong> ${brandName}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Creator:</strong> ${creatorName}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Deal Value:</strong> ₹${dealAmount.toLocaleString('en-IN')}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Signed At:</strong> ${signedAt}
            </p>
          </div>

          <p style="color: #4b5563; font-size: 16px;">
            This agreement is now active and both parties are legally bound by its terms.
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from CreatorArmour. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to: email,
      subject: 'Agreement Signed Successfully — CreatorArmour',
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }
}

/**
 * Send email to creator after brand signs
 */
async function sendCreatorSignedEmail(
  email: string,
  creatorName: string,
  brandName: string,
  signerName: string,
  dealAmount: number,
  signedAt: string,
  dealId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.warn('[ContractSignedEmail] Resend API key not configured');
    return;
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const dealUrl = `${baseUrl}/#/creator-contracts/${dealId}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CreatorArmour</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Brand Signed Your Agreement</h2>
          <p style="color: #4b5563; font-size: 16px;">
            Dear ${creatorName},
          </p>
          <p style="color: #4b5563; font-size: 16px;">
            Great news! <strong>${brandName}</strong> has signed your collaboration agreement. The agreement is now legally binding.
          </p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Deal Summary</h3>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Brand:</strong> ${brandName}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Signed By:</strong> ${signerName}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Deal Value:</strong> ₹${dealAmount.toLocaleString('en-IN')}
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;">
              <strong>Signed At:</strong> ${signedAt}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dealUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Deal Details
            </a>
          </div>

          <p style="color: #4b5563; font-size: 16px;">
            You can now proceed with content creation as per the agreement terms.
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email from CreatorArmour. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CreatorArmour <noreply@creatorarmour.com>',
      to: email,
      subject: 'Agreement Signed Successfully — CreatorArmour',
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
  }
}



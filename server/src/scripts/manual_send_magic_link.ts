import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseKey || !resendApiKey) {
    console.error('Missing credentials. Check .env');
    console.log('URL:', !!supabaseUrl, 'Key:', !!supabaseKey, 'Resend:', !!resendApiKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendApiKey);

const DEAL_ID = '2b640456-6762-42c8-b42b-40e5268edea4';

async function run() {
    console.log(`Processing deal: ${DEAL_ID}`);

    // 1. Fetch Deal
    const { data: deal, error: dealError } = await supabase
        .from('brand_deals')
        .select(`
            *,
            creator:profiles!brand_deals_creator_id_fkey(email, first_name)
        `)
        .eq('id', DEAL_ID)
        .single();

    if (dealError || !deal) {
        console.error('Deal not found:', dealError);
        // Fallback: try without explicit foreign key if name changed
        if (dealError) {
            const { data: dealFallback, error: fallbackError } = await supabase
                .from('brand_deals')
                .select('*')
                .eq('id', DEAL_ID)
                .single();

            if (fallbackError) {
                console.error('Fallback fetch failed:', fallbackError);
                return;
            }
            // Manually fetch creator
            const { data: creator } = await supabase.from('profiles').select('*').eq('id', dealFallback.creator_id).single();
            dealFallback.creator = creator;

            // Continue with dealFallback
            processDeal(dealFallback);
            return;
        }
        return;
    }

    processDeal(deal);
}

async function processDeal(deal: any) {
    console.log(`Found deal: ${deal.brand_name} - ${deal.deal_type}`);

    // 2. Determine Creator Email
    let creatorEmail = '';
    let creatorName = 'Creator';

    // Try from joined profile
    if (deal.creator) {
        if (deal.creator.email) creatorEmail = deal.creator.email;
        if (deal.creator.first_name) creatorName = deal.creator.first_name;
    }

    // Fallback: Fetch from auth users if possible (requires admin key, which we have)
    if (!creatorEmail && deal.creator_id) {
        try {
            const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(deal.creator_id);
            if (user && user.email) {
                creatorEmail = user.email;
                if (creatorName === 'Creator') creatorName = user.email.split('@')[0];
                console.log('Fetched email from Auth:', creatorEmail);
            }
        } catch (e) {
            console.error('Auth fetch failed:', e);
        }
    }

    if (!creatorEmail) {
        console.error('Could not find creator email. Aborting.');
        return;
    }

    console.log(`Sending to: ${creatorName} <${creatorEmail}>`);

    // 3. Generate Token
    // Invalidate old
    await supabase.from('creator_signing_tokens')
        .update({ is_valid: false })
        .eq('deal_id', DEAL_ID)
        .eq('is_valid', true);

    // Create new
    const { data: tokenData, error: tokenError } = await supabase
        .from('creator_signing_tokens')
        .insert({
            deal_id: DEAL_ID,
            creator_id: deal.creator_id,
            creator_email: creatorEmail,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_valid: true,
            // Ensure new columns are populated
            creator_otp_attempts: 0,
            creator_otp_verified: false,
            updated_at: new Date().toISOString()
        })
        .select('token')
        .single();

    if (tokenError || !tokenData) {
        console.error('Failed to create token:', tokenError);
        return;
    }

    const token = tokenData.token;
    console.log('Generated Token:', token);

    // 4. Send Email
    const link = `https://creatorarmour.com/creator-sign/${token}`;

    // Construct email (simplified from template)
    const subject = `Action required: Sign contract to lock this collaboration`;
    const html = `
    <div style="font-family: sans-serif; padding: 20px;">
        <h1>🎉 Brand Has Signed!</h1>
        <p>Hi ${creatorName},</p>
        <p><strong>${deal.brand_name || 'Brand'}</strong> has signed the agreement.</p>
        <p>Please sign early to lock the collaboration.</p>
        <a href="${link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Sign Agreement</a>
        <p>Or click here: <a href="${link}">${link}</a></p>
    </div>
    `;

    try {
        const data = await resend.emails.send({
            from: 'CreatorArmour <noreply@creatorarmour.com>',
            to: [creatorEmail],
            subject: subject,
            html: html
        });

        console.log('Email sent result:', data);
    } catch (e) {
        console.error('Email send failed:', e);
    }
}

run();

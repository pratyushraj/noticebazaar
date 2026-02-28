// @ts-nocheck
// Creator Signing Token Service
// Generates and validates magic link tokens for creator contract signing

import { supabase } from '../lib/supabase.js';

interface CreatorSigningToken {
    id: string;
    token: string;
    deal_id: string;
    creator_id: string;
    creator_email: string;
    expires_at: string;
    used_at: string | null;
    is_valid: boolean;
    created_at: string;
}

/**
 * Generate a new creator signing token
 */
export async function generateCreatorSigningToken(
    dealId: string,
    creatorId: string,
    creatorEmail: string
): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
        // Invalidate any existing tokens for this deal
        await supabase
            .from('creator_signing_tokens')
            .update({ is_valid: false })
            .eq('deal_id', dealId)
            .eq('is_valid', true);

        // Create new token
        const { data, error } = await supabase
            .from('creator_signing_tokens')
            .insert({
                deal_id: dealId,
                creator_id: creatorId,
                creator_email: creatorEmail,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                is_valid: true
            })
            .select('token')
            .single();

        if (error) {
            console.error('[CreatorSigningTokenService] Error creating token:', error);
            return { success: false, error: 'Failed to generate signing token' };
        }

        return { success: true, token: data.token };
    } catch (error: any) {
        console.error('[CreatorSigningTokenService] Exception:', error);
        return { success: false, error: error.message || 'Failed to generate token' };
    }
}

/**
 * Validate and retrieve token details
 */
export async function validateCreatorSigningToken(
    token: string
): Promise<{
    success: boolean;
    tokenData?: CreatorSigningToken;
    dealData?: any;
    error?: string
}> {
    try {
        // Fetch token with deal data
        const { data: tokenData, error: tokenError } = await supabase
            .from('creator_signing_tokens')
            .select(`
        *,
        deal:brand_deals(*)
      `)
            .eq('token', token)
            .eq('is_valid', true)
            .maybeSingle();

        if (tokenError) {
            console.error('[CreatorSigningTokenService] Token lookup error:', tokenError);
            return { success: false, error: 'Invalid or expired signing link' };
        }

        if (!tokenData) {
            return { success: false, error: 'This signing link is invalid or has already been used.' };
        }

        // Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            // Invalidate expired token
            await supabase
                .from('creator_signing_tokens')
                .update({ is_valid: false })
                .eq('id', tokenData.id);

            return { success: false, error: 'This signing link has expired. Please contact the brand for a new link.' };
        }

        // Check if already used
        if (tokenData.used_at) {
            return { success: false, error: 'This signing link has already been used.' };
        }

        const deal = (tokenData as any).deal;

        // Validate deal status
        if (deal.status !== 'SIGNED_BY_BRAND' && deal.status !== 'AWAITING_CREATOR_SIGNATURE') {
            return {
                success: false,
                error: 'This contract is not ready for signing. Current status: ' + deal.status
            };
        }

        // Check if creator already signed
        const { data: existingSignature } = await supabase
            .from('contract_signatures')
            .select('signed')
            .eq('deal_id', tokenData.deal_id)
            .eq('signer_role', 'creator')
            .eq('signed', true)
            .maybeSingle();

        if (existingSignature) {
            return { success: false, error: 'You have already signed this contract.' };
        }

        return {
            success: true,
            tokenData: tokenData as CreatorSigningToken,
            dealData: deal
        };
    } catch (error: any) {
        console.error('[CreatorSigningTokenService] Validation exception:', error);
        return { success: false, error: 'Failed to validate signing link' };
    }
}

/**
 * Mark token as used after successful signing
 */
export async function markTokenAsUsed(token: string): Promise<{ success: boolean }> {
    try {
        const { error } = await supabase
            .from('creator_signing_tokens')
            .update({
                used_at: new Date().toISOString(),
                is_valid: false
            })
            .eq('token', token);

        if (error) {
            console.error('[CreatorSigningTokenService] Error marking token as used:', error);
            return { success: false };
        }

        return { success: true };
    } catch (error) {
        console.error('[CreatorSigningTokenService] Exception marking token:', error);
        return { success: false };
    }
}

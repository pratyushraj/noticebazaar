import { supabase } from '../lib/supabase.js';
import crypto from 'crypto';

/**
 * Brand Auth Service
 * Handles automatic brand account creation and magic link generation.
 */

export interface BrandUserResult {
    userId: string;
    isNew: boolean;
    profileCreated: boolean;
}

/**
 * Finds or creates a brand user in auth.users and profiles.
 * Safe to call multiple times (idempotent).
 */
export async function findOrCreateBrandUser(email: string, brandName: string): Promise<BrandUserResult> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fast path: look up existing user by email via the profiles table (indexed).
    //    This avoids the catastrophically slow listUsers() full-table scan.
    let userId: string | undefined;
    let isNew = false;

    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role, business_name')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (existingProfile?.id) {
        userId = existingProfile.id;
    } else {
        // 2. profiles table may not have an email column on older schemas.
        //    Try a single-page auth admin lookup as fallback (page=1 only, fast).
        try {
            const { data: pageData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const found = (pageData?.users || []).find((u: any) => u.email?.toLowerCase() === normalizedEmail);
            if (found) userId = found.id;
        } catch {
            // Silently swallow; we'll attempt createUser below which is idempotent on duplicate email
        }
    }

    if (!userId) {
        // 3. Create new brand user account (frictionless registration)
        const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            email_confirm: true,
            user_metadata: {
                role: 'brand',
                full_name: brandName,
                business_name: brandName
            }
        });

        if (createError) {
            // If the user already exists (race condition), re-try the profile lookup
            if (createError.message?.toLowerCase().includes('already been registered') ||
                createError.message?.toLowerCase().includes('already exists')) {
                const { data: retryPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
                const found = (retryPage?.users || []).find((u: any) => u.email?.toLowerCase() === normalizedEmail);
                if (found) {
                    userId = found.id;
                } else {
                    console.error('[BrandAuth] Error creating brand user:', createError);
                    throw createError;
                }
            } else {
                console.error('[BrandAuth] Error creating brand user:', createError);
                throw createError;
            }
        } else {
            if (!newUser) throw new Error('Failed to create brand user');
            userId = newUser.id;
            isNew = true;
        }
    }

    // 4. Ensure profile has 'brand' role and business_name
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, business_name')
        .eq('id', userId)
        .maybeSingle();

    if (profile && profile.role !== 'brand') {
        await supabase
            .from('profiles')
            .update({
                role: 'brand',
                business_name: profile.business_name || brandName,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
    }

    return {
        userId: userId!,
        isNew,
        profileCreated: !!profile
    };
}

/**
 * Generates a magic link for a brand user.
 * Returns the full login URL.
 */
export async function generateBrandMagicLink(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
            redirectTo: `${process.env.FRONTEND_URL || 'https://creatorarmour.com'}/brand-dashboard?auth_callback=true`
        }
    });

    if (error) {
        console.error('[BrandAuth] Magic link generation failed:', error);
        throw error;
    }

    return data.properties.action_link;
}

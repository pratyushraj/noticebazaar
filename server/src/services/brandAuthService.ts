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

    // 1. Check if user already exists in auth (standard way for admin lookup by email)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('[BrandAuth] Error listing users:', listError);
        throw listError;
    }

    let authUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);
    let userId: string | undefined = authUser?.id;
    let isNew = false;

    if (!userId) {
        // 2. Create new user if not found
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
            console.error('[BrandAuth] Error creating brand user:', createError);
            throw createError;
        }

        if (!newUser) throw new Error('Failed to create brand user');

        userId = newUser.id;
        isNew = true;
    }

    // 3. Ensure profile has 'brand' role and business_name
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, business_name')
        .eq('id', userId)
        .single();

    if (profile && profile.role !== 'brand') {
        // If it was a lead or something else, update it to brand
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
        userId,
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

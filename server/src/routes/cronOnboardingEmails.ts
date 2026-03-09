// Onboarding Email sequence cron: find creators needing onboarding emails.
// Sequence:
// 1. Welcome activation (immediately after signup)
// 2. Profile completion reminder (after 1 day)
// 3. Collab link live/share (after 3 days)

import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import {
    sendWelcomeActivationEmail,
    sendProfileCompletionReminderEmail,
    sendCollabLinkLiveEmail
} from '../services/creatorOnboardingEmailService.js';

const router = Router();

// Durations for email sequence
const DAY_1_MS = 24 * 60 * 60 * 1000;
const DAY_3_MS = 3 * DAY_1_MS;

router.post('/onboarding-sequence', async (req: Request, res: Response) => {
    try {
        const secret = process.env.CRON_SECRET || process.env.DEAL_REMINDERS_CRON_SECRET;
        const authHeader = req.headers.authorization;
        const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const cronSecret = headerSecret || (req.headers['x-cron-secret'] as string) || null;

        if (secret && cronSecret !== secret) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, username, created_at, onboarding_emails_sent, last_onboarding_email_at')
            .eq('role', 'creator')
            .eq('onboarding_complete', false);

        if (profileError) {
            console.error('[CronOnboarding] Error fetching profiles:', profileError);
            return res.status(500).json({ success: false, error: profileError.message });
        }

        const results = { welcome: 0, profileCompletion: 0, linkReady: 0, errors: [] as string[] };
        const now = new Date();

        for (const profile of profiles) {
            const { id, first_name, last_name, username } = profile;
            const createdAt = new Date(profile.created_at || profile.updated_at || Date.now());
            const ageMs = now.getTime() - createdAt.getTime();
            const sentList = Array.isArray(profile.onboarding_emails_sent) ? profile.onboarding_emails_sent : [];

            // Get creator's email from auth.users (since it's not in public.profiles)
            let creatorEmail: string | null = null;
            try {
                const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
                if (!authError && authUser?.user?.email) {
                    creatorEmail = authUser.user.email;
                }
            } catch (err) {
                console.error(`[CronOnboarding] Failed to fetch email for account ${id}:`, err);
                continue;
            }

            if (!creatorEmail) {
                console.warn(`[CronOnboarding] No email for account ${id}, skipping.`);
                continue;
            }

            const creatorName = `${first_name || ''} ${last_name || ''}`.trim() || 'Creator';
            const lastSentAt = profile.last_onboarding_email_at ? new Date(profile.last_onboarding_email_at) : null;

            // Rule: Never send more than one onboarding email per 24 hours (anti-spam)
            if (lastSentAt && (now.getTime() - lastSentAt.getTime() < DAY_1_MS)) {
                continue;
            }

            let emailSent = false;
            let emailType: string | null = null;

            // 1. Welcome (Immediately / < 24h age)
            if (!sentList.includes('welcome')) {
                const r = await sendWelcomeActivationEmail({ creatorName, username, creatorEmail });
                if (r.success) {
                    emailSent = true;
                    emailType = 'welcome';
                    results.welcome++;
                } else results.errors.push(`welcome ${id}: ${r.error}`);
            }

            // 2. Profile Completion (after 1 day, age 24-72h)
            else if (!sentList.includes('profile_completion') && ageMs >= DAY_1_MS) {
                const r = await sendProfileCompletionReminderEmail({ creatorName, username, creatorEmail });
                if (r.success) {
                    emailSent = true;
                    emailType = 'profile_completion';
                    results.profileCompletion++;
                } else results.errors.push(`profile completion ${id}: ${r.error}`);
            }

            // 3. Collab Link Ready (after 3 days, age >= 72h)
            else if (!sentList.includes('link_ready') && ageMs >= DAY_3_MS) {
                const r = await sendCollabLinkLiveEmail({ creatorName, username, creatorEmail });
                if (r.success) {
                    emailSent = true;
                    emailType = 'link_ready';
                    results.linkReady++;
                } else results.errors.push(`link ready ${id}: ${r.error}`);
            }

            // Update the profile to track sent status
            if (emailSent && emailType) {
                await supabase
                    .from('profiles')
                    .update({
                        onboarding_emails_sent: [...sentList, emailType],
                        last_onboarding_email_at: now.toISOString()
                    })
                    .eq('id', id);
            }
        }

        return res.json({ success: true, sent: results });
    } catch (err: any) {
        console.error('[CronOnboarding] Fatal error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

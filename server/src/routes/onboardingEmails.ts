import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { sendWelcomeActivationEmail } from '../services/creatorOnboardingEmailService.js';

const router = Router();

/**
 * POST /api/onboarding-emails/welcome
 * Sends one welcome email to the authenticated creator after signup.
 * Idempotent: if already sent, it returns success without re-sending.
 */
router.post('/welcome', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userId = req.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, username, onboarding_emails_sent')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // Fresh signup flows can reach this endpoint before the profile row is readable.
      // Treat that as a non-fatal no-op so the browser does not surface a fake broken route.
      return res.status(202).json({ success: true, skipped: true, reason: 'profile_not_ready' });
    }

    const sentList = Array.isArray(profile.onboarding_emails_sent) ? profile.onboarding_emails_sent : [];
    if (sentList.includes('welcome')) {
      return res.json({ success: true, alreadySent: true });
    }

    let creatorEmail = req.user.email || null;
    if (!creatorEmail) {
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
      if (authUserError || !authUser?.user?.email) {
        return res.status(400).json({ success: false, error: 'Creator email not found' });
      }
      creatorEmail = authUser.user.email;
    }

    const creatorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator';
    const username = profile.username || 'creator';
    const emailResult = await sendWelcomeActivationEmail({
      creatorName,
      username,
      creatorEmail,
    });

    if (!emailResult?.success) {
      return res.status(502).json({
        success: false,
        error: emailResult?.error || 'Failed to send welcome email',
      });
    }

    await supabase
      .from('profiles')
      .update({
        onboarding_emails_sent: [...sentList, 'welcome'],
        last_onboarding_email_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return res.json({ success: true, alreadySent: false, emailId: emailResult.emailId || null });
  } catch (error: any) {
    console.error('[OnboardingEmails] Error sending welcome email:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

export default router;

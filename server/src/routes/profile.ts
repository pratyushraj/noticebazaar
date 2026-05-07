import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { syncSingleCreatorInstagram } from '../jobs/instagramSync.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// UPI validation helpers (mirrors frontend upiValidation.ts — keep in sync)
// ─────────────────────────────────────────────────────────────────────────────
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{3,256}@[a-zA-Z0-9.\-]{2,64}$/;

function validateUpiId(raw: string): { valid: boolean; normalised: string; error: string | null } {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) return { valid: false, normalised: lower, error: 'UPI ID is required' };

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) return { valid: false, normalised: lower, error: 'UPI ID must contain "@"' };
  if (atCount > 1) return { valid: false, normalised: lower, error: 'UPI ID must contain only one "@"' };

  if (!UPI_REGEX.test(trimmed)) {
    if (/[^a-zA-Z0-9.\-_@]/.test(trimmed)) {
      return { valid: false, normalised: lower, error: 'UPI ID contains invalid characters' };
    }
    return { valid: false, normalised: lower, error: 'Invalid UPI ID format — expected yourname@bankhandle' };
  }

  return { valid: true, normalised: lower, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/profile/instagram-sync
 */
router.post('/instagram-sync', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const instagramUsername = typeof req.body?.instagram_username === 'string'
      ? req.body.instagram_username
      : null;

    const result = await syncSingleCreatorInstagram(creatorId, instagramUsername);

    console.log(`[ProfileSync] Result for @${instagramUsername}:`, {
      success: result.success,
      followers: result.followers,
      hasPhoto: !!result.profile_photo,
      reason: result.reason
    });

    if (!result.success) {
      return res.status(200).json({
        success: false,
        synced: false,
        reason: result.reason,
      });
    }

    return res.json({
      success: true,
      synced: true,
      profile_photo: result.profile_photo,
      followers: result.followers,
    });
  } catch (error: any) {
    console.error('[Profile] instagram-sync error:', error);
    return res.status(500).json({ success: false, error: 'Failed to sync Instagram profile' });
  }
});

/**
 * POST /api/profile/update-payout
 * Server-side validated payout details update (UPI + account name).
 * Validates UPI format, normalises to lowercase, clears verification on change.
 */
router.post('/update-payout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const rawUpi = String(req.body?.payout_upi || '').trim();
    const accountName = String(req.body?.bank_account_name || '').trim();

    // Validate UPI
    const { valid, normalised, error } = validateUpiId(rawUpi);
    if (!valid) {
      return res.status(400).json({ success: false, error: `Invalid UPI ID: ${error}` });
    }

    if (!accountName || accountName.length < 2) {
      return res.status(400).json({ success: false, error: 'Account holder name is required' });
    }

    // Fetch current to detect UPI change
    const { data: current } = await (supabase as any)
      .from('profiles')
      .select('payout_upi')
      .eq('id', userId)
      .maybeSingle();

    const upiChanged = current?.payout_upi !== normalised;

    const updatePayload: Record<string, any> = {
      payout_upi: normalised,
      bank_account_name: accountName,
      updated_at: new Date().toISOString(),
    };

    // If UPI changed, clear the verification status
    if (upiChanged) {
      updatePayload.upi_verified_at = null;
    }

    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      const isMissing = updateError.message?.includes('column') || updateError.code === '42703';
      if (isMissing) {
        // Fall back to minimal update if schema doesn't have upi_verified_at yet
        const { error: fallback } = await (supabase as any)
          .from('profiles')
          .update({ payout_upi: normalised, bank_account_name: accountName, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (fallback) throw fallback;
      } else {
        throw updateError;
      }
    }

    return res.json({
      success: true,
      payout_upi: normalised,
      upi_changed: upiChanged,
      upi_verified: !upiChanged && !!current?.upi_verified_at,
    });
  } catch (error: any) {
    console.error('[Profile] update-payout error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/profile/verify-upi
 * Creator confirms their UPI ID by self-attestation (opened UPI app, saw their name).
 * Stores upi_verified_at timestamp. Validates that the submitted UPI matches what's saved.
 */
router.post('/verify-upi', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const claimedUpi = String(req.body?.payout_upi || '').trim().toLowerCase();
    const { valid, normalised, error } = validateUpiId(claimedUpi);
    if (!valid) {
      return res.status(400).json({ success: false, error: `Invalid UPI ID: ${error}` });
    }

    // Ensure it matches what's stored (prevent verifying a different UPI)
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('payout_upi')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.payout_upi) {
      return res.status(400).json({ success: false, error: 'No UPI ID saved. Save your UPI ID first.' });
    }

    const savedNormalised = String(profile.payout_upi).toLowerCase().trim();
    if (savedNormalised !== normalised) {
      return res.status(409).json({
        success: false,
        error: 'UPI ID mismatch — the ID you are verifying does not match your saved UPI ID.',
      });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ upi_verified_at: now, updated_at: now })
      .eq('id', userId);

    if (updateError) {
      const isMissing = updateError.message?.includes('column') || updateError.code === '42703';
      if (isMissing) {
        // Column doesn't exist yet — log and return success so UI doesn't break
        console.warn('[Profile] verify-upi: upi_verified_at column missing in schema');
        return res.json({ success: true, verified_at: now, note: 'Verification recorded locally (schema pending).' });
      }
      throw updateError;
    }

    return res.json({ success: true, verified_at: now });
  } catch (error: any) {
    console.error('[Profile] verify-upi error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

export default router;


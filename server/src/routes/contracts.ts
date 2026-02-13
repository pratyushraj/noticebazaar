// @ts-nocheck
// API endpoint for generating signed URLs for secure contract downloads
// This ensures contracts can only be accessed by authorized users with time-limited URLs

import express from 'express';
import { supabase } from '../index.js';
import { generateSignedDownloadUrl } from '../services/storage.js';

const router = express.Router();

/**
 * Generate a signed URL for downloading a contract
 * POST /api/contracts/signed-url
 * Body: { dealId: string }
 * Headers: Authorization: Bearer <token>
 */
router.post('/signed-url', async (req, res) => {
    try {
        const { dealId } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.substring(7);

        // Verify the user's session
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        if (!dealId) {
            return res.status(400).json({ error: 'Missing dealId' });
        }

        // Fetch the deal and verify user has access
        const { data: deal, error: dealError } = await supabase
            .from('brand_deals')
            .select('id, creator_id, contract_file_path, contract_file_url, signed_contract_path, signed_contract_url')
            .eq('id', dealId)
            .single();

        if (dealError || !deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        // Verify the user is the creator of this deal
        if (deal.creator_id !== user.id) {
            return res.status(403).json({ error: 'Forbidden: You do not have access to this contract' });
        }

        // Determine which file to provide (signed contract takes precedence)
        const filePath = deal.signed_contract_path || deal.contract_file_path;
        const fallbackUrl = deal.signed_contract_url || deal.contract_file_url;

        if (!filePath && !fallbackUrl) {
            return res.status(404).json({ error: 'No contract file available for this deal' });
        }

        // If we have a path, generate a signed URL (expires in 1 hour)
        if (filePath) {
            try {
                const signedUrl = await generateSignedDownloadUrl(filePath, 3600);
                return res.json({
                    success: true,
                    signedUrl,
                    expiresIn: 3600,
                    type: deal.signed_contract_path ? 'signed' : 'unsigned'
                });
            } catch (error) {
                console.error('[Contracts API] Failed to generate signed URL:', error);
                // Fall through to fallback URL if available
            }
        }

        // Fallback to public URL if path-based signed URL generation failed
        // This handles legacy contracts that only have public URLs
        if (fallbackUrl) {
            return res.json({
                success: true,
                signedUrl: fallbackUrl,
                expiresIn: null, // Public URLs don't expire
                type: deal.signed_contract_url ? 'signed' : 'unsigned',
                legacy: true // Indicates this is a legacy public URL
            });
        }

        return res.status(404).json({ error: 'No contract file available' });

    } catch (error) {
        console.error('[Contracts API] Error generating signed URL:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Generate a signed URL using a magic link token (for unauthenticated access)
 * POST /api/contracts/signed-url-token
 * Body: { token: string, type?: 'contract' | 'signed' }
 */
router.post('/signed-url-token', async (req, res) => {
    try {
        const { token, type = 'contract' } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Missing token' });
        }

        // Verify the token exists and is valid
        const { data: tokenData, error: tokenError } = await supabase
            .from('contract_ready_tokens')
            .select('deal_id, expires_at')
            .eq('token', token)
            .single();

        if (tokenError || !tokenData) {
            return res.status(404).json({ error: 'Invalid or expired token' });
        }

        // Check if token has expired
        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
            return res.status(403).json({ error: 'Token has expired' });
        }

        // Fetch the deal
        const { data: deal, error: dealError } = await supabase
            .from('brand_deals')
            .select('id, contract_file_path, contract_file_url, signed_contract_path, signed_contract_url')
            .eq('id', tokenData.deal_id)
            .single();

        if (dealError || !deal) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        // Determine which file to provide based on type
        const filePath = type === 'signed'
            ? (deal.signed_contract_path || deal.contract_file_path)
            : deal.contract_file_path;

        const fallbackUrl = type === 'signed'
            ? (deal.signed_contract_url || deal.contract_file_url)
            : deal.contract_file_url;

        if (!filePath && !fallbackUrl) {
            return res.status(404).json({ error: 'No contract file available' });
        }

        // Generate signed URL (expires in 1 hour)
        if (filePath) {
            try {
                const signedUrl = await generateSignedDownloadUrl(filePath, 3600);
                return res.json({
                    success: true,
                    signedUrl,
                    expiresIn: 3600,
                    type
                });
            } catch (error) {
                console.error('[Contracts API] Failed to generate signed URL:', error);
                // Fall through to fallback
            }
        }

        // Fallback to public URL
        if (fallbackUrl) {
            return res.json({
                success: true,
                signedUrl: fallbackUrl,
                expiresIn: null,
                type,
                legacy: true
            });
        }

        return res.status(404).json({ error: 'No contract file available' });

    } catch (error) {
        console.error('[Contracts API] Error generating signed URL with token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

// @ts-nocheck
// Creator Signing Token Routes
// Handles magic link validation and creator contract signing without login

import express, { Request, Response } from 'express';
import {
    validateCreatorSigningToken,
    markTokenAsUsed
} from '../services/creatorSigningTokenService.js';
import { signContractAsCreator } from '../services/contractSigningService.js';

const router = express.Router();

/**
 * GET /api/creator-sign/:token
 * Validate creator signing token and return deal details
 */
router.get('/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }

        const result = await validateCreatorSigningToken(token);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error || 'Invalid signing link'
            });
        }

        // Return token and deal data for frontend to display
        return res.json({
            success: true,
            tokenData: result.tokenData,
            dealData: result.dealData
        });
    } catch (error: any) {
        console.error('[CreatorSignRoutes] GET error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to validate signing link'
        });
    }
});

/**
 * POST /api/creator-sign/:token/sign
 * Sign contract using magic link token
 */
router.post('/:token/sign', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const {
            signerName,
            signerEmail,
            signerPhone,
            contractVersionId,
            contractSnapshotHtml,
            otpVerified,
            otpVerifiedAt
        } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }

        // Validate token first
        const validationResult = await validateCreatorSigningToken(token);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: validationResult.error || 'Invalid or expired signing link'
            });
        }

        const { tokenData, dealData } = validationResult;

        // Verify email matches
        if (signerEmail !== tokenData!.creator_email) {
            return res.status(403).json({
                success: false,
                error: 'Email address does not match the authorized signer for this contract'
            });
        }

        // Get IP and user agent for audit trail
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Sign the contract
        const signResult = await signContractAsCreator({
            dealId: tokenData!.deal_id,
            creatorId: tokenData!.creator_id,
            signerName,
            signerEmail,
            signerPhone,
            contractVersionId,
            contractSnapshotHtml,
            ipAddress,
            userAgent,
            otpVerified,
            otpVerifiedAt
        });

        if (!signResult.success) {
            return res.status(400).json({
                success: false,
                error: signResult.error || 'Failed to sign contract'
            });
        }

        // Mark token as used
        await markTokenAsUsed(token);

        return res.json({
            success: true,
            signature: signResult.signature
        });
    } catch (error: any) {
        console.error('[CreatorSignRoutes] POST sign error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to sign contract'
        });
    }
});

export default router;

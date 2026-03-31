/**
 * Auth Domain Routes
 * 
 * Express routes for authentication endpoints.
 * 
 * @module domains/auth/routes
 */

import { Router } from 'express';
import { AuthController } from './controller';
import { AuthService } from './service';
import { validateBody, validateParams, validateQuery, commonSchemas } from '../../shared/middleware/validate';
import {
  loginSchema,
  signupSchema,
  magicLinkSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  sessionRefreshSchema,
  emailVerifySchema,
  oauthProviderSchema,
} from './schemas';
import { z } from 'zod';

// Create router
const router = Router();

// Initialize service and controller
const authService = new AuthService();
const authController = new AuthController(authService);

/**
 * OAuth provider param validation
 */
const oauthProviderParamSchema = z.object({
  provider: oauthProviderSchema,
});

/**
 * @route POST /auth/login
 * @description Login with email and password
 * @access Public
 */
router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);

/**
 * @route POST /auth/signup
 * @description Create a new account
 * @access Public
 */
router.post(
  '/signup',
  validateBody(signupSchema),
  authController.signup
);

/**
 * @route POST /auth/magic-link
 * @description Request a magic link for passwordless login
 * @access Public
 */
router.post(
  '/magic-link',
  validateBody(magicLinkSchema),
  authController.sendMagicLink
);

/**
 * @route GET /auth/oauth/:provider
 * @description Initiate OAuth flow
 * @access Public
 */
router.get(
  '/oauth/:provider',
  validateParams(oauthProviderParamSchema),
  authController.initiateOAuth
);

/**
 * @route GET /auth/oauth/:provider/callback
 * @description Handle OAuth callback
 * @access Public
 */
router.get(
  '/oauth/:provider/callback',
  validateParams(oauthProviderParamSchema),
  authController.handleOAuthCallback
);

/**
 * @route POST /auth/logout
 * @description Sign out the current user
 * @access Private
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * @route POST /auth/password-reset
 * @description Request a password reset email
 * @access Public
 */
router.post(
  '/password-reset',
  validateBody(passwordResetRequestSchema),
  authController.requestPasswordReset
);

/**
 * @route POST /auth/password-reset/confirm
 * @description Confirm password reset with token
 * @access Public
 */
router.post(
  '/password-reset/confirm',
  validateBody(passwordResetConfirmSchema),
  authController.confirmPasswordReset
);

/**
 * @route POST /auth/verify-email
 * @description Verify email address with token
 * @access Public
 */
router.post(
  '/verify-email',
  validateBody(emailVerifySchema),
  authController.verifyEmail
);

/**
 * @route POST /auth/refresh
 * @description Refresh access token
 * @access Public
 */
router.post(
  '/refresh',
  validateBody(sessionRefreshSchema),
  authController.refreshToken
);

/**
 * @route GET /auth/session
 * @description Get current session info
 * @access Private
 */
router.get(
  '/session',
  authController.getSession
);

/**
 * @route POST /auth/change-password
 * @description Change password for authenticated user
 * @access Private
 */
router.post(
  '/change-password',
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;

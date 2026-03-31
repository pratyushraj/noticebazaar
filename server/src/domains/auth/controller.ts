/**
 * Auth Domain Controller
 * 
 * HTTP request handlers for authentication endpoints.
 * 
 * @module domains/auth/controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { ValidationError, AuthenticationError, ConflictError } from '../../shared/utils/errors';

/**
 * Auth controller class
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Login with email and password
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const result = await this.authService.login(email, password);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/signup
   * Create a new account
   */
  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, full_name, role } = req.body;
      
      const result = await this.authService.signup({
        email,
        password,
        fullName: full_name,
        role,
      });
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/magic-link
   * Request a magic link for passwordless login
   */
  sendMagicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, redirect_to } = req.body;
      
      await this.authService.sendMagicLink(email, redirect_to);
      
      res.status(200).json({
        success: true,
        message: 'Magic link sent to your email',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/oauth/:provider
   * Initiate OAuth flow
   */
  initiateOAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider } = req.params;
      const { redirect_to } = req.query;
      
      const authUrl = await this.authService.getOAuthUrl(
        provider as 'google' | 'apple' | 'facebook' | 'twitter',
        redirect_to as string | undefined
      );
      
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /auth/oauth/:provider/callback
   * Handle OAuth callback
   */
  handleOAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;
      
      if (!code || typeof code !== 'string') {
        throw new ValidationError('Authorization code is required');
      }
      
      const result = await this.authService.handleOAuthCallback(
        provider as 'google' | 'apple' | 'facebook' | 'twitter',
        code,
        state as string | undefined
      );
      
      // Redirect to frontend with session
      const redirectUrl = new URL(state as string || process.env.FRONTEND_URL || 'http://localhost:5173');
      redirectUrl.searchParams.set('access_token', result.access_token);
      redirectUrl.searchParams.set('refresh_token', result.refresh_token);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/logout
   * Sign out the current user
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        await this.authService.logout(token);
      }
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/password-reset
   * Request a password reset email
   */
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      
      await this.authService.requestPasswordReset(email);
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/password-reset/confirm
   * Confirm password reset with token
   */
  confirmPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      
      await this.authService.confirmPasswordReset(token, password);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/verify-email
   * Verify email address with token
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, type } = req.body;
      
      const result = await this.authService.verifyEmail(token, type);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body;
      
      const result = await this.authService.refreshSession(refresh_token);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /auth/session
   * Get current session info
   */
  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Session is attached by auth middleware
      const user = (req as any).user;
      
      if (!user) {
        throw new AuthenticationError('No active session');
      }
      
      res.status(200).json({
        success: true,
        data: {
          user,
          session: (req as any).session,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/change-password
   * Change password for authenticated user
   */
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { current_password, new_password } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AuthenticationError('Authentication required');
      }
      
      await this.authService.changePassword(userId, current_password, new_password);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;

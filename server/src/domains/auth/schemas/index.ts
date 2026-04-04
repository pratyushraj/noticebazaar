/**
 * Auth Domain Schemas
 * 
 * Zod validation schemas for authentication endpoints.
 * 
 * @module domains/auth/schemas
 */

import { z } from 'zod';

/**
 * Login credentials schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Signup credentials schema
 */
export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  role: z.enum(['creator', 'brand', 'lawyer']).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Magic link request schema
 */
export const magicLinkSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  redirect_to: z
    .string()
    .url('Invalid redirect URL')
    .optional(),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

/**
 * OAuth provider schema
 */
export const oauthProviderSchema = z.enum(['google', 'apple', 'facebook', 'twitter']);

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

/**
 * OAuth callback schema
 */
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

/**
 * OTP verification schema
 */
export const otpVerifySchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;

/**
 * Session refresh schema
 */
export const sessionRefreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export type SessionRefreshInput = z.infer<typeof sessionRefreshSchema>;

/**
 * Change password schema (for authenticated users)
 */
export const changePasswordSchema = z.object({
  current_password: z
    .string()
    .min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Email verification schema
 */
export const emailVerifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  type: z.enum(['signup', 'email_change', 'recovery']).optional(),
});

export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;

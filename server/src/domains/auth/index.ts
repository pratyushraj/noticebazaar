/**
 * Auth Domain
 * 
 * Exports for the authentication domain module.
 * 
 * @module domains/auth
 */

// Routes
export { default as authRoutes } from './routes';

// Controller
export { AuthController } from './controller';

// Service
export { AuthService } from './service';

// Schemas
export {
  loginSchema,
  signupSchema,
  magicLinkSchema,
  oauthProviderSchema,
  oauthCallbackSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  sessionRefreshSchema,
  emailVerifySchema,
  otpVerifySchema,
  type LoginInput,
  type SignupInput,
  type MagicLinkInput,
  type OAuthProvider,
  type OAuthCallbackInput,
  type PasswordResetRequestInput,
  type PasswordResetConfirmInput,
  type ChangePasswordInput,
  type SessionRefreshInput,
  type EmailVerifyInput,
  type OTPVerifyInput,
} from './schemas';

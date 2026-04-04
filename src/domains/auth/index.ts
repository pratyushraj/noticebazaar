/**
 * Auth Domain
 * 
 * Handles authentication, authorization, sessions, OAuth, and magic links.
 * 
 * @module domains/auth
 */

// Context
export { AuthProvider, useAuth } from './contexts/AuthContext';

// Types
export type { 
  AuthStatus, 
  AuthContextType, 
  OAuthProvider,
  LoginCredentials,
  SignupCredentials,
  MagicLinkRequest,
  OAuthCallbackResult,
  AuthStateChangeEvent
} from './types';

// Hooks
export { useOAuth, useMagicLink, useSession } from './hooks';

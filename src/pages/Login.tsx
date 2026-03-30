"use client";

import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LOGIN_LOADING_TIMEOUT_MS = 4000;
const DEMO_BRAND_EMAIL = 'brand-demo@noticebazaar.com';
const DEMO_BRAND_PASSWORD = 'BrandDemo123!@#';

const getDashboardPathForRole = (role?: string | null) => {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'brand') return '/brand-dashboard';
  if (role === 'chartered_accountant') return '/ca-dashboard';
  if (role === 'lawyer') return '/lawyer-dashboard';
  return '/creator-dashboard';
};

const Login = () => {
  const navigate = useNavigate();
  const { session, loading, profile } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // If session check takes too long (e.g. network/Supabase slow), show form so user isn't stuck
  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTimedOut(true), LOGIN_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    // Check for OAuth errors in query parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');

    if (error || errorCode || errorDescription) {
      console.error('[Login] OAuth error detected:', { error, errorCode, errorDescription });

      // Clean the URL immediately to prevent routing issues
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);

      // Show user-friendly error message
      let errorMessage = 'Google sign-in failed. Please try again.';

      if (errorDescription) {
        const decodedDescription = decodeURIComponent(errorDescription);
        if (decodedDescription.includes('Unable to exchange external code')) {
          errorMessage = 'Google sign-in timed out or was cancelled. Please try signing in again.';
        } else if (decodedDescription.includes('invalid_client')) {
          errorMessage = 'Google sign-in is temporarily unavailable. Please try again in a few minutes or use email/password.';
        } else if (decodedDescription.includes('access_denied')) {
          errorMessage = 'Google sign-in was cancelled. Please try again.';
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
      });

      // Clear any OAuth-related sessionStorage
      sessionStorage.removeItem('oauth_intended_route');

      return; // Don't proceed with normal OAuth callback handling
    }

    // If session loading is finished and a session exists, redirect.
    // But check if we're coming from OAuth callback first
    const hash = window.location.hash;
    const isOAuthCallback = hash.includes('access_token') ||
      hash.includes('type=recovery') ||
      hash.includes('type=magiclink') ||
      urlParams.get('code') !== null; // OAuth code in query params

    // Check if we just came from OAuth (check sessionStorage for OAuth intent)
    const hasOAuthIntent = sessionStorage.getItem('oauth_intended_route') !== null;

    // If we have a session and we're not in the middle of OAuth callback, redirect
    // Also wait a bit if we just came from OAuth to let SessionContext process it
	    if (!loading && session && !isOAuthCallback) {
	      // If we have OAuth intent, wait a bit longer for SessionContext to redirect
	      const delay = hasOAuthIntent ? 1000 : 200;
	      console.log('[Login] Session exists, redirecting to dashboard', { hasOAuthIntent, delay });
	      const timer = setTimeout(() => {
	        // If we're still on /login, do a role-based redirect as a fallback.
	        // (SessionContext should usually handle this, but this prevents brand users landing on creator routes.)
	        if (window.location.pathname === '/login') {
	          navigate(getDashboardPathForRole((profile as any)?.role), { replace: true });
	        }
	      }, delay);
	      return () => clearTimeout(timer);
	    }

    // If we're in OAuth callback but session isn't established yet, wait for it
    if (!loading && !session && (isOAuthCallback || hasOAuthIntent)) {
      console.log('[Login] OAuth callback detected, waiting for session...');
      // Wait up to 5 seconds for session to be established
      const maxWait = 5000;
      const startTime = Date.now();
      const checkSession = setInterval(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (currentSession) {
            console.log('[Login] Session established after OAuth, redirecting...');
            clearInterval(checkSession);
            // Let SessionContext handle the redirect, but if it doesn't, redirect here
	            setTimeout(() => {
	              const currentHash = window.location.hash;
	              if (currentHash.includes('access_token') || currentHash === '' || window.location.pathname === '/login') {
	                navigate(getDashboardPathForRole((profile as any)?.role), { replace: true });
	              }
	            }, 500);
	          } else if (Date.now() - startTime > maxWait) {
	            console.warn('[Login] Session not established after OAuth, timeout');
            clearInterval(checkSession);
          }
        });
      }, 200);

      return () => clearInterval(checkSession);
    }
	  }, [session, loading, navigate, profile]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('[Login] Email/password error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error('Failed to sign in: ' + error.message);
        }
      } else if (data.session) {
        // Don't show toast - AuthLoadingScreen will handle the transition
        // SessionContext will handle the redirect (role-based).
      }
    } catch (err: any) {
      console.error('[Login] Email/password exception:', err);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error('Failed to send password reset email: ' + error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error('[Login] Forgot password exception:', err);
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div
      className="nb-screen-height flex flex-col items-center justify-center bg-[#0B0F14] p-4 font-inter"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div
        className="w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 bg-slate-900/50 relative z-10"
        style={{ backdropFilter: 'blur(40px)' }}
      >
        {/* Branding */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">Creator Armour</h1>
        </div>

        {/* Title and Subtitle */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Sign In</h2>
          <p className="text-slate-400 text-[15px] font-medium leading-relaxed">Access your creator business OS to manage deals and payouts.</p>
        </div>

        {/* Loading: wait for session (with timeout so user isn't stuck) */}
        {loading && !loadingTimedOut && !session && (
          <div className="mb-6 flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" aria-hidden />
            <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Initializing OS...</p>
          </div>
        )}

        {/* Already signed in */}
        {session && (
          <div className="mb-6 space-y-4">
            <p className="text-slate-400 text-sm text-center font-medium">
              {loading ? 'Authenticating…' : "Session established. Launching dashboard…"}
            </p>
            <Button
              onClick={() => window.location.replace('/creator-dashboard')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* Timed out */}
        {loading && loadingTimedOut && !session && (
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest text-center mb-6">Network delay detected. Use credentials below.</p>
        )}

        {/* Primary: Email/Password Login */}
        {(!loading || loadingTimedOut) && !session && (
          <div className="mb-8">
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
                  Email Intelligence
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/85 border-slate-700 text-white placeholder:text-slate-300 text-[16px] h-14 rounded-2xl focus:border-emerald-500/50 focus:ring-emerald-500/20 px-5 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-slate-500 text-[11px] font-black uppercase tracking-widest">
                    Secure Access
                  </Label>
                  <button type="button"
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/85 border-slate-700 text-white placeholder:text-slate-300 text-[16px] h-14 rounded-2xl focus:border-emerald-500/50 focus:ring-emerald-500/20 px-5 transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>
	              <Button
	                type="submit"
	                disabled={isLoading || !email.trim() || !password.trim()}
	                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs mt-2"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  transform: 'translateZ(0)',
                }}
	              >
	                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
	                {isLoading ? 'Authenticating...' : 'Sign In To Armour'}
	              </Button>

                <button type="button"
                  type="button"
                  onClick={() => {
                    setEmail(DEMO_BRAND_EMAIL);
                    setPassword(DEMO_BRAND_PASSWORD);
                    toast.message('Demo brand credentials filled', {
                      description: 'Sign in to preview the Brand Console UI.',
                    });
                  }}
                  className="w-full h-12 rounded-2xl border border-slate-800 bg-white/5 hover:bg-white/10 text-white/80 font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.99]"
                >
                  Use Demo Brand Login
                </button>
	            </form>
	          </div>
	        )}

        {/* Secondary: Other Sign-in Methods */}
        {(!loading || loadingTimedOut) && !session && (
          <div className="mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-[#0B0F14] px-4 text-slate-600">Secure Vault Access</span>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  try {
                    const redirectUrl = `${window.location.origin}/creator-dashboard`;
                    sessionStorage.setItem('oauth_intended_route', 'creator-dashboard');
                    const { data, error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: redirectUrl,
                        queryParams: {
                          access_type: 'offline',
                          prompt: 'consent',
                        },
                      },
                    });
                    if (error) {
                      toast.error('Google sign-in error: ' + error.message);
                    } else if (data?.url) {
                      window.location.replace(data.url);
                    }
                  } catch (err: any) {
                    toast.error('Failed to start Google sign-in');
                  }
                }}
                variant="outline"
                className="w-full bg-white/5 border-slate-800 text-white hover:bg-white/10 rounded-2xl h-14 font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>
        )}

        {/* Sign Up Link */}
        {(!loading || loadingTimedOut) && !session && (
          <div className="text-center">
            <Link to="/signup" className="text-slate-400 hover:text-white transition-all text-[13px] font-medium group inline-flex items-center gap-2">
              Don't have an account? <span className="text-emerald-500 font-bold group-hover:underline">Start for free</span>
            </Link>
          </div>
        )}

        {/* Back to Homepage */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <Link to="/" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition-all text-[12px] font-black uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Exit To Homepage
          </Link>
        </div>
      </div>

      {/* Legal Text */}
      <div className="mt-10 text-center px-4 max-w-sm">
        <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
          Protected by Creator Armour Shield. By signing in, you agree to our{' '}
          <a href="/terms" className="text-slate-500 hover:text-emerald-500 transition-colors">Terms</a>
          {' '}&{' '}
          <a href="/privacy" className="text-slate-500 hover:text-emerald-500 transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

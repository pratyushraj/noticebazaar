"use client";

import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getErrorMessage = (error: unknown, fallback = 'An error occurred. Please try again.') =>
  error instanceof Error ? error.message : fallback;

const Login = () => {
  const { session, loading } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign In | Creator Armour';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', 'Sign in to see your brand offers, active deals, and payments in one place.');
  }, []);

  // Login page no longer owns redirect logic.
  // SessionContext + ProtectedRoute control all navigation after auth.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error') || urlParams.get('error_code') || urlParams.get('error_description');
    if (!error) return;

    // Clean URL to prevent loops (and keep the login screen usable).
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
    sessionStorage.removeItem('oauth_intended_route');
    toast.error('Sign-in failed. Please try again.');
  }, []);

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
    } catch (err: unknown) {
      console.error('[Login] Email/password exception:', err);
      toast.error(getErrorMessage(err));
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
    } catch (err: unknown) {
      console.error('[Login] Forgot password exception:', err);
      toast.error(getErrorMessage(err));
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
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div
        className="w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-border bg-background/50 relative z-10"
        style={{ backdropFilter: 'blur(40px)' }}
      >
        {/* Branding */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <ShieldCheck className="h-5 w-5 text-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Creator Armour</h1>
        </div>

        {/* Title and Subtitle */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-foreground mb-3 tracking-tight text-balance">Sign In</h2>
          <p className="text-muted-foreground text-[15px] font-medium leading-relaxed text-pretty">Enter your email and password to access your dashboard.</p>
        </div>

        {/* Loading: wait for session (with timeout so user isn't stuck) */}
        {loading && !session && (
          <div className="mb-6 flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase">Checking your sign-in...</p>
          </div>
        )}

        {/* Already signed in */}
        {session && (
          <div className="mb-6 space-y-4">
            <p className="text-muted-foreground text-sm text-center font-medium">
              {loading ? 'Authenticating…' : 'Signed in. Opening your dashboard…'}
            </p>
          </div>
        )}

        {/* Primary: Email/Password Login */}
        {!session && (
          <div className="mb-8">
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-[13px] font-bold ml-1">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/85 border-border text-foreground placeholder:text-muted-foreground/50 text-[17px] h-[56px] rounded-2xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:bg-background px-5 transition-all outline-none"
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-foreground/80 text-[13px] font-bold">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[13px] font-bold text-primary hover:text-primary/80 transition-colors py-1 px-2 -mr-2 rounded-lg hover:bg-primary/10 active:scale-95"
                    aria-label="Send password reset email"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/85 border-border text-foreground placeholder:text-muted-foreground/50 text-[17px] h-[56px] rounded-2xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:bg-background px-5 transition-all outline-none"
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
              </div>
	              <Button
	                type="submit"
	                disabled={isLoading || !email.trim() || !password.trim()}
	                className="w-full bg-primary hover:bg-primary text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-600/10 transition-all active:scale-[0.98] uppercase tracking-widest text-xs mt-2"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  transform: 'translateZ(0)',
                }}
	              >
	                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
	                {isLoading ? 'Authenticating...' : 'Open My Deals'}
	              </Button>

	            </form>
	          </div>
	        )}

        {/* Secondary: Other Sign-in Methods */}
        {!session && (
          <div className="mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-[#0B0F14] px-4 text-foreground/75 font-semibold">Or continue with</span>
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
                  } catch (err: unknown) {
                    toast.error(getErrorMessage(err, 'Failed to start Google sign-in'));
                  }
                }}
                variant="outline"
                className="w-full bg-card border-border text-foreground hover:bg-secondary/50 rounded-2xl h-14 font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
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
        {(!loading || true) && !session && (
          <div className="text-center">
            <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-all text-[13px] font-medium group inline-flex items-center gap-2">
              Don't have a brand account? <span className="text-primary font-bold group-hover:underline">Create a brand account →</span>
            </Link>
          </div>
        )}

        {/* Back to Homepage */}
        <div className="mt-8 pt-6 border-t border-border">
          <Link to="/" className="flex items-center justify-center gap-2 text-foreground/80 hover:text-foreground transition-all text-[12px] font-bold uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Exit To Homepage
          </Link>
        </div>
      </div>

      {/* Legal Text */}
      <div className="mt-10 text-center px-4 max-w-sm">
        <p className="text-muted-foreground text-[11px] leading-relaxed font-medium">
          Protected by Creator Armour Shield. By signing in, you agree to our{' '}
          <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
          {' '}&{' '}
          <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

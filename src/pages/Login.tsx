"use client";

import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBaseUrl } from '@/lib/utils/api';

const getErrorMessage = (error: unknown, fallback = 'An error occurred. Please try again.') =>
  error instanceof Error ? error.message : fallback;

const Login = () => {
  const { session, loading } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (!identifier.trim() || !password.trim()) {
      toast.error('Please enter your email or Instagram username and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success || !json?.session?.access_token || !json?.session?.refresh_token) {
        toast.error(json?.error || 'Failed to sign in');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });

      if (error) {
        console.error('[Login] Session set error:', error);
        toast.error(`Failed to establish session: ${error.message}`);
      }
    } catch (err: unknown) {
      console.error('[Login] Email/password exception:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier.trim() || !identifier.includes('@')) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
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
          <p className="text-muted-foreground text-[15px] font-medium leading-relaxed text-pretty">Enter your email or Instagram username and password to access your dashboard.</p>
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
                  Email or Instagram username
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="name@example.com or @yourhandle"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-background/85 border-border text-foreground placeholder:text-muted-foreground/50 text-[17px] h-[56px] rounded-2xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:bg-background px-5 transition-all outline-none"
                  required
                  autoComplete="username"
                  aria-label="Email or Instagram username"
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/85 border-border text-foreground placeholder:text-muted-foreground/50 text-[17px] h-[56px] rounded-2xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:bg-background px-5 pr-12 transition-all outline-none"
                    required
                    autoComplete="current-password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>
	              <Button
	                type="submit"
	                disabled={isLoading || !identifier.trim() || !password.trim()}
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


        {/* Sign Up Links */}
        {!session && (
          <div className="space-y-4 text-center">
            <div>
              <Link to="/signup?mode=creator" className="text-muted-foreground hover:text-foreground transition-all text-[13px] font-medium group inline-flex items-center gap-2">
                Don't have a creator account? <span className="text-primary font-bold group-hover:underline">Create a creator account →</span>
              </Link>
            </div>
            <div>
              <Link to="/signup?mode=brand" className="text-muted-foreground hover:text-foreground transition-all text-[13px] font-medium group inline-flex items-center gap-2">
                Don't have a brand account? <span className="text-primary font-bold group-hover:underline">Create a brand account →</span>
              </Link>
            </div>
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

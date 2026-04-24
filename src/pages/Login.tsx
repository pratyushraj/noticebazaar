"use client";

import { supabase } from '@/integrations/supabase/client';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBaseUrl } from '@/lib/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const getErrorMessage = (error: unknown, fallback = 'An error occurred. Please try again.') =>
  error instanceof Error ? error.message : fallback;

const Login = () => {
  const navigate = useNavigate();
  const { session, loading, profile, isAdmin, isBrand, isCreator } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Safety redirect: If session exists, we should move to dashboard
  useEffect(() => {
    if (session && !isLoading) {
      const metadata = session.user?.user_metadata || {};
      const role = profile?.role || metadata.role || metadata.account_mode || 'creator';
      const onboardingComplete = profile?.onboarding_complete ?? false;
      
      let path = '/creator-dashboard';
      if (role === 'brand') {
        path = onboardingComplete ? '/brand-dashboard' : '/brand-onboarding';
      } else if (role === 'admin') {
        path = '/admin-dashboard';
      } else if (role === 'lawyer') {
        path = '/lawyer-dashboard';
      } else if (role === 'chartered_accountant') {
        path = '/ca-dashboard';
      }
      
      console.log('[Login] Session detected, navigating to:', path);
      navigate(path, { replace: true });
    }
  }, [session, navigate, isLoading, profile?.role, profile?.onboarding_complete]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to sign in';
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          // Response is not JSON (like a 404 HTML page)
          errorMessage = `Server error (${response.status}): ${response.statusText || 'Endpoint not found'}`;
        }
        
        console.error(`[Login] API request failed with status ${response.status}:`, errorMessage);
        toast.error(errorMessage);
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!json?.success || !json?.session?.access_token || !json?.session?.refresh_token) {
        toast.error(json?.error || 'Invalid session received from server');
        return;
      }

      try {
        // Double check if we already have a session that matches (avoid unnecessary writes)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession?.access_token === json.session.access_token) {
          console.log('[Login] Session already exists and matches, skipping write');
        } else {
          await Promise.race([
            supabase.auth.setSession({
              access_token: json.session.access_token,
              refresh_token: json.session.refresh_token,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('SESSION_WRITE_TIMEOUT')), 5000)
            ),
          ]);
        }
      } catch (sessionError: any) {
        if (
          sessionError?.name === 'NavigatorLockAcquireTimeoutError' ||
          sessionError?.message?.includes('Lock') ||
          sessionError?.message === 'SESSION_WRITE_TIMEOUT'
        ) {
          console.warn('[Login] Session write timed out, proceeding with redirect fallback:', sessionError);
          // SessionContext will attempt to hydrate from storage/tokens on the next page
        } else {
          throw sessionError;
        }
      }

      const metadata = json.session.user?.user_metadata || {};
      const role = metadata.role || metadata.account_mode || 'creator';
      const onboardingComplete = json.session.user?.profile?.onboarding_complete ?? false;
      
      let path = '/creator-dashboard';
      if (role === 'brand') {
        path = onboardingComplete ? '/brand-dashboard' : '/brand-onboarding';
      } else if (role === 'admin') {
        path = '/admin-dashboard';
      }
      
      console.log('[Login] Navigating to:', path);
      navigate(path, { replace: true });
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
    <div className="min-h-screen bg-[#020D0A] text-white flex flex-col font-outfit relative overflow-hidden" 
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(24px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div 
          className="p-8 md:p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5 bg-[#0D1117]/60 relative overflow-hidden"
          style={{ backdropFilter: 'blur(32px)' }}
        >
          {/* Subtle top reflection */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Branding & Trust Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-4 group transition-transform hover:scale-110 active:scale-95 duration-300">
              <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">Creator Armour</h1>
            
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">Secure Fintech Login</span>
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back 👋</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Login to manage your deals & earnings
            </p>
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
          <div className="mb-6">
            <form onSubmit={handleEmailPasswordLogin} className="space-y-5">
              <div className="space-y-2 group">
                <Label htmlFor="identifier" className="text-slate-400 text-[12px] font-black uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                  Email or Username
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="name@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-white/[0.03] border-white/5 text-white placeholder:text-slate-600 text-[16px] h-[60px] rounded-2xl border-2 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:bg-white/[0.05] pl-12 pr-5 transition-all outline-none"
                    required
                    autoComplete="username"
                    aria-label="Email or Instagram username"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-slate-400 text-[12px] font-black uppercase tracking-widest transition-colors group-focus-within:text-primary">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/[0.03] border-white/5 text-white placeholder:text-slate-600 text-[16px] h-[60px] rounded-2xl border-2 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:bg-white/[0.05] pl-12 pr-12 transition-all outline-none"
                    required
                    autoComplete="current-password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[13px] font-bold text-slate-500 hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !identifier.trim() || !password.trim()}
                className="w-full bg-primary hover:bg-emerald-400 text-black font-black h-[60px] rounded-2xl shadow-[0_20px_40px_-12px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] text-[16px] mt-4 relative overflow-hidden group"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Authenticating...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center w-full"
                    >
                      Continue
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
              </Button>
            </form>
          </div>
        )}



        {/* Signup Options */}
        {!session && (
          <div className="space-y-6 pt-2">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">New here?</p>
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  to="/signup?mode=creator" 
                  className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group active:scale-95"
                >
                  <User className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[13px] font-black text-white">I'm a Creator</span>
                </Link>
                <Link 
                  to="/signup?mode=brand" 
                  className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all group active:scale-95"
                >
                  <ShieldCheck className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[13px] font-black text-white">I'm a Brand</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Bottom Link */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-6">
          <Link to="/" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors flex items-center gap-2 group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to homepage
          </Link>
        </div>
      </div>
    </motion.div>

      {/* Legal Footer */}
      <div className="mt-8 text-center px-4 max-w-[320px]">
        <p className="text-slate-600 text-[10px] leading-relaxed font-bold uppercase tracking-widest">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-slate-400 hover:text-primary transition-colors">Terms</a>
          {' '}&{' '}
          <a href="/privacy" className="text-slate-400 hover:text-primary transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

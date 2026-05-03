

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
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBaseUrl } from '@/lib/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

const getErrorMessage = (error: unknown, fallback = 'An error occurred. Please try again.') =>
  error instanceof Error ? error.message : fallback;

const Login = () => {
  const safeHaptic = (pattern = HapticPatterns.light) => {
    try {
      triggerHaptic(pattern);
    } catch (e) {
      // ignore
    }
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, loading, profile } = useSession();
  const [identifier, setIdentifier] = useState(searchParams.get('email') || searchParams.get('username') || '');
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error') || urlParams.get('error_code') || urlParams.get('error_description');
    if (!error) return;

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
      const trimmedIdentifier = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);
      let resolvedEmail = trimmedIdentifier;
      if (!isEmail) {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: trimmedIdentifier,
            password: '__resolve_only__',
          }),
        });
        if (!response.ok) {
          let errorMessage = 'Failed to resolve Instagram username';
          try {
            const errorJson = await response.json();
            errorMessage = errorJson.error || errorMessage;
          } catch (e) {
            errorMessage = `Server error (${response.status}): ${response.statusText || 'Endpoint not found'}`;
          }
          toast.error(errorMessage);
          return;
        }
        const json = await response.json().catch(() => ({}));
        resolvedEmail = String(json?.email || json?.resolved_email || '').trim();
        if (!resolvedEmail) {
          toast.error('Could not resolve that Instagram username to an email address');
          return;
        }
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error || !data.session || !data.user) {
        const message = error?.message || 'Invalid email/username or password';
        toast.error(message);
        return;
      }
      if (resolvedEmail) {
        // We let the useEffect handle the redirection based on the session and profile role
        // This ensures the user is sent to the correct dashboard (Brand, Creator, etc.)
        // without a split-second flash of the wrong one.
        console.log('[Login] Success, waiting for session redirect...');
      }
    } catch (err: unknown) {
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
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#020D0A] text-white flex flex-col items-center py-12 font-outfit relative overflow-x-hidden overflow-y-auto"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(48px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(48px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Dark Theme Force - Prevent white leak from LandingPage light class */}
      <style>{`
        html, body { background-color: #020D0A !important; }
        .light { --background: 222 15% 4% !important; }
      `}</style>

      {/* Premium Background Accents - Simplified for mobile stability */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 px-6"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-[22px] flex items-center justify-center mb-6 shadow-[0_20px_40px_rgba(16,185,129,0.3)] relative group"
          >
            <ShieldCheck className="h-8 w-8 text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          
          <h1 className="text-2xl font-black tracking-tighter text-white mb-1 uppercase italic">Creator Armour</h1>
          <div className="flex items-center gap-2">
            <span className="w-8 h-[1px] bg-emerald-500/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Securing your deals</p>
            <span className="w-8 h-[1px] bg-emerald-500/30" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          {/* Form Content */}
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Sign In</h2>
            <p className="text-white/40 text-[13px] font-medium mb-8">
              Welcome back to your mobile command center.
            </p>

            {loading && !session ? (
              <div className="py-10 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black tracking-[0.2em] text-emerald-500/60 uppercase">Syncing Session...</p>
              </div>
            ) : session ? (
              <div className="py-10 text-center">
                 <p className="text-emerald-400 text-sm font-black animate-pulse uppercase tracking-widest">
                   Access Granted
                 </p>
              </div>
            ) : (
              <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
                <div className="space-y-2 group">
                  <Label htmlFor="identifier" className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 transition-colors group-focus-within:text-emerald-400">
                    Email or Username
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Enter your handle"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      autoComplete="username"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[64px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 pl-12 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-white/40 text-[10px] font-black uppercase tracking-widest transition-colors group-focus-within:text-emerald-400">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      autoComplete="current-password"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[64px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 pl-12 pr-12 transition-all outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic();
                        setShowPassword(!showPassword);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-white/20 hover:text-white transition-all active:scale-90"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        safeHaptic();
                        handleForgotPassword();
                      }}
                      className="text-[11px] font-black uppercase tracking-widest text-white/20 hover:text-emerald-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !identifier.trim() || !password.trim()}
                  onClick={() => safeHaptic()}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black h-[64px] rounded-[22px] shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] text-[15px] mt-2 relative overflow-hidden group border-none uppercase tracking-widest"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : "Unlock Dashboard"}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {!session && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">New to the armoury?</p>
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  to="/signup?mode=creator" 
                  onClick={() => safeHaptic()}
                  className="flex flex-col items-center justify-center p-5 rounded-[30px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group active:scale-95"
                >
                  <User className="w-6 h-6 text-white/20 mb-2 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">Creator</span>
                </Link>
                <Link 
                  to="/signup?mode=brand" 
                  onClick={() => safeHaptic()}
                  className="flex flex-col items-center justify-center p-5 rounded-[30px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group active:scale-95"
                >
                  <ShieldCheck className="w-6 h-6 text-white/20 mb-2 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">Brand</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 flex flex-col items-center gap-6">
              <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Back to gateway
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-12 text-center px-6 max-w-[320px] relative z-10">
        <p className="text-white/10 text-[9px] leading-relaxed font-black uppercase tracking-[0.2em]">
          Secured by end-to-end encryption. By entering, you agree to our{' '}
          <a href="/terms-of-service" className="text-white/20 hover:text-emerald-400 transition-colors">Terms</a>
          {' '}&{' '}
          <a href="/privacy-policy" className="text-white/20 hover:text-emerald-400 transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

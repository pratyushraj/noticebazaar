
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ArrowLeft, Shield, TrendingUp, MessageCircle, Eye, EyeOff, Loader2, Link2 } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBaseUrl } from '@/lib/utils/api';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/utils/analytics';
import { triggerHaptic } from '@/lib/utils/haptics';
import type { Tables } from '@/types/supabase';
import { SmartIndustrySelector } from '@/components/brand/SmartIndustrySelector';

type ProfileRoleLookup = Pick<Tables<'profiles'>, 'role' | 'onboarding_complete'>;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isMissingColumnError = (error: { message?: string } | null | undefined) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('could not find')
  );
};

const getCreatorTargetPath = (profile?: ProfileRoleLookup | null) =>
  profile?.onboarding_complete ? '/creator-dashboard' : '/creator-onboarding';

const Signup = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountModeParam = (searchParams.get('mode') || '').toLowerCase();
  const accountMode: 'creator' | 'brand' = accountModeParam === 'brand' ? 'brand' : 'creator';
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandIndustry, setBrandIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupPhase, setSignupPhase] = useState<'idle' | 'creating' | 'provisioning' | 'opening'>('idle');

  useEffect(() => {
    document.title = accountMode === 'brand' ? 'Create Brand Account | CreatorArmour' : 'Create your creator link | CreatorArmour';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', accountMode === 'brand'
      ? 'Create a CreatorArmour brand account to send structured offers and manage creator deal workflows.'
      : 'Create your CreatorArmour account and get your creator link ready in 2 minutes.');
  }, [accountMode]);

  const profilesTable = supabase.from('profiles') as unknown as {
    update: (payload: {
      role?: string;
      business_name?: string;
      onboarding_complete?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
      instagram_handle?: string;
      open_to_collabs?: boolean;
    }) => {
      eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ProfileRoleLookup | null }>;
        single: () => Promise<{ data: { id: string } | null }>;
      };
    };
  };

  const ensureCreatorProfileSeed = async (
    userId: string,
    creatorName: string,
    creatorHandle: string,
  ) => {
    const cleanHandle = creatorHandle.replace(/^@+/, '').trim().toLowerCase();
    if (!cleanHandle) return;

    const nameParts = creatorName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Creator';
    const lastName = nameParts.slice(1).join(' ');

    // Poll for profile row to exist (it may not exist yet if DB trigger is slow).
    let profileExists = false;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data: existingProfile } = await profilesTable
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (existingProfile) {
        profileExists = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!profileExists) {
      console.warn('[Signup] Profile row not found after polling, skipping seed:', userId);
      return;
    }

    const updateAttempts = [
      {
        first_name: firstName,
        last_name: lastName,
        username: cleanHandle,
        instagram_handle: cleanHandle,
        open_to_collabs: true,
        onboarding_complete: true,
      },
      {
        first_name: firstName,
        last_name: lastName,
        username: cleanHandle,
        instagram_handle: cleanHandle,
        onboarding_complete: true,
      },
      {
        username: cleanHandle,
        instagram_handle: cleanHandle,
        onboarding_complete: true,
      },
      {
        username: cleanHandle,
        onboarding_complete: true,
      },
    ];

    for (const payload of updateAttempts) {
      const { error } = await profilesTable
        .update(payload)
        .eq('id', userId);

      if (!error) {
        return;
      }

      if (!isMissingColumnError(error)) {
        console.warn('[Signup] Failed to seed creator handle onto profile row:', error);
        return;
      }
    }

    console.warn('[Signup] Could not seed creator handle with current production schema');
  };

  const ensureBrandWorkspace = async (userId: string, emailToUse: string) => {
    const cleanBrandName = String(brandName || '').trim();
    const cleanIndustry = String(brandIndustry || '').trim() || 'Other';

    if (!cleanBrandName) throw new Error('Brand name is required');

    // Update profile role so ProtectedLayout allows brand routes.
    const { error: profileErr } = await profilesTable
      .update({
        role: 'brand',
        business_name: cleanBrandName,
        onboarding_complete: false,
      })
      .eq('id', userId);

    if (profileErr) {
      console.warn('[Signup] Failed to set profile role=brand:', profileErr);
      throw new Error('Failed to set up brand account');
    }

    // Ensure `brands` row exists (RLS is enabled, so use the backend service role).
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const apiBaseUrl = getApiBaseUrl();
        await fetch(`${apiBaseUrl}/api/brand-dashboard/identity`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanBrandName,
            industry: cleanIndustry,
          }),
        });
      }
    } catch (err) {
      console.warn('[Signup] Failed to ensure brand identity:', err);
    }
  };

  const triggerWelcomeEmail = async (accessToken: string) => {
    const endpointDisabledKey = 'welcome_email_endpoint_unavailable';
    if (typeof window !== 'undefined' && sessionStorage.getItem(endpointDisabledKey) === 'true') {
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/onboarding-emails/welcome`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Best-effort enhancement: in fresh signups the session/profile may not be ready yet,
      // and some environments may not expose this endpoint. Treat auth/not-found as non-fatal.
      if ([401, 403, 404].includes(response.status)) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(endpointDisabledKey, 'true');
        }
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.warn('[Signup] Welcome email trigger failed:', payload?.error || response.statusText);
      }
    } catch (error) {
      console.warn('[Signup] Welcome email trigger network failure:', error);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    if (pwd.length < 6) return { strength: 1, label: 'Too short', color: 'bg-red-500' };
    if (pwd.length < 8) return { strength: 2, label: 'Weak', color: 'bg-yellow-500' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { strength: 3, label: 'Fair', color: 'bg-emerald-500' };
    return { strength: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordHelper =
    password.length === 0
      ? 'At least 6 characters. Stronger: add 1 uppercase + 1 number.'
      : passwordStrength.label
        ? `Password strength: ${passwordStrength.label}`
        : 'At least 6 characters.';

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !value.includes('@')) {
      setEmailError('Please enter a valid email address');
    } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  useEffect(() => {
    // Check for OAuth errors in query parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');

    if (error || errorCode || errorDescription) {
      console.error('[Signup] OAuth error detected:', { error, errorCode, errorDescription });

      // Clean the URL immediately to prevent routing issues
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);

      // Show user-friendly error message
      let errorMessage = 'Google sign-up failed. Please try again.';

      if (errorDescription) {
        const decodedDescription = decodeURIComponent(errorDescription);
        if (decodedDescription.includes('Unable to exchange external code')) {
          errorMessage = 'Google sign-up timed out or was cancelled. Please try signing up again.';
        } else if (decodedDescription.includes('invalid_client')) {
          errorMessage = 'Google sign-up is temporarily unavailable. Please try again in a few minutes or use email/password.';
        } else if (decodedDescription.includes('access_denied')) {
          errorMessage = 'Google sign-up was cancelled. Please try again.';
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
      });

      // Clear any OAuth-related sessionStorage
      sessionStorage.removeItem('oauth_intended_route');

      return; // Don't proceed with normal session handling
    }

    // If session loading is finished and a session exists, redirect.
    // But don't redirect if we're in the middle of signup (let signup handler manage it)
    if (session && !isLoading) {
      // Check if we just signed up - if so, let the signup handler manage redirect
      const justSignedUp = sessionStorage.getItem('just_signed_up') === 'true';

      if (!justSignedUp) {
        // Wait a moment for profile to be created by database trigger
        const timer = setTimeout(async () => {
          // Session has user; redirect to intended route (e.g. after Google login) or role dashboard.
          if (session?.user) {
            const intendedRoute = sessionStorage.getItem('oauth_intended_route');
            let fallbackPath = accountMode === 'brand' ? '/brand-dashboard' : '/creator-onboarding';
            try {
              const { data: p } = await profilesTable
                .select('role, onboarding_complete')
                .eq('id', session.user.id)
                .maybeSingle();
              if (p?.role === 'brand') fallbackPath = '/brand-dashboard';
              if (p?.role && p.role !== 'brand') fallbackPath = getCreatorTargetPath(p);
            } catch {
              // ignore
            }

            const path = intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup'
              ? `/${intendedRoute}`
              : fallbackPath;
            sessionStorage.removeItem('oauth_intended_route');
            navigate(path, { replace: true });
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [session, loading, navigate, isLoading, accountMode]);

  const handleEmailPasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedHandle = instagramHandle.replace(/^@+/, '').trim().toLowerCase();

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Please enter your name, email, and password');
      return;
    }
    if (accountMode === 'brand' && !brandName.trim()) {
      toast.error('Please enter your brand name');
      return;
    }

    // Capture values before any state resets; used in delayed callbacks.
    const emailAtSignup = email.trim();
    const passwordAtSignup = password;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAtSignup)) {
      toast.error('Please enter a valid email address');
      setEmailError('Invalid email format');
      return;
    }

    if (accountMode === 'creator' && normalizedHandle && normalizedHandle.length > 0 && normalizedHandle.length < 3) {
      toast.error('Instagram username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setSignupPhase('creating');
    void trackEvent('signup_started', { mode: accountMode, method: 'email' });
    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase.auth.signUp({
        email: emailAtSignup,
        password: password,
        options: {
          // Email confirmation link should land on onboarding which can finalize link creation automatically.
          emailRedirectTo: `${window.location.origin}/${accountMode === 'brand' ? 'brand-dashboard' : 'creator-onboarding'}`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: name.trim(),
            instagram_handle: accountMode === 'creator' ? (normalizedHandle || undefined) : undefined,
            account_mode: accountMode,
            brand_name: accountMode === 'brand' ? brandName.trim() : undefined,
          },
        },
      });

      if (error) {
        console.error('[Signup] Email/password signup error:', error);
        // Check for various error types
        const errorMsg = error.message.toLowerCase();
        const errorCode = error.status?.toString() || '';

        // Invalid email format
        if (errorMsg.includes('email address') && errorMsg.includes('invalid')) {
          toast.error('Invalid email address', {
            description: 'Please check your email address and try again.',
            duration: 5000,
          });
          setEmailError('Invalid email format');
          return;
        }

        // User already exists
        if (
          errorMsg.includes('user already registered') ||
          errorMsg.includes('already registered') ||
          errorMsg.includes('email already exists') ||
          errorMsg.includes('user already exists') ||
          errorMsg.includes('already been registered') ||
          errorMsg.includes('duplicate') ||
          errorCode === '422' ||
          error.status === 422
        ) {
          toast.error('An account with this email already exists.', {
            description: 'Would you like to sign in instead?',
            action: {
              label: 'Sign In',
              onClick: () => {
                setShowLogin(true);
                // Pre-fill email
                setEmail(emailAtSignup);
              },
            },
            duration: 5000,
          });
          setShowLogin(true);
        } else {
          // Generic error - show user-friendly message
          toast.error('Failed to sign up', {
            description: error.message || 'Please check your information and try again.',
            duration: 5000,
          });
        }
      } else if (data.user) {
        // Supabase signUp returns user even if already exists in some cases
        // Check if identities array is empty (indicates user already existed)
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error('An account with this email already exists.', {
            description: 'Would you like to sign in instead?',
            action: {
              label: 'Sign In',
              onClick: () => {
                setShowLogin(true);
                setEmail(emailAtSignup);
              },
            },
            duration: 5000,
          });
          setShowLogin(true);
        } else {
          // New user was created
          // Email confirmation is disabled - proceed immediately
          // Mark that we just signed up to prevent useEffect from redirecting
          sessionStorage.setItem('just_signed_up', 'true');

          toast.success('Account created successfully!', {
            description: 'Setting up your account...',
            duration: 2000,
          });
          void trackEvent('signup_completed', { mode: accountMode, method: 'email' });
          if (accountMode === 'creator') {
            void trackEvent('creator_signed_up', { method: 'email' });
          }

          // Clear form immediately (this also prevents accidental re-submits).
          setName('');
          setEmail('');
          setPassword('');
          setEmailError('');

          // Fast path: establish session (with a short retry), then redirect right away.
          // Users should never be left on the signup form after seeing "Account created".
          setSignupPhase('provisioning');
          const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
          const waitForSession = async () => {
            for (let i = 0; i < 8; i++) {
              const { data: { session: s } } = await supabase.auth.getSession();
              if (s) return s;
              await wait(250);
            }
            return null;
          };

          let sessionNow = await waitForSession();
          if (!sessionNow) {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: emailAtSignup,
              password: passwordAtSignup,
            });
            sessionNow = signInData.session || null;
          }

          if (!sessionNow) {
            sessionStorage.removeItem('just_signed_up');
            toast.info('Account created! Please sign in to continue', {
              description: 'We could not open your account automatically.',
              duration: 5000,
            });
            setShowLogin(true);
            setEmail(emailAtSignup);
            return;
          }

          // Fire-and-forget: welcome email trigger
          void triggerWelcomeEmail(sessionNow.access_token);

          sessionStorage.removeItem('just_signed_up');
          setSignupPhase('opening');
          if (accountMode === 'brand') {
            await ensureBrandWorkspace(sessionNow.user.id, emailAtSignup);
            navigate('/brand-onboarding', { replace: true });
          } else {
            // Onboarding will persist handle automatically (and never blocks the CTA).
            navigate('/creator-onboarding', { replace: true });
          }
        }
      }
    } catch (err: unknown) {
      console.error('[Signup] Email/password signup exception:', err);
      const errMsg = getErrorMessage(err, '').toLowerCase();
      if (
        errMsg.includes('user already registered') ||
        errMsg.includes('already registered') ||
        errMsg.includes('email already exists')
      ) {
        toast.error('An account with this email already exists.', {
          description: 'Would you like to sign in instead?',
          action: {
            label: 'Sign In',
            onClick: () => {
              setShowLogin(true);
              setEmail(email.trim());
            },
          },
          duration: 5000,
        });
        setShowLogin(true);
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
      // Don't reset the phase if we're mid-provisioning; that causes "Account created" toasts
      // without any visible progress/redirect for slow sessions.
      const justSignedUp = sessionStorage.getItem('just_signed_up') === 'true';
      if (!justSignedUp) setSignupPhase('idle');
    }
  };

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
        console.error('[Signup] Email/password error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error('Failed to sign in: ' + error.message);
        }
      } else if (data.session) {
        // Fast path: navigate immediately based on metadata or fallback
        const metadata = data.session.user?.user_metadata || {};
        const role = metadata.role || metadata.account_mode || accountMode;
        
        let path = '/creator-dashboard';
        if (role === 'brand') {
          path = '/brand-dashboard';
        }

        // We still try to get the real profile role for better precision if it's quick
        try {
          const { data: p } = await profilesTable
            .select('role, onboarding_complete')
            .eq('id', data.session.user.id)
            .maybeSingle();
          
          if (p?.role === 'brand') {
            path = p.onboarding_complete ? '/brand-dashboard' : '/brand-onboarding';
          } else if (p?.role) {
            path = p.onboarding_complete ? '/creator-dashboard' : '/creator-onboarding';
          }
        } catch (e) {
          console.warn('[Signup] Profile lookup failed, using fallback path:', path);
        }

        console.log('[Signup] Login success, navigating to:', path);
        window.location.href = path;
      }
    } catch (err: unknown) {
      console.error('[Signup] Email/password exception:', err);
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
    } catch (err: unknown) {
      console.error('[Signup] Forgot password exception:', err);
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#020D0A] text-white relative flex items-center justify-center p-6 font-outfit overflow-x-hidden overflow-y-auto"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(24px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Premium Background Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-[22px] flex items-center justify-center mb-6 shadow-[0_20px_40px_rgba(16,185,129,0.3)] relative group"
          >
            <ShieldCheck className="h-8 w-8 text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <h1 className="text-2xl font-black tracking-tighter text-white mb-1 uppercase italic">CreatorArmour</h1>
          <div className="flex items-center gap-2">
            <span className="w-8 h-[1px] bg-emerald-500/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Securing your future</p>
            <span className="w-8 h-[1px] bg-emerald-500/30" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            {/* Toggle Mode */}
            {!showLogin && (
              <div className="mb-8">
                <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.();
                      const next = new URLSearchParams(searchParams);
                      next.set('mode', 'creator');
                      setSearchParams(next, { replace: true });
                    }}
                    className={cn(
                      'flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                      accountMode === 'creator'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-transparent text-white/40 hover:text-white'
                    )}
                  >
                    Creator
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.();
                      const next = new URLSearchParams(searchParams);
                      next.set('mode', 'brand');
                      setSearchParams(next, { replace: true });
                    }}
                    className={cn(
                      'flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                      accountMode === 'brand'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-transparent text-white/40 hover:text-white'
                    )}
                  >
                    Brand
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              {showLogin ? 'Welcome back' : `Create ${accountMode} account`}
            </h2>
            <p className="text-white/40 text-[13px] font-medium mb-8 leading-relaxed">
              {showLogin 
                ? 'Sign in to access your dashboard.' 
                : accountMode === 'brand'
                  ? 'Join the network to find and hire creators safely.'
                  : 'Get your professional collab link in seconds.'
              }
            </p>

            <form onSubmit={showLogin ? handleEmailPasswordLogin : handleEmailPasswordSignup} className="space-y-5">
              {!showLogin && (
                <>
                  <div className="space-y-2 group">
                    <Label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 group-focus-within:text-emerald-400">
                      Full Name
                    </Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[60px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 transition-all outline-none"
                      required
                    />
                  </div>

                  {accountMode === 'creator' && (
                    <div className="space-y-2 group">
                      <Label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 group-focus-within:text-emerald-400">
                        Instagram Username
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">@</span>
                        <Input
                          placeholder="yourhandle"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[60px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 pl-10 transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {accountMode === 'brand' && (
                    <>
                      <div className="space-y-2 group">
                        <Label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 group-focus-within:text-emerald-400">
                          Brand / Agency Name
                        </Label>
                        <Input
                          placeholder="e.g. Nike, creatorarmour"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[60px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 transition-all outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-2 group">
                        <Label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 group-focus-within:text-emerald-400">
                          Industry
                        </Label>
                        <SmartIndustrySelector
                          value={brandIndustry}
                          onChange={setBrandIndustry}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2 group">
                <Label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 group-focus-within:text-emerald-400">
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={cn(
                    "bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[60px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 transition-all outline-none",
                    emailError && "border-red-500/50 focus:border-red-500/50"
                  )}
                  required
                />
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between">
                  <Label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1 group-focus-within:text-emerald-400">
                    Password
                  </Label>
                  {showLogin && (
                    <button type="button" onClick={() => { triggerHaptic?.(); handleForgotPassword(); }} className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 hover:text-emerald-500">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/10 text-[16px] h-[60px] rounded-[20px] focus:border-emerald-500/50 focus:ring-0 focus:bg-white/10 pr-12 transition-all outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-white/20 hover:text-white transition-all active:scale-90"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!showLogin && password.length > 0 && (
                  <div className="px-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{passwordHelper}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", passwordStrength.color)} 
                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => triggerHaptic?.()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black h-[64px] rounded-[22px] shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] text-[15px] mt-4 relative overflow-hidden group border-none uppercase tracking-widest"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {signupPhase === 'creating' ? 'Creating...' : signupPhase === 'provisioning' ? 'Setting up...' : 'Opening...'}
                  </div>
                ) : showLogin ? 'Unlock Dashboard' : 'Create My Armour'}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.();
                  setShowLogin(!showLogin);
                }}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-emerald-400 transition-colors"
              >
                {showLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-emerald-400 transition-colors flex items-center gap-2 group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to homepage
          </Link>
          
          <p className="text-white/10 text-[9px] leading-relaxed font-black uppercase tracking-[0.2em] text-center max-w-[320px]">
            By continuing, you agree to our{' '}
            <a href="/terms-of-service" className="text-white/20 hover:text-emerald-400 transition-colors underline underline-offset-4">Terms</a>
            {' '}&{' '}
            <a href="/privacy-policy" className="text-white/20 hover:text-emerald-400 transition-colors underline underline-offset-4">Privacy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;

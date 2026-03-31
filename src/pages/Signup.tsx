"use client";

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
import type { Tables } from '@/types/supabase';

type ProfileRoleLookup = Pick<Tables<'profiles'>, 'role' | 'onboarding_complete'>;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

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
  const [brandIndustry, setBrandIndustry] = useState('Other');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupPhase, setSignupPhase] = useState<'idle' | 'creating' | 'provisioning' | 'opening'>('idle');

  useEffect(() => {
    document.title = accountMode === 'brand' ? 'Create Brand Account | Creator Armour' : 'Create your collab page | Creator Armour';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', accountMode === 'brand'
      ? 'Create a Creator Armour brand account to send structured offers and manage creator deal workflows.'
      : 'Create your Creator Armour account and get your collab link ready in 2 minutes.');
  }, [accountMode]);

  const profilesTable = supabase.from('profiles') as unknown as {
    update: (payload: {
      role?: string;
      business_name?: string;
      onboarding_complete?: boolean;
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

  const ensureBrandWorkspace = async (userId: string, emailToUse: string) => {
    const cleanBrandName = String(brandName || '').trim();
    const cleanIndustry = String(brandIndustry || '').trim() || 'Other';

    if (!cleanBrandName) throw new Error('Brand name is required');

    // Update profile role so ProtectedLayout allows brand routes.
    const { error: profileErr } = await profilesTable
      .update({
        role: 'brand',
        business_name: cleanBrandName,
        onboarding_complete: true,
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

      // Best-effort enhancement: in fresh signups the profile row may not exist yet,
      // and some environments may not have this endpoint. Treat 404 as non-fatal.
      if (response.status === 404) {
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
    if (!loading && session && !isLoading) {
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

    if (!name.trim() || !email.trim() || !password.trim() || (accountMode === 'creator' && !instagramHandle.trim())) {
      toast.error(accountMode === 'creator'
        ? 'Please enter your name, Instagram handle, email, and password'
        : 'Please enter your name, email, and password');
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

    if (accountMode === 'creator' && normalizedHandle.length < 3) {
      toast.error('Instagram handle must be at least 3 characters');
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
          emailRedirectTo: `${window.location.origin}/${accountMode === 'brand' ? 'brand-dashboard' : 'creator-onboarding'}`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: name.trim(),
            instagram_handle: accountMode === 'creator' ? normalizedHandle : undefined,
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

          // Clear form immediately
          setName('');
          setEmail('');
          setPassword('');
          setEmailError('');

          // Wait a moment for Supabase to establish session (even if email confirmation is disabled)
          // Sometimes there's a brief delay before session is available
          setTimeout(async () => {
            setSignupPhase('provisioning');
            // Check if session is now available
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (currentSession) {
              // Session exists - wait for profile and navigate
              let attempts = 0;
              const maxAttempts = 10;
              const checkProfile = setInterval(async () => {
                attempts++;
                const { data: profileData } = await profilesTable
                  .select('id')
                  .eq('id', currentSession.user.id)
                  .single();

                if (profileData || attempts >= maxAttempts) {
                  clearInterval(checkProfile);
                  sessionStorage.removeItem('just_signed_up');
                  setSignupPhase('opening');
                  if (profileData) {
                    // Fire-and-forget: welcome email trigger (only after profile exists to avoid 404 noise)
                    void triggerWelcomeEmail(currentSession.access_token);
                  }
                  if (accountMode === 'brand') {
                    try {
                      await ensureBrandWorkspace(currentSession.user.id, currentSession.user.email || emailAtSignup);
                      window.location.assign('/brand-dashboard');
                      return;
                    } catch (e: unknown) {
                      toast.error(getErrorMessage(e, 'Failed to set up brand account'));
                    }
                  }
                  navigate('/creator-onboarding', { replace: true });
                }
              }, 500);
            } else {
              // No session yet - try signin once
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailAtSignup,
                password: passwordAtSignup,
              });

              if (signInData.session) {
                // Fire-and-forget: welcome email trigger
                void triggerWelcomeEmail(signInData.session.access_token);

                sessionStorage.removeItem('just_signed_up');
                setSignupPhase('opening');
                // Wait a moment for profile creation
                setTimeout(async () => {
                  if (accountMode === 'brand') {
                    try {
                      await ensureBrandWorkspace(signInData.session.user.id, signInData.session.user.email || emailAtSignup);
                    } catch (e: unknown) {
                      toast.error(getErrorMessage(e, 'Failed to set up brand account'));
                      return;
                    }
                    window.location.assign('/brand-dashboard');
                    return;
                  }
                  navigate('/creator-onboarding', { replace: true });
                }, 1000);
              } else {
                // Signin failed - redirect to login
                sessionStorage.removeItem('just_signed_up');
                console.warn('[Signup] Auto-signin failed:', signInError?.message);

                toast.info('Account created! Please sign in to continue', {
                  description: 'Your account has been created successfully.',
                  duration: 5000,
                });
                setShowLogin(true);
                setEmail(emailAtSignup);
              }
            }
          }, 1000); // Wait 1 second for session to be established
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
      setSignupPhase('idle');
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
        // Don't show toast - AuthLoadingScreen will handle the transition
        try {
          const { data: p } = await profilesTable
            .select('role, onboarding_complete')
            .eq('id', data.session.user.id)
            .maybeSingle();
          if (p?.role === 'brand') {
            navigate('/brand-dashboard', { replace: true });
          } else {
            navigate(getCreatorTargetPath(p), { replace: true });
          }
        } catch {
          navigate(accountMode === 'brand' ? '/brand-dashboard' : '/creator-onboarding', { replace: true });
        }
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

  const features = [
    {
      icon: Link2,
      title: 'Collab Link',
      description: 'Share one link to receive brand deals safely',
      color: 'text-emerald-400'
    },
    {
      icon: Shield,
      title: 'Auto-Protected Deals',
      description: 'Contracts + payments handled automatically',
      color: 'text-green-400'
    },
    {
      icon: TrendingUp,
      title: 'Track Brand Earnings',
      description: 'Know what you earned from every collab',
      color: 'text-blue-400'
    },
    {
      icon: MessageCircle,
      title: 'Expert Backup',
      description: 'Legal help when you actually need it',
      color: 'text-teal-300'
    }
  ];

  return (
    <div
      className="nb-screen-height bg-[#F4F7FB] relative flex items-start justify-start md:items-center md:justify-center p-4 font-inter overflow-x-hidden overflow-y-auto"
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

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block text-slate-900 space-y-12"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight">Creator Armour</h1>
            </div>

            <h2 className="text-5xl font-black leading-tight tracking-tight">
              Protect and scale<br />
              your creator business
            </h2>
            <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-md">
              Create your collab page, get brand offers, and track deals and payments in one place.
            </p>
          </div>

          <div className="space-y-6 pt-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClass = feature.color;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                    <p className="text-slate-600 text-sm font-medium">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="pt-10 border-t border-slate-200 flex gap-10">
            <div>
              <p className="text-slate-900 text-xl font-black">10,000+</p>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-1">Contracts Analyzed</p>
            </div>
            <div>
              <p className="text-slate-900 text-xl font-black">₹2Cr+</p>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-1">Value Protected</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-white shadow-xl rounded-[2.5rem] p-10 border border-slate-200">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Creator Armour</h1>
	            </div>
	
	            <div className="mb-10">
                {!showLogin && (
                  <div className="mb-6">
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set('mode', 'creator');
                          setSearchParams(next, { replace: true });
                        }}
                        className={cn(
                          'flex-1 h-11 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all',
                          accountMode === 'creator'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                            : 'bg-transparent text-slate-600 hover:text-slate-900'
                        )}
                      >
                        Creator
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set('mode', 'brand');
                          setSearchParams(next, { replace: true });
                        }}
                        className={cn(
                          'flex-1 h-11 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all',
                          accountMode === 'brand'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                            : 'bg-transparent text-slate-600 hover:text-slate-900'
                        )}
                      >
                        Brand
                      </button>
                    </div>
                  </div>
                )}

	              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
	                {showLogin ? 'Sign In' : accountMode === 'brand' ? 'Create Brand Account' : 'Create your collab page'}
	              </h2>
	              <p className="text-slate-600 font-medium leading-relaxed">
	                {showLogin
	                  ? 'Sign in to see your brand offers and active deals.'
	                  : accountMode === 'brand'
	                    ? 'Send structured offers, track deals, and sign contracts without DMs.'
	                    : 'Sign up and get your collab link ready in 2 minutes. Brands will send you offers through this link.'
	                }
	              </p>
	            </div>

            {/* Login Form (shorthand for users already registered) */}
            {showLogin && (
              <div className="mb-8">
                <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label htmlFor="password" className="text-slate-500 text-[11px] font-black uppercase tracking-widest">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[11px] font-black text-emerald-500 uppercase tracking-widest"
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
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim() || !password.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] uppercase tracking-widest text-xs mt-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </div>
            )}

            {/* Email/Password Signup Form */}
            {!showLogin && (
              <div className="mb-8">
	                <form onSubmit={handleEmailPasswordSignup} className="space-y-4">
	                  <div className="space-y-2">
	                    <Label htmlFor="signup-name" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
	                      {accountMode === 'brand' ? 'Your Name' : 'Name'}
	                    </Label>
	                    <Input
	                      id="signup-name"
	                      type="text"
	                      placeholder="e.g. Pratyush Raj"
	                      value={name}
	                      onChange={(e) => setName(e.target.value)}
	                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5"
	                      required
	                      autoComplete="name"
	                    />
	                  </div>
                    {accountMode === 'creator' && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-instagram-handle" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
                          Instagram Handle
                        </Label>
                        <Input
                          id="signup-instagram-handle"
                          type="text"
                          placeholder="@yourhandle"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5"
                          required
                          autoComplete="username"
                        />
                        <p className="px-1 text-xs text-slate-500">
                          Use your Instagram username, for example sana.reels.delhi
                        </p>
                      </div>
                    )}
                    {accountMode === 'brand' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="signup-brand-name" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
                            Brand Name
                          </Label>
                          <Input
                            id="signup-brand-name"
                            type="text"
                            placeholder="e.g. Demo Brand Co"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5"
                            required
                            autoComplete="organization"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-brand-industry" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
                            Industry
                          </Label>
                          <Input
                            id="signup-brand-industry"
                            type="text"
                            placeholder="e.g. Fashion"
                            value={brandIndustry}
                            onChange={(e) => setBrandIndustry(e.target.value)}
                            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5"
                          />
                        </div>
                      </>
                    )}
	                  <div className="space-y-2">
	                    <Label htmlFor="signup-email" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
	                      {accountMode === 'brand' ? 'Work Email' : 'Email'}
	                    </Label>
	                    <Input
	                      id="signup-email"
	                      type="email"
	                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5 ${emailError ? 'border-red-500/50' : ''}`}
                      required
                      autoComplete="email"
                    />
                    {emailError && (
                      <p className="text-xs text-red-400 mt-1 font-bold">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-500 text-[11px] font-black uppercase tracking-widest ml-1">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-[16px] h-14 rounded-2xl px-5 pr-12"
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
	                  </div>
	                  <Button
	                    type="submit"
	                    disabled={isLoading || !name.trim() || (accountMode === 'creator' && !instagramHandle.trim()) || (accountMode === 'brand' && !brandName.trim()) || !email.trim() || !password.trim() || password.length < 6 || !!emailError}
	                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-[0.98] uppercase tracking-widest text-xs mt-2"
	                  >
	                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
	                    {isLoading
                        ? signupPhase === 'opening'
                          ? 'Opening Onboarding...'
                          : signupPhase === 'provisioning'
                            ? 'Setting Up Workspace...'
                            : 'Creating Account...'
                        : accountMode === 'brand'
                          ? 'Create Brand Console'
                          : 'Get My Collab Link'}
	                  </Button>
                    {!showLogin && accountMode === 'creator' && (
                      <p className="text-center text-xs text-slate-500 mt-3">
                        Takes about 2 minutes. You will set your price next.
                      </p>
                    )}
	                </form>
	              </div>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-white px-4 text-slate-500">Or continue with</span>
              </div>
            </div>

	            <div className="space-y-3 mb-8">
	              <Button
	                onClick={async () => {
                  void trackEvent('signup_started', { mode: accountMode, method: 'google' });
	                  try {
	                    const redirectPath = accountMode === 'brand' ? 'brand-dashboard' : 'creator-onboarding';
	                    const redirectUrl = `${window.location.origin}/${redirectPath}`;
	                    sessionStorage.setItem('oauth_intended_route', redirectPath);
	                    const { data, error } = await supabase.auth.signInWithOAuth({
	                      provider: 'google',
	                      options: {
	                        redirectTo: redirectUrl,
	                      },
	                    });
	                    if (error) toast.error('Google error: ' + error.message);
	                    else if (data?.url) window.location.replace(data.url);
	                  } catch (err) { toast.error('Failed to start Google sign-up'); }
	                }}
                variant="outline"
                className="w-full bg-white border-slate-300 text-slate-900 hover:bg-slate-50 rounded-2xl h-14 font-bold text-sm transition-all active:scale-[0.98]"
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

            <div className="text-center pt-6 border-t border-slate-200">
              <button type="button"
                onClick={() => setShowLogin(!showLogin)}
                className="text-slate-600 hover:text-slate-900 font-medium text-[13px] transition-all group inline-flex items-center gap-2"
              >
                {showLogin ? "Don't have an account?" : 'Already have an account?'}
                <span className="text-emerald-500 font-bold group-hover:underline">{showLogin ? 'Start for free' : 'Sign in here'}</span>
              </button>
            </div>

            {/* Back to Homepage */}
            <div className="mt-8 text-center pt-6 border-t border-slate-200">
              <Link to="/" className="text-slate-500 hover:text-emerald-500 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Protocol
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center px-4">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.1em]">
              By continuing, you agree to our <Link to="/terms-of-service" className="text-slate-400 hover:text-emerald-500 underline">Terms</Link> & <Link to="/privacy-policy" className="text-slate-400 hover:text-emerald-500 underline">Privacy</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;

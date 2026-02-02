"use client";

import { supabase } from '@/integrations/supabase/client';
import { Scale, ArrowLeft, Sparkles, Shield, TrendingUp, MessageCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Signup = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    if (pwd.length < 6) return { strength: 1, label: 'Too short', color: 'bg-red-500' };
    if (pwd.length < 8) return { strength: 2, label: 'Weak', color: 'bg-yellow-500' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { strength: 3, label: 'Fair', color: 'bg-blue-500' };
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
      const timer = setTimeout(() => {
        // Session has user; redirect to intended route (e.g. after Google login) or creator-dashboard, not homepage
        if (session?.user) {
          const intendedRoute = sessionStorage.getItem('oauth_intended_route');
          const path = intendedRoute && intendedRoute !== 'login' && intendedRoute !== 'signup'
            ? `/${intendedRoute}`
            : '/creator-dashboard';
          sessionStorage.removeItem('oauth_intended_route');
          navigate(path, { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    }
  }, [session, loading, navigate, isLoading]);

  const handleEmailPasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Please enter your name, email, and password');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      setEmailError('Invalid email format');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/#/creator-onboarding`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: name.trim(),
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
                setEmail(email.trim());
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
                setEmail(email.trim());
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
          
          // Clear form immediately
          setName('');
          setEmail('');
          setPassword('');
          setEmailError('');
          
          // Wait a moment for Supabase to establish session (even if email confirmation is disabled)
          // Sometimes there's a brief delay before session is available
          setTimeout(async () => {
            // Check if session is now available
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            if (currentSession) {
              // Session exists - wait for profile and navigate
              let attempts = 0;
              const maxAttempts = 10;
              const checkProfile = setInterval(async () => {
                attempts++;
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', currentSession.user.id)
                  .single();
                
                if (profileData || attempts >= maxAttempts) {
                  clearInterval(checkProfile);
                  sessionStorage.removeItem('just_signed_up');
                  navigate('/creator-onboarding', { replace: true });
                }
              }, 500);
            } else {
              // No session yet - try signin once
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
              });
              
              if (signInData.session) {
                sessionStorage.removeItem('just_signed_up');
                // Wait a moment for profile creation
                setTimeout(() => {
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
                setEmail(email.trim());
              }
            }
          }, 1000); // Wait 1 second for session to be established
        }
      }
    } catch (err: any) {
      console.error('[Signup] Email/password signup exception:', err);
      const errMsg = err?.message?.toLowerCase() || '';
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
        navigate('/creator-dashboard', { replace: true });
      }
    } catch (err: any) {
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
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) {
        toast.error('Failed to send password reset email: ' + error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error('[Signup] Forgot password exception:', err);
      toast.error('An error occurred. Please try again.');
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'AI Contract Review',
      description: 'Get instant analysis in 30 seconds',
      color: 'text-green-400'
    },
    {
      icon: TrendingUp,
      title: 'Track Earnings',
      description: 'Monitor payments & income',
      color: 'text-blue-400'
    },
    {
      icon: MessageCircle,
      title: 'Legal Advisors',
      description: 'Chat with experts anytime',
      color: 'text-purple-400'
    }
  ];

  return (
    <div 
      className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block text-white space-y-8"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">CreatorArmour</h1>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight">
              Legal & Tax Services<br />
              Built for Content Creators
            </h2>
            <p className="text-xl text-purple-200 leading-relaxed">
              Protect your deals, track your earnings, and get expert legal advice—all in one place.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-purple-200 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="pt-8 border-t border-white/10">
            <p className="text-purple-200 text-sm">
              <span className="text-white font-semibold">10,000+</span> contracts analyzed
            </p>
            <p className="text-purple-200 text-sm">
              <span className="text-white font-semibold">₹2Cr+</span> creator value protected
            </p>
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-8 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">CreatorArmour</h1>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                {showLogin ? 'Sign In' : 'Create Your Account'}
              </h2>
              <p className="text-purple-200">
                {showLogin 
                  ? 'Access your account to manage your deals and earnings.'
                  : 'Start protecting your deals and tracking your earnings today.'
                }
              </p>
            </div>

            {/* Login Form */}
            {showLogin && (
              <div className="mb-6">
                <form onSubmit={handleEmailPasswordLogin} className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-purple-200 text-sm mb-2 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base h-12"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-purple-200 text-sm mb-2 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base h-12"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim() || !password.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
                <div className="text-sm mt-4">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {/* Email/Password Signup Form */}
            {!showLogin && (
              <div className="mb-6 space-y-3">
                <form onSubmit={handleEmailPasswordSignup} className="space-y-3">
                  <div>
                    <Label htmlFor="signup-name" className="text-purple-200 text-sm mb-2 block">
                      Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base h-12"
                      required
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="text-purple-200 text-sm mb-2 block">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base h-12 ${
                        emailError ? 'border-red-500/50' : ''
                      }`}
                      required
                      autoComplete="email"
                    />
                    {emailError && (
                      <p className="text-xs text-red-400 mt-1">{emailError}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-purple-200 text-sm mb-2 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password (min. 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base h-12 pr-10"
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 h-1">
                          {[1, 2, 3, 4].map((level) => {
                            const { strength, color } = getPasswordStrength(password);
                            return (
                              <div
                                key={level}
                                className={`flex-1 rounded transition-colors ${
                                  level <= strength ? color : 'bg-gray-700'
                                }`}
                              />
                            );
                          })}
                        </div>
                        {password.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {getPasswordStrength(password).label}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !name.trim() || !email.trim() || !password.trim() || password.length < 6 || !!emailError}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-purple-200">Or</span>
                  </div>
                </div>
              </div>
            )}

            {/* OAuth Sign-up/Sign-in Buttons */}
            {!showLogin && (
              <div className="mb-6 space-y-3">
              <Button
                onClick={async () => {
                  try {
                    const redirectUrl = `${window.location.origin}/#/creator-onboarding`;
                    // Store intended route in sessionStorage BEFORE OAuth call
                    sessionStorage.setItem('oauth_intended_route', 'creator-onboarding');
                    console.log('[Signup] Starting Google OAuth with redirect:', redirectUrl);
                    console.log('[Signup] Stored intended route: creator-onboarding');
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
                      console.error('[Signup] Google OAuth error:', error);
                      toast.error('Failed to sign up with Google: ' + error.message);
                    } else if (data?.url) {
                      // Redirect to Google OAuth
                      // Use replace instead of href for Safari compatibility
                      console.log('[Signup] Redirecting to Google OAuth:', data.url);
                      try {
                        // Try using location.replace first (better for Safari)
                        window.location.replace(data.url);
                      } catch (err) {
                        // Fallback to href if replace fails
                        console.warn('[Signup] location.replace failed, using href:', err);
                        window.location.href = data.url;
                      }
                    } else {
                      console.error('[Signup] No OAuth URL received from Supabase');
                      toast.error('Failed to start Google sign-up. Please try again.');
                    }
                  } catch (err: any) {
                    console.error('[Signup] Google OAuth exception:', err);
                    toast.error('Failed to sign up with Google');
                  }
                }}
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
            </div>
            )}

            {/* OAuth Sign-in Buttons (shown when login is active) */}
            {showLogin && (
              <div className="mb-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-purple-200">Or sign in with</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      try {
                        const redirectUrl = `${window.location.origin}/#/creator-dashboard`;
                        sessionStorage.setItem('oauth_intended_route', 'creator-dashboard');
                        console.log('[Signup] Starting Google OAuth with redirect:', redirectUrl);
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
                          console.error('[Signup] Google OAuth error:', error);
                          toast.error('Failed to sign in with Google: ' + error.message);
                        } else if (data?.url) {
                          console.log('[Signup] Redirecting to Google OAuth:', data.url);
                          try {
                            window.location.replace(data.url);
                          } catch (err) {
                            console.warn('[Signup] location.replace failed, using href:', err);
                            window.location.href = data.url;
                          }
                        } else {
                          console.error('[Signup] No OAuth URL received from Supabase');
                          toast.error('Failed to start Google sign-in. Please try again.');
                        }
                      } catch (err: any) {
                        console.error('[Signup] Google OAuth exception:', err);
                        toast.error('Failed to sign in with Google');
                      }
                    }}
                    variant="outline"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-purple-200">
                  {showLogin ? "Don't have an account?" : 'Already have an account?'}
                </span>
              </div>
            </div>

            {/* Toggle between Signup and Login */}
            <div className="text-center">
              <button
                onClick={() => {
                  setShowLogin(!showLogin);
                  setName('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-purple-300 hover:text-purple-200 font-medium transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {showLogin ? 'Sign up instead' : 'Sign in instead'}
              </button>
            </div>

            {/* Back to Homepage */}
            <div className="mt-6">
              <Button variant="link" asChild className="w-full text-purple-300 hover:text-purple-200">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
                </Link>
              </Button>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs text-purple-300">
                By signing up, you agree to our{' '}
                <Link to="/terms-of-service" className="underline hover:text-purple-200">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="underline hover:text-purple-200">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;


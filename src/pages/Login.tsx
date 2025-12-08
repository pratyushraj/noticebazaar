"use client";

import { supabase } from '@/integrations/supabase/client';
import { Scale, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import BiometricLogin from '@/components/auth/BiometricLogin';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const navigate = useNavigate();
  const { session, loading, user } = useSession();
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [showPasskeyAuth, setShowPasskeyAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showFaceIDLogin, setShowFaceIDLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If session loading is finished and a session exists, redirect.
    // But check if we're coming from OAuth callback first
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
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
        // Check if SessionContext already redirected (hash changed)
        const currentHash = window.location.hash;
        if (currentHash === hash || currentHash === '' || currentHash.startsWith('#/creator-')) {
          // SessionContext might have already redirected, but if we're still here, redirect manually
          navigate('/creator-dashboard', { replace: true });
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
                navigate('/creator-dashboard', { replace: true });
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
  }, [session, loading, navigate]);

  const handlePasskeyAuthSuccess = async () => {
    // Wait a moment for session to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we have a session now
    const { data: { session: newSession } } = await supabase.auth.getSession();
    
    if (newSession) {
      toast.success('Biometric authentication successful!');
      navigate('/', { replace: true });
    } else {
      // Session might be created via email OTP, show message
      toast.info('Please check your email to complete sign-in');
    }
  };

  const handlePasskeyRegisterSuccess = () => {
    toast.success('Passkey registered! You can now use it to sign in.');
    setShowPasskeyAuth(false);
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
        console.error('[Login] Email/password error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and confirm your account before signing in.');
        } else {
          toast.error('Failed to sign in: ' + error.message);
        }
      } else if (data.session) {
        toast.success('Signed in successfully!');
        // SessionContext will handle the redirect
        navigate('/creator-dashboard', { replace: true });
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
        redirectTo: `${window.location.origin}/#/reset-password`,
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2A40A0] p-4">
      <div 
        className="w-full max-w-md p-8 rounded-lg shadow-lg border border-blue-400/30" 
        style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex flex-col items-center mb-6">
          <Scale className="h-12 w-12 text-blue-300 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Law Client Portal</h1>
          <p className="text-center text-blue-200 mb-8">Access your cases securely</p>
        </div>
        
        {/* Primary: Email/Password Login */}
        {!session && (
          <div className="mb-6">
            <div className="space-y-3">
              {!showFaceIDLogin ? (
                <>
                  <form onSubmit={handleEmailPasswordLogin} className="space-y-3">
                    <div>
                      <Label htmlFor="email" className="text-blue-200 text-sm mb-2 block">
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
                      <Label htmlFor="password" className="text-blue-200 text-sm mb-2 block">
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
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        transform: 'translateZ(0)',
                        minHeight: '44px'
                      }}
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-blue-200 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFaceIDLogin(true)}
                      className="text-blue-200 hover:text-white transition-colors"
                    >
                      Use Face ID instead
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="passkey-email" className="text-blue-200 text-sm mb-2 block">
                      Sign in with Face ID
                    </Label>
                    <Input
                      id="passkey-email"
                      type="email"
                      placeholder="Enter your email"
                      value={passkeyEmail}
                      onChange={(e) => setPasskeyEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && passkeyEmail.trim()) {
                          e.preventDefault();
                          const button = e.currentTarget.nextElementSibling?.querySelector('button');
                          button?.click();
                        }
                      }}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-base h-12"
                      aria-label="Email address for passkey authentication"
                      required
                    />
                    {passkeyEmail && !passkeyEmail.includes('@') && (
                      <p className="text-xs text-red-400 mt-1">Please enter a valid email address</p>
                    )}
                  </div>
                  <BiometricLogin 
                    mode="authenticate"
                    email={passkeyEmail.trim()}
                    onSuccess={handlePasskeyAuthSuccess}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <Button
                      variant="ghost"
                      onClick={() => setShowPasskeyAuth(true)}
                      className="text-blue-200 hover:text-white text-sm"
                    >
                      Don't have a passkey? Register one
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowFaceIDLogin(false)}
                      className="text-blue-200 hover:text-white transition-colors"
                    >
                      Use password instead
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Secondary: Other Sign-in Methods */}
        {!session && (
          <div className="mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-blue-200">Or sign in with</span>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={async () => {
                  try {
                    const redirectUrl = `${window.location.origin}/#/creator-dashboard`;
                    // Store intended route in sessionStorage BEFORE OAuth call
                    // This ensures we can redirect correctly even if Supabase uses Site URL
                    sessionStorage.setItem('oauth_intended_route', 'creator-dashboard');
                    console.log('[Login] Starting Google OAuth with redirect:', redirectUrl);
                    console.log('[Login] Stored intended route: creator-dashboard');
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
                      console.error('[Login] Google OAuth error:', error);
                      toast.error('Failed to sign in with Google: ' + error.message);
                    } else if (data?.url) {
                      // Redirect to Google OAuth
                      // Use replace instead of href for Safari compatibility
                      console.log('[Login] Redirecting to Google OAuth:', data.url);
                      try {
                        // Try using location.replace first (better for Safari)
                        window.location.replace(data.url);
                      } catch (err) {
                        // Fallback to href if replace fails
                        console.warn('[Login] location.replace failed, using href:', err);
                        window.location.href = data.url;
                      }
                    } else {
                      console.error('[Login] No OAuth URL received from Supabase');
                      toast.error('Failed to start Google sign-in. Please try again.');
                    }
                  } catch (err: any) {
                    console.error('[Login] Google OAuth exception:', err);
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
              <Button
                onClick={async () => {
                  try {
                    const redirectUrl = `${window.location.origin}/#/creator-dashboard`;
                    // Store intended route in sessionStorage BEFORE OAuth call
                    sessionStorage.setItem('oauth_intended_route', 'creator-dashboard');
                    console.log('[Login] Starting GitHub OAuth with redirect:', redirectUrl);
                    console.log('[Login] Stored intended route: creator-dashboard');
                    const { data, error } = await supabase.auth.signInWithOAuth({
                      provider: 'github',
                      options: {
                        redirectTo: redirectUrl,
                      },
                    });
                    if (error) {
                      console.error('[Login] GitHub OAuth error:', error);
                      toast.error('Failed to sign in with GitHub: ' + error.message);
                    } else if (data?.url) {
                      // Redirect to GitHub OAuth
                      // Use replace instead of href for Safari compatibility
                      console.log('[Login] Redirecting to GitHub OAuth:', data.url);
                      try {
                        // Try using location.replace first (better for Safari)
                        window.location.replace(data.url);
                      } catch (err) {
                        // Fallback to href if replace fails
                        console.warn('[Login] location.replace failed, using href:', err);
                        window.location.href = data.url;
                      }
                    } else {
                      console.error('[Login] No OAuth URL received from Supabase');
                      toast.error('Failed to start GitHub sign-in. Please try again.');
                    }
                  } catch (err: any) {
                    console.error('[Login] GitHub OAuth exception:', err);
                    toast.error('Failed to sign in with GitHub');
                  }
                }}
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.425 22 12.017 22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
                Sign in with Github
              </Button>
            </div>
          </div>
        )}

        {/* Passkey Registration Mode */}
        {!session && showPasskeyAuth && (
          <div className="mb-6">
            <div className="space-y-3">
              <p className="text-sm text-blue-200 text-center">
                Register a passkey for faster, more secure sign-ins
              </p>
              {session && user ? (
                <BiometricLogin 
                  mode="register"
                  onSuccess={handlePasskeyRegisterSuccess}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-blue-200 text-sm">
                    Sign in first to register a passkey
                  </Label>
                  <p className="text-xs text-blue-300 text-center">
                    Please sign in with Google or email above, then you can register a passkey for future logins.
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={() => setShowPasskeyAuth(false)}
                className="w-full text-blue-200 hover:text-white text-sm"
              >
                Back to sign in
              </Button>
            </div>
          </div>
        )}

        {/* Register Passkey (only shown when logged in) */}
        {session && user && (
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-blue-200">Secure your account</span>
              </div>
            </div>
            <BiometricLogin 
              mode="register"
              onSuccess={handlePasskeyRegisterSuccess}
            />
          </div>
        )}
        
        <div className="mt-6">
          <Button variant="link" asChild className="w-full text-blue-200 hover:text-white">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
            </Link>
          </Button>
        </div>
      </div>
      <div className="p-4 text-center">
        <a
          href="https://www.dyad.sh/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-200 hover:text-blue-100"
        >
          Made with Dyad
        </a>
      </div>
    </div>
  );
};

export default Login;
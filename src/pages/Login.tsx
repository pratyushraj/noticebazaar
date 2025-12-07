"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
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

  useEffect(() => {
    // If session loading is finished and a session exists, redirect.
    // But check if we're coming from OAuth callback first
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = hash.includes('access_token') || 
                            hash.includes('type=recovery') || 
                            hash.includes('type=magiclink') ||
                            urlParams.get('code') !== null; // OAuth code in query params
    
    // Don't redirect if we're in the middle of an OAuth callback - let SessionContext handle it
    // Also add a small delay to ensure OAuth processing completes
    if (!loading && session && !isOAuthCallback) {
      console.log('[Login] Session exists, redirecting to dashboard');
      // Use setTimeout to avoid race condition with OAuth callback
      const timer = setTimeout(() => {
        navigate('/creator-dashboard', { replace: true });
      }, 200);
      return () => clearTimeout(timer);
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
        
        {/* Primary: Face ID Authentication */}
        {!session && (
          <div className="mb-6">
            <div className="space-y-3">
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
              <Button
                variant="ghost"
                onClick={() => setShowPasskeyAuth(true)}
                className="w-full text-blue-200 hover:text-white text-sm"
              >
                Don't have a passkey? Register one
              </Button>
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
                    console.log('[Login] Starting Google OAuth with redirect:', redirectUrl);
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
                      window.location.href = data.url;
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
                    console.log('[Login] Starting GitHub OAuth with redirect:', redirectUrl);
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
                      window.location.href = data.url;
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
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
    if (!loading && session) {
      navigate('/', { replace: true });
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
            <Auth
              supabaseClient={supabase}
              providers={['google']}
              appearance={{ theme: ThemeSupa }}
              theme="dark"
            />
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
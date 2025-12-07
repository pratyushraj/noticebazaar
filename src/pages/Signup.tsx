"use client";

import { supabase } from '@/integrations/supabase/client';
import { Scale, ArrowLeft, Sparkles, Shield, TrendingUp, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Signup = () => {
  const navigate = useNavigate();
  const { session, loading, user } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If session loading is finished and a session exists, redirect.
    if (!loading && session) {
      // Wait a moment for profile to be created by database trigger
      const timer = setTimeout(() => {
        // Check if we have a profile now
        if (user) {
          // Profile should be created by trigger, navigate based on role
          // The ProtectedRoute will handle the actual routing
          navigate('/', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session, loading, navigate, user]);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
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
              <h1 className="text-3xl font-bold">NoticeBazaar</h1>
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
              <h1 className="text-2xl font-bold text-white">NoticeBazaar</h1>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-purple-200">
                Start protecting your deals and tracking your earnings today.
              </p>
            </div>

            {/* OAuth Sign-up Buttons */}
            <div className="mb-6 space-y-3">
              <Button
                onClick={async () => {
                  try {
                    const redirectUrl = `${window.location.origin}/#/creator-onboarding`;
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
                      toast.error('Failed to sign up with Google: ' + error.message);
                    } else if (data?.url) {
                      // Redirect to Google OAuth
                      window.location.href = data.url;
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
              <Button
                onClick={async () => {
                  try {
                    const redirectUrl = `${window.location.origin}/#/creator-onboarding`;
                    console.log('[Signup] Starting GitHub OAuth with redirect:', redirectUrl);
                    const { data, error } = await supabase.auth.signInWithOAuth({
                      provider: 'github',
                      options: {
                        redirectTo: redirectUrl,
                      },
                    });
                    if (error) {
                      console.error('[Signup] GitHub OAuth error:', error);
                      toast.error('Failed to sign up with GitHub: ' + error.message);
                    } else if (data?.url) {
                      // Redirect to GitHub OAuth
                      window.location.href = data.url;
                    }
                  } catch (err: any) {
                    console.error('[Signup] GitHub OAuth exception:', err);
                    toast.error('Failed to sign up with GitHub');
                  }
                }}
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.425 22 12.017 22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
                Sign up with Github
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-purple-200">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-purple-300 hover:text-purple-200 font-medium transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Sign in instead
              </Link>
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


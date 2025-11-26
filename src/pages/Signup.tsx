"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
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
      navigate('/', { replace: true });
    }
  }, [session, loading, navigate]);

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

            {/* Supabase Auth UI */}
            <div className="mb-6">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#8B5CF6',
                        brandAccent: '#7C3AED',
                        brandButtonText: 'white',
                        defaultButtonBackground: 'rgba(255, 255, 255, 0.1)',
                        defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.15)',
                        defaultButtonBorder: 'rgba(255, 255, 255, 0.2)',
                        defaultButtonText: 'white',
                        dividerBackground: 'rgba(255, 255, 255, 0.1)',
                        inputBackground: 'rgba(255, 255, 255, 0.05)',
                        inputBorder: 'rgba(255, 255, 255, 0.1)',
                        inputBorderHover: 'rgba(255, 255, 255, 0.2)',
                        inputBorderFocus: '#8B5CF6',
                        inputText: 'white',
                        inputLabelText: 'rgba(255, 255, 255, 0.7)',
                        inputPlaceholder: 'rgba(255, 255, 255, 0.5)',
                        messageText: 'rgba(255, 255, 255, 0.9)',
                        messageTextDanger: '#EF4444',
                        anchorTextColor: '#A78BFA',
                        anchorTextHoverColor: '#C4B5FD',
                      },
                      space: {
                        spaceSmall: '8px',
                        spaceMedium: '16px',
                        spaceLarge: '24px',
                        labelBottomMargin: '8px',
                        anchorBottomMargin: '4px',
                        emailInputSpacing: '4px',
                        socialAuthSpacing: '4px',
                        buttonPadding: '12px 24px',
                        inputPadding: '12px 16px',
                      },
                      fontSizes: {
                        baseBodySize: '15px',
                        baseInputSize: '15px',
                        baseLabelSize: '14px',
                        baseButtonSize: '15px',
                      },
                      radii: {
                        borderRadiusButton: '12px',
                        buttonBorderRadius: '12px',
                        inputBorderRadius: '12px',
                        labelBorderRadius: '4px',
                      },
                    },
                  },
                  style: {
                    button: {
                      borderRadius: '12px',
                      fontWeight: '600',
                    },
                    input: {
                      borderRadius: '12px',
                    },
                    anchor: {
                      color: '#A78BFA',
                    },
                  },
                }}
                providers={['google', 'github']}
                view="sign_up"
                redirectTo={`${window.location.origin}/creator-onboarding`}
                magicLink={true}
              />
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


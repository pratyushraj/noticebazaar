"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Upload, Home, Briefcase, CreditCard, Shield, MessageCircle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { analytics } from '@/utils/analytics';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  position: 'center' | 'top' | 'bottom';
  highlight?: string; // data-tutorial attribute value
  pointer?: 'top' | 'bottom';
  action?: string;
  interactive?: boolean;
  celebration?: boolean;
}

interface DashboardTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

const DashboardTutorial: React.FC<DashboardTutorialProps> = ({ onComplete, onSkip }) => {
  const { profile, user } = useSession();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [startTime] = useState(Date.now());

  // Fetch user data for conditional tutorial
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Determine user state for dynamic tutorial
  const userState = useMemo(() => {
    const hasUploadedContract = brandDeals.length > 0;
    const hasEarnings = brandDeals.some(deal => deal.status === 'Completed' && deal.payment_received_date);
    const hasAdvisor = false; // TODO: Check if advisor assigned
    const hasMessages = false; // TODO: Check if messages exist

    return {
      hasUploadedContract,
      hasEarnings,
      hasAdvisor,
      hasMessages,
    };
  }, [brandDeals]);

  // Initialize analytics with user ID
  useEffect(() => {
    if (profile?.id) {
      analytics.setUserId(profile.id);
    }
  }, [profile?.id]);

  // Track tutorial started
  useEffect(() => {
    if (showTutorial && profile?.id) {
      analytics.track('tutorial_started', {
        category: 'tutorial',
        userId: profile.id,
        tutorial_type: 'dashboard',
      });
    }
  }, [showTutorial, profile?.id]);

  // All possible tutorial steps
  const allTutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Dashboard! 👋',
      description: 'This is your command center for managing all your creator deals. Let me show you around!',
      position: 'center',
      action: 'Start Tour',
    },
    {
      id: 'earnings',
      title: 'Your Earnings at a Glance',
      description: 'See your total earnings this month. The green percentage shows how much you\'ve grown compared to last month!',
      position: 'top',
      highlight: 'earnings-card',
      pointer: 'top',
    },
    {
      id: 'stats',
      title: 'Quick Stats',
      description: 'Track your next payout, active deals, pending payments, and protection score - all in one place.',
      position: 'top',
      highlight: 'stats-grid',
      pointer: 'top',
    },
    {
      id: 'upload',
      title: 'Upload Your First Contract',
      description: 'Tap here to upload any brand contract. Our AI will review it in 30 seconds and tell you if it\'s safe to sign!',
      position: 'bottom',
      highlight: 'upload-fab',
      pointer: 'bottom',
      action: 'Try It Now',
      interactive: true,
    },
    {
      id: 'deals-tab',
      title: 'Manage Your Deals',
      description: 'Tap here to see all your brand partnerships. Track progress, deadlines, and payments for each deal.',
      position: 'bottom',
      highlight: 'deals-nav',
      pointer: 'bottom',
    },
    {
      id: 'payments-tab',
      title: 'Track Every Payment',
      description: 'See all your income, pending payments, and expenses. Never miss a payment again!',
      position: 'bottom',
      highlight: 'payments-nav',
      pointer: 'bottom',
    },
    {
      id: 'protection-tab',
      title: 'Stay Protected',
      description: 'Your protection score shows how safe your contracts are. Upload contracts here for AI review.',
      position: 'bottom',
      highlight: 'protection-nav',
      pointer: 'bottom',
    },
    {
      id: 'messages-tab',
      title: 'Get Expert Help',
      description: 'Chat with our legal and tax advisors anytime. They understand creator businesses and can help with any questions!',
      position: 'bottom',
      highlight: 'messages-nav',
      pointer: 'bottom',
    },
    {
      id: 'complete',
      title: 'You\'re Ready to Go! 🎉',
      description: 'That\'s the tour! Start by uploading your first contract or exploring your dashboard. We\'re here if you need help!',
      position: 'center',
      action: 'Start Using NoticeBazaar',
      celebration: true,
    },
  ];

  // Filter steps based on user state (dynamic tutorial)
  const tutorialSteps = useMemo(() => {
    const steps: TutorialStep[] = [];

    // Always show welcome
    steps.push(allTutorialSteps[0]);

    // Always show earnings
    steps.push(allTutorialSteps[1]);

    // Always show stats
    steps.push(allTutorialSteps[2]);

    // Show upload step only if user hasn't uploaded
    if (!userState.hasUploadedContract) {
      steps.push(allTutorialSteps[3]);
    }

    // Always show deals tab
    steps.push(allTutorialSteps[4]);

    // Always show payments tab
    steps.push(allTutorialSteps[5]);

    // Always show protection tab
    steps.push(allTutorialSteps[6]);

    // Show messages tab only if advisor exists (or always for now)
    steps.push(allTutorialSteps[7]);

    // Always show completion
    steps.push(allTutorialSteps[8]);

    return steps;
  }, [userState]);

  // Check if tutorial was already completed
  useEffect(() => {
    if (!profile?.id) return;
    
    const tutorialCompleted = localStorage.getItem(`dashboard-tutorial-completed-${profile.id}`);
    if (tutorialCompleted === 'true') {
      setShowTutorial(false);
      onComplete?.();
    }
  }, [profile?.id, onComplete]);

  // Track step viewed
  useEffect(() => {
    if (showTutorial && profile?.id && currentStep < tutorialSteps.length) {
      const step = tutorialSteps[currentStep];
      analytics.track('tutorial_step_viewed', {
        category: 'tutorial',
        step: step.id,
        step_number: currentStep + 1,
        total_steps: tutorialSteps.length,
        userId: profile.id,
      });
    }
  }, [currentStep, showTutorial, profile?.id, tutorialSteps]);

  // Add highlight classes to elements
  useEffect(() => {
    if (!showTutorial) return;

    const step = tutorialSteps[currentStep];
    if (!step.highlight) return;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      // Add highlight class to target element
      const element = document.querySelector(`[data-tutorial="${step.highlight}"]`);
      if (element) {
        element.classList.add('tutorial-highlight');
        if (step.interactive) {
          element.classList.add('interactive');
        }
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight', 'interactive');
      });
    };
  }, [currentStep, showTutorial, tutorialSteps]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (profile?.id) {
      const step = tutorialSteps[currentStep];
      localStorage.setItem(`dashboard-tutorial-dismissed-${profile.id}`, 'true');
      
      // Track dismissal
      analytics.track('tutorial_dismissed', {
        category: 'tutorial',
        step: step?.id,
        step_number: currentStep + 1,
        total_steps: tutorialSteps.length,
        userId: profile.id,
        time_spent: Date.now() - startTime,
      });
    }
    setShowTutorial(false);
    onSkip?.();
  };

  const handleComplete = () => {
    if (profile?.id) {
      localStorage.setItem(`dashboard-tutorial-completed-${profile.id}`, 'true');
      
      // Track completion
      const timeSpent = Date.now() - startTime;
      analytics.track('tutorial_completed', {
        category: 'tutorial',
        total_steps: tutorialSteps.length,
        userId: profile.id,
        time_spent: timeSpent,
        skipped_steps: allTutorialSteps.length - tutorialSteps.length,
      });
    }
    setShowTutorial(false);
    onComplete?.();
  };

  const handleInteractiveClick = () => {
    const step = tutorialSteps[currentStep];
    
    // Track interaction
    if (step.interactive && profile?.id) {
      analytics.track('tutorial_interacted', {
        category: 'tutorial',
        step: step.id,
        target: step.highlight,
        userId: profile.id,
      });
    }

    if (step.interactive && step.highlight === 'upload-fab') {
      // Find and click the upload FAB
      const fabElement = document.querySelector('[data-tutorial="upload-fab"]') as HTMLButtonElement;
      if (fabElement) {
        fabElement.click();
      }
      // Advance to next step after a short delay
      setTimeout(() => {
        handleNext();
      }, 300);
    } else {
      handleNext();
    }
  };

  if (!showTutorial) return null;

  const step = tutorialSteps[currentStep];

  return (
    <>
      {/* Dark Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] pointer-events-none"
      />

      {/* Tutorial Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed z-[9999] ${
          step.position === 'center'
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : step.position === 'top'
            ? 'top-1/4 left-1/2 -translate-x-1/2'
            : 'bottom-32 left-1/2 -translate-x-1/2'
        }`}
      >
        <div className="relative max-w-sm mx-4">
          {/* Pointer Arrow */}
          {step.pointer === 'top' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-600"></div>
          )}
          {step.pointer === 'bottom' && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-600"></div>
          )}

          {/* Tooltip Card */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-2xl border border-purple-400 relative">
            {/* Celebration Sparkle */}
            {step.celebration && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold pr-8 text-white">{step.title}</h3>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                aria-label="Skip tutorial"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Description */}
            <p className="text-purple-100 leading-relaxed mb-4">{step.description}</p>

            {/* Progress Dots */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentStep ? 'w-8 bg-white' : 'w-1 bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-purple-200">
                {currentStep + 1} of {tutorialSteps.length}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 bg-white/20 hover:bg-white/30 font-semibold py-3 rounded-xl transition-colors text-white"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Back
                </button>
              )}
              <button
                onClick={step.interactive ? handleInteractiveClick : handleNext}
                className="flex-1 bg-white hover:bg-purple-50 text-purple-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {step.action || (currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next')}
                {currentStep < tutorialSteps.length - 1 && !step.action && (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confetti Animation (Final Step) */}
      {step.celebration && (
        <AnimatePresence>
          {['🎉', '✨', '🎊', '⭐'].map((emoji, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -100,
                x: (index % 2 === 0 ? -1 : 1) * 50,
                rotate: 360,
              }}
              transition={{
                duration: 2,
                delay: index * 0.2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="fixed text-4xl pointer-events-none"
              style={{
                top: `${20 + index * 10}%`,
                left: `${10 + index * 20}%`,
                zIndex: 10000,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </>
  );
};

export default DashboardTutorial;


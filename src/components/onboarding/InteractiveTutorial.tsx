"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface TutorialStep {
  id: string;
  target: string; // CSS selector or data attribute
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  storageKey?: string;
  onComplete?: () => void;
}

const InteractiveTutorial = ({ steps, storageKey = 'onboarding-tutorial', onComplete }: InteractiveTutorialProps) => {
  const { profile } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tutorial was already completed
    const tutorialCompleted = localStorage.getItem(`${storageKey}-completed-${profile?.id}`);
    if (tutorialCompleted === 'true') {
      return;
    }

    // Check if tutorial was dismissed
    const tutorialDismissed = localStorage.getItem(`${storageKey}-dismissed-${profile?.id}`);
    if (tutorialDismissed === 'true') {
      return;
    }

    // Show tutorial after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      updateTargetElement();
    }, 1000);

    return () => clearTimeout(timer);
  }, [profile?.id, storageKey]);

  useEffect(() => {
    if (isVisible && currentStep < steps.length) {
      updateTargetElement();
    }
  }, [currentStep, isVisible]);

  const updateTargetElement = () => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    let element: HTMLElement | null = null;

    // Try data attribute first
    if (step.target.startsWith('[') && step.target.endsWith(']')) {
      const attr = step.target.slice(1, -1);
      element = document.querySelector(`[data-tutorial="${attr}"]`) as HTMLElement;
    } else {
      // Try CSS selector
      element = document.querySelector(step.target) as HTMLElement;
    }

    setTargetElement(element);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  const handleDismiss = () => {
    localStorage.setItem(`${storageKey}-dismissed-${profile?.id}`, 'true');
    setIsVisible(false);
  };

  const handleComplete = () => {
    localStorage.setItem(`${storageKey}-completed-${profile?.id}`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || currentStep >= steps.length || !targetElement) {
    return null;
  }

  const step = steps[currentStep];
  const rect = targetElement.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  // Calculate position based on step.position
  let tooltipStyle: React.CSSProperties = {};
  
  if (step.position === 'center') {
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10000,
    };
  } else {
    const positions = {
      top: { top: rect.top + scrollY - 10, left: rect.left + scrollX + rect.width / 2, transform: 'translate(-50%, -100%)' },
      bottom: { top: rect.bottom + scrollY + 10, left: rect.left + scrollX + rect.width / 2, transform: 'translate(-50%, 0)' },
      left: { top: rect.top + scrollY + rect.height / 2, left: rect.left + scrollX - 10, transform: 'translate(-100%, -50%)' },
      right: { top: rect.top + scrollY + rect.height / 2, left: rect.right + scrollX + 10, transform: 'translate(0, -50%)' },
    };
    tooltipStyle = {
      position: 'absolute',
      ...positions[step.position],
      zIndex: 10000,
    };
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay */}
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Highlighted Element */}
        {step.position !== 'center' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute border-4 border-purple-400 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              top: rect.top + scrollY,
              left: rect.left + scrollX,
              width: rect.width,
              height: rect.height,
              zIndex: 10001,
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={tooltipStyle}
          className="pointer-events-auto"
        >
          <div className="bg-white/[0.95] backdrop-blur-[40px] rounded-[24px] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-500" />
                <span className="text-[13px] text-purple-400 font-medium">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss tutorial"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <h3 className="font-semibold text-[17px] text-gray-900 mb-2">{step.title}</h3>
            <p className="text-[15px] text-gray-600 mb-4 leading-relaxed">{step.description}</p>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[15px] font-medium text-gray-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[15px] font-semibold transition-all flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InteractiveTutorial;


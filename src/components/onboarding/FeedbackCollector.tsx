"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Star, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { onboardingAnalytics } from '@/lib/onboarding/analytics';
import { toast } from 'sonner';

interface FeedbackCollectorProps {
  triggerAfter?: number; // Show after X seconds
  onDismiss?: () => void;
}

const FeedbackCollector = ({ triggerAfter = 30000, onDismiss }: FeedbackCollectorProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useState(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, triggerAfter);

    return () => clearTimeout(timer);
  });

  const handleDismiss = () => {
    setIsVisible(false);
    onboardingAnalytics.track('feedback_dismissed');
    onDismiss?.();
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);
    
    try {
      // Track feedback
      onboardingAnalytics.track('feedback_submitted', {
        rating,
        feedback: feedback || null,
        feedback_length: feedback.length
      });

      // TODO: Send to backend
      // await submitFeedback({ rating, feedback });

      toast.success('Thank you for your feedback!', {
        description: 'Your input helps us improve CreatorArmour.'
      });

      setIsVisible(false);
      onDismiss?.();
    } catch (error) {
      toast.error('Failed to submit feedback', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white/[0.95] backdrop-blur-[40px] rounded-[24px] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[17px] text-gray-900 mb-1">How's it going?</h3>
                <p className="text-[13px] text-gray-600">Help us improve your experience</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Dismiss feedback"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      rating && star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Input */}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think (optional)..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none mb-4"
            rows={3}
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[15px] font-medium text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleSubmit}
              disabled={!rating || isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  Send <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackCollector;


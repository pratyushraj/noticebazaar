"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Loader2, Send, Shield, Clock, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { animations, gradients, shadows, radius, typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface RequestedChange {
  title: string;
  severity: 'high' | 'medium' | 'warning';
  category: string;
  description: string;
}

const BrandResponsePage = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'negotiating' | 'rejected' | null>(null);
  const [message, setMessage] = useState('');
  const [brandTeamName, setBrandTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dealInfo, setDealInfo] = useState<{
    brand_name: string;
    response_status: string;
  } | null>(null);
  const [requestedChanges, setRequestedChanges] = useState<RequestedChange[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch deal info and requested changes on mount
  useEffect(() => {
    const fetchDealInfo = async () => {
      if (!dealId) {
        toast.error('Invalid deal ID');
        setIsLoading(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
            ? 'https://api.noticebazaar.com' 
            : 'http://localhost:3001');
        
        const response = await fetch(`${apiBaseUrl}/api/brand-response/${dealId}`);
        const data = await response.json();

        if (data.success && data.deal) {
          setDealInfo(data.deal);
          if (data.requested_changes && Array.isArray(data.requested_changes)) {
            setRequestedChanges(data.requested_changes);
          }
          if (data.deal.response_status !== 'pending') {
            setIsSubmitted(true);
          }
        } else {
          toast.error('Deal not found');
        }
      } catch (error: any) {
        console.error('[BrandResponsePage] Fetch error:', error);
        toast.error('Failed to load deal information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealInfo();
  }, [dealId]);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a decision');
      triggerHaptic(HapticPatterns.error);
      return;
    }

    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      
      const response = await fetch(`${apiBaseUrl}/api/brand-response/${dealId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          message: message.trim() || undefined,
          brand_team_name: brandTeamName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast.success('Response submitted successfully!');
        triggerHaptic(HapticPatterns.success);
      } else {
        throw new Error(data.error || 'Failed to submit response');
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] Submit error:', error);
      toast.error(error.message || 'Failed to submit response. Please try again.');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSelect = (status: 'accepted' | 'negotiating' | 'rejected') => {
    setSelectedStatus(status);
    triggerHaptic(HapticPatterns.light);
  };

  if (isLoading) {
    return (
      <div className={cn("min-h-screen", gradients.page, "flex items-center justify-center")}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dealInfo) {
    return (
      <div className={cn("min-h-screen", gradients.page, "flex items-center justify-center p-4")}>
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Deal Not Found</h1>
          <p className="text-white/70">The deal you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", gradients.page, "text-white pb-8 md:pb-12")}>
      <div className={cn("max-w-2xl mx-auto px-4 py-6 md:py-8")}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">NoticeBazaar</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full" />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            {dealInfo.brand_name} Collaboration
          </h2>
          <p className="text-white/70 text-sm md:text-base">
            Please confirm your decision on the requested contract updates
          </p>
        </motion.div>

        {/* Response Form */}
        {!isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* 1️⃣ Summary of Requested Changes */}
            {requestedChanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6",
                  "border border-yellow-500/30 shadow-xl",
                  "sticky top-4 z-10"
                )}
              >
                <h3 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-yellow-400" />
                  Requested Contract Revisions
                </h3>
                <ul className="space-y-2">
                  {requestedChanges.slice(0, 5).map((change, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm md:text-base">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span className="text-white/90 flex-1">{change.title}</span>
                    </li>
                  ))}
                  {requestedChanges.length > 5 && (
                    <li className="text-xs text-white/60 italic">
                      + {requestedChanges.length - 5} more requested changes
                    </li>
                  )}
                </ul>
              </motion.div>
            )}

            {/* Main Card */}
            <div className={cn(
              "bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8",
              "border border-white/20 shadow-xl"
            )}>
              {/* 2️⃣ Enhanced Response Buttons */}
              <div className="space-y-4 mb-6">
                {/* Accept Button */}
                <motion.button
                  onClick={() => handleStatusSelect('accepted')}
                  className={cn(
                    "w-full rounded-xl border-2 transition-all text-left",
                    "flex items-center gap-4 min-h-[64px] p-4",
                    selectedStatus === 'accepted'
                      ? "bg-green-500/30 border-green-500 shadow-lg shadow-green-500/30"
                      : "bg-white/5 border-white/20 hover:bg-white/10 opacity-70 hover:opacity-100"
                  )}
                  whileHover={selectedStatus !== 'accepted' ? { scale: 1.01 } : {}}
                  whileTap={{ scale: 0.99 }}
                  animate={selectedStatus === 'accepted' ? {
                    scale: [1, 1.02, 1],
                    borderWidth: [2, 3, 2]
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      selectedStatus === 'accepted' ? "bg-green-500/40" : "bg-white/10"
                    )}
                    animate={selectedStatus === 'accepted' ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <CheckCircle className={cn(
                      "w-6 h-6",
                      selectedStatus === 'accepted' ? "text-green-300" : "text-white/60"
                    )} />
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">Accept All Changes</div>
                    <div className="text-sm text-white/70 mb-2">I agree to all requested contract revisions</div>
                    <div className="text-xs text-white/60 italic">
                      Most creators request these standard safety updates for clarity.
                    </div>
                  </div>
                </motion.button>

                {/* Negotiate Button */}
                <motion.button
                  onClick={() => handleStatusSelect('negotiating')}
                  className={cn(
                    "w-full rounded-xl border-2 transition-all text-left",
                    "flex items-center gap-4 min-h-[64px] p-4",
                    selectedStatus === 'negotiating'
                      ? "bg-yellow-500/30 border-yellow-500 shadow-lg shadow-yellow-500/30"
                      : "bg-white/5 border-white/20 hover:bg-white/10 opacity-70 hover:opacity-100"
                  )}
                  whileHover={selectedStatus !== 'negotiating' ? { scale: 1.01 } : {}}
                  whileTap={{ scale: 0.99 }}
                  animate={selectedStatus === 'negotiating' ? {
                    scale: [1, 1.02, 1],
                    borderWidth: [2, 3, 2]
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      selectedStatus === 'negotiating' ? "bg-yellow-500/40" : "bg-white/10"
                    )}
                    animate={selectedStatus === 'negotiating' ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <AlertCircle className={cn(
                      "w-6 h-6",
                      selectedStatus === 'negotiating' ? "text-yellow-300" : "text-white/60"
                    )} />
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">Want to Negotiate</div>
                    <div className="text-sm text-white/70 mb-2">I'd like to discuss some of the requested changes</div>
                    <div className="text-xs text-white/60 italic">
                      You can discuss specific points after submitting.
                    </div>
                  </div>
                </motion.button>

                {/* Reject Button */}
                <motion.button
                  onClick={() => handleStatusSelect('rejected')}
                  className={cn(
                    "w-full rounded-xl border-2 transition-all text-left",
                    "flex items-center gap-4 min-h-[64px] p-4",
                    selectedStatus === 'rejected'
                      ? "bg-red-500/30 border-red-500 shadow-lg shadow-red-500/30"
                      : "bg-white/5 border-white/20 hover:bg-white/10 opacity-70 hover:opacity-100"
                  )}
                  whileHover={selectedStatus !== 'rejected' ? { scale: 1.01 } : {}}
                  whileTap={{ scale: 0.99 }}
                  animate={selectedStatus === 'rejected' ? {
                    scale: [1, 1.02, 1],
                    borderWidth: [2, 3, 2]
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      selectedStatus === 'rejected' ? "bg-red-500/40" : "bg-white/10"
                    )}
                    animate={selectedStatus === 'rejected' ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <XCircle className={cn(
                      "w-6 h-6",
                      selectedStatus === 'rejected' ? "text-red-300" : "text-white/60"
                    )} />
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">Reject Changes</div>
                    <div className="text-sm text-white/70 mb-2">I cannot accept the requested revisions</div>
                    <div className="text-xs text-white/60 italic">
                      You may continue the deal, but some unclear terms may remain.
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* 4️⃣ Brand Team Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-white/90">
                  Your Name / Team (Optional)
                </label>
                <input
                  type="text"
                  value={brandTeamName}
                  onChange={(e) => setBrandTeamName(e.target.value)}
                  placeholder="e.g. Aditi – Brand Partnerships Team"
                  className={cn(
                    "w-full p-4 rounded-xl bg-white/5 border border-white/20",
                    "text-white placeholder:text-white/40",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  )}
                  maxLength={100}
                />
              </div>

              {/* Optional Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-white/90">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any additional notes or questions..."
                  className={cn(
                    "w-full p-4 rounded-xl bg-white/5 border border-white/20",
                    "text-white placeholder:text-white/40",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
                    "resize-none min-h-[120px]"
                  )}
                  maxLength={1000}
                />
                <div className="text-xs text-white/50 mt-2 text-right">
                  {message.length}/1000
                </div>
              </div>

              {/* 5️⃣ Anti-Hesitation Micro-Line */}
              <div className="mb-4 text-center">
                <p className="text-xs text-white/60 italic">
                  You can update your response later if needed.
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!selectedStatus || isSubmitting}
                whileHover={selectedStatus && !isSubmitting ? { scale: 1.02 } : {}}
                whileTap={selectedStatus && !isSubmitting ? { scale: 0.98 } : {}}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold transition-all",
                  "flex items-center justify-center gap-2 min-h-[56px]",
                  selectedStatus && !isSubmitting
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Response
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* 6️⃣ Enhanced Post-Submission Confirmation */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12",
              "border border-white/20 shadow-xl text-center"
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-4">Response Submitted Successfully!</h3>
            
            {/* Trust Points */}
            <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">Response sent securely</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">Creator notified instantly</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">This response is legally time-stamped</p>
              </div>
            </div>

            {/* NoticeBazaar Trust Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-white/60 mt-6">
              <Shield className="w-4 h-4" />
              <span>Secured by NoticeBazaar</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BrandResponsePage;

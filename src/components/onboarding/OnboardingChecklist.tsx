"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Link2, MessageCircleMore, Sparkles, X, ArrowRight } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const OnboardingChecklist = () => {
  const { profile } = useSession();
  const { data: brandDeals = [] } = useBrandDeals({ creatorId: profile?.id, enabled: !!profile?.id });
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  const hasOffers = brandDeals.length > 0;
  const hasEarnings = brandDeals.some(deal => deal.payment_received_date);
  const linkShared = !!profile?.link_shared_at;

  const completionPercentage = ([linkShared, hasOffers, hasEarnings].filter(Boolean).length / 3) * 100;
  const allCompleted = completionPercentage === 100;

  if (!isVisible || allCompleted) {
    return null;
  }

  const copyLink = async () => {
    if (profile?.username) {
      const url = `${window.location.origin}/${profile.username}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success('Collab link copied!');
    }
  };

  const checklistItems = [
    {
      id: 'share-link',
      title: 'Share your collab link',
      description: 'Send it to brands on Instagram DM or WhatsApp',
      icon: MessageCircleMore,
      action: copyLink,
      completed: linkCopied || linkShared,
      cta: linkCopied ? 'Copied!' : 'Copy Link',
      ctaIcon: linkCopied ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />,
    },
    {
      id: 'receive-offer',
      title: 'Receive your first offer',
      description: 'A brand sends you a deal through your link',
      icon: Link2,
      completed: hasOffers,
      cta: hasOffers ? 'Deal received!' : 'Waiting...',
      ctaIcon: hasOffers ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />,
    },
    {
      id: 'get-paid',
      title: 'Get paid',
      description: 'Submit your content, brand approves, you confirm payment',
      icon: CheckCircle,
      completed: hasEarnings,
      cta: hasEarnings ? 'Paid!' : 'In progress',
      ctaIcon: hasEarnings ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-secondary/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-6 border border-border shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-foreground mb-1">Your collab journey</h3>
              <p className="text-[13px] text-secondary">
                {checklistItems.filter(i => i.completed).length} of {checklistItems.length} done
              </p>
            </div>
          </div>
          <button type="button"
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-secondary/50 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-secondary" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-secondary/50 rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {checklistItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  item.completed
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-card border border-border'
                }`}
              >
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-secondary/50 flex-shrink-0" />
                )}
                <Icon className={`w-5 h-5 text-secondary flex-shrink-0 ${item.completed ? 'opacity-40' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-[15px] ${item.completed ? 'text-green-400' : 'text-foreground'}`}>
                    {item.title}
                  </div>
                  <div className="text-[13px] text-secondary">{item.description}</div>
                </div>
                {item.action && !item.completed && (
                  <button
                    type="button"
                    onClick={item.action}
                    className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {item.cta}
                    {item.ctaIcon}
                  </button>
                )}
                {item.completed && (
                  <span className="text-xs font-bold text-green-400 whitespace-nowrap">{item.cta}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingChecklist;

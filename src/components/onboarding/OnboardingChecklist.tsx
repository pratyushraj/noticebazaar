"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Briefcase, FileText, MessageCircle, Shield, TrendingUp, Sparkles, X } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  checkFn: () => boolean;
  color: string;
}

const OnboardingChecklist = () => {
  const { profile } = useSession();
  const { data: brandDeals = [] } = useBrandDeals({ creatorId: profile?.id, enabled: !!profile?.id });
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const checklistItems: ChecklistItem[] = [
    {
      id: 'add-deal',
      title: 'Add Your First Deal',
      description: 'Upload a contract to get started',
      icon: Briefcase,
      route: '/contract-upload',
      checkFn: () => brandDeals.length > 0,
      color: 'text-blue-400'
    },
    {
      id: 'upload-contract',
      title: 'Review a Contract',
      description: 'Get AI-powered contract analysis',
      icon: FileText,
      route: '/contract-upload',
      checkFn: () => brandDeals.some(deal => deal.status !== 'Drafting'),
      color: 'text-purple-400'
    },
    {
      id: 'chat-advisor',
      title: 'Chat with Advisor',
      description: 'Connect with your legal advisor',
      icon: MessageCircle,
      route: '/messages',
      checkFn: () => false, // TODO: Check if user has sent a message
      color: 'text-green-400'
    },
    {
      id: 'protect-content',
      title: 'Protect Your Content',
      description: 'Register your original content',
      icon: Shield,
      route: '/creator-content-protection',
      checkFn: () => false, // TODO: Check if user has protected content
      color: 'text-orange-400'
    },
    {
      id: 'track-earnings',
      title: 'Track Your Earnings',
      description: 'View your payment dashboard',
      icon: TrendingUp,
      route: '/creator-payments',
      checkFn: () => brandDeals.some(deal => deal.payment_received_date),
      color: 'text-pink-400'
    }
  ];

  useEffect(() => {
    const completed = new Set<string>();
    checklistItems.forEach(item => {
      if (item.checkFn()) {
        completed.add(item.id);
      }
    });
    setCompletedItems(completed);
  }, [brandDeals]);

  const completionPercentage = (completedItems.size / checklistItems.length) * 100;
  const allCompleted = completedItems.size === checklistItems.length;

  if (!isVisible || allCompleted) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-6 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-white mb-1">Getting Started Checklist</h3>
              <p className="text-[13px] text-purple-200">
                {completedItems.size} of {checklistItems.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss checklist"
          >
            <X className="w-4 h-4 text-purple-300" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
            />
          </div>
          <p className="text-[13px] text-purple-300 text-right">
            {Math.round(completionPercentage)}% Complete
          </p>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {checklistItems.map((item, index) => {
            const Icon = item.icon;
            const isCompleted = completedItems.has(item.id);
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => item.route && navigate(item.route)}
                disabled={isCompleted}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isCompleted
                    ? 'bg-green-500/10 border border-green-500/20 cursor-default'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                ) : (
                  <Circle className="w-5 h-5 text-purple-400/50 flex-shrink-0" />
                )}
                <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-[15px] ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                    {item.title}
                  </div>
                  <div className="text-[13px] text-purple-200">{item.description}</div>
                </div>
                {!isCompleted && item.route && (
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="text-purple-400"
                  >
                    →
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 text-center"
          >
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="font-semibold text-green-400">All set! You're ready to go! 🎉</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingChecklist;

"use client";

import React from 'react';
import { useSwipeable } from 'react-swipeable';
import ProjectDealCard from './ProjectDealCard';
import type { ProjectDealCardProps } from './ProjectDealCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import { BrandDeal } from '@/types';

interface SwipeableDealCardProps extends ProjectDealCardProps {
  onSwipeLeft?: (deal: BrandDeal) => void; // Chase Payment
  onSwipeRight?: (deal: BrandDeal) => void; // Mark Delivered
}

const SwipeableDealCard: React.FC<SwipeableDealCardProps> = ({
  deal,
  onSwipeLeft,
  onSwipeRight,
  stage,
  onView,
  onEdit,
  onManageDeliverables,
  onUploadContent,
  onContactBrand,
  onViewContract,
}) => {
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [showAction, setShowAction] = React.useState<'left' | 'right' | null>(null);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      setSwipeOffset(e.deltaX);
      if (e.deltaX < -50) {
        setShowAction('left');
      } else if (e.deltaX > 50) {
        setShowAction('right');
      } else {
        setShowAction(null);
      }
    },
    onSwipedLeft: () => {
      if (swipeOffset < -100) {
        onSwipeLeft?.(deal);
      }
      setSwipeOffset(0);
      setShowAction(null);
    },
    onSwipedRight: () => {
      if (swipeOffset > 100) {
        onSwipeRight?.(deal);
      }
      setSwipeOffset(0);
      setShowAction(null);
    },
    onSwiped: () => {
      setSwipeOffset(0);
      setShowAction(null);
    },
    trackMouse: true,
  });

  return (
    <div className="relative overflow-hidden" {...handlers}>
      {/* Swipe Actions */}
      <AnimatePresence>
        {showAction === 'left' && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute left-0 top-0 bottom-0 w-24 bg-orange-500/20 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <div className="flex flex-col items-center gap-1">
              <Send className="w-6 h-6 text-orange-400" />
              <span className="text-xs font-medium text-orange-400">Chase</span>
            </div>
          </motion.div>
        )}
        {showAction === 'right' && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute right-0 top-0 bottom-0 w-24 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-xs font-medium text-green-400">Done</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        style={{ x: swipeOffset }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <ProjectDealCard 
          deal={deal}
          stage={stage}
          onView={onView}
          onEdit={onEdit}
          onManageDeliverables={onManageDeliverables}
          onUploadContent={onUploadContent}
          onContactBrand={onContactBrand}
          onViewContract={onViewContract}
        />
      </motion.div>
    </div>
  );
};

export default SwipeableDealCard;


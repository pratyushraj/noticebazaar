"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tip, TipAction } from '@/components/contextual-tips/TipCard';
import { getAllTips, UserState } from '@/lib/contextual-tips/tips';
import { analytics } from '@/utils/analytics';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';

const STORAGE_KEY_PREFIX = 'contextual-tip-dismissed-';

export const useContextualTips = (currentView?: string) => {
  const { profile, user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [userActions, setUserActions] = useState({
    checkedPayments: false,
    viewedDeals: false,
    messagesSent: 0,
  });

  // Fetch user data for state
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Calculate user state
  const userState: UserState = useMemo(() => {
    const hasUploadedContract = brandDeals.length > 0;
    const totalDeals = brandDeals.length;
    const earnings = brandDeals
      .filter((deal) => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const protectionScore = 85; // TODO: Calculate from actual protection data
    const daysActive = profile?.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const hasOverduePayment = brandDeals.some(
      (deal) => deal.status === 'Payment Pending' && deal.payment_due_date
        ? new Date(deal.payment_due_date) < new Date()
        : false
    );
    const hasExpiringContract = false; // TODO: Check for expiring contracts
    const messagesSent = userActions.messagesSent;

    return {
      hasUploadedContract,
      totalDeals,
      earnings,
      protectionScore,
      daysActive,
      hasOverduePayment,
      hasExpiringContract,
      messagesSent,
      checkedPayments: userActions.checkedPayments,
      viewedDeals: userActions.viewedDeals,
    };
  }, [brandDeals, profile, userActions]);

  // Load dismissed tips from localStorage
  useEffect(() => {
    if (profile?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${profile.id}`);
      if (stored) {
        try {
          setDismissedTips(JSON.parse(stored));
        } catch (e) {
          console.warn('Failed to parse dismissed tips', e);
        }
      }
    }
  }, [profile?.id]);

  // Save dismissed tips to localStorage
  useEffect(() => {
    if (profile?.id && dismissedTips.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${profile.id}`, JSON.stringify(dismissedTips));
    }
  }, [dismissedTips, profile?.id]);

  // Get view from location or prop
  const view = useMemo(() => {
    if (currentView) return currentView;
    
    const path = location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('contract-upload') || path.includes('upload')) return 'upload';
    if (path.includes('contracts') || path.includes('deals')) return 'deals';
    if (path.includes('payments')) return 'payments';
    if (path.includes('protection')) return 'protection';
    if (path.includes('messages')) return 'messages';
    return null;
  }, [location.pathname, currentView]);

  // Get applicable tips
  const applicableTips = useMemo(() => {
    if (!view) return [];

    const allTips = getAllTips(userState);
    
    return allTips
      .filter((tip) => {
        // Skip if dismissed
        if (dismissedTips.includes(tip.id)) return false;

        // Check view match
        if (tip.view && tip.view !== view) return false;

        // Check condition
        if (tip.condition && !tip.condition()) return false;

        // Only show view-triggered tips automatically
        if (tip.trigger === 'view') return true;

        return false;
      })
      .sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      });
  }, [view, userState, dismissedTips]);

  // Show tip when view changes or applicable tips change
  useEffect(() => {
    if (applicableTips.length > 0 && !currentTip) {
      const tip = applicableTips[0];
      setCurrentTip(tip);
      
      // Track tip view
      if (profile?.id) {
        analytics.track('contextual_tip_viewed', {
          category: 'tips',
          tip_id: tip.id,
          tip_title: tip.title,
          tip_priority: tip.priority,
          view: view,
          userId: profile.id,
        });
      }
    }
  }, [applicableTips, currentTip, view, profile?.id]);

  // Handle tip dismissal
  const handleDismiss = useCallback(
    (permanent: boolean) => {
      if (currentTip) {
        if (permanent) {
          setDismissedTips((prev) => [...prev, currentTip.id]);
          
          // Track dismissal
          if (profile?.id) {
            analytics.track('contextual_tip_dismissed', {
              category: 'tips',
              tip_id: currentTip.id,
              permanent: true,
              userId: profile.id,
            });
          }
        } else {
          // Track "later" action
          if (profile?.id) {
            analytics.track('contextual_tip_dismissed', {
              category: 'tips',
              tip_id: currentTip.id,
              permanent: false,
              userId: profile.id,
            });
          }
        }
        setCurrentTip(null);
      }
    },
    [currentTip, profile?.id]
  );

  // Handle tip action
  const handleAction = useCallback(
    (action: TipAction) => {
      if (!currentTip) return;

      // Track action
      if (profile?.id) {
        analytics.track('contextual_tip_action', {
          category: 'tips',
          tip_id: currentTip.id,
          action_type: action.type,
          action_label: action.label,
          userId: profile.id,
        });
      }

      if (action.type === 'dismiss') {
        handleDismiss(true);
      } else if (action.type === 'navigate' && action.target) {
        navigate(action.target);
        handleDismiss(true);
      } else if (action.type === 'action' && action.callback) {
        // Execute callback
        // TODO: Implement callback handlers
        console.log('Action callback:', action.callback);
        handleDismiss(true);
      }
    },
    [currentTip, navigate, handleDismiss, profile?.id]
  );

  // Trigger event-based tips
  const triggerEvent = useCallback(
    (eventName: string) => {
      const allTips = getAllTips(userState);
      const eventTip = allTips.find((tip) => tip.trigger === 'event' && tip.event === eventName);

      if (eventTip && !dismissedTips.includes(eventTip.id)) {
        setCurrentTip(eventTip);
        
        // Track event tip
        if (profile?.id) {
          analytics.track('contextual_tip_event_triggered', {
            category: 'tips',
            tip_id: eventTip.id,
            event_name: eventName,
            userId: profile.id,
          });
        }
      }
    },
    [userState, dismissedTips, profile?.id]
  );

  // Track user actions
  useEffect(() => {
    if (view === 'payments' && !userActions.checkedPayments) {
      setUserActions((prev) => ({ ...prev, checkedPayments: true }));
    }
    if (view === 'deals' && !userActions.viewedDeals) {
      setUserActions((prev) => ({ ...prev, viewedDeals: true }));
    }
  }, [view, userActions]);

  return {
    currentTip,
    handleDismiss,
    handleAction,
    triggerEvent,
    applicableTips,
    userState,
  };
};


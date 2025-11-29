"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tip, TipAction } from '@/components/contextual-tips/TipCard';
import { getAllTips, UserState } from '@/lib/contextual-tips/tips';
import { analytics } from '@/utils/analytics';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';

const STORAGE_KEY_PREFIX = 'contextual-tip-dismissed-';
const TEMP_STORAGE_KEY_PREFIX = 'contextual-tip-temp-dismissed-';
const TEMP_DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (effectively permanent)

export const useContextualTips = (currentView?: string) => {
  const { profile } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [temporaryDismissals, setTemporaryDismissals] = useState<Record<string, number>>({});
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
    const daysActive = (profile as any)?.created_at
      ? Math.floor((Date.now() - new Date((profile as any).created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const hasOverduePayment = brandDeals.some(
      (deal) => deal.status === 'Payment Pending' && deal.payment_expected_date
        ? new Date(deal.payment_expected_date) < new Date()
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
      const storedTemp = localStorage.getItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`);
      if (storedTemp) {
        try {
          const tempDismissals = JSON.parse(storedTemp);
          // Clean up expired dismissals
          const now = Date.now();
          const cleaned: Record<string, number> = {};
          for (const [key, value] of Object.entries(tempDismissals)) {
            if (typeof value === 'number' && value > now) {
              cleaned[key] = value;
            }
          }
          setTemporaryDismissals(cleaned);
          // Update localStorage with cleaned data
          if (Object.keys(cleaned).length !== Object.keys(tempDismissals).length) {
            localStorage.setItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`, JSON.stringify(cleaned));
          }
        } catch (e) {
          console.warn('Failed to parse temporary dismissed tips', e);
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

  // Save temporary dismissals
  useEffect(() => {
    if (profile?.id) {
      localStorage.setItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`, JSON.stringify(temporaryDismissals));
    }
  }, [temporaryDismissals, profile?.id]);

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
    const now = Date.now();
    
    // Get temporary dismissals from localStorage as well (for persistence)
    let localStorageDismissals: Record<string, number> = {};
    if (profile?.id) {
      try {
        const storedTemp = localStorage.getItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`);
        if (storedTemp) {
          localStorageDismissals = JSON.parse(storedTemp);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return allTips
      .filter((tip) => {
        // Skip if dismissed
        if (dismissedTips.includes(tip.id)) return false;

        // Skip if temporarily dismissed (check both state and localStorage)
        const tempExpiry = temporaryDismissals[tip.id] || localStorageDismissals[tip.id];
        if (tempExpiry && tempExpiry > now) {
          return false;
        }

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
  }, [view, userState, dismissedTips, temporaryDismissals, profile?.id]);

  // Show tip when view changes or applicable tips change
  useEffect(() => {
    // Only show tip if there are applicable tips, no current tip, and view is stable
    if (applicableTips.length > 0 && !currentTip && view) {
      const tip = applicableTips[0];
      const now = Date.now();
      
      // Triple-check dismissal: state, localStorage, and permanent dismissal
      // Check permanent dismissal first
      if (dismissedTips.includes(tip.id)) {
        return; // Don't show if permanently dismissed
      }
      
      // Check temporary dismissal in state
      const tempExpiry = temporaryDismissals[tip.id];
      if (tempExpiry && tempExpiry > now) {
        return; // Don't show if still temporarily dismissed in state
      }
      
      // Check temporary dismissal in localStorage (most reliable check)
      if (profile?.id) {
        try {
          const storedTemp = localStorage.getItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`);
          if (storedTemp) {
            const tempDismissals = JSON.parse(storedTemp);
            const storedExpiry = tempDismissals[tip.id];
            if (storedExpiry && storedExpiry > now) {
              // Update state to match localStorage (sync state with localStorage)
              setTemporaryDismissals((prev) => {
                if (prev[tip.id] !== storedExpiry) {
                  return { ...prev, [tip.id]: storedExpiry };
                }
                return prev;
              });
              return; // Don't show if temporarily dismissed in localStorage
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Final check: make sure tip wasn't just dismissed (race condition protection)
      // This prevents showing a tip that was just dismissed in the same render cycle
      if (dismissedTips.includes(tip.id) || (temporaryDismissals[tip.id] && temporaryDismissals[tip.id] > now)) {
        return;
      }
      
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
  }, [applicableTips, currentTip, view, profile?.id, temporaryDismissals, dismissedTips]);

  // Handle tip dismissal
  const handleDismiss = useCallback(
    (permanent: boolean) => {
      if (currentTip) {
        const tipId = currentTip.id;
        
        if (permanent) {
          // For permanent dismissal, clear tip and mark as dismissed
          setCurrentTip(null);
          setDismissedTips((prev) => {
            if (prev.includes(tipId)) return prev;
            return [...prev, tipId];
          });
          
          // Track dismissal
          if (profile?.id) {
            analytics.track('contextual_tip_dismissed', {
              category: 'tips',
              tip_id: tipId,
              permanent: true,
              userId: profile.id,
            });
          }
        } else {
          // Set temporary dismissal with expiry
          const expiry = Date.now() + TEMP_DISMISS_DURATION;
          
          // Save to localStorage FIRST (synchronously) to prevent race conditions
          // This ensures localStorage is updated before any re-renders
          if (profile?.id) {
            try {
              const storedTemp = localStorage.getItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`);
              const tempDismissals = storedTemp ? JSON.parse(storedTemp) : {};
              tempDismissals[tipId] = expiry;
              localStorage.setItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`, JSON.stringify(tempDismissals));
            } catch (e) {
              console.warn('Failed to save temporary dismissal', e);
            }
          }
          
          // Update state BEFORE clearing tip (so filter excludes it immediately)
          setTemporaryDismissals((prev) => ({
            ...prev,
            [tipId]: expiry,
          }));
          
          // Clear tip AFTER state is updated (prevents reappearance)
          setCurrentTip(null);
          
          // Mark user actions based on tip type to prevent re-showing
          // This makes conditions false so tips don't reappear
          if (tipId === 'payments-first-view') {
            setUserActions((prev) => ({ ...prev, checkedPayments: true }));
          } else if (tipId === 'deals-empty' || tipId === 'deals-first-view' || tipId === 'deal-progress-tip') {
            setUserActions((prev) => ({ ...prev, viewedDeals: true }));
          } else if (tipId === 'messages-advisor-available') {
            // Mark as having seen messages to prevent re-showing
            setUserActions((prev) => ({ ...prev, messagesSent: prev.messagesSent > 0 ? prev.messagesSent : 1 }));
          } else if (tipId === 'dashboard-welcome' || tipId === 'earnings-zero') {
            // Mark as having viewed dashboard - this won't affect dashboard-welcome condition
            // but the temporary dismissal will prevent it from showing
            setUserActions((prev) => ({ ...prev, viewedDeals: true, checkedPayments: true }));
          }
          
          // Track "later" action
          if (profile?.id) {
            analytics.track('contextual_tip_dismissed', {
              category: 'tips',
              tip_id: tipId,
              permanent: false,
              userId: profile.id,
            });
          }
        }
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


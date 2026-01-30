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
  const [isInitialized, setIsInitialized] = useState(false);
  const [userActions, setUserActions] = useState({
    checkedPayments: false,
    viewedDeals: false,
    messagesSent: 0,
  });

  // Fetch user data for state
  const { data: brandDeals = [], isLoading: isLoadingDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Calculate user state (dealsDataReady only true once deals have finished loading)
  const userState: UserState = useMemo(() => {
    const hasUploadedContract = brandDeals.length > 0;
    const totalDeals = brandDeals.length;
    const dealsDataReady = !!profile?.id && !isLoadingDeals;
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
      dealsDataReady,
    };
  }, [brandDeals, profile, userActions, isLoadingDeals]);

  // Load dismissed tips from localStorage IMMEDIATELY when profile is available
  useEffect(() => {
    if (profile?.id && !isInitialized) {
      console.log('Initializing contextual tips for profile:', profile.id);
      
      // Load permanent dismissals
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${profile.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDismissedTips(parsed);
          console.log('Loaded permanent dismissals:', parsed);
        } catch (e) {
          console.warn('Failed to parse dismissed tips', e);
        }
      }
      
      // Load temporary dismissals
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
          console.log('Loaded temporary dismissals:', cleaned);
          // Update localStorage with cleaned data
          if (Object.keys(cleaned).length !== Object.keys(tempDismissals).length) {
            localStorage.setItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`, JSON.stringify(cleaned));
          }
        } catch (e) {
          console.warn('Failed to parse temporary dismissed tips', e);
        }
      }
      
      setIsInitialized(true);
    }
  }, [profile?.id, isInitialized]);

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
    
    // Get permanent and temporary dismissals from localStorage (for persistence)
    let localStorageDismissed: string[] = [];
    let localStorageDismissals: Record<string, number> = {};
    if (profile?.id) {
      try {
        // Load permanent dismissals
        const storedPermanent = localStorage.getItem(`${STORAGE_KEY_PREFIX}${profile.id}`);
        if (storedPermanent) {
          localStorageDismissed = JSON.parse(storedPermanent);
        }
        
        // Load temporary dismissals
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
        // Skip if permanently dismissed (check both state and localStorage)
        if (dismissedTips.includes(tip.id) || localStorageDismissed.includes(tip.id)) {
          return false;
        }

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
    // Only show tip if initialized, there are applicable tips, no current tip, and view is stable
    if (!isInitialized) {
      console.log('Not initialized yet, skipping tip display');
      return;
    }
    
    if (applicableTips.length > 0 && !currentTip && view) {
      const tip = applicableTips[0];
      const now = Date.now();
      
      // Quadruple-check dismissal: state and localStorage for both permanent and temporary
      // Check permanent dismissal in state
      if (dismissedTips.includes(tip.id)) {
        console.log('Tip blocked by state dismissal:', tip.id);
        return; // Don't show if permanently dismissed in state
      }
      
      // Check permanent dismissal in localStorage (most reliable check)
      if (profile?.id) {
        try {
          const storedPermanent = localStorage.getItem(`${STORAGE_KEY_PREFIX}${profile.id}`);
          if (storedPermanent) {
            const permanentDismissals: string[] = JSON.parse(storedPermanent);
            if (permanentDismissals.includes(tip.id)) {
              console.log('Tip blocked by localStorage permanent dismissal:', tip.id);
              // Update state to match localStorage (sync state with localStorage)
              setDismissedTips((prev) => {
                if (!prev.includes(tip.id)) {
                  return [...prev, tip.id];
                }
                return prev;
              });
              return; // Don't show if permanently dismissed in localStorage
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Check temporary dismissal in state
      const tempExpiry = temporaryDismissals[tip.id];
      if (tempExpiry && tempExpiry > now) {
        console.log('Tip blocked by state temp dismissal:', tip.id);
        return; // Don't show if still temporarily dismissed in state
      }
      
      // Check temporary dismissal in localStorage
      if (profile?.id) {
        try {
          const storedTemp = localStorage.getItem(`${TEMP_STORAGE_KEY_PREFIX}${profile.id}`);
          if (storedTemp) {
            const tempDismissals = JSON.parse(storedTemp);
            const storedExpiry = tempDismissals[tip.id];
            if (storedExpiry && storedExpiry > now) {
              console.log('Tip blocked by localStorage temp dismissal:', tip.id);
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
        console.log('Tip blocked by final check:', tip.id);
        return;
      }
      
      console.log('Showing tip:', tip.id);
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
  }, [applicableTips, currentTip, view, profile?.id, temporaryDismissals, dismissedTips, isInitialized]);

  const oneTimeTipIds = useMemo(() => new Set([
    'dashboard-welcome',
    'earnings-zero',
    'deals-empty',
    'deal-progress-tip',
    'payments-first-view',
    'messages-advisor-available',
  ]), []);

  // Handle tip dismissal
  const handleDismiss = useCallback(
    (permanent: boolean) => {
      if (currentTip) {
        const tipId = currentTip.id;
        const shouldForcePermanent = !permanent && (currentTip.trigger === 'view' || oneTimeTipIds.has(tipId));
        const isPermanentDismissal = permanent || shouldForcePermanent;

        console.log('Dismissing tip:', tipId, 'permanent:', isPermanentDismissal, 'shouldForcePermanent:', shouldForcePermanent);

        if (isPermanentDismissal) {
          // Save to localStorage FIRST (synchronously) to prevent race conditions
          if (profile?.id) {
            try {
              const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${profile.id}`);
              const dismissed = stored ? JSON.parse(stored) : [];
              if (!dismissed.includes(tipId)) {
                dismissed.push(tipId);
                localStorage.setItem(`${STORAGE_KEY_PREFIX}${profile.id}`, JSON.stringify(dismissed));
                console.log('Saved permanent dismissal to localStorage:', dismissed);
              }
            } catch (e) {
              console.warn('Failed to save permanent dismissal', e);
            }
          }
          
          // Update state AFTER localStorage
          setDismissedTips((prev) => {
            if (prev.includes(tipId)) return prev;
            const newDismissed = [...prev, tipId];
            console.log('Updated dismissedTips state:', newDismissed);
            return newDismissed;
          });
          
          // Clear tip AFTER state is updated
          setCurrentTip(null);
          
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
    [currentTip, profile?.id, oneTimeTipIds, setUserActions]
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


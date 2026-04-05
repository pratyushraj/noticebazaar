"use client";

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { AlertTriangle, CheckCircle2, Clock, Instagram, Loader2, Lock, ShieldCheck, XCircle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CollabRequestStatus = 'pending' | 'accepted' | 'countered' | 'declined';
type CollabType = 'paid' | 'barter' | 'hybrid' | 'both';

interface CollabRequest {
  id: string;
  brand_name: string;
  brand_email: string;
  brand_instagram?: string | null;
  collab_type: CollabType;
  budget_range: string | null;
  exact_budget: number | null;
  barter_description: string | null;
  barter_value: number | null;
  barter_product_image_url?: string | null;
  campaign_description: string;
  deliverables: string | string[];
  usage_rights: boolean;
  deadline: string | null;
  status: CollabRequestStatus;
  created_at: string;
  creator_id: string;
}

const normalizeInstagramHandle = (value?: string | null): string | null => {
  if (!value) return null;
  let v = String(value).trim();
  if (!v) return null;
  v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  v = v.replace(/^@+/, '');
  v = v.split(/[/?#]/)[0] || '';
  return v.trim() || null;
};

const normalizeDeliverable = (deliverable: any): string => {
  if (typeof deliverable === 'string') return deliverable;
  if (!deliverable || typeof deliverable !== 'object') return String(deliverable ?? '');

  const count = deliverable.count ?? deliverable.quantity;
  const name = deliverable.name ?? deliverable.contentType ?? deliverable.type;
  const platform = deliverable.platform;
  if (name) {
    const parts = [count ? String(count) : null, platform ? String(platform) : null, String(name)].filter(Boolean);
    return parts.join(' ');
  }

  try {
    return JSON.stringify(deliverable);
  } catch {
    return String(deliverable);
  }
};

const parseDeliverables = (deliverables: any): string[] => {
  if (!deliverables) return [];

  const coerceToList = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  };

  if (Array.isArray(deliverables)) return deliverables.map(normalizeDeliverable).filter(Boolean);
  if (typeof deliverables === 'string') {
    try {
      const parsed = JSON.parse(deliverables);
      return coerceToList(parsed).map(normalizeDeliverable).filter(Boolean);
    } catch {
      return [deliverables].map(normalizeDeliverable).filter(Boolean);
    }
  }
  return coerceToList(deliverables).map(normalizeDeliverable).filter(Boolean);
};

const isHybrid = (collabType: CollabType) => collabType === 'hybrid' || collabType === 'both';
const isPaidLike = (collabType: CollabType) => collabType === 'paid' || isHybrid(collabType);
const isBarterLike = (collabType: CollabType) => collabType === 'barter' || isHybrid(collabType);
const collabTypeLabel = (collabType: CollabType) => {
  if (collabType === 'paid') return 'Paid';
  if (collabType === 'barter') return 'Free products as payment';
  return 'Paid + Product';
};

const formatBudget = (request: CollabRequest): string => {
  if (isPaidLike(request.collab_type)) {
    if (request.exact_budget) return `₹${request.exact_budget.toLocaleString()}`;
    if (request.budget_range) {
      const ranges: { [key: string]: string } = {
        'under-5000': 'Under ₹5,000',
        '5000-10000': '₹5,000 - ₹10,000',
        '10000-25000': '₹10,000 - ₹25,000',
        '25000+': '₹25,000+',
      };
      return ranges[request.budget_range] || request.budget_range;
    }
  }
  if (isBarterLike(request.collab_type)) {
    if (request.barter_value) return `Free products as payment (₹${request.barter_value.toLocaleString()})`;
    return 'Free products as payment';
  }
  return 'Not specified';
};

const CollabRequestBriefPage = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile } = useSession();
  const updateProfileMutation = useUpdateProfile();
  const requestFromState = state?.request as CollabRequest | undefined;
  const [request, setRequest] = useState<CollabRequest | null>(
    requestFromState && requestFromState.id === requestId ? requestFromState : null
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveRequestId = useMemo(() => (requestId || '').trim() || null, [requestId]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  const [pendingReelPrice, setPendingReelPrice] = useState('');
  const [pendingAddress, setPendingAddress] = useState('');
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);
  const [brandVerified, setBrandVerified] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showCounterDialog, setShowCounterDialog] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [isCounting, setIsCounting] = useState(false);

  useEffect(() => {
    if (!effectiveRequestId) return;
    if (requestFromState?.id === effectiveRequestId) {
      setRequest(requestFromState);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from('collab_requests')
          .select('*')
          .eq('id', effectiveRequestId as any)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;
        if (!data) throw new Error('Offer not found');
        const d = data as any;
        if (profile?.id && d.creator_id && d.creator_id !== profile.id) {
          throw new Error('You do not have access to this offer');
        }

        setRequest(d);
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.message || 'Failed to load offer details');
        setRequest(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveRequestId, profile?.id, requestFromState]);

  useEffect(() => {
    if (!request?.id || !profile?.id) return;
    void trackEvent('offer_opened', {
      creator_id: profile.id,
      request_id: request.id,
    });
  }, [request?.id, profile?.id]);

  useEffect(() => {
    if (!request?.id) return;
    const fetchBrandVerified = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${request.id}/brand-status`);
        const data = await res.json();
        if (data?.success) setBrandVerified(Boolean(data.brand_verified));
      } catch {
        // Non-critical - don't block UI
      }
    };
    void fetchBrandVerified();
  }, [request?.id]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!effectiveRequestId) {
    navigate('/creator-dashboard?tab=collabs&subtab=pending', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <CreatorNavigationWrapper
        title="Offer details"
        subtitle="Loading offer..."
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=collabs&subtab=pending"
        backIconOnly
      >
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="flex items-center justify-center py-14 text-foreground/70">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Loading...
          </div>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  if (loadError || !request) {
    return (
      <CreatorNavigationWrapper
        title="Offer details"
        subtitle="Offer not available"
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=collabs&subtab=pending"
        backIconOnly
      >
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="rounded-2xl bg-card border border-border p-5 text-foreground/80">
            <p className="text-sm font-semibold text-foreground mb-1">Couldn't open this offer</p>
            <p className="text-sm text-foreground/60">{loadError || 'Unknown error'}</p>
            <button type="button"
              onClick={() => navigate('/creator-dashboard?tab=collabs&subtab=pending', { replace: true })}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-info hover:bg-info text-foreground text-sm font-semibold px-4 py-2 transition-colors"
            >
              Back to offers
            </button>
          </div>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  const deliverablesList = parseDeliverables(request.deliverables);
  const subtitle = isBarterLike(request.collab_type) ? 'Free products offer' : (request.brand_name ?? 'Brand');
  const budgetLabel = formatBudget(request);
  const deadlineDate = request.deadline ? new Date(request.deadline) : null;
  const brandInstagramHandle = normalizeInstagramHandle((request as any)?.brand_instagram);

  const timeLeft = (() => {
    if (!deadlineDate || Number.isNaN(deadlineDate.getTime())) return null;
    const ms = deadlineDate.getTime() - Date.now();
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    if (ms <= 0) return { label: 'Past due', tone: 'danger' as const };
    if (hours < 24) return { label: `⚠ ${hours}h left`, tone: 'danger' as const };
    return { label: `${days + 1} days left`, tone: days < 3 ? 'warn' as const : 'ok' as const };
  })();

  const formatDeliverableChip = (raw: string) => {
    const s = String(raw || '').trim();
    const lower = s.toLowerCase();
    const countMatch = lower.match(/(^|\\s)(\\d+)\\s*(x|×)?\\s*/);
    const count = countMatch ? countMatch[2] : null;

    if (lower.includes('reel')) return { emoji: '🎬', label: 'Reel', count };
    if (lower.includes('story')) return { emoji: '📱', label: 'Story', count };
    if (lower.includes('post')) return { emoji: '🖼', label: 'Post', count };
    if (lower.includes('youtube')) return { emoji: '▶️', label: 'YouTube', count };
    return { emoji: '📦', label: s, count: null };
  };

  const handleAccept = async ({ skipRequirements = false }: { skipRequirements?: boolean } = {}) => {
    if (!effectiveRequestId) return;
    try {
      const requiresPaidRate =
        !skipRequirements &&
        isPaidLike(request.collab_type) &&
        !(Number(profile?.avg_rate_reel || (profile as any)?.reel_price || 0) > 0);
      const requiresAddress =
        !skipRequirements &&
        isBarterLike(request.collab_type) &&
        !String(profile?.location || (profile as any)?.address || '').trim();

      if (requiresPaidRate || requiresAddress) {
        setPendingReelPrice(requiresPaidRate ? String(profile?.avg_rate_reel || (profile as any)?.reel_price || '') : '');
        setPendingAddress(requiresAddress ? String(profile?.location || (profile as any)?.address || '') : '');
        setShowRequirementDialog(true);
        return;
      }

      setIsAccepting(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        toast.error('Please log in to accept offers');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/collab-requests/${effectiveRequestId}/accept`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        toast.error(data?.error || 'Failed to accept offer');
        return;
      }

      trackEvent('creator_accepted_request', {
        deal_id: data?.deal?.id,
        creator_id: profile?.id,
        collab_type: request.collab_type || 'paid',
      });
      trackEvent('offer_accepted', {
        deal_id: data?.deal?.id,
        creator_id: profile?.id,
        request_id: effectiveRequestId,
      });
      trackEvent('deal_started', {
        deal_id: data?.deal?.id,
        creator_id: profile?.id,
        request_id: effectiveRequestId,
      });

      toast.success(data?.needs_delivery_details ? 'Offer accepted. Add your address next.' : 'Offer accepted.');
      const acceptedDealId = typeof data?.deal?.id === 'string' ? data.deal.id : null;
      if (acceptedDealId) {
        navigate(
          data?.needs_delivery_details
            ? `/deal-delivery-details/${acceptedDealId}`
            : `/deal/${acceptedDealId}`,
          { replace: true }
        );
      } else {
        navigate('/creator-dashboard?tab=collabs&subtab=active', { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept offer');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSaveRequirementsAndAccept = async () => {
    if (!profile?.id || !request) return;

    const requiresPaidRate = isPaidLike(request.collab_type) && !(Number(profile?.avg_rate_reel || (profile as any)?.reel_price || 0) > 0);
    const requiresAddress = isBarterLike(request.collab_type) && !String(profile?.location || (profile as any)?.address || '').trim();

    if (requiresPaidRate && !(Number(pendingReelPrice) > 0)) {
      toast.error('Please add your price');
      return;
    }

    if (requiresAddress && pendingAddress.trim().length < 15) {
      toast.error('Address too short — please include flat/house, area, city, state, and 6-digit pincode');
      return;
    }
    // Validate pincode format (6 digits)
    const pincodeMatch = pendingAddress.match(/\b(\d{6})\b/);
    if (requiresAddress && !pincodeMatch) {
      toast.error('Please include a valid 6-digit PIN code in your address');
      return;
    }

    try {
      setIsSavingRequirements(true);
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        ...(requiresPaidRate ? {
          avg_rate_reel: Number(pendingReelPrice) || null,
          reel_price: Number(pendingReelPrice) || null,
        } : {}),
        ...(requiresAddress ? {
          address: pendingAddress.trim(),
          location: pendingAddress.trim(),
        } : {}),
      } as any);

      setShowRequirementDialog(false);
      toast.success('Saved. You can accept this offer now.');
      await handleAccept({ skipRequirements: true });
    } catch (error: any) {
      toast.error(error?.message || 'Could not save your details');
    } finally {
      setIsSavingRequirements(false);
    }
  };

  const handleDecline = async () => {
    if (!effectiveRequestId) return;
    try {
      setIsDeclining(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        toast.error('Please log in to decline offers');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/collab-requests/${effectiveRequestId}/decline`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        toast.error(data?.error || 'Failed to decline offer');
        return;
      }

      trackEvent('creator_declined_request', { request_id: effectiveRequestId, creator_id: profile?.id });
      toast.success('Offer declined');
      navigate('/creator-dashboard?tab=collabs&subtab=pending', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to decline offer');
    } finally {
      setIsDeclining(false);
    }
  };

  const handleCounter = async () => {
    if (!effectiveRequestId) return;
    try {
      setIsCounting(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        toast.error('Please log in to counter offers');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/collab-requests/${effectiveRequestId}/counter`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          final_price: counterPrice || undefined,
          notes: counterNotes || undefined,
        }),
      });

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        toast.error(data?.error || 'Failed to submit counter offer');
        return;
      }

      trackEvent('creator_countered_request', { request_id: effectiveRequestId, creator_id: profile?.id });
      toast.success('Counter offer sent');
      setShowCounterDialog(false);
      navigate('/creator-dashboard?tab=collabs&subtab=pending', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit counter offer');
    } finally {
      setIsCounting(false);
    }
  };

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-foreground px-4 py-2.5 flex items-center gap-2 text-sm font-bold shadow-lg">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          You're offline — changes will sync when you reconnect
        </div>
      )}
      <CreatorNavigationWrapper
        title="Offer details"
        subtitle={subtitle}
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=collabs&subtab=pending"
        backIconOnly
      >
        <div className={cn(spacing.loose, "pb-32 md:pb-28")}>
        {/* Offer Snapshot */}
        <div className="rounded-[24px] md:rounded-[22px] bg-card backdrop-blur-md border border-border p-4 md:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="text-lg md:text-[18px] font-bold text-foreground tracking-tight break-words flex items-center gap-2">
                {request.brand_name ?? 'Brand'}
                {brandVerified && <ShieldCheck className="h-5 w-5 text-info flex-shrink-0" aria-label="Verified brand" />}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 text-sm md:text-xs text-info/70">
                {request.brand_email ? <span className="truncate">{request.brand_email}</span> : <span>Protected offer</span>}
                {brandInstagramHandle && (
                  <>
                    <span className="text-info/60">•</span>
                    <a
                      href={`https://instagram.com/${brandInstagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-info/80 hover:text-foreground transition-colors"
                      aria-label={`Open ${request.brand_name || 'brand'} Instagram`}
                    >
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  </>
                )}
                <span className="text-info/60">•</span>
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Creator Armour protected
                </span>
              </div>
            </div>
            <span
              className={cn(
                "flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                request.collab_type === 'barter'
                  ? "bg-info/20 text-info border-info/30"
                  : request.collab_type === 'paid'
                    ? "bg-green-500/20 text-green-200 border-green-500/30"
                    : "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
              )}
            >
              {collabTypeLabel(request.collab_type)}
            </span>
          </div>

          <div className="rounded-2xl bg-secondary/[0.06] border border-border/[0.08] p-4 md:p-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-info/60 uppercase tracking-wider">They're paying</p>
                <p className="text-xl md:text-2xl font-black text-foreground tracking-tight mt-1">{budgetLabel}</p>
              </div>
              {timeLeft && (
                <div
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                    timeLeft.tone === 'danger'
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : timeLeft.tone === 'warn'
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {timeLeft.label}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {deliverablesList.slice(0, 6).map((d, idx) => {
                const chip = formatDeliverableChip(d);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] md:text-[12px] border border-border text-foreground/90 bg-secondary/[0.04]"
                  >
                    <span aria-hidden>{chip.emoji}</span>
                    <span className="font-semibold">{chip.label}</span>
                    {chip.count ? <span className="text-foreground/60 font-medium">×{chip.count}</span> : null}
                  </span>
                );
              })}
              {deadlineDate && !Number.isNaN(deadlineDate.getTime()) && (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] md:text-[12px] border border-border text-info/90 bg-secondary/[0.02]">
                  <span aria-hidden>📅</span>
                  <span className="font-medium">Deadline</span>
                  <span className="text-foreground/70">
                    {deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* What the brand wants */}
          <div className="rounded-2xl bg-secondary/[0.03] border border-border/[0.06] p-4">
            <p className="text-[11px] font-medium text-info/60 uppercase tracking-wider mb-2">What the brand wants</p>
            <p className="text-sm text-info leading-relaxed whitespace-pre-wrap">
              {request.campaign_description || '-'}
            </p>
          </div>

          {/* Earnings Breakdown */}
          <div className="rounded-2xl bg-secondary/[0.03] border border-border/[0.06] p-4">
            <p className="text-[11px] font-medium text-info/60 uppercase tracking-wider mb-3">Deal value</p>
            <div className="space-y-3 text-base md:text-sm">
              {!isBarterLike(request.collab_type) && (
                <>
                  <div className="flex items-center justify-between text-foreground/85">
                    <span>Offer budget</span>
                    <span className="font-semibold text-foreground">{budgetLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-foreground/70">
                    <span>Platform fee</span>
                    <span className="font-semibold text-foreground">₹0</span>
                  </div>
                  <div className="h-px bg-secondary/50 my-3" />
                </>
              )}
              <div className="flex items-center justify-between text-foreground">
                <span className="font-semibold">{isBarterLike(request.collab_type) ? "You'll receive" : "You'll get"}</span>
                <span className="font-black text-primary text-lg md:text-base">{budgetLabel}</span>
              </div>
              {!isBarterLike(request.collab_type) && (
                <p className="text-[13px] md:text-[11px] text-foreground/55 mt-3">Paid via bank transfer or UPI.</p>
              )}
            </div>
          </div>

          {/* Simple next-step explainer — extra bottom margin prevents overlap with sticky CTA */}
          <div className="rounded-2xl bg-secondary/[0.02] border border-border/[0.06] p-4 mb-[160px] md:mb-0">
            <p className="text-[11px] font-medium text-info/60 uppercase tracking-wider mb-3">If you accept</p>
            <div className="grid grid-cols-1 gap-3 text-[13px] md:text-[12px] text-foreground/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>The deal moves into your active workflow</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>You only add price, address, or UPI when needed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>You can still track content, payment, and updates in one place</span>
              </div>
            </div>
          </div>

          {/* Mobile Sticky CTA */}
          <div className="fixed inset-x-0 bottom-0 z-50 pb-safe md:hidden" role="region" aria-label="Offer actions">
            <div className="mx-auto max-w-lg px-4 pb-4">
              <div className="rounded-2xl border border-border bg-black/70 backdrop-blur-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground" id="offer-action-heading">Do you want this offer?</p>
                    <p className="text-sm text-foreground/70">Accept it, counter it, or decline it.</p>
                    {timeLeft && (
                      <p className="mt-1 text-xs text-foreground/60 flex items-center gap-1.5" aria-live="polite">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {timeLeft.label}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-foreground/60">Deal value</p>
                      <p className="text-lg font-black text-primary" aria-label={`Payment amount: ${budgetLabel}`}>{budgetLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3" role="group" aria-labelledby="offer-action-heading">
                  <button type="button"
                    onClick={() => handleAccept()}
                    disabled={isAccepting || isDeclining}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-base text-foreground transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black",
                      isAccepting ? "bg-primary/60" : "bg-primary hover:bg-primary active:scale-[0.98]"
                    )}
                    aria-label={isAccepting ? 'Accepting deal, please wait' : 'Accept this offer'}
                    aria-describedby="accept-offer-description"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        Accept offer
                      </>
                    )}
                  </button>
                  <div className="sr-only" id="accept-offer-description">
                    This moves the offer into your active deal workflow
                  </div>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => { setCounterPrice(request.exact_budget ? String(request.exact_budget) : ''); setCounterNotes(''); setShowCounterDialog(true); }}
                      disabled={isAccepting || isDeclining}
                      className="flex-1 h-12 rounded-xl border border-info/40 text-info hover:text-foreground hover:bg-info/20 text-sm font-bold transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-black"
                      aria-label="Make a counter offer to negotiate terms"
                    >
                      Counter offer
                    </button>
                    <button type="button"
                      onClick={handleDecline}
                      disabled={isAccepting || isDeclining}
                      className={cn(
                        "flex-1 h-12 rounded-xl border border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/20 text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-black",
                        isDeclining ? "opacity-60" : ""
                      )}
                      aria-label={isDeclining ? 'Declining offer, please wait' : 'Decline this offer'}
                    >
                      {isDeclining ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Declining...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Decline
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {timeLeft?.tone === 'danger' && (
                  <div className="mt-2 flex items-start gap-2 text-[11px] text-destructive/80">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <p>Offer deadline is near — reply soon so you don't miss this.</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block mt-6">
            <div className="rounded-2xl border border-border bg-card backdrop-blur-md p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-lg font-bold text-foreground">Do you want this offer?</p>
                  <p className="text-sm text-foreground/70">Accept it now, or counter if you want different terms.</p>
                  {timeLeft && (
                    <p className="mt-2 text-sm text-foreground/60 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> {timeLeft.label}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground/60 uppercase tracking-wider">Deal value</p>
                  <p className="text-2xl font-black text-primary">{budgetLabel}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button"
                  onClick={() => handleAccept()}
                  disabled={isAccepting || isDeclining}
                  className={cn(
                    "flex-1 h-14 rounded-xl font-black text-base uppercase tracking-wider text-foreground transition-colors shadow-lg",
                    isAccepting ? "bg-primary/60" : "bg-primary hover:bg-primary"
                  )}
                >
                  {isAccepting ? 'Accepting...' : 'Accept offer'}
                </button>
                <button type="button"
                  onClick={() => { setCounterPrice(request.exact_budget ? String(request.exact_budget) : ''); setCounterNotes(''); setShowCounterDialog(true); }}
                  disabled={isAccepting || isDeclining}
                  className="h-14 px-6 rounded-xl border border-border text-foreground/85 hover:text-foreground hover:bg-secondary/50 text-base font-bold transition-colors"
                >
                  Counter offer
                </button>
                <button type="button"
                  onClick={handleDecline}
                  disabled={isAccepting || isDeclining}
                  className={cn(
                    "h-14 px-5 rounded-xl border border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/20 text-base font-bold transition-colors flex items-center gap-1.5",
                    isDeclining ? "opacity-60" : ""
                  )}
                  aria-label="Decline offer"
                >
                  {isDeclining ? <><Loader2 className="h-5 w-5 animate-spin" /> Declining...</> : <><XCircle className="h-5 w-5" /> Decline</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </CreatorNavigationWrapper>
      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent className="border-border bg-[#121826] text-foreground">
          <DialogHeader>
            <DialogTitle>Add one missing detail</DialogTitle>
            <DialogDescription className="text-foreground/70">
              We only ask for this now because this specific offer needs it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isPaidLike(request.collab_type) && !(Number(profile?.avg_rate_reel || (profile as any)?.reel_price || 0) > 0) && (
              <div className="space-y-2">
                <Label htmlFor="pending-reel-price" className="text-foreground/80">Your reel price</Label>
                <Input
                  id="pending-reel-price"
                  inputMode="numeric"
                  value={pendingReelPrice}
                  onChange={(e) => setPendingReelPrice(e.target.value)}
                  placeholder="Example: 5000"
                  className="border-border bg-card text-foreground"
                />
              </div>
            )}
            {isBarterLike(request.collab_type) && !String(profile?.location || (profile as any)?.address || '').trim() && (
              <div className="space-y-2">
                <Label htmlFor="pending-address" className="text-foreground/80">Your delivery address</Label>
                <Input
                  id="pending-address"
                  value={pendingAddress}
                  onChange={(e) => setPendingAddress(e.target.value)}
                  placeholder="Flat/House, Area, City, State, Pincode"
                  className="border-border bg-card text-foreground"
                />
                <p className="text-xs text-foreground/40">Include full address so the brand can ship products to you.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowRequirementDialog(false)}
              className="h-11 rounded-xl border border-border px-4 text-foreground/80 hover:bg-card"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={handleSaveRequirementsAndAccept}
              disabled={isSavingRequirements}
              className="h-11 rounded-xl bg-primary px-4 font-bold text-foreground hover:bg-primary disabled:opacity-60"
            >
              {isSavingRequirements ? 'Saving...' : 'Save and accept'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counter Offer Dialog */}
      <Dialog open={showCounterDialog} onOpenChange={setShowCounterDialog}>
        <DialogContent className="border-border bg-[#121826] text-foreground">
          <DialogHeader>
            <DialogTitle>Send a counter offer</DialogTitle>
            <DialogDescription className="text-foreground/70">
              Negotiate the terms with {request.brand_name}. They can accept, decline, or counter back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!isBarterLike(request.collab_type) && (
              <div className="space-y-2">
                <Label htmlFor="counter-price" className="text-foreground/80">Your price (₹)</Label>
                <Input
                  id="counter-price"
                  inputMode="numeric"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="e.g. 15000"
                  className="border-border bg-card text-foreground"
                />
              </div>
            )}
            {isBarterLike(request.collab_type) && (
              <div className="space-y-2">
                <Label htmlFor="counter-notes" className="text-foreground/80">What you want instead</Label>
                <Input
                  id="counter-notes"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="e.g. A different product, more quantity, cash on top"
                  className="border-border bg-card text-foreground"
                />
              </div>
            )}
            {!isBarterLike(request.collab_type) && (
              <div className="space-y-2">
                <Label htmlFor="counter-notes" className="text-foreground/80">Notes for the brand <span className="text-foreground/40">(optional)</span></Label>
                <Input
                  id="counter-notes"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Any changes or conditions you want to mention"
                  className="border-border bg-card text-foreground"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowCounterDialog(false)}
              className="h-11 rounded-xl border border-border px-4 text-foreground/80 hover:bg-card"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCounter}
              disabled={isCounting}
              className="h-11 rounded-xl bg-info px-4 font-bold text-foreground hover:bg-info disabled:opacity-60 flex items-center gap-2"
            >
              {isCounting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCounting ? 'Sending...' : 'Send counter offer'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollabRequestBriefPage;

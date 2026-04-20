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
    navigate('/creator-dashboard?tab=deals&subtab=pending', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <CreatorNavigationWrapper
        title="Offer details"
        subtitle="Loading offer..."
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=deals&subtab=pending"
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
        backTo="/creator-dashboard?tab=deals&subtab=pending"
        backIconOnly
      >
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="rounded-2xl bg-card border border-border p-5 text-foreground/80">
            <p className="text-sm font-semibold text-foreground mb-1">Couldn't open this offer</p>
            <p className="text-sm text-foreground/60">{loadError || 'Unknown error'}</p>
            <button type="button"
              onClick={() => navigate('/creator-dashboard?tab=deals&subtab=pending', { replace: true })}
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
        const targetPath = data?.needs_delivery_details
          ? `/deal-delivery-details/${acceptedDealId}`
          : `/deal/${acceptedDealId}`;

        if (typeof window !== 'undefined') {
          window.location.replace(targetPath);
          return;
        }

        navigate(targetPath, { replace: true });
      } else {
        navigate('/creator-dashboard?tab=deals&subtab=active', { replace: true });
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
      navigate('/creator-dashboard?tab=deals&subtab=pending', { replace: true });
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
      navigate('/creator-dashboard?tab=deals&subtab=pending', { replace: true });
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
        title={`Offer from ${request.brand_name || 'Brand'}`}
        subtitle=""
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=deals&subtab=pending"
        backIconOnly
      >
        <div className="pb-36">
          {/* ─── URGENCY BANNER ─── */}
          {timeLeft && (
            <div className={cn(
              "mx-4 mt-3 px-4 py-3 rounded-2xl border flex items-center justify-between",
              timeLeft.tone === 'danger'
                ? "bg-red-500/10 border-red-500/20"
                : timeLeft.tone === 'warn'
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-emerald-500/8 border-emerald-500/15"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <p className={cn(
                    "text-[13px] font-bold",
                    timeLeft.tone === 'danger' ? "text-red-400" : timeLeft.tone === 'warn' ? "text-amber-400" : "text-emerald-400"
                  )}>Action Required</p>
                  <p className="text-[11px] text-foreground/40 font-medium">
                    {deadlineDate ? `Expires ${deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at ${deadlineDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Respond soon'}
                  </p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-[13px] font-black animate-pulse",
                timeLeft.tone === 'danger' ? "bg-red-500/15 text-red-400" : timeLeft.tone === 'warn' ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
              )}>
                ⏳ {timeLeft.label}
              </div>
            </div>
          )}

          {/* ─── BRAND HEADER ─── */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="text-base font-black text-emerald-400">
                {(request.brand_name ?? 'B').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[16px] font-bold text-foreground truncate">{request.brand_name ?? 'Brand'}</p>
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-wider">Verified</span>
              </div>
              <p className="text-[11px] text-foreground/40 font-medium">
                {collabTypeLabel(request.collab_type)} collaboration
              </p>
            </div>
          </div>

          {/* ─── OFFER CARD ─── */}
          <div className="mx-4 rounded-2xl border border-border/60 bg-card/40 overflow-hidden backdrop-blur-md">
            <div className="flex items-center h-32">
              {/* LEFT: Product Image */}
              <div className="w-1/3 h-full relative bg-secondary/10 shrink-0 border-r border-border/20">
                {request.barter_product_image_url ? (
                  <img
                    src={request.barter_product_image_url}
                    alt="Product"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-3 opacity-20 group">
                    <div className="w-full h-full rounded-lg bg-current/10 flex items-center justify-center">
                       <span className="text-xl font-bold">{(request.brand_name || 'B')[0]}</span>
                    </div>
                  </div>
                )}
                {/* 10% Badge logic — if applicable */}
                {(request.exact_budget && request.exact_budget >= 15000) && (
                  <div className="absolute top-2 left-2 right-2">
                    <div className="bg-amber-500 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded shadow-lg text-center animate-pulse">
                      Top 10% Deal
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: High Impact Price */}
              <div className="flex-1 p-4 flex flex-col justify-center min-w-0 h-full">
                <p className="text-[10px] text-foreground/35 font-bold uppercase tracking-wider mb-1">
                  {isBarterLike(request.collab_type) ? "Total Value" : "You'll Earn"}
                </p>
                
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-black text-white tracking-tighter leading-none shrink-0">
                    {budgetLabel}
                  </p>
                  <p className="text-[12px] font-bold text-white/30 italic truncate">
                    {isPaidLike(request.collab_type) ? "per Reel" : "products"}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 w-fit">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400/90 whitespace-nowrap">✔ Payment secured</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── DELIVERABLES ─── */}
          {deliverablesList.length > 0 && (
            <div className="px-4 pt-4 space-y-2">
              <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">What you'll create</p>
              <div className="flex flex-wrap gap-2">
                {deliverablesList.slice(0, 6).map((d, idx) => {
                  const chip = formatDeliverableChip(d);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold border border-border bg-card text-foreground/80"
                    >
                      <span className="text-foreground/50">{chip.emoji}</span>
                      {chip.label}
                      {chip.count ? <span className="text-foreground/40">×{chip.count}</span> : null}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── CAMPAIGN BRIEF ─── */}
          {request.campaign_description && (
            <div className="px-4 pt-4 space-y-2">
              <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">Campaign brief</p>
              <p className="text-[13px] text-foreground/65 leading-relaxed whitespace-pre-wrap">
                {request.campaign_description}
              </p>
            </div>
          )}

          {/* ─── DEAL DETAILS (Collapsible) ─── */}
          <div className="px-4 pt-4">
            <details className="group rounded-2xl border border-border/40 bg-card/30">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none">
                <span className="text-[13px] font-semibold text-foreground/60">Deal details & timeline</span>
                <svg className="h-4 w-4 text-foreground/25 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </summary>
              <div className="px-4 pb-4 space-y-3 text-[13px]">
                {request.usage_rights && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400/70 shrink-0" />
                    <span className="text-foreground/60">Usage rights included</span>
                  </div>
                )}
                {isBarterLike(request.collab_type) && request.barter_description && (
                  <div className="space-y-1">
                    <p className="text-foreground/40 text-[11px] font-medium uppercase tracking-wider">Product details</p>
                    <p className="text-foreground/70">{request.barter_description}</p>
                  </div>
                )}
                {deadlineDate && !Number.isNaN(deadlineDate.getTime()) && (
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/40">📅</span>
                    <span className="text-foreground/60">
                      Deadline: {deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-foreground/30">✉️</span>
                  <span className="text-foreground/50 truncate">{request.brand_email ?? 'Contact via Creator Armour'}</span>
                </div>
                {brandInstagramHandle && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-foreground/30 shrink-0" />
                    <a
                      href={`https://instagram.com/${brandInstagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-info/80 hover:text-info text-[13px] transition-colors"
                    >
                      @{brandInstagramHandle}
                    </a>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* ─── TRUST BLOCK ─── */}
          <div className="px-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
                <ShieldCheck className="h-4 w-4 text-emerald-400/70" />
                <span className="text-[10px] font-bold text-emerald-400/70 text-center leading-tight">Verified Brand</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
                <Lock className="h-4 w-4 text-emerald-400/70" />
                <span className="text-[10px] font-bold text-emerald-400/70 text-center leading-tight">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
                <span className="text-[10px] font-bold text-emerald-400/70 text-center leading-tight">No Hidden Terms</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ STICKY BOTTOM CTA ═══ */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F14]/95 backdrop-blur-xl border-t border-border/40 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] safe-area-bottom">
          {/* Primary CTA — dominant */}
          <button
            type="button"
            onClick={() => handleAccept()}
            disabled={isAccepting || isDeclining}
            className={cn(
              "w-full h-14 rounded-2xl font-black text-[15px] text-[#0B0F14] transition-all",
              "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300",
              "active:scale-[0.97] shadow-[0_8px_32px_rgba(16,185,129,0.3)]",
              "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0B0F14]",
              isAccepting ? "opacity-70" : ""
            )}>
            {isAccepting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Accepting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🚀 Accept & Start Earning {budgetLabel}
              </span>
            )}
          </button>
          <p className="text-[10px] text-foreground/30 text-center mt-1.5 font-medium">Contract generated instantly • 100% goes to you</p>

          {/* Secondary actions — smaller, de-emphasized */}
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              className="flex-1 h-9 rounded-xl border border-border/50 bg-transparent text-[12px] font-semibold text-foreground/50 transition-colors hover:text-foreground/70 hover:border-border"
              onClick={() => toast.info('Send your question to the brand')}>
              Ask Question
            </button>
            <button
              type="button"
              onClick={() => { setCounterPrice(request.exact_budget ? String(request.exact_budget) : ''); setCounterNotes(''); setShowCounterDialog(true); }}
              disabled={isAccepting || isDeclining}
              className="flex-1 h-9 rounded-xl border border-border/50 bg-transparent text-[12px] font-semibold text-foreground/50 transition-colors hover:text-foreground/70 hover:border-border">
              Counter Offer
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className={cn(
                "h-9 px-4 rounded-xl border text-[12px] font-semibold transition-colors",
                "border-border/30 text-foreground/30 hover:text-red-400/60 hover:border-red-500/20",
                isDeclining ? "opacity-60" : ""
              )}>
              {isDeclining ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Decline"}
            </button>
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

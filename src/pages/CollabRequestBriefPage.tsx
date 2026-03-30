"use client";

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { AlertTriangle, CheckCircle2, Clock, Instagram, Loader2, Lock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';

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
  if (collabType === 'barter') return 'Barter';
  return 'Hybrid';
};

const formatBudget = (request: CollabRequest): string => {
  if (isPaidLike(request.collab_type)) {
    if (request.exact_budget) return `₹${request.exact_budget.toLocaleString()}`;
    if (request.budget_range) {
      const ranges: { [key: string]: string } = {
        'under-5000': 'Under ₹5,000',
        '5000-10000': '₹5,000 – ₹10,000',
        '10000-25000': '₹10,000 – ₹25,000',
        '25000+': '₹25,000+',
      };
      return ranges[request.budget_range] || request.budget_range;
    }
  }
  if (isBarterLike(request.collab_type)) {
    if (request.barter_value) return `Barter (₹${request.barter_value.toLocaleString()})`;
    return 'Barter';
  }
  return 'Not specified';
};

const CollabRequestBriefPage = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile } = useSession();
  const requestFromState = state?.request as CollabRequest | undefined;
  const [request, setRequest] = useState<CollabRequest | null>(
    requestFromState && requestFromState.id === requestId ? requestFromState : null
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveRequestId = useMemo(() => (requestId || '').trim() || null, [requestId]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

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
          .eq('id', effectiveRequestId)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;
        if (!data) throw new Error('Offer not found');
        if (profile?.id && data.creator_id && data.creator_id !== profile.id) {
          throw new Error('You do not have access to this offer');
        }

        setRequest(data as any);
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.message || 'Failed to load offer brief');
        setRequest(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveRequestId, profile?.id, requestFromState]);

  if (!effectiveRequestId) {
    navigate('/creator-dashboard?tab=collabs&subtab=pending', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <CreatorNavigationWrapper
        title="Full brief"
        subtitle="Loading offer…"
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=collabs&subtab=pending"
        backIconOnly
      >
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="flex items-center justify-center py-14 text-white/70">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Loading…
          </div>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  if (loadError || !request) {
    return (
      <CreatorNavigationWrapper
        title="Full brief"
        subtitle="Offer not available"
        compactHeader
        showBackButton
        backTo="/creator-dashboard?tab=collabs&subtab=pending"
        backIconOnly
      >
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-white/80">
            <p className="text-sm font-semibold text-white mb-1">Couldn’t open this offer</p>
            <p className="text-sm text-white/60">{loadError || 'Unknown error'}</p>
            <button type="button"
              type="button"
              onClick={() => navigate('/creator-dashboard?tab=collabs&subtab=pending', { replace: true })}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              Back to offers
            </button>
          </div>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  const deliverablesList = parseDeliverables(request.deliverables);
  const subtitle = isBarterLike(request.collab_type) ? 'Barter collaboration' : (request.brand_name ?? 'Brand');
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

  const handleAccept = async () => {
    if (!effectiveRequestId) return;
    try {
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

      toast.success(data?.needs_delivery_details ? 'Accepted — add delivery details to proceed' : 'Accepted — deal created');
      navigate('/creator-dashboard?tab=collabs&subtab=active', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept offer');
    } finally {
      setIsAccepting(false);
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

  return (
    <CreatorNavigationWrapper
      title="Full brief"
      subtitle={subtitle}
      compactHeader
      showBackButton
      backTo="/creator-dashboard?tab=collabs&subtab=pending"
      backIconOnly
    >
      <div className={cn(spacing.loose, "pb-28")}>
        {/* Offer Snapshot */}
        <div className="rounded-[22px] bg-white/5 backdrop-blur-md border border-white/10 p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-white tracking-tight break-words">{request.brand_name ?? 'Brand'}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-blue-300/70">
                {request.brand_email ? <span className="truncate">{request.brand_email}</span> : <span>Protected offer</span>}
                {brandInstagramHandle && (
                  <>
                    <span className="text-blue-400/60">•</span>
                    <a
                      href={`https://instagram.com/${brandInstagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-200/80 hover:text-white transition-colors"
                      aria-label={`Open ${request.brand_name || 'brand'} Instagram`}
                    >
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  </>
                )}
                <span className="text-blue-400/60">•</span>
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Creator Armour protected
                </span>
              </div>
            </div>
            <span
              className={cn(
                "flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                request.collab_type === 'barter'
                  ? "bg-blue-500/20 text-blue-200 border-blue-500/30"
                  : request.collab_type === 'paid'
                    ? "bg-green-500/20 text-green-200 border-green-500/30"
                    : "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
              )}
            >
              {collabTypeLabel(request.collab_type)}
            </span>
          </div>

          <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-blue-300/60 uppercase tracking-wider">Offer Budget</p>
                <p className="text-2xl font-black text-white tracking-tight mt-1">{budgetLabel}</p>
              </div>
              {timeLeft && (
                <div
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                    timeLeft.tone === 'danger'
                      ? "bg-red-500/10 text-red-300 border-red-500/20"
                      : timeLeft.tone === 'warn'
                        ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
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
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] border border-white/10 text-white/90 bg-white/[0.04]"
                  >
                    <span aria-hidden>{chip.emoji}</span>
                    <span className="font-semibold">{chip.label}</span>
                    {chip.count ? <span className="text-white/60 font-medium">×{chip.count}</span> : null}
                  </span>
                );
              })}
              {deadlineDate && !Number.isNaN(deadlineDate.getTime()) && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] border border-white/10 text-blue-200/90 bg-white/[0.02]">
                  <span aria-hidden>📅</span>
                  <span className="font-medium">Deadline</span>
                  <span className="text-white/70">
                    {deadlineDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Campaign Brief */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-[10px] font-medium text-blue-300/60 uppercase tracking-wider mb-1.5">Campaign Brief</p>
            <p className="text-sm text-blue-200 leading-relaxed whitespace-pre-wrap">
              {request.campaign_description || '—'}
            </p>
          </div>

          {/* Earnings Breakdown */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
            <p className="text-[10px] font-medium text-blue-300/60 uppercase tracking-wider mb-3">Earnings Breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-white/85">
                <span>Offer budget</span>
                <span className="font-semibold text-white">{budgetLabel}</span>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Platform fee</span>
                <span className="font-semibold text-white">₹0</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-center justify-between text-white">
                <span className="font-semibold">You receive</span>
                <span className="font-black text-emerald-300">{budgetLabel}</span>
              </div>
              <p className="text-[11px] text-white/55 mt-2">Payment: bank transfer (as per contract).</p>
            </div>
          </div>

          {/* Compact protection card */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
            <p className="text-[10px] font-medium text-blue-300/60 uppercase tracking-wider mb-3">Protected by Creator Armour</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Contract auto-generated
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Content rights secured
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Dispute protection
              </div>
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="fixed inset-x-0 bottom-0 z-50 pb-safe">
            <div className="mx-auto max-w-xl px-4 pb-4">
              <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white">Accept Collaboration</p>
                    {timeLeft ? (
                      <p className="text-[11px] text-white/55 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {timeLeft.label}
                      </p>
                    ) : (
                      <p className="text-[11px] text-white/55">Review and respond to this offer.</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-white/55">Budget</p>
                    <p className="text-[14px] font-black text-white">{budgetLabel}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button"
                    type="button"
                    onClick={handleAccept}
                    disabled={isAccepting || isDeclining}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-black text-[12px] uppercase tracking-wider text-white transition-colors",
                      isAccepting ? "bg-blue-900/60" : "bg-blue-600 hover:bg-blue-500"
                    )}
                  >
                    {isAccepting ? 'Accepting…' : `Accept ${budgetLabel}`}
                  </button>
                  <button type="button"
                    type="button"
                    onClick={() => navigate(`/collab-requests/${request.id}/counter`, { state: { request } })}
                    disabled={isAccepting || isDeclining}
                    className="h-12 px-4 rounded-xl border border-white/15 text-white/85 hover:text-white hover:bg-white/10 text-[12px] font-bold transition-colors"
                  >
                    Suggest new price
                  </button>
                  <button type="button"
                    type="button"
                    onClick={handleDecline}
                    disabled={isAccepting || isDeclining}
                    className={cn(
                      "h-12 w-12 rounded-xl border border-white/15 text-white/85 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center",
                      isDeclining ? "opacity-60" : ""
                    )}
                    aria-label="Decline"
                    title="Decline"
                  >
                    {isDeclining ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5 text-red-300" />}
                  </button>
                </div>

                {timeLeft?.tone === 'danger' && (
                  <div className="mt-2 flex items-start gap-2 text-[11px] text-red-200/80">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <p>Offer deadline is close — respond soon to avoid missing the deal.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestBriefPage;

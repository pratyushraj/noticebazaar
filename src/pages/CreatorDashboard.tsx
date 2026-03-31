"use client";

import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Loader2, MessageCircleMore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useBrandDeals, getDealStageFromStatus, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/utils/analytics';
import { getApiBaseUrl } from '@/lib/utils/api';
import { getCreatorCompletionMetrics, getCreatorProgressPatch } from '@/lib/creatorProfileCompletion';
import { DashboardSkeleton as EnhancedDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CollabRequestPreview {
  id: string;
  brand_name: string;
  brand_email?: string;
  collab_type?: string;
  budget_range?: string | null;
  exact_budget?: number | null;
  barter_value?: number | null;
  deadline?: string | null;
  brand_logo?: string | null;
  created_at: string;
  raw: Record<string, unknown>;
}

interface CollabRequestsResponse {
  success?: boolean;
  requests?: CollabRequestData[];
}

interface CollabRequestData {
  id: string;
  brand_name?: string;
  brand_email?: string;
  collab_type?: string;
  budget_range?: string | null;
  exact_budget?: number | null;
  barter_value?: number | null;
  deadline?: string | null;
  brand_logo?: string | null;
  brand_logo_url?: string | null;
  created_at?: string;
  status?: string;
  raw?: { brand_logo?: string; brand_logo_url?: string };
  brand?: { logo_url?: string };
}

const formatCurrency = (value?: number | null) =>
  value && value > 0 ? `₹${value.toLocaleString('en-IN')}` : 'To be confirmed';

const formatDealType = (value?: string | null) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'barter') return 'Free products as payment';
  if (normalized === 'hybrid' || normalized === 'both') return 'Paid + Product';
  return 'Paid';
};

const formatDealStageLabel = (status?: string | null, progress?: number | null) => {
  const stage = getDealStageFromStatus(status || undefined, progress ?? undefined);
  switch (stage) {
    case 'contract_ready':
    case 'brand_signed':
    case 'fully_executed':
      return 'Deal confirmed';
    case 'content_making':
      return 'Making content';
    case 'content_submitted':
      return 'Content sent';
    case 'content_revision':
      return 'Changes requested';
    case 'payment_pending':
      return 'Payment pending';
    case 'completed':
      return 'Completed';
    default:
      return 'In progress';
  }
};

const formatDeadline = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getInstagramDmTemplate = (collabUrl: string) =>
  `Hi! For collabs, please use my collab page here: ${collabUrl}`;

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { profile, session, loading: sessionLoading } = useSession();
  const updateProfileMutation = useUpdateProfile();
  const [pendingCollabRequestsCount, setPendingCollabRequestsCount] = useState(0);
  const [totalOffersReceived, setTotalOffersReceived] = useState(0);
  const [storefrontViews, setStorefrontViews] = useState(0);
  const [collabRequestsPreview, setCollabRequestsPreview] = useState<CollabRequestPreview[]>([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [declineRequestId, setDeclineRequestId] = useState<string | null>(null);
  const [showDeclineRequestDialog, setShowDeclineRequestDialog] = useState(false);
  const [copiedDm, setCopiedDm] = useState(false);

  const creatorId = profile?.id || session?.user?.id;

  const fetchPendingCollabRequestsPreview = async (signal?: AbortSignal) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) return;

      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/collab-requests`, {
        headers: { Authorization: `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
        signal,
      });
      const data: CollabRequestsResponse = res.ok
        ? await res.json().catch(() => ({ success: false, requests: [] }))
        : { success: false, requests: [] };
      const list = Array.isArray(data.requests) ? data.requests : [];
      const pending = list.filter((request) => {
        const status = (request.status || '').toLowerCase();
        return status === 'pending' || status === 'countered';
      });

      setTotalOffersReceived(list.length);
      setPendingCollabRequestsCount(pending.length);
      setCollabRequestsPreview(
        pending.slice(0, 6).map((request) => ({
          id: request.id,
          brand_name: request.brand_name || 'Brand',
          brand_email: request.brand_email || undefined,
          collab_type: request.collab_type,
          budget_range: request.budget_range ?? null,
          exact_budget: request.exact_budget ?? null,
          barter_value: request.barter_value ?? null,
          deadline: request.deadline ?? null,
          brand_logo:
            request.brand_logo ||
            request.brand_logo_url ||
            request.raw?.brand_logo ||
            request.raw?.brand_logo_url ||
            request.brand?.logo_url,
          created_at: request.created_at || '',
          raw: request,
        })),
      );
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return;
      setPendingCollabRequestsCount(0);
      setCollabRequestsPreview([]);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchPendingCollabRequestsPreview(controller.signal);
    return () => controller.abort();
  }, [session?.user?.id]);

  useEffect(() => {
    let cancelled = false;

    const fetchCollabPageViews = async () => {
      if (!profile?.username) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sess = sessionData.session;
        if (!sess?.access_token) return;

        const response = await fetch(`${getApiBaseUrl()}/api/collab-analytics?days=30`, {
          headers: { Authorization: `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) return;

        const data = await response.json().catch(() => null);
        if (!cancelled && data?.success && data?.analytics) {
          setStorefrontViews(Number(data.analytics.views?.total || 0));
        }
      } catch {
        // Ignore performance fetch errors on the simplified dashboard.
      }
    };

    void fetchCollabPageViews();
    return () => {
      cancelled = true;
    };
  }, [profile?.username, session?.user?.id]);

  const { data: brandDeals = [], isLoading: isLoadingDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId,
    enabled: !sessionLoading && !!creatorId,
  });

  const completedDealsCount = useMemo(() => (
    brandDeals.filter((deal: any) => {
      const status = String(deal.status || '').toLowerCase();
      const execution = String((deal as any)?.deal_execution_status || '').toLowerCase();
      return status === 'completed' || execution === 'completed' || Boolean(deal.payment_received_date);
    }).length
  ), [brandDeals]);

  const totalEarnings = useMemo(() => (
    brandDeals.reduce((sum, deal) => sum + (Number(deal.deal_amount || 0) || 0), 0)
  ), [brandDeals]);

  useEffect(() => {
    if (!profile?.id || updateProfileMutation.isPending) return;

    const progressPatch = getCreatorProgressPatch(profile, {
      offersReceived: totalOffersReceived,
      offersAccepted: brandDeals.length,
      totalDeals: brandDeals.length,
      completedDeals: completedDealsCount,
      totalEarnings,
      storefrontViews,
    });

    const firstOfferAt = totalOffersReceived > 0 ? (profile.first_offer_at || new Date().toISOString()) : profile.first_offer_at;
    const firstDealAt = completedDealsCount > 0 ? (profile.first_deal_at || new Date().toISOString()) : profile.first_deal_at;

    const hasDiff = (
      profile.creator_stage !== progressPatch.creator_stage ||
      Number(profile.profile_completion || 0) !== progressPatch.profile_completion ||
      Number(profile.storefront_completion || 0) !== progressPatch.storefront_completion ||
      Number(profile.offers_received || 0) !== progressPatch.offers_received ||
      Number(profile.offers_accepted || 0) !== progressPatch.offers_accepted ||
      Number(profile.completed_deals || 0) !== progressPatch.completed_deals ||
      Number(profile.total_deals || 0) !== progressPatch.total_deals ||
      Number(profile.total_earnings || 0) !== progressPatch.total_earnings ||
      Number(profile.storefront_views || 0) !== progressPatch.storefront_views ||
      Number(profile.conversion_rate || 0) !== progressPatch.conversion_rate ||
      firstOfferAt !== profile.first_offer_at ||
      firstDealAt !== profile.first_deal_at
    );

    if (!hasDiff) return;

    void updateProfileMutation.mutateAsync({
      id: profile.id,
      ...progressPatch,
      first_offer_at: firstOfferAt,
      first_deal_at: firstDealAt,
      last_active_at: new Date().toISOString(),
    } as any).catch(() => {
      // Ignore dashboard lifecycle sync errors.
    });
  }, [
    profile,
    totalOffersReceived,
    brandDeals.length,
    completedDealsCount,
    totalEarnings,
    storefrontViews,
    updateProfileMutation,
  ]);

  const collabHandle = (profile?.instagram_handle || profile?.username || '').replace(/^@/, '').trim();
  const collabUrl = collabHandle ? `${window.location.origin}/${collabHandle}` : '';
  const collabUrlShort = collabUrl.replace(/^https?:\/\//, '');
  const dmTemplate = collabUrl ? getInstagramDmTemplate(collabUrl) : '';
  const completion = getCreatorCompletionMetrics(profile);

  const smallChecklist = useMemo(() => {
    const items = completion.items.filter((item) =>
      ['pricing', 'intro', 'audience', 'past_work'].includes(item.id),
    );
    return items.map((item) => ({
      id: item.id,
      label: item.title,
      complete: item.complete,
    }));
  }, [completion.items]);

  const dealsForFirstView = useMemo(() => {
    return brandDeals
      .filter((deal) => {
        const status = String(deal.status || '').toLowerCase();
        return status !== 'completed';
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [brandDeals]);

  const copyText = async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  };

  const handleShareWhatsApp = async () => {
    if (!collabUrl || !profile?.id) return;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Hi! For collabs, please use my collab page here: ${collabUrl}`)}`,
      '_blank',
      'noopener,noreferrer',
    );

    if (!profile.link_shared_at) {
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        link_shared_at: new Date().toISOString(),
      } as any).catch(() => undefined);
    }

    void trackEvent('creators_shared_link', { creator_id: profile.id, mode: 'whatsapp' });
  };

  const acceptCollabRequest = async (request: CollabRequestPreview) => {
    if (!request.id) return;

    try {
      setAcceptingRequestId(request.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) {
        toast.error('Please log in to accept requests');
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${request.id}/accept`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sess.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to accept request');
        return;
      }

      trackEvent('creator_accepted_request', {
        deal_id: data.deal?.id,
        creator_id: profile?.id,
        collab_type: request.collab_type || 'paid',
      });
      toast.success(data.contract ? 'Deal confirmed' : 'Deal accepted');

      await Promise.all([
        fetchPendingCollabRequestsPreview(),
        refetchBrandDeals?.(),
      ]);
    } catch {
      toast.error('Failed to accept request');
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const declineCollabRequest = async () => {
    if (!declineRequestId) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) {
        toast.error('Please log in to decline requests');
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${declineRequestId}/decline`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sess.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to decline request');
        return;
      }

      toast.success('Request declined');
      await fetchPendingCollabRequestsPreview();
    } catch {
      toast.error('Failed to decline request');
    } finally {
      setShowDeclineRequestDialog(false);
      setDeclineRequestId(null);
    }
  };

  if ((sessionLoading && !session) || (isLoadingDeals && !!creatorId && !brandDealsError)) {
    return <EnhancedDashboardSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-emerald-400" />
          <p>Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">Creator Armour</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your Deals</h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              Share your collab page, reply faster, and track only the deals that need your attention.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Your Collab Page</p>
                  <p className="mt-2 break-all text-2xl font-black text-white">{collabUrlShort || 'Create your Instagram handle first'}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Send this link when a brand asks for price, details, or examples of your work.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => navigate('/creator-profile?section=profile')}
                >
                  Edit Profile
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  onClick={() => void copyText(collabUrl, 'Collab page copied')}
                  disabled={!collabUrl}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => void handleShareWhatsApp()}
                  disabled={!collabUrl}
                >
                  <MessageCircleMore className="mr-2 h-4 w-4" />
                  WhatsApp Share
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    void copyText(dmTemplate, 'Instagram DM template copied');
                    setCopiedDm(true);
                  }}
                  disabled={!dmTemplate}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Instagram DM Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => window.open(collabUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!collabUrl}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Page
                </Button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Instagram DM Template</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {dmTemplate || 'Add your Instagram handle to generate a ready-to-send message.'}
                </p>
                {copiedDm && (
                  <p className="mt-2 text-xs font-semibold text-emerald-300">Copied. Paste this in Instagram DM.</p>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 shadow-[0_20px_60px_rgba(16,185,129,0.18)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Quick Checklist</p>
              <p className="mt-2 text-lg font-black text-white">
                {completion.completedCount}/{completion.items.length} basics done
              </p>
              <p className="mt-2 text-sm text-emerald-50/85">
                Finish only the basics first so brands understand you quickly. Advanced settings can wait.
              </p>

              <div className="mt-4 space-y-2">
                {smallChecklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <span className={`text-xs font-black uppercase tracking-[0.14em] ${item.complete ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {item.complete ? 'Done' : 'Next'}
                    </span>
                  </div>
                ))}
              </div>

              {completedDealsCount === 0 && (
                <p className="mt-4 text-xs text-emerald-100/80">
                  Performance and deeper stats will appear after your first completed deal.
                </p>
              )}
            </section>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your Deals</p>
                <h2 className="mt-1 text-2xl font-black text-white">What needs your attention</h2>
              </div>
              <div className="text-right text-sm text-slate-300">
                <p>{pendingCollabRequestsCount} new request{pendingCollabRequestsCount === 1 ? '' : 's'}</p>
                <p>{dealsForFirstView.length} active deal{dealsForFirstView.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {collabRequestsPreview.map((request) => (
                <article key={request.id} className="rounded-[24px] border border-amber-300/20 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Your Turn</p>
                      <h3 className="mt-2 text-xl font-black text-white">{request.brand_name}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {formatDealType(request.collab_type)} • {formatCurrency(request.exact_budget || request.barter_value)}
                        {request.deadline ? ` • Deadline ${formatDeadline(request.deadline)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      type="button"
                      className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      onClick={() => void acceptCollabRequest(request)}
                      disabled={acceptingRequestId === request.id}
                    >
                      {acceptingRequestId === request.id ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => {
                        setDeclineRequestId(request.id);
                        setShowDeclineRequestDialog(true);
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </article>
              ))}

              {dealsForFirstView.map((deal) => {
                const progress = deal.progress_percentage ?? STAGE_TO_PROGRESS[getDealStageFromStatus(deal.status, deal.progress_percentage)] ?? 20;
                return (
                  <article key={deal.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">{progress < 100 ? 'In Progress' : 'Completed'}</p>
                        <h3 className="mt-2 text-xl font-black text-white">{deal.brand_name}</h3>
                        <p className="mt-2 text-sm text-slate-300">
                          {formatDealStageLabel(deal.status, deal.progress_percentage)} • {formatCurrency(deal.deal_amount)}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-white">
                        {progress}%
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                      <span>{deal.due_date ? `Due ${formatDeadline(deal.due_date)}` : 'No due date yet'}</span>
                      <button
                        type="button"
                        className="font-semibold text-emerald-300 transition hover:text-emerald-200"
                        onClick={() => navigate('/creator-contracts')}
                      >
                        Open deal
                      </button>
                    </div>
                  </article>
                );
              })}

              {collabRequestsPreview.length === 0 && dealsForFirstView.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center lg:col-span-2">
                  <p className="text-lg font-black text-white">No deals yet</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Share your collab page in WhatsApp and Instagram DMs to start getting requests.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AlertDialog open={showDeclineRequestDialog} onOpenChange={setShowDeclineRequestDialog}>
        <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              The brand will be notified that you declined this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={declineCollabRequest} className="bg-red-500 hover:bg-red-600 text-white border-none">
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreatorDashboard;

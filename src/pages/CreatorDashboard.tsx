"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, Loader2, MessageCircleMore, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useBrandDeals, getDealStageFromStatus, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';
import { useNotifications } from '@/lib/hooks/useNotifications';
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
import ErrorBoundary from '@/components/ErrorBoundary';
import type { BrandDeal } from '@/types';
import type { Notification } from '@/types/notifications';

// ============================================
// TYPES
// ============================================

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

type DashboardBrandDeal = BrandDeal & {
  brand_approval_status?: string | null;
  deal_type?: string | null;
  invoice_url?: string | null;
};

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
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

// ============================================
// CONSTANTS
// ============================================

const PREVIEW_ITEMS_LIMIT = 6;
const DEAL_CARDS_LIMIT = 6;
const ANALYTICS_DAYS = 30;

// ============================================
// UTILITY FUNCTIONS (memoized outside component)
// ============================================

const formatCurrency = (value?: number | null): string =>
  value && value > 0 ? `₹${value.toLocaleString('en-IN')}` : 'To be confirmed';

const formatDealType = (value?: string | null): string => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'barter') return 'Free products as payment';
  if (normalized === 'hybrid' || normalized === 'both') return 'Paid + Product';
  return 'Paid';
};

const formatDealStageLabel = (status?: string | null, progress?: number | null): string => {
  const stage = getDealStageFromStatus(status || undefined, progress ?? undefined);
  switch (stage) {
    case 'contract_ready':
      return 'Awaiting signature';
    case 'brand_signed':
      return 'Awaiting your signature';
    case 'fully_executed':
      return 'Deal confirmed';
    case 'live_deal':
    case 'content_making':
      return 'Making content';
    case 'content_delivered':
      return 'Content delivered';
    case 'awaiting_product_shipment':
      return 'Awaiting product';
    case 'negotiation':
      return 'Negotiating';
    case 'needs_changes':
      return 'Needs changes';
    case 'declined':
      return 'Declined';
    case 'completed':
      return 'Completed';
    default:
      return 'In progress';
  }
};

const formatDeadline = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getInstagramDmTemplate = (collabUrl: string): string =>
  `Hi! For collabs, please use my collab page here: ${collabUrl}`;

// ============================================
// SUB-COMPONENTS
// ============================================

interface DealCardProps {
  deal: BrandDeal;
  onOpenDeal: () => void;
}

const DealCard = ({ deal, onOpenDeal }: DealCardProps) => {
  const progress = deal.progress_percentage ?? STAGE_TO_PROGRESS[getDealStageFromStatus(deal.status, deal.progress_percentage ?? undefined)] ?? 20;
  
  return (
    <article 
      className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:bg-white/[0.07] focus-within:ring-2 focus-within:ring-emerald-400/50"
      role="article"
      aria-labelledby={`deal-title-${deal.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
            {progress < 100 ? 'In Progress' : 'Completed'}
          </p>
          <h3 id={`deal-title-${deal.id}`} className="mt-2 text-xl font-black text-white">
            {deal.brand_name}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {formatDealStageLabel(deal.status, deal.progress_percentage)} • {formatCurrency(deal.deal_amount)}
          </p>
        </div>
        <div 
          className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-white"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% complete`}
        >
          {progress}%
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="presentation">
        <div 
          className="h-full rounded-full bg-emerald-400 transition-all duration-300" 
          style={{ width: `${progress}%` }} 
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <span>{deal.due_date ? `Due ${formatDeadline(deal.due_date)}` : 'No due date yet'}</span>
        <button
          type="button"
          className="font-semibold text-emerald-300 transition hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
          onClick={onOpenDeal}
          aria-label={`Open deal with ${deal.brand_name}`}
        >
          Open deal
        </button>
      </div>
    </article>
  );
};

interface CollabRequestCardProps {
  request: CollabRequestPreview;
  isAccepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const CollabRequestCard = ({ request, isAccepting, onAccept, onDecline }: CollabRequestCardProps) => {
  return (
    <article 
      className="rounded-[24px] border border-amber-300/20 bg-white/5 p-5 transition-all duration-200 hover:bg-white/[0.07]"
      role="article"
      aria-labelledby={`request-title-${request.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Your Turn</p>
          <h3 id={`request-title-${request.id}`} className="mt-2 text-xl font-black text-white">
            {request.brand_name}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {formatDealType(request.collab_type)} • {formatCurrency(request.exact_budget || request.barter_value)}
            {request.deadline ? ` • Deadline ${formatDeadline(request.deadline)}` : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          onClick={onAccept}
          disabled={isAccepting}
          aria-busy={isAccepting}
          aria-label={`Accept request from ${request.brand_name}`}
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Accepting...
            </>
          ) : (
            'Accept'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          onClick={onDecline}
          aria-label={`Decline request from ${request.brand_name}`}
        >
          Decline
        </Button>
      </div>
    </article>
  );
};

interface EmptyStateProps {
  hasUrl: boolean;
}

const EmptyState = ({ hasUrl }: EmptyStateProps) => (
  <div 
    className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center lg:col-span-2"
    role="status"
    aria-label="No deals or requests"
  >
    <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-4" aria-hidden="true" />
    <p className="text-lg font-black text-white">No deals yet</p>
    <p className="mt-2 text-sm text-slate-300">
      {hasUrl 
        ? 'Share your collab page in WhatsApp and Instagram DMs to start getting requests.'
        : 'Set up your Instagram handle to start receiving collaboration requests.'
      }
    </p>
  </div>
);

const formatNotificationTime = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

interface DashboardAlertsProps {
  notifications: Notification[];
  onOpen: (notification: Notification) => void;
}

const DashboardAlerts = ({ notifications, onOpen }: DashboardAlertsProps) => {
  if (notifications.length === 0) return null;

  return (
    <section className="mb-6 rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-5" aria-labelledby="dashboard-alerts-heading">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p id="dashboard-alerts-heading" className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Latest Updates</p>
          <p className="mt-2 text-sm text-amber-50/85">Important deal updates also show here, so you do not need to open each deal to know what changed.</p>
        </div>
        <Button type="button" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => window.location.assign('/#/notifications')}>
          View All
        </Button>
      </div>
      <div className="mt-4 grid gap-3">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => onOpen(notification)}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-white">{notification.title}</p>
                {notification.message && <p className="mt-1 text-sm text-slate-200">{notification.message}</p>}
              </div>
              <span className="text-xs font-semibold text-amber-100/80">{formatNotificationTime(notification.created_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

type GuidedDashboardState =
  | 'no_deals'
  | 'offer_received'
  | 'delivery_details_needed'
  | 'content_not_started'
  | 'content_upload_needed'
  | 'revision_requested'
  | 'waiting_payment'
  | 'payment_confirmation_needed'
  | 'deal_completed';

interface NextStepCardData {
  state: GuidedDashboardState;
  title: string;
  helper: string;
  primaryLabel?: string;
  primaryAction?: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  deal?: BrandDeal;
  request?: CollabRequestPreview;
}

interface NextStepCardProps {
  data: NextStepCardData;
}

const NextStepCard = ({ data }: NextStepCardProps) => (
  <section className="mb-6 rounded-[28px] border border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.45))] p-5 shadow-[0_22px_60px_rgba(16,185,129,0.12)]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">What To Do Next</p>
        <h2 className="mt-2 text-2xl font-black text-white">{data.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-emerald-50/85">{data.helper}</p>
        {data.request && (
          <p className="mt-3 text-sm font-semibold text-white/90">
            Brand: {data.request.brand_name} • {formatDealType(data.request.collab_type)}
          </p>
        )}
        {data.deal && (
          <p className="mt-3 text-sm font-semibold text-white/90">
            Deal: {data.deal.brand_name} • {formatDealStageLabel(data.deal.status, data.deal.progress_percentage)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {data.primaryLabel && data.primaryAction && (
          <Button type="button" className="bg-emerald-400 text-slate-950 hover:bg-emerald-300" onClick={data.primaryAction}>
            {data.primaryLabel}
          </Button>
        )}
        {data.secondaryLabel && data.secondaryAction && (
          <Button type="button" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={data.secondaryAction}>
            {data.secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  </section>
);

// ============================================
// MAIN COMPONENT
// ============================================

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { profile, session, loading: sessionLoading } = useSession();
  const updateProfileMutation = useUpdateProfile();
  
  // State
  const [pendingCollabRequestsCount, setPendingCollabRequestsCount] = useState(0);
  const [totalOffersReceived, setTotalOffersReceived] = useState(0);
  const [storefrontViews, setStorefrontViews] = useState(0);
  const [collabRequestsPreview, setCollabRequestsPreview] = useState<CollabRequestPreview[]>([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [declineRequestId, setDeclineRequestId] = useState<string | null>(null);
  const [showDeclineRequestDialog, setShowDeclineRequestDialog] = useState(false);
  const [copiedDm, setCopiedDm] = useState(false);
  
  // Refs for focus management
  const declineButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLButtonElement | null>(null);

  const creatorId = profile?.id || session?.user?.id;

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchPendingCollabRequestsPreview = useCallback(async (signal?: AbortSignal) => {
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
        pending.slice(0, PREVIEW_ITEMS_LIMIT).map((request) => ({
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
          raw: request as Record<string, unknown>,
        })),
      );
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return;
      setPendingCollabRequestsCount(0);
      setCollabRequestsPreview([]);
    }
  }, []);

  // Fetch collab requests on mount
  useEffect(() => {
    const controller = new AbortController();
    void fetchPendingCollabRequestsPreview(controller.signal);
    return () => controller.abort();
  }, [fetchPendingCollabRequestsPreview, session?.user?.id]);

  // Fetch collab page views
  useEffect(() => {
    let cancelled = false;

    const fetchCollabPageViews = async () => {
      if (!profile?.username) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sess = sessionData.session;
        if (!sess?.access_token) return;

        const response = await fetch(`${getApiBaseUrl()}/api/collab-analytics?days=${ANALYTICS_DAYS}`, {
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

  // Brand deals query
  const { data: brandDeals = [], isLoading: isLoadingDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId,
    enabled: !sessionLoading && !!creatorId,
  });
  const { notifications: creatorNotifications, markAsRead } = useNotifications({
    enabled: !!creatorId,
    limit: 3,
    filter: { read: false },
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const completedDealsCount = useMemo(() => (
    brandDeals.filter((deal) => {
      const status = String(deal.status || '').toLowerCase();
      return status === 'completed' || status === 'fully_executed' || Boolean(deal.payment_received_date);
    }).length
  ), [brandDeals]);

  const totalEarnings = useMemo(() => (
    brandDeals.reduce((sum, deal) => sum + (Number(deal.deal_amount || 0) || 0), 0)
  ), [brandDeals]);

  const collabHandle = useMemo(() => 
    (profile?.instagram_handle || profile?.username || '').replace(/^@/, '').trim(),
    [profile?.instagram_handle, profile?.username]
  );
  
  const collabUrl = useMemo(() =>
    collabHandle ? `${window.location.origin}/${collabHandle}` : '',
    [collabHandle]
  );
  
  const collabUrlShort = useMemo(() =>
    collabUrl.replace(/^https?:\/\//, ''),
    [collabUrl]
  );
  
  const dmTemplate = useMemo(() =>
    collabUrl ? getInstagramDmTemplate(collabUrl) : '',
    [collabUrl]
  );
  
  const completion = useMemo(() =>
    getCreatorCompletionMetrics(profile),
    [profile]
  );

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

  const normalizedBrandDeals = useMemo<DashboardBrandDeal[]>(() => (
    brandDeals as DashboardBrandDeal[]
  ), [brandDeals]);

  const dealsForFirstView = useMemo(() => {
    return normalizedBrandDeals
      .filter((deal) => {
        const status = String(deal.status || '').toLowerCase();
        return status !== 'completed';
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, DEAL_CARDS_LIMIT);
  }, [normalizedBrandDeals]);

  const dashboardAlerts = useMemo(() => (
    creatorNotifications.filter((notification) => ['deal', 'contract', 'payment'].includes(notification.type)).slice(0, 2)
  ), [creatorNotifications]);

  // ============================================
  // HANDLERS (defined after collabUrl, before nextStepData)
  // ============================================

  const copyText = useCallback(async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  }, []);

  const handleShareWhatsApp = useCallback(async () => {
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
      }).catch(() => undefined);
    }

    void trackEvent('creators_shared_link', { creator_id: profile.id, mode: 'whatsapp' });
  }, [collabUrl, profile, updateProfileMutation]);

  // ============================================
  // DERIVED COMPUTED VALUES (depend on handlers)
  // ============================================

  const nextStepData = useMemo<NextStepCardData>(() => {
    const openDeals = () => navigate('/creator-contracts');
    const openCollabPage = () => {
      if (!collabUrl) {
        navigate('/creator-profile?section=profile');
        return;
      }
      void copyText(collabUrl, 'Collab page copied');
    };
    const openPayment = (dealId: string) => navigate(`/payment/${dealId}`);
    const openDeliveryDetails = (dealId: string) => navigate(`/deal-delivery-details/${dealId}`);
    const openDealDetails = (dealId: string) => navigate(`/deal/${dealId}`);
    const openContentConsole = () => navigate('/brand-deal-console');

    const paymentConfirmationDeal = normalizedBrandDeals.find((deal) => {
      const status = String(deal.status || '').toLowerCase();
      return !deal.payment_received_date && (status.includes('paid') || status.includes('payment_released') || status.includes('payment sent'));
    });
    if (paymentConfirmationDeal) {
      return {
        state: 'payment_confirmation_needed',
        title: 'Confirm Payment Received',
        helper: 'The brand marked this payment as sent. Confirm after the money reaches your account.',
        primaryLabel: 'Confirm Payment Received',
        primaryAction: () => openPayment(paymentConfirmationDeal.id),
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(paymentConfirmationDeal.id),
        deal: paymentConfirmationDeal,
      };
    }

    const approvedWaitingPaymentDeal = normalizedBrandDeals.find((deal) => {
      const approvalStatus = String(deal.brand_approval_status || '').toLowerCase();
      return approvalStatus === 'approved' && !deal.payment_received_date;
    });
    if (approvedWaitingPaymentDeal) {
      return {
        state: 'waiting_payment',
        title: 'Waiting for brand to send payment',
        helper: 'Your content is approved. You do not need to do anything right now.',
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(approvedWaitingPaymentDeal.id),
        deal: approvedWaitingPaymentDeal,
      };
    }

    const revisionRequestedDeal = normalizedBrandDeals.find((deal) => {
      const approvalStatus = String(deal.brand_approval_status || '').toLowerCase();
      return approvalStatus === 'changes_requested';
    });
    if (revisionRequestedDeal) {
      return {
        state: 'revision_requested',
        title: 'Upload Revised Content',
        helper: 'The brand asked for a change. Upload the updated content here.',
        primaryLabel: 'Upload Revised Content',
        primaryAction: openContentConsole,
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(revisionRequestedDeal.id),
        deal: revisionRequestedDeal,
      };
    }

    const contentRequestedDeal = normalizedBrandDeals.find((deal) => {
      const approvalStatus = String(deal.brand_approval_status || '').toLowerCase();
      const status = String(deal.status || '').toLowerCase();
      return !deal.content_submitted_at && (status.includes('content') || status.includes('active') || approvalStatus === 'pending');
    });
    if (contentRequestedDeal) {
      return {
        state: 'content_upload_needed',
        title: 'Upload Content',
        helper: 'Upload your content link for brand review.',
        primaryLabel: 'Upload Content',
        primaryAction: openContentConsole,
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(contentRequestedDeal.id),
        deal: contentRequestedDeal,
      };
    }

    const deliveryDetailsDeal = normalizedBrandDeals.find((deal) => {
      const status = String(deal.status || '').toLowerCase();
      const needsDelivery = String(deal.deal_type || '').toLowerCase() === 'barter' && status === 'drafting';
      return needsDelivery;
    });
    if (deliveryDetailsDeal) {
      return {
        state: 'delivery_details_needed',
        title: 'Add delivery details',
        helper: 'Add your address so the brand can send the product.',
        primaryLabel: 'Add Delivery Details',
        primaryAction: () => openDeliveryDetails(deliveryDetailsDeal.id),
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(deliveryDetailsDeal.id),
        deal: deliveryDetailsDeal,
      };
    }

    const acceptedNotStartedDeal = normalizedBrandDeals.find((deal) => {
      const status = String(deal.status || '').toLowerCase();
      return !deal.content_submitted_at && (status.includes('signed') || status.includes('confirmed') || status.includes('fully_executed'));
    });
    if (acceptedNotStartedDeal) {
      return {
        state: 'content_not_started',
        title: 'Start Content',
        helper: 'Your deal is confirmed. Start making the content for this brand.',
        primaryLabel: 'Start Content',
        primaryAction: openContentConsole,
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(acceptedNotStartedDeal.id),
        deal: acceptedNotStartedDeal,
      };
    }

    const firstOffer = collabRequestsPreview[0];
    if (firstOffer) {
      return {
        state: 'offer_received',
        title: 'Review Offer',
        helper: 'Brands have sent you a collaboration offer.',
        primaryLabel: 'Review Offer',
        primaryAction: () => navigate(`/collab-requests/${firstOffer.id}/brief`),
        secondaryLabel: 'View Your Deals',
        secondaryAction: openDeals,
        request: firstOffer,
      };
    }

    const completedDealWithInvoice = normalizedBrandDeals.find((deal) => Boolean(deal.payment_received_date) && Boolean(deal.invoice_url));
    if (completedDealWithInvoice) {
      return {
        state: 'deal_completed',
        title: 'Deal completed',
        helper: 'This deal is complete. Download your invoice if you need it.',
        primaryLabel: 'Download Invoice',
        primaryAction: () => window.open(completedDealWithInvoice.invoice_url || '', '_blank', 'noopener,noreferrer'),
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(completedDealWithInvoice.id),
        deal: completedDealWithInvoice,
      };
    }

      return {
        state: 'no_deals',
        title: 'Share your collab page to get your first brand offer',
        helper: collabUrl
          ? 'Copy your link or share it on WhatsApp so brands know where to send offers.'
          : 'Add your Instagram handle first so your collab page link is ready to share.',
        primaryLabel: collabUrl ? 'Copy Link' : 'Edit Profile',
        primaryAction: openCollabPage,
        secondaryLabel: collabUrl ? 'WhatsApp Share' : undefined,
        secondaryAction: collabUrl ? () => void handleShareWhatsApp() : undefined,
      };
  }, [collabRequestsPreview, collabUrl, copyText, handleShareWhatsApp, navigate, normalizedBrandDeals]);

  // ============================================
  // PROFILE SYNC EFFECT
  // ============================================

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
    }).catch(() => {
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

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const acceptCollabRequest = useCallback(async (request: CollabRequestPreview) => {
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
  }, [fetchPendingCollabRequestsPreview, profile?.id, refetchBrandDeals]);

  const declineCollabRequest = useCallback(async () => {
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
      // Return focus to the last focused element
      lastFocusedElementRef.current?.focus();
    }
  }, [declineRequestId, fetchPendingCollabRequestsPreview]);

  const handleDeclineClick = useCallback((requestId: string, buttonRef: HTMLButtonElement) => {
    lastFocusedElementRef.current = buttonRef;
    setDeclineRequestId(requestId);
    setShowDeclineRequestDialog(true);
  }, []);

  const handleOpenDeal = useCallback(() => {
    navigate('/creator-contracts');
  }, [navigate]);

  const handleOpenNotification = useCallback((notification: Notification) => {
    markAsRead(notification.id);

    if (notification.action_link) {
      navigate(notification.action_link);
      return;
    }

    if (notification.link) {
      navigate(notification.link);
      return;
    }

    navigate('/notifications');
  }, [markAsRead, navigate]);

  // ============================================
  // FOCUS MANAGEMENT FOR DIALOG
  // ============================================

  useEffect(() => {
    if (showDeclineRequestDialog && declineButtonRef.current) {
      declineButtonRef.current.focus();
    }
  }, [showDeclineRequestDialog]);

  // ============================================
  // RENDER
  // ============================================

  if ((sessionLoading && !session) || (isLoadingDeals && !!creatorId && !brandDealsError)) {
    return <EnhancedDashboardSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white" role="status" aria-label="Loading">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-emerald-400" aria-hidden="true" />
          <p>Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] text-white">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-slate-950 focus:rounded-lg focus:font-bold"
        >
          Skip to main content
        </a>
        
        <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">Creator Armour</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your Deals</h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              Share your collab page, reply faster, and track only the deals that need your attention.
            </p>
          </header>

          <NextStepCard data={nextStepData} />
          <DashboardAlerts notifications={dashboardAlerts} onOpen={handleOpenNotification} />

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Collab Page Section */}
            <section 
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.35)]"
              aria-labelledby="collab-page-heading"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p id="collab-page-heading" className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Your Collab Page</p>
                  <p className="mt-2 break-all text-2xl font-black text-white">{collabUrlShort || 'Create your Instagram handle first'}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Send this link when a brand asks for price, details, or examples of your work.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  onClick={() => navigate('/creator-profile?section=profile')}
                  aria-label="Edit your profile"
                >
                  Edit Profile
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Share options">
                <Button
                  type="button"
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  onClick={() => void copyText(collabUrl, 'Collab page copied')}
                  disabled={!collabUrl}
                  aria-label="Copy collab page link"
                >
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Copy Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  onClick={() => void handleShareWhatsApp()}
                  disabled={!collabUrl}
                  aria-label="Share collab page on WhatsApp"
                >
                  <MessageCircleMore className="mr-2 h-4 w-4" aria-hidden="true" />
                  WhatsApp Share
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  onClick={() => {
                    void copyText(dmTemplate, 'Instagram DM template copied');
                    setCopiedDm(true);
                  }}
                  disabled={!dmTemplate}
                  aria-label="Copy Instagram DM template"
                >
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Instagram DM Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  onClick={() => window.open(collabUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!collabUrl}
                  aria-label="Open collab page in new tab"
                >
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Open Page
                </Button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Instagram DM Template</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {dmTemplate || 'Add your Instagram handle to generate a ready-to-send message.'}
                </p>
                {copiedDm && (
                  <p className="mt-2 text-xs font-semibold text-emerald-300" role="status" aria-live="polite">
                    Copied. Paste this in Instagram DM.
                  </p>
                )}
              </div>
            </section>

            {completedDealsCount === 0 ? (
              <section 
                className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 shadow-[0_20px_60px_rgba(16,185,129,0.18)]"
                aria-labelledby="checklist-heading"
              >
                <p id="checklist-heading" className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Quick Checklist</p>
                <p className="mt-2 text-lg font-black text-white">
                  {completion.completedCount}/{completion.items.length} basics done
                </p>
                <p className="mt-2 text-sm text-emerald-50/85">
                  Finish only the basics first so brands understand you quickly. Advanced settings can wait.
                </p>

                <ul className="mt-4 space-y-2" role="list" aria-label="Profile completion checklist">
                  {smallChecklist.map((item) => (
                    <li 
                      key={item.id} 
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <span 
                        className={`text-xs font-black uppercase tracking-[0.14em] ${item.complete ? 'text-emerald-300' : 'text-amber-300'}`}
                        aria-label={item.complete ? 'Completed' : 'Pending'}
                      >
                        {item.complete ? 'Done' : 'Next'}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-xs text-emerald-100/80">
                  Performance and earnings will appear after your first completed deal.
                </p>
              </section>
            ) : (
              <section 
                className="rounded-[28px] border border-sky-400/20 bg-sky-500/10 p-5 shadow-[0_20px_60px_rgba(14,165,233,0.14)]"
                aria-labelledby="performance-heading"
              >
                <p id="performance-heading" className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">Performance</p>
                <p className="mt-2 text-lg font-black text-white">Your completed work is now live</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">Completed Work</p>
                    <p className="mt-2 text-2xl font-black text-white">{completedDealsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">Earnings</p>
                    <p className="mt-2 text-2xl font-black text-white">₹{totalEarnings.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">Active Deals</p>
                    <p className="mt-2 text-2xl font-black text-white">{dealsForFirstView.length}</p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Deals Section */}
          <section className="mt-8" aria-labelledby="deals-heading">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p id="deals-heading" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your Deals</p>
                <h2 className="mt-1 text-2xl font-black text-white">What needs your attention</h2>
              </div>
              <div className="text-right text-sm text-slate-300" aria-live="polite">
                <p>{pendingCollabRequestsCount} new request{pendingCollabRequestsCount === 1 ? '' : 's'}</p>
                <p>{dealsForFirstView.length} active deal{dealsForFirstView.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2" role="list" aria-label="Collaboration requests and deals">
              {collabRequestsPreview.map((request) => (
                <CollabRequestCard
                  key={request.id}
                  request={request}
                  isAccepting={acceptingRequestId === request.id}
                  onAccept={() => void acceptCollabRequest(request)}
                  onDecline={() => {
                    const button = document.activeElement as HTMLButtonElement;
                    handleDeclineClick(request.id, button);
                  }}
                />
              ))}

              {dealsForFirstView.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onOpenDeal={handleOpenDeal}
                />
              ))}

              {collabRequestsPreview.length === 0 && dealsForFirstView.length === 0 && (
                <EmptyState hasUrl={!!collabUrl} />
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Decline Confirmation Dialog */}
      <AlertDialog open={showDeclineRequestDialog} onOpenChange={setShowDeclineRequestDialog}>
        <AlertDialogContent 
          className="bg-[#1C1C1E] border-white/10 text-white shadow-2xl"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            declineButtonRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              The brand will be notified that you declined this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              ref={declineButtonRef}
              onClick={declineCollabRequest} 
              className="bg-red-500 hover:bg-red-600 text-white border-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorBoundary>
  );
};

export default CreatorDashboard;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, Loader2, MessageCircleMore, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useBrandDeals, getDealStageFromStatus, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/utils/analytics';
import { getApiBaseUrl } from '@/lib/utils/api';
import { getCreatorProgressPatch } from '@/lib/creatorProfileCompletion';
import { buildCreatorDmMessage, buildWhatsAppShareUrl, normalizeInstagramHandle } from '@/lib/utils/creatorMessaging';
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
  brand_verified?: boolean;
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
  if (normalized === 'barter') return 'Products as payment';
  if (normalized === 'hybrid' || normalized === 'both') return 'Paid + Product';
  return 'Paid';
};

const formatDealStageLabel = (status?: string | null, progress?: number | null): string => {
  const stage = getDealStageFromStatus(status || undefined, progress ?? undefined);
  switch (stage) {
    case 'contract_ready':
      return 'Waiting for you to sign';
    case 'brand_signed':
      return 'Tap to sign';
    case 'fully_executed':
      return 'Ready to start';
    case 'live_deal':
    case 'content_making':
      return 'Making content';
    case 'content_delivered':
      return 'Content delivered';
    case 'awaiting_product_shipment':
      return 'Waiting for product delivery';
    case 'negotiation':
      return 'Negotiating';
    case 'needs_changes':
      return 'Changes needed';
    case 'declined':
      return 'Declined';
    case 'completed':
      return 'Done';
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
  `Hi! Collab details + prices are here: ${collabUrl}\nPlease send your brief here.`;

// ============================================
// SUB-COMPONENTS
// ============================================

interface DealCardProps {
  deal: BrandDeal;
  onOpenDeal: () => void;
}

const DealCard = ({ deal, onOpenDeal }: DealCardProps) => {
  const progress = deal.progress_percentage ?? STAGE_TO_PROGRESS[getDealStageFromStatus(deal.status, deal.progress_percentage ?? undefined)] ?? 20;

  const status = String(deal.status || '').toLowerCase();
  const needsAction = status === 'contract_sent' || status === 'revision_requested';
  const waitingOnBrand = status === 'content_submitted' || status === 'approved';

  // Action label based on deal stage
  const actionLabel = (() => {
    if (status === 'contract_sent') return 'Sign to unlock content form';
    if (status === 'revision_requested') return 'Make requested changes';
    if (status === 'content_in_progress') return 'Submit your post link';
    return null;
  })();

  // Deadline urgency
  const deadlineUrgency = (() => {
    if (!deal.due_date) return null;
    const due = new Date(deal.due_date);
    due.setHours(23, 59, 59, 999);
    const diff = due.getTime() - Date.now();
    if (diff < 0) return { label: `${Math.ceil(Math.abs(diff) / 86400000)}d overdue`, tone: 'danger' as const };
    const days = Math.ceil(diff / 86400000);
    if (days === 0) return { label: 'Due today', tone: 'danger' as const };
    if (days === 1) return { label: 'Due tomorrow', tone: 'warn' as const };
    if (days <= 3) return { label: `${days}d left`, tone: 'warn' as const };
    return null;
  })();
  
  return (
    <article 
      className={cn(
        "rounded-[24px] border bg-card p-5 transition-all duration-200 hover:bg-card/80 focus-within:ring-2 focus-within:ring-primary/50",
        needsAction ? "border-warning/40" : waitingOnBrand ? "border-info/30" : "border-border"
      )}
      role="article"
      aria-labelledby={`deal-title-${deal.id}`}
    >
      {/* Urgency label */}
      {needsAction && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-warning">
            ⚡ Your action needed
          </span>
          {deadlineUrgency && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              deadlineUrgency.tone === 'danger' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
            )}>
              {deadlineUrgency.label}
            </span>
          )}
        </div>
      )}
      {waitingOnBrand && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-info">
            👀 Waiting on brand
          </span>
        </div>
      )}

      {/* Brand + stage */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 id={`deal-title-${deal.id}`} className="text-xl font-black text-foreground flex items-center gap-2">
            {deal.brand_name}
            {(deal as any).brand_verified && <ShieldCheck className="h-5 w-5 text-info flex-shrink-0" aria-label="Verified brand" />}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatDealStageLabel(deal.status, deal.progress_percentage)} • {formatCurrency(deal.deal_amount)}
          </p>
          <div className="mt-2 h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", 
                needsAction ? "bg-warning" : waitingOnBrand ? "bg-info" : "bg-primary"
              )}
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
        <div 
          className="rounded-full border border-border px-3 py-1 text-sm font-bold text-foreground flex items-center gap-1.5 flex-shrink-0"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% complete`}
        >
          <div className={cn("w-2 h-2 rounded-full animate-pulse", 
            needsAction ? "bg-warning" : waitingOnBrand ? "bg-info" : "bg-primary"
          )} />
          {progress}%
        </div>
      </div>

      {/* Action prompt */}
      {actionLabel && (
        <div className={cn(
          "mt-3 rounded-xl border px-3 py-2.5 text-sm font-semibold",
          needsAction 
            ? "bg-warning/10 border-warning/30 text-warning"
            : "bg-info/10 border-info/30 text-info"
        )}>
          👉 {actionLabel}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={cn(
          deadlineUrgency?.tone === 'danger' ? "text-destructive font-semibold" 
            : deadlineUrgency?.tone === 'warn' ? "text-warning font-semibold" 
            : "text-muted-foreground"
        )}>
          {deadlineUrgency ? deadlineUrgency.label 
            : deal.due_date ? `Due ${formatDeadline(deal.due_date)}` 
            : 'No deadline'}
        </span>
        <button
          type="button"
          className={cn(
            "font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-3 py-1.5",
            needsAction
              ? "bg-primary text-foreground hover:bg-primary"
              : "text-primary hover:text-primary"
          )}
          onClick={onOpenDeal}
          aria-label={`Open deal with ${deal.brand_name}`}
        >
          {needsAction ? 'Take Action →' : 'View deal'}
        </button>
      </div>
    </article>
  );
};

interface CollabRequestCardProps {
  request: CollabRequestPreview;
  onReview: () => void;
  onDecline: () => void;
}

const CollabRequestCard = ({ request, onReview, onDecline }: CollabRequestCardProps) => {
  return (
    <article 
      className="rounded-[24px] border border-warning/20 bg-card p-5 transition-all duration-200 hover:bg-card/80"
      role="article"
      aria-labelledby={`request-title-${request.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-warning">New Offer</p>
          <h3 id={`request-title-${request.id}`} className="mt-2 text-xl font-black text-foreground flex items-center gap-2">
            {request.brand_name}
            {request.brand_verified && (
              <ShieldCheck className="h-5 w-5 text-info flex-shrink-0" aria-label="Verified brand" />
            )}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDealType(request.collab_type)} • {formatCurrency(request.exact_budget || request.barter_value)}
            {request.deadline ? ` • Deadline ${formatDeadline(request.deadline)}` : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          className="bg-primary text-foreground hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={onReview}
          aria-label={`Review request from ${request.brand_name}`}
        >
          Review offer
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-border bg-card text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
    className="rounded-[24px] border border-dashed border-border bg-secondary/[0.03] p-8 text-center lg:col-span-2"
    role="status"
    aria-label="No deals or requests"
  >
    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
    <p className="text-lg font-black text-foreground">Your offers will appear here</p>
    <p className="mt-2 text-sm text-muted-foreground">
      {hasUrl
        ? 'Share your creator link on WhatsApp or in DMs. New offers will show up here.'
        : 'Add your Instagram first.'
      }
    </p>
  </div>
);

const ProgressiveSetupCard = () => (
  <section className="rounded-[24px] border border-border bg-secondary/[0.04] p-5" aria-labelledby="progressive-setup-heading">
    <p id="progressive-setup-heading" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">How setup works now</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Paid offer</p>
        <p className="mt-2 text-sm font-semibold text-foreground">We ask your price only when you accept it.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-warning">Product deal</p>
        <p className="mt-2 text-sm font-semibold text-foreground">We ask your address only if shipping is needed.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-info">Payment</p>
        <p className="mt-2 text-sm font-semibold text-foreground">We only ask for your UPI when payment is about to be made.</p>
      </div>
    </div>
  </section>
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
    <section className="mb-6 rounded-[24px] border border-warning/20 bg-warning/10 p-5" aria-labelledby="dashboard-alerts-heading">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p id="dashboard-alerts-heading" className="text-xs font-black uppercase tracking-[0.2em] text-warning">Updates</p>
          <p className="mt-2 text-sm text-warning/85">Deal updates show here.</p>
        </div>
        <Button type="button" variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/50" onClick={() => window.location.assign('/#/notifications')}>
          See all
        </Button>
      </div>
      <div className="mt-4 grid gap-3">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => onOpen(notification)}
            className="rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-foreground">{notification.title}</p>
                {notification.message && <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>}
                {notification.action_label && (
                  <p className="mt-3 inline-flex items-center rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-warning">
                    {notification.action_label}
                  </p>
                )}
              </div>
              <span className="text-xs font-semibold text-warning/80">{formatNotificationTime(notification.created_at)}</span>
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
  <section className="mb-6 rounded-[28px] border border-primary/25 bg-card p-5 shadow-md">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Next step</p>
        <h2 className="mt-2 text-2xl font-black text-foreground">{data.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-primary/85">{data.helper}</p>
        {data.request && (
          <p className="mt-3 text-sm font-semibold text-foreground/90">
            Brand: {data.request.brand_name} • {formatDealType(data.request.collab_type)}
          </p>
        )}
        {data.deal && (
          <p className="mt-3 text-sm font-semibold text-foreground/90">
            Deal: {data.deal.brand_name} • {formatDealStageLabel(data.deal.status, data.deal.progress_percentage)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {data.primaryLabel && data.primaryAction && (
          <Button type="button" className="bg-primary text-foreground hover:bg-primary" onClick={data.primaryAction}>
            {data.primaryLabel}
          </Button>
        )}
        {data.secondaryLabel && data.secondaryAction && (
          <Button type="button" variant="outline" className="border-border bg-card text-foreground hover:bg-secondary/50" onClick={data.secondaryAction}>
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
  // Set page title
  useEffect(() => {
    document.title = 'Creator Dashboard | Creator Armour';
  }, []);
  const navigate = useNavigate();
  const { profile, session, loading: sessionLoading } = useSession();
  const updateProfileMutation = useUpdateProfile();
  
  // Deals tab state
  const [dealsTab, setDealsTab] = useState<'pending' | 'active' | 'completed'>('active');

  // State
  const [pendingCollabRequestsCount, setPendingCollabRequestsCount] = useState(0);
  const [totalOffersReceived, setTotalOffersReceived] = useState(0);
  const [storefrontViews, setStorefrontViews] = useState(0);
  const [collabRequestsPreview, setCollabRequestsPreview] = useState<CollabRequestPreview[]>([]);
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
    brandDeals
      .filter((deal) => {
        const status = String(deal.status || '').toLowerCase();
        return status === 'completed' || status === 'fully_executed' || Boolean(deal.payment_received_date);
      })
      .reduce((sum, deal) => sum + (Number(deal.deal_amount || 0) || 0), 0)
  ), [brandDeals]);

  const collabHandle = useMemo(() =>
    normalizeInstagramHandle(profile?.instagram_handle || profile?.username || ''),
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
  
  
  const dmTemplate = useMemo(() => {
    if (!collabUrl) return '';
    const creatorName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    return buildCreatorDmMessage({ creatorName, collabUrl });
  }, [collabUrl, profile?.first_name, profile?.last_name]);
  
  const normalizedBrandDeals = useMemo<DashboardBrandDeal[]>(() => (
    brandDeals as DashboardBrandDeal[]
  ), [brandDeals]);

  // Urgency tiers: lower = more urgent
  const urgencyTier = (deal: DashboardBrandDeal): number => {
    const s = String(deal.status || '').toLowerCase();
    if (s === 'contract_sent') return 0; // Must sign — unlocks everything
    if (s === 'revision_requested') return 1; // Brand wants changes
    if (s === 'content_in_progress') return 2; // Creator is working
    if (s === 'content_submitted') return 3; // Under brand review
    if (s === 'approved') return 4; // Brand approved
    if (s === 'payment_pending') return 5; // Waiting for payment
    if (s === 'payment_received') return 6; // Done
    return 9;
  };

  const dealsForFirstView = useMemo(() => {
    return normalizedBrandDeals
      .filter((deal) => {
        const status = String(deal.status || '').toLowerCase();
        return status !== 'completed' && status !== 'fully_executed';
      })
      .sort((a, b) => {
        const urgencyDiff = urgencyTier(a) - urgencyTier(b);
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, DEAL_CARDS_LIMIT);
  }, [normalizedBrandDeals]);

  // Deals that need creator action now (for action-required card)
  const actionRequiredDeals = useMemo(() =>
    dealsForFirstView.filter(deal => {
      const s = String(deal.status || '').toLowerCase();
      return s === 'contract_sent' || s === 'revision_requested';
    }),
  [dealsForFirstView]);

  // Deals creator is waiting on brand
  const waitingOnBrandDeals = useMemo(() =>
    dealsForFirstView.filter(deal => {
      const s = String(deal.status || '').toLowerCase();
      return s === 'content_submitted' || s === 'approved';
    }),
  [dealsForFirstView]);

  const dashboardAlerts = useMemo(() => (
    creatorNotifications.filter((notification) => ['deal', 'contract', 'payment'].includes(notification.type)).slice(0, 2)
  ), [creatorNotifications]);

  // ============================================
  // CREATOR LIFECYCLE STAGE
  // ============================================
  
  const creatorStage = useMemo((): 'new' | 'link_shared' | 'has_offer' | 'active_deal' | 'completed' => {
    if (completedDealsCount > 0) return 'completed';
    if (dealsForFirstView.length > 0) return 'active_deal';
    if (collabRequestsPreview.length > 0) return 'has_offer';
    if (profile?.link_shared_at) return 'link_shared';
    return 'new';
  }, [completedDealsCount, dealsForFirstView.length, collabRequestsPreview.length, profile?.link_shared_at]);

  // ============================================
  // HANDLERS (defined after collabUrl, before nextStepData)
  // ============================================

  const copyText = useCallback(async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Failed to copy. Please try again.');
    }
  }, []);

  const handleShareWhatsApp = useCallback(async () => {
    if (!collabUrl || !profile?.id) return;

    const creatorName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    const message = buildCreatorDmMessage({ creatorName, collabUrl });
    window.open(buildWhatsAppShareUrl(message), '_blank', 'noopener,noreferrer');

    if (!profile.link_shared_at) {
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        link_shared_at: new Date().toISOString(),
      }).catch(() => undefined);
    }

    void trackEvent('collab_link_shared', { creator_id: profile.id, mode: 'whatsapp' });
    void trackEvent('creators_shared_link', { creator_id: profile.id, mode: 'whatsapp' });
  }, [collabUrl, profile, updateProfileMutation, profile?.first_name, profile?.last_name]);

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
      void trackEvent('collab_link_copied', { creator_id: profile?.id });
    };
    const openPayment = (dealId: string) => navigate(`/payment/${dealId}`);
    const openDeliveryDetails = (dealId: string) => navigate(`/deal-delivery-details/${dealId}`);
    const openDealDetails = (dealId: string) => navigate(`/deal/${dealId}`);

    const paymentConfirmationDeal = normalizedBrandDeals.find((deal) => {
      const status = String(deal.status || '').toLowerCase();
      return !deal.payment_received_date && (status.includes('paid') || status.includes('payment_released') || status.includes('payment sent'));
    });
    if (paymentConfirmationDeal) {
      return {
        state: 'payment_confirmation_needed',
        title: 'I got the money',
        helper: 'The brand says they sent the money. Confirm when it hits your account.',
        primaryLabel: 'I got the money',
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
      const expectedDate = approvedWaitingPaymentDeal.payment_expected_date
        ? new Date(approvedWaitingPaymentDeal.payment_expected_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : null;
      return {
        state: 'waiting_payment',
        title: 'Waiting for payment',
        helper: expectedDate
          ? `The brand has approved your content. Expected by ${expectedDate}.`
          : 'The brand has approved your content. Payment will be sent to you shortly.',
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
        title: 'Changes requested',
        helper: 'Open the deal, check what the brand changed, and share the updated post link.',
        primaryLabel: 'Open deal',
        primaryAction: () => openDealDetails(revisionRequestedDeal.id),
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
        title: 'Share post link',
        helper: 'Open the deal and share your Instagram post link for brand review.',
        primaryLabel: 'Open deal',
        primaryAction: () => openDealDetails(contentRequestedDeal.id),
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
        title: 'Add your address',
        helper: 'Add your address so they can send the product.',
        primaryLabel: 'Add address',
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
        title: 'Make your content',
        helper: 'Deal confirmed. Open it to review the brief and start making your content.',
        primaryLabel: 'Open deal',
        primaryAction: () => openDealDetails(acceptedNotStartedDeal.id),
        deal: acceptedNotStartedDeal,
      };
    }

    const firstOffer = collabRequestsPreview[0];
    if (firstOffer) {
      return {
        state: 'offer_received',
        title: 'A brand sent you an offer',
        helper: 'Open it, check the brief, and decide if you want to accept, counter, or decline.',
        primaryLabel: 'Review offer',
        primaryAction: () => navigate(`/collab-requests/${firstOffer.id}/brief`),
        secondaryLabel: 'Open deals',
        secondaryAction: openDeals,
        request: firstOffer,
      };
    }

    const completedDealWithInvoice = normalizedBrandDeals.find((deal) => Boolean(deal.payment_received_date) && Boolean(deal.invoice_url));
    if (completedDealWithInvoice) {
      return {
        state: 'deal_completed',
        title: 'Deal completed',
        helper: 'This deal is done. Download your invoice and share your collab link to get your next deal.',
        primaryLabel: 'Download Invoice',
        primaryAction: () => window.open(completedDealWithInvoice.invoice_url || '', '_blank', 'noopener,noreferrer'),
        secondaryLabel: 'View Deal',
        secondaryAction: () => openDealDetails(completedDealWithInvoice.id),
        deal: completedDealWithInvoice,
      };
    }

      return {
        state: 'no_deals',
        title: 'Share your creator link',
        helper: collabUrl
          ? 'Send this link when a brand asks to work with you. Their offers will appear here.'
          : 'Add your Instagram first.',
      };
  }, [collabRequestsPreview, collabUrl, copyText, handleShareWhatsApp, navigate, normalizedBrandDeals, profile?.id]);

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

    // Only update fields that exist in the profiles table schema
    // Note: storefront_completion, offers_received, offers_accepted, completed_deals,
    // total_deals, total_earnings, storefront_views, conversion_rate, first_offer_at,
    // first_deal_at, last_active_at do NOT exist in the database schema
    const hasDiff = (
      (profile.creator_stage ?? 'new') !== (progressPatch.creator_stage ?? 'new') ||
      Number(profile.profile_completion || 0) !== progressPatch.profile_completion
    );

    if (!hasDiff) return;

    void updateProfileMutation.mutateAsync({
      id: profile.id,
      creator_stage: progressPatch.creator_stage,
      profile_completion: progressPatch.profile_completion,
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

  // Loading state with skeleton
  if ((sessionLoading && !session) || (isLoadingDeals && !!creatorId && !brandDealsError)) {
    return <EnhancedDashboardSkeleton />;
  }

  // Enhanced error state with retry and reporting
  if (brandDealsError) {
    return (
      <div className="nb-screen-height bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-3">Unable to load deals</h2>
          <p className="text-foreground/70 mb-6 leading-relaxed">
            We couldn't load your collaboration deals. This might be a temporary network issue.
          </p>

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-card rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-foreground/50 mb-2">Error Details (Dev Mode):</p>
              <p className="text-xs text-destructive font-mono break-all">
                {brandDealsError.message || 'Unknown error'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => refetchBrandDeals()}
              className="w-full h-12 bg-primary hover:bg-primary text-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Try Again
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="w-full h-12 bg-secondary/50 hover:bg-secondary/20 text-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground" role="status" aria-label="Loading">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" aria-hidden="true" />
          <p>Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        
        
        <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Creator Armour</p>
            {profile?.first_name && (
              <p className="text-sm text-foreground/50">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile.first_name}
              </p>
            )}
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {creatorStage === 'new' || creatorStage === 'link_shared' ? 'Your Offer Inbox' : 
               creatorStage === 'has_offer' ? 'New Offer' :
               creatorStage === 'active_deal' ? 'Active Deal' :
               'Completed Deals'}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {creatorStage === 'new' || creatorStage === 'link_shared' ? 'Share your link. Brand offers appear here.' :
               creatorStage === 'has_offer' ? 'A brand is waiting for your response.' :
               creatorStage === 'active_deal' ? 'This deal is in progress. Follow the next step below.' :
               `You\'ve earned ₹${totalEarnings.toLocaleString('en-IN')} from ${completedDealsCount} completed deal${completedDealsCount === 1 ? '' : 's'}.`}
            </p>
          </header>

          <DashboardAlerts notifications={dashboardAlerts} onOpen={handleOpenNotification} />

          {/* STATE 1: New creator - show link + share */}
          {(creatorStage === 'new' || creatorStage === 'link_shared') && (
            <div className="space-y-4 pb-32 md:pb-6">
              <section 
                className="rounded-[24px] md:rounded-[28px] border border-border bg-card p-4 md:p-5 shadow-[0_20px_60px_rgba(15,23,42,0.35)]"
                aria-labelledby="collab-page-heading"
              >
                <div>
                  <p id="collab-page-heading" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Your link</p>
                  {collabUrlShort ? (
                    <>
                      <p className="mt-2 break-all text-xl md:text-2xl font-black text-foreground">{collabUrlShort}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Send this when a brand DMs you.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => window.open(`${collabUrl}?preview=1`, '_blank')}
                          className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preview your page
                        </button>
                        {storefrontViews > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {storefrontViews.toLocaleString('en-IN')} profile view{storefrontViews === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-xl md:text-2xl font-black text-foreground/60">Not set up yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add your Instagram handle to get your collab link.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/creator-profile?section=profile')}
                        className="mt-3 text-sm font-bold text-primary hover:text-primary underline"
                      >
                        Add Instagram →
                      </button>
                    </>
                  )}
                </div>
              </section>

              {/* Profile Completeness Nudge — shown when link exists but profile is less than 60% complete */}
              {(() => {
                const completionPct = profile?.profile_completion ?? 0;
                if (!collabUrlShort || completionPct >= 60) return null;

                // Dismiss for this session (persists across navigations within the same browser session)
                const dismissedKey = `profile_nudge_dismissed_${profile?.id ?? 'unknown'}`;
                if (typeof window !== 'undefined' && sessionStorage.getItem(dismissedKey)) return null;

                const missingItems: string[] = [];
                if (!(profile as any)?.instagram_handle) missingItems.push('Instagram handle');
                if (!(profile as any)?.avg_rate_reel) missingItems.push('your rate');
                if (!profile?.avatar_url) missingItems.push('profile photo');
                if (!profile?.intro_line) missingItems.push('bio / intro');
                if (!profile?.packages_added) missingItems.push('pricing packages');

                return (
                  <section className="rounded-[24px] border border-warning/20 bg-warning/10 p-4 md:p-5">
                    <div className="flex items-start gap-3">
                      <div className="bg-warning/20 p-2 rounded-xl flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[13px] font-black text-warning">Your collab page is {completionPct}% complete</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-warning/70">Profile incomplete</span>
                            <button
                              type="button"
                              onClick={() => sessionStorage.setItem(dismissedKey, '1')}
                              className="text-warning/50 hover:text-warning text-[11px] font-medium ml-1"
                              aria-label="Dismiss this session"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="h-1.5 bg-warning/20 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                        </div>
                        {missingItems.length > 0 && (
                          <p className="text-[12px] text-warning/70 mb-2">
                            Brands see these as blank: {missingItems.join(', ')}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate('/creator-profile?section=profile')}
                          className="text-[12px] font-bold text-warning hover:text-warning underline"
                        >
                          Complete your profile →
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })()}

              <section 
                className="rounded-[24px] md:rounded-[28px] border border-primary/20 bg-primary/10 p-4 md:p-5"
                aria-labelledby="waiting-heading"
              >
                <p id="waiting-heading" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Waiting for your first offer</p>
                <p className="mt-2 text-base md:text-lg font-black text-foreground">
                  Share your link to start receiving offers.
                </p>
                <p className="mt-1 text-sm text-primary/85">
                  When a brand sends an offer, it shows up here.
                </p>
                {storefrontViews > 0 && (
                  <p className="mt-2 text-xs text-primary/60">
                    {storefrontViews.toLocaleString('en-IN')} people have viewed your collab page
                  </p>
                )}
              </section>

              <ProgressiveSetupCard />
            </div>
          )}

          {/* Sticky bottom CTA for new creators */}
          {(creatorStage === 'new' || creatorStage === 'link_shared') && (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent md:hidden">
              <div className="flex flex-row gap-2 max-w-lg mx-auto">
                <Button
                  type="button"
                  className="flex-1 bg-primary text-foreground hover:bg-primary h-12 text-sm font-black rounded-2xl shadow-lg gap-1.5"
                  onClick={() => void handleShareWhatsApp()}
                  disabled={!collabUrl}
                >
                  <MessageCircleMore className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-primary text-foreground hover:bg-primary h-12 text-sm font-black rounded-2xl gap-1.5"
                  onClick={() => {
                    void copyText(collabUrl, 'Link copied. Paste it in DM');
                    void trackEvent('collab_link_copied', { creator_id: profile?.id });
                  }}
                  disabled={!collabUrl}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* STATE 2: Has offers - show offer cards */}
          {creatorStage === 'has_offer' && (
            <div className="space-y-6">
              <NextStepCard data={nextStepData} />
              
              <section aria-labelledby="offers-heading">
                <h2 id="offers-heading" className="text-2xl font-black text-foreground mb-4">Your offers</h2>
                <div className="grid gap-4 lg:grid-cols-2" role="list">
                  {collabRequestsPreview.map((request) => (
                    <CollabRequestCard
                      key={request.id}
                      request={request}
                      onReview={() => navigate(`/collab-requests/${request.id}/brief`, { state: { request } })}
                      onDecline={() => {
                        const button = document.activeElement as HTMLButtonElement;
                        handleDeclineClick(request.id, button);
                      }}
                    />
                  ))}
                </div>
              </section>

              {/* Show link smaller at bottom */}
              <section className="rounded-[28px] border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Your link</p>
                    <p className="text-sm font-bold text-foreground">{collabUrlShort}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border bg-card text-foreground hover:bg-secondary/50 text-xs"
                    onClick={() => {
                      void copyText(collabUrl, 'Link copied');
                    }}
                    disabled={!collabUrl}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </section>
            </div>
          )}

          {/* STATE 3: Active deal - show deal with next action */}
          {creatorStage === 'active_deal' && (
            <div className="space-y-6">
              <NextStepCard data={nextStepData} />

              {/* Action Required Summary */}
              {actionRequiredDeals.length > 0 && (
                <section className="rounded-2xl border border-warning/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-warning">
                      ⚡ Do this first
                    </p>
                    <span className="text-[10px] font-bold bg-warning/20 text-warning px-2 py-1 rounded-full">
                      {actionRequiredDeals.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {actionRequiredDeals.slice(0, 3).map(deal => (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => navigate(`/creator-deal/${deal.id}`)}
                        className="w-full flex items-center justify-between bg-card hover:bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{deal.brand_name}</p>
                          <p className="text-xs text-warning font-medium">
                            {String(deal.status || '').toLowerCase() === 'contract_sent' ? 'Sign agreement' : 'Make requested changes'}
                          </p>
                        </div>
                        <span className="text-primary text-sm font-semibold flex-shrink-0 ml-2">→</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              
              <section aria-labelledby="deals-heading">
                <h2 id="deals-heading" className="text-2xl font-black text-foreground mb-4">Your deal</h2>
                <div className="grid gap-4 lg:grid-cols-2" role="list">
                  {dealsForFirstView.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onOpenDeal={handleOpenDeal}
                    />
                  ))}
                </div>
              </section>

              {/* Show link smaller at bottom */}
              <section className="rounded-[28px] border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Your link</p>
                    <p className="text-sm font-bold text-foreground">{collabUrlShort}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border bg-card text-foreground hover:bg-secondary/50 text-xs"
                    onClick={() => {
                      void copyText(collabUrl, 'Link copied');
                    }}
                    disabled={!collabUrl}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </section>
            </div>
          )}

          {/* STATE 4: Completed deals - show earnings + stats */}
          {creatorStage === 'completed' && (
            <div className="space-y-6">
              <NextStepCard data={nextStepData} />

              {/* Action Required Summary — shown when deals need attention */}
              {(actionRequiredDeals.length > 0 || collabRequestsPreview.length > 0) && (
                <section className="rounded-2xl border border-warning/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-warning">
                      ⚡ Things to do right now
                    </p>
                    <span className="text-[10px] font-bold bg-warning/20 text-warning px-2 py-1 rounded-full">
                      {actionRequiredDeals.length + collabRequestsPreview.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {actionRequiredDeals.slice(0, 3).map(deal => (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => navigate(`/creator-deal/${deal.id}`)}
                        className="w-full flex items-center justify-between bg-card hover:bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{deal.brand_name}</p>
                          <p className="text-xs text-warning font-medium">
                            {String(deal.status || '').toLowerCase() === 'contract_sent' ? 'Sign agreement' : 'Make requested changes'}
                          </p>
                        </div>
                        <span className="text-primary text-sm font-semibold flex-shrink-0 ml-2">→</span>
                      </button>
                    ))}
                    {collabRequestsPreview.slice(0, 2 - Math.min(actionRequiredDeals.length, 1)).map(request => (
                      <button
                        key={request.id}
                        type="button"
                        onClick={() => navigate(`/collab-requests/${request.id}/brief`, { state: { request } })}
                        className="w-full flex items-center justify-between bg-card hover:bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{request.brand_name}</p>
                          <p className="text-xs text-warning font-medium">Review offer — expires soon</p>
                        </div>
                        <span className="text-primary text-sm font-semibold flex-shrink-0 ml-2">→</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Earnings summary */}
              <section 
                className="rounded-[28px] border border-info/20 bg-info/10 p-5"
                aria-labelledby="earnings-heading"
              >
                <p id="earnings-heading" className="text-xs font-black uppercase tracking-[0.2em] text-info">Your earnings</p>
                <p className="mt-2 text-3xl font-black text-foreground">₹{totalEarnings.toLocaleString('en-IN')}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Completed</p>
                    <p className="mt-2 text-2xl font-black text-foreground">{completedDealsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Active</p>
                    <p className="mt-2 text-2xl font-black text-foreground">{dealsForFirstView.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Offers</p>
                    <p className="mt-2 text-2xl font-black text-foreground">{pendingCollabRequestsCount}</p>
                  </div>
                </div>
              </section>

              {/* Active deals and offers */}
              {(collabRequestsPreview.length > 0 || dealsForFirstView.length > 0 || completedDealsCount > 0) && (
                <section aria-labelledby="active-heading">
                  {/* Tab Navigation */}
                  <div className="flex items-center gap-1 mb-4 border-b border-border">
                    <button
                      onClick={() => setDealsTab('active')}
                      className={cn(
                        'pb-3 px-1 pr-4 text-sm font-semibold transition-colors flex items-center gap-1.5',
                        dealsTab === 'active' ? 'text-foreground border-b-2 border-primary' : 'text-foreground/50 hover:text-foreground/70'
                      )}
                    >
                      Active
                      {dealsForFirstView.length > 0 && (
                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dealsForFirstView.length}</span>
                      )}
                    </button>
                    <button
                      onClick={() => setDealsTab('pending')}
                      className={cn(
                        'pb-3 px-1 pr-4 text-sm font-semibold transition-colors flex items-center gap-1.5',
                        dealsTab === 'pending' ? 'text-foreground border-b-2 border-warning' : 'text-foreground/50 hover:text-foreground/70'
                      )}
                    >
                      Pending
                      {collabRequestsPreview.length > 0 && (
                        <span className="bg-warning/20 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded-full">{collabRequestsPreview.length}</span>
                      )}
                    </button>
                    <button
                      onClick={() => setDealsTab('completed')}
                      className={cn(
                        'pb-3 px-1 text-sm font-semibold transition-colors flex items-center gap-1.5',
                        dealsTab === 'completed' ? 'text-foreground border-b-2 border-info' : 'text-foreground/50 hover:text-foreground/70'
                      )}
                    >
                      Done
                      {completedDealsCount > 0 && (
                        <span className="bg-info/20 text-info text-[10px] font-bold px-1.5 py-0.5 rounded-full">{completedDealsCount}</span>
                      )}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div role="tabpanel">
                    {/* Pending Offers */}
                    {dealsTab === 'pending' && (
                      <div>
                        {collabRequestsPreview.length === 0 ? (
                          <div className="rounded-2xl border border-border bg-card p-6 text-center">
                            <p className="text-sm text-foreground/60">No pending offers. Share your collab link to get brand deals!</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 lg:grid-cols-2" role="list">
                            {collabRequestsPreview.map((request) => (
                              <CollabRequestCard
                                key={request.id}
                                request={request}
                                onReview={() => navigate(`/collab-requests/${request.id}/brief`, { state: { request } })}
                                onDecline={() => {
                                  const button = document.activeElement as HTMLButtonElement;
                                  handleDeclineClick(request.id, button);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active Deals */}
                    {dealsTab === 'active' && (
                      <div>
                        {dealsForFirstView.length === 0 ? (
                          <div className="rounded-2xl border border-border bg-card p-6 text-center">
                            <p className="text-sm text-foreground/60">No active deals. Accept an offer to get started!</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 lg:grid-cols-2" role="list">
                            {dealsForFirstView.map((deal) => (
                              <DealCard
                                key={deal.id}
                                deal={deal}
                                onOpenDeal={handleOpenDeal}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed Deals */}
                    {dealsTab === 'completed' && (
                      <div>
                        {completedDealsCount === 0 ? (
                          <div className="rounded-2xl border border-border bg-card p-6 text-center">
                            <p className="text-sm text-foreground/60">No completed deals yet. Keep going!</p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border bg-card p-6">
                            <p className="text-sm text-foreground/60">{completedDealsCount} deal{completedDealsCount === 1 ? '' : 's'} completed. Great work!</p>
                            <Button
                              type="button"
                              className="mt-4 bg-secondary hover:bg-secondary text-foreground h-10 text-sm font-semibold"
                              onClick={() => navigate('/creator-payments')}
                            >
                              View Payment History
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Collab link + profile */}
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-[28px] border border-border bg-card p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Your link</p>
                  <p className="mt-2 break-all text-xl font-black text-foreground">{collabUrlShort}</p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      className="bg-primary text-foreground hover:bg-primary h-12 sm:h-auto text-base sm:text-sm"
                      onClick={() => {
                        void copyText(collabUrl, 'Link copied');
                      }}
                      disabled={!collabUrl}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button
                      type="button"
                      className="bg-primary text-foreground hover:bg-primary h-12 sm:h-auto text-base sm:text-sm"
                      onClick={() => void handleShareWhatsApp()}
                      disabled={!collabUrl}
                    >
                      <MessageCircleMore className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-border bg-card p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Your profile</p>
                  <p className="mt-2 text-sm text-muted-foreground">Keep your profile updated to attract more brands.</p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border bg-card text-foreground hover:bg-secondary/50"
                      onClick={() => navigate('/creator-profile?section=profile')}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Decline Confirmation Dialog */}
      <AlertDialog open={showDeclineRequestDialog} onOpenChange={setShowDeclineRequestDialog}>
        <AlertDialogContent 
          className="bg-card border-border text-foreground shadow-2xl"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            declineButtonRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              The brand will be notified that you declined this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-card border-border text-foreground hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              ref={declineButtonRef}
              onClick={declineCollabRequest} 
              className="bg-destructive hover:bg-destructive text-foreground border-none focus-visible:ring-2 focus-visible:ring-red-400"
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

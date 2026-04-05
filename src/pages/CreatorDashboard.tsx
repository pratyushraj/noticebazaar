"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy, ExternalLink, Loader2, MessageCircleMore,
  AlertCircle, ShieldCheck, CheckCircle, Clock, FileText,
  ArrowRight, TrendingUp, Zap, ChevronRight
} from 'lucide-react';
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
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { BrandDeal } from '@/types';
import type { Notification } from '@/types/notifications';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface CollabRequestPreview {
  id: string; brand_name: string; brand_email?: string;
  brand_verified?: boolean; collab_type?: string;
  budget_range?: string | null; exact_budget?: number | null;
  barter_value?: number | null; deadline?: string | null;
  brand_logo?: string | null; created_at: string;
  raw: Record<string, unknown>;
}

type GuidedDashboardState =
  | 'no_deals' | 'offer_received' | 'delivery_details_needed'
  | 'content_not_started' | 'content_upload_needed'
  | 'revision_requested' | 'waiting_payment'
  | 'payment_confirmation_needed' | 'deal_completed';

interface NextStepCardData {
  state: GuidedDashboardState; title: string; helper: string;
  primaryLabel?: string; primaryAction?: () => void;
  secondaryLabel?: string; secondaryAction?: () => void;
  deal?: BrandDeal; request?: CollabRequestPreview;
}

// ============================================
// CONSTANTS
// ============================================

const PREVIEW_ITEMS_LIMIT = 6;
const DEAL_CARDS_LIMIT = 6;
const ANALYTICS_DAYS = 30;

// ============================================
// UTILITY FUNCTIONS
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
    case 'contract_ready': return 'Waiting for you to sign';
    case 'brand_signed': return 'Tap to sign';
    case 'fully_executed': return 'Ready to start';
    case 'live_deal': case 'content_making': return 'Making content';
    case 'content_delivered': return 'Content delivered';
    case 'awaiting_product_shipment': return 'Waiting for product';
    case 'negotiation': return 'Negotiating';
    case 'needs_changes': return 'Changes needed';
    case 'completed': return 'Done';
    default: return 'In progress';
  }
};

const formatDeadline = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatTimeAgo = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ============================================
// SUB-COMPONENTS
// ============================================

// ── Welcome Header ──────────────────────────────────────────────────────

const WelcomeHeader = ({
  firstName,
  stage,
  totalEarnings,
  completedDealsCount,
  hasUrl,
}: {
  firstName?: string;
  stage: string;
  totalEarnings: number;
  completedDealsCount: number;
  hasUrl: boolean;
}) => {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {firstName ? `${greeting}, ${firstName}` : 'Creator Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stage === 'new' || stage === 'link_shared'
              ? 'Share your link to start getting brand deals'
              : stage === 'has_offer'
              ? 'You have a new offer waiting'
              : stage === 'active_deal'
              ? 'You have an active deal in progress'
              : `${completedDealsCount} deal${completedDealsCount === 1 ? '' : 's'} completed`}
          </p>
        </div>
        {totalEarnings > 0 && (
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Earned</p>
              <p className="text-sm font-semibold text-foreground">₹{totalEarnings.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// ── Collab Link Card ─────────────────────────────────────────────────────

const CollabLinkCard = ({
  collabUrlShort,
  collabUrl,
  storefrontViews,
  onCopy,
  onShareWhatsApp,
  onPreview,
  hasUrl,
  onAddInstagram,
  onCompleteProfile,
  profileCompletion = 0,
}: {
  collabUrlShort: string;
  collabUrl: string;
  storefrontViews: number;
  onCopy: () => void;
  onShareWhatsApp: () => void;
  onPreview: () => void;
  hasUrl: boolean;
  onAddInstagram: () => void;
  onCompleteProfile: () => void;
  profileCompletion: number;
}) => {
  if (!hasUrl) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Set up your collab page</p>
            <p className="text-xs text-muted-foreground">Add Instagram to get your link</p>
          </div>
        </div>
        <Button onClick={onAddInstagram} className="w-full">
          Add Instagram →
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-muted-foreground">Your collab link</p>
        {storefrontViews > 0 && (
          <span className="text-xs text-muted-foreground">{storefrontViews.toLocaleString('en-IN')} views</span>
        )}
      </div>
      <p className="text-base font-semibold text-foreground break-all leading-snug">{collabUrlShort}</p>

      {profileCompletion < 60 && (
        <div className="mt-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-xs text-warning font-medium">
            Your page is {profileCompletion}% complete — incomplete pages get fewer responses
          </p>
          <button onClick={onCompleteProfile} className="text-xs text-primary hover:underline mt-1">
            Complete profile →
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onCopy} variant="outline" size="sm" className="flex-1">
          <Copy className="h-3.5 w-3.5" /> Copy link
        </Button>
        <Button onClick={onShareWhatsApp} size="sm" className="flex-1">
          <MessageCircleMore className="h-3.5 w-3.5" /> Share on WhatsApp
        </Button>
      </div>
      <button
        onClick={onPreview}
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3 w-3" /> Preview your page
      </button>
    </section>
  );
};

// ── Next Step Card ───────────────────────────────────────────────────────

const NextStepCard = ({ data }: { data: NextStepCardData }) => (
  <section className="rounded-2xl border border-border bg-card p-6">
    <div className="flex items-start gap-3 mb-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium text-primary">Next step</p>
        <h2 className="text-base font-semibold text-foreground mt-0.5">{data.title}</h2>
      </div>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed">{data.helper}</p>
    {data.deal && (
      <p className="mt-2 text-xs text-muted-foreground">
        {data.deal.brand_name} · {formatDealStageLabel(data.deal.status, data.deal.progress_percentage)}
      </p>
    )}
    {data.request && (
      <p className="mt-2 text-xs text-muted-foreground">
        {data.request.brand_name} · {formatDealType(data.request.collab_type)}
      </p>
    )}
    {data.primaryLabel && data.primaryAction && (
      <Button onClick={data.primaryAction} className="mt-4 w-full sm:w-auto">
        {data.primaryLabel} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    )}
  </section>
);

// ── Deal Card ────────────────────────────────────────────────────────────

const DealCard = ({ deal, onOpen }: { deal: BrandDeal; onOpen: () => void }) => {
  const progress = deal.progress_percentage ?? STAGE_TO_PROGRESS[getDealStageFromStatus(deal.status, deal.progress_percentage ?? undefined)] ?? 20;
  const status = String(deal.status || '').toLowerCase();
  const needsAction = status === 'contract_sent' || status === 'revision_requested';
  const waiting = status === 'content_submitted' || status === 'approved';

  const statusLabel = (() => {
    if (status === 'contract_sent') return { text: 'Sign to continue', tone: 'warning' as const };
    if (status === 'revision_requested') return { text: 'Changes needed', tone: 'warning' as const };
    if (status === 'content_in_progress') return { text: 'Submit post link', tone: 'default' as const };
    if (waiting) return { text: 'Waiting on brand', tone: 'muted' as const };
    return { text: formatDealStageLabel(deal.status, deal.progress_percentage), tone: 'muted' as const };
  })();

  const deadline = deal.due_date ? formatDeadline(deal.due_date) : null;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-5 transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:-translate-y-0.5",
        needsAction ? "border-warning/30" : "border-border"
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      aria-label={`Open deal with ${deal.brand_name}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{deal.brand_name}</h3>
            {(deal as any).brand_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          <span className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            statusLabel.tone === 'warning' ? "bg-warning/15 text-warning" :
            statusLabel.tone === 'muted' ? "bg-secondary text-muted-foreground" :
            "bg-primary/15 text-primary"
          )}>
            {statusLabel.text}
          </span>
        </div>
        <span className="text-base font-semibold text-foreground shrink-0">{progress}%</span>
      </div>

      <div className="h-1 rounded-full bg-secondary overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all",
            needsAction ? "bg-warning" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{formatCurrency(deal.deal_amount)}</span>
        {deadline && <span className="text-xs text-muted-foreground">Due {deadline}</span>}
      </div>
    </article>
  );
};

// ── Offer Card ───────────────────────────────────────────────────────────

const OfferCard = ({
  request,
  onReview,
  onDecline,
}: {
  request: CollabRequestPreview;
  onReview: () => void;
  onDecline: () => void;
}) => (
  <article className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            New offer
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          {request.brand_name}
          {request.brand_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDealType(request.collab_type)} · {formatCurrency(request.exact_budget || request.barter_value)}
          {request.deadline ? ` · Due ${formatDeadline(request.deadline)}` : ''}
        </p>
      </div>
    </div>
    <div className="flex gap-2">
      <Button onClick={onReview} size="sm" className="flex-1">Review offer</Button>
      <Button onClick={onDecline} variant="ghost" size="sm">Decline</Button>
    </div>
  </article>
);

// ── Earnings Summary ─────────────────────────────────────────────────────

const EarningsSummary = ({
  totalEarnings,
  completedDealsCount,
  activeDealsCount,
  pendingOffersCount,
}: {
  totalEarnings: number;
  completedDealsCount: number;
  activeDealsCount: number;
  pendingOffersCount: number;
}) => (
  <section className="rounded-2xl border border-border bg-card p-6">
    <p className="text-xs font-medium text-muted-foreground mb-4">Earnings overview</p>
    <div className="space-y-1 mb-5">
      <p className="text-3xl font-semibold tracking-tight text-foreground">
        ₹{totalEarnings.toLocaleString('en-IN')}
      </p>
      <p className="text-xs text-muted-foreground">Total earned</p>
    </div>
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{completedDealsCount}</p>
        <p className="text-xs text-muted-foreground">Completed</p>
      </div>
      <div className="text-center border-x border-border">
        <p className="text-lg font-semibold text-foreground">{activeDealsCount}</p>
        <p className="text-xs text-muted-foreground">Active</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{pendingOffersCount}</p>
        <p className="text-xs text-muted-foreground">Offers</p>
      </div>
    </div>
  </section>
);

// ── Activity Timeline ─────────────────────────────────────────────────────

const ActivityTimelineItem = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  time,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  time: string;
  onClick?: () => void;
}) => (
  <div
    className={cn(
      "flex items-start gap-3 py-3",
      onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
    )}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconBg)}>
      <Icon className={cn("h-3.5 w-3.5", iconColor)} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-foreground leading-snug">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
    </div>
    {onClick && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />}
  </div>
);

const ActivityTimeline = ({
  deals,
  notifications,
  onDealClick,
  onNotificationClick,
}: {
  deals: BrandDeal[];
  notifications: Notification[];
  onDealClick: (id: string) => void;
  onNotificationClick: (n: Notification) => void;
}) => {
  // Build timeline items from deals
  const dealItems = deals.slice(0, 4).map((deal) => ({
    id: deal.id,
    icon: FileText as React.ElementType,
    iconBg: "bg-secondary",
    iconColor: "text-muted-foreground",
    title: `${deal.brand_name} — ${formatDealStageLabel(deal.status, deal.progress_percentage)}`,
    time: formatTimeAgo(deal.updated_at),
    onClick: () => onDealClick(deal.id),
  }));

  // Build timeline items from notifications
  const notifItems = notifications.slice(0, 3).map((n) => ({
    id: n.id,
    icon: n.type === 'payment' ? CheckCircle
      : n.type === 'contract' ? FileText
      : AlertCircle,
    iconBg: n.read ? "bg-secondary" : "bg-primary/15",
    iconColor: n.read ? "text-muted-foreground" : "text-primary",
    title: n.title,
    time: formatTimeAgo(n.created_at),
    onClick: () => onNotificationClick(n),
  }));

  const allItems = [...dealItems, ...notifItems]
    .sort((a, b) => b.time.localeCompare(a.time)) // rough time sort
    .slice(0, 6);

  if (allItems.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-medium text-muted-foreground mb-4">Recent activity</p>
        <p className="text-xs text-muted-foreground text-center py-4">No recent activity yet</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="text-xs font-medium text-muted-foreground mb-1">Recent activity</p>
      <div className="divide-y divide-border">
        {allItems.map((item) => (
          <ActivityTimelineItem
            key={item.id}
            icon={item.icon}
            iconBg={item.iconBg}
            iconColor={item.iconColor}
            title={item.title}
            time={item.time}
            onClick={item.onClick}
          />
        ))}
      </div>
    </section>
  );
};

// ── Empty State ──────────────────────────────────────────────────────────

const EmptyState = ({ hasUrl, onAddInstagram, onShare }: {
  hasUrl: boolean;
  onAddInstagram: () => void;
  onShare: () => void;
}) => (
  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
      <AlertCircle className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="text-base font-medium text-foreground">No offers yet</p>
    <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
      {hasUrl
        ? 'Share your collab link on WhatsApp or in DMs. Brands will send offers here.'
        : 'Add your Instagram to get your collab link, then share it with brands.'}
    </p>
    <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
      {hasUrl ? (
        <Button onClick={onShare}>
          <MessageCircleMore className="h-4 w-4" /> Share link
        </Button>
      ) : (
        <Button onClick={onAddInstagram}>
          Add Instagram →
        </Button>
      )}
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const CreatorDashboard = () => {
  useEffect(() => {
    document.title = 'Creator Dashboard | Creator Armour';
  }, []);

  const navigate = useNavigate();
  const { profile, session, loading: sessionLoading } = useSession();
  const updateProfileMutation = useUpdateProfile();
  const [declineRequestId, setDeclineRequestId] = useState<string | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [copiedDm, setCopiedDm] = useState(false);
  const declineButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLButtonElement | null>(null);

  const creatorId = profile?.id || session?.user?.id;

  // ── Data fetching ─────────────────────────────────────────────────────

  const fetchPendingCollabRequestsPreview = useCallback(async (signal?: AbortSignal) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) return;
      const res = await fetch(`${getApiBaseUrl()}/api/collab-requests`, {
        headers: { Authorization: `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
        signal,
      });
      const data = res.ok ? await res.json().catch(() => ({ success: false, requests: [] })) : { success: false, requests: [] };
      const list = Array.isArray(data.requests) ? data.requests : [];
      const pending = list.filter((r: any) => ['pending', 'countered'].includes(String(r.status || '').toLowerCase()));
      return pending.slice(0, PREVIEW_ITEMS_LIMIT).map((r: any) => ({
        id: r.id, brand_name: r.brand_name || 'Brand', brand_email: r.brand_email,
        brand_verified: r.brand_verified, collab_type: r.collab_type,
        budget_range: r.budget_range ?? null, exact_budget: r.exact_budget ?? null,
        barter_value: r.barter_value ?? null, deadline: r.deadline ?? null,
        brand_logo: r.brand_logo || r.brand_logo_url || r.raw?.brand_logo || r.brand?.logo_url,
        created_at: r.created_at || '', raw: r as Record<string, unknown>,
      }));
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return [];
      return [];
    }
  }, []);

  const [collabRequestsPreview, setCollabRequestsPreview] = useState<CollabRequestPreview[]>([]);
  const [pendingCollabRequestsCount, setPendingCollabRequestsCount] = useState(0);
  const [totalOffersReceived, setTotalOffersReceived] = useState(0);
  const [storefrontViews, setStorefrontViews] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const result = await fetchPendingCollabRequestsPreview(controller.signal);
      if (!result) return;
      setCollabRequestsPreview(result as CollabRequestPreview[]);
      setPendingCollabRequestsCount((result as CollabRequestPreview[]).length);
    };
    void load();
    return () => controller.abort();
  }, [fetchPendingCollabRequestsPreview, session?.user?.id]);

  useEffect(() => {
    let cancelled = false;
    const fetchViews = async () => {
      if (!profile?.username) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sess = sessionData.session;
        if (!sess?.access_token) return;
        const res = await fetch(`${getApiBaseUrl()}/api/collab-analytics?days=${ANALYTICS_DAYS}`, {
          headers: { Authorization: `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.success && data?.analytics) {
          setStorefrontViews(Number(data.analytics.views?.total || 0));
        }
      } catch { /* ignore */ }
    };
    void fetchViews();
    return () => { cancelled = true; };
  }, [profile?.username, session?.user?.id]);

  const { data: brandDeals = [], isLoading: isLoadingDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId, enabled: !sessionLoading && !!creatorId,
  });
  const { notifications: creatorNotifications, markAsRead } = useNotifications({ enabled: !!creatorId, limit: 5, filter: { read: false } });

  // ── Computed ───────────────────────────────────────────────────────────

  const completedDealsCount = useMemo(() =>
    brandDeals.filter((d) => ['completed', 'fully_executed'].includes(String(d.status || '').toLowerCase()) || Boolean(d.payment_received_date)).length,
  [brandDeals]);

  const totalEarnings = useMemo(() =>
    brandDeals
      .filter((d) => ['completed', 'fully_executed'].includes(String(d.status || '').toLowerCase()) || Boolean(d.payment_received_date))
      .reduce((sum, d) => sum + (Number(d.deal_amount) || 0), 0),
  [brandDeals]);

  const collabHandle = useMemo(() => normalizeInstagramHandle(profile?.instagram_handle || profile?.username || ''), [profile?.instagram_handle, profile?.username]);
  const collabUrl = useMemo(() => collabHandle ? `${window.location.origin}/${collabHandle}` : '', [collabHandle]);
  const collabUrlShort = useMemo(() => collabUrl.replace(/^https?:\/\//, ''), [collabUrl]);

  const hasUrl = Boolean(collabUrlShort);

  const creatorStage = useMemo((): string => {
    if (completedDealsCount > 0) return 'completed';
    if (brandDeals.some(d => !['completed', 'fully_executed'].includes(String(d.status || '').toLowerCase()))) return 'active_deal';
    if (collabRequestsPreview.length > 0) return 'has_offer';
    if (profile?.link_shared_at) return 'link_shared';
    return 'new';
  }, [completedDealsCount, brandDeals, collabRequestsPreview.length, profile?.link_shared_at]);

  const activeDeals = useMemo(() =>
    brandDeals.filter(d => !['completed', 'fully_executed'].includes(String(d.status || '').toLowerCase()))
      .slice(0, DEAL_CARDS_LIMIT),
  [brandDeals]);

  const dealsNeedingAction = useMemo(() =>
    activeDeals.filter(d => ['contract_sent', 'revision_requested'].includes(String(d.status || '').toLowerCase())),
  [activeDeals]);

  const unreadNotifications = useMemo(() =>
    creatorNotifications.slice(0, 5),
  [creatorNotifications]);

  // ── Next step logic ────────────────────────────────────────────────────

  const nextStepData = useMemo<NextStepCardData>(() => {
    const openDeal = (id: string) => navigate(`/creator-deal/${id}`);
    const openOffer = (id: string) => navigate(`/collab-requests/${id}/brief`);
    const openPayment = (id: string) => navigate(`/payment/${id}`);
    const openDelivery = (id: string) => navigate(`/deal-delivery-details/${id}`);

    const paymentConfirm = brandDeals.find(d =>
      !d.payment_received_date && ['payment_pending', 'payment_released', 'payment_sent'].includes(String(d.status || '').toLowerCase())
    );
    if (paymentConfirm) return {
      state: 'payment_confirmation_needed',
      title: 'Confirm payment received',
      helper: 'The brand says they sent the money. Confirm when it hits your account.',
      primaryLabel: "I've been paid",
      primaryAction: () => openPayment(paymentConfirm.id),
      deal: paymentConfirm,
    };

    const revisionNeeded = brandDeals.find(d => String(d.brand_approval_status || '').toLowerCase() === 'changes_requested');
    if (revisionNeeded) return {
      state: 'revision_requested',
      title: 'Changes requested',
      helper: 'The brand has asked for some changes to your content.',
      primaryLabel: 'View deal',
      primaryAction: () => openDeal(revisionNeeded.id),
      deal: revisionNeeded,
    };

    const awaitingContent = brandDeals.find(d => {
      const s = String(d.status || '').toLowerCase();
      return !d.content_submitted_at && (s.includes('content') || s.includes('active') || s.includes('live'));
    });
    if (awaitingContent) return {
      state: 'content_upload_needed',
      title: 'Submit your content',
      helper: 'Share your post link for the brand to review.',
      primaryLabel: 'Open deal',
      primaryAction: () => openDeal(awaitingContent.id),
      deal: awaitingContent,
    };

    const needsAddress = brandDeals.find(d =>
      String(d.deal_type || '').toLowerCase() === 'barter' && String(d.status || '').toLowerCase() === 'drafting'
    );
    if (needsAddress) return {
      state: 'delivery_details_needed',
      title: 'Add your shipping address',
      helper: 'Add your address so the brand can send the product.',
      primaryLabel: 'Add address',
      primaryAction: () => openDelivery(needsAddress.id),
      deal: needsAddress,
    };

    const readyToStart = brandDeals.find(d => {
      const s = String(d.status || '').toLowerCase();
      return !d.content_submitted_at && (s.includes('signed') || s.includes('confirmed') || s.includes('executed'));
    });
    if (readyToStart) return {
      state: 'content_not_started',
      title: 'Deal confirmed — start making content',
      helper: 'Review the brief and start creating your content.',
      primaryLabel: 'Open deal',
      primaryAction: () => openDeal(readyToStart.id),
      deal: readyToStart,
    };

    const firstOffer = collabRequestsPreview[0];
    if (firstOffer) return {
      state: 'offer_received',
      title: 'You have a new offer',
      helper: 'Review the brief and decide if you want to accept, counter, or decline.',
      primaryLabel: 'Review offer',
      primaryAction: () => openOffer(firstOffer.id),
      request: firstOffer,
    };

    if (activeDeals.length > 0) return {
      state: 'no_deals',
      title: 'Track your active deal',
      helper: 'Your deal is in progress. Keep an eye on the timeline below.',
    };

    return {
      state: 'no_deals',
      title: 'Share your link',
      helper: hasUrl
        ? 'Send your collab link to brands. Their offers will appear here.'
        : 'Add your Instagram to get your collab link.',
    };
  }, [brandDeals, collabRequestsPreview, navigate, hasUrl, activeDeals.length]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const copyText = useCallback(async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const handleShareWhatsApp = useCallback(async () => {
    if (!collabUrl || !profile?.id) return;
    const creatorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
    const message = buildCreatorDmMessage({ creatorName, collabUrl });
    window.open(buildWhatsAppShareUrl(message), '_blank', 'noopener,noreferrer');
    if (!profile.link_shared_at) {
      await updateProfileMutation.mutateAsync({ id: profile.id, link_shared_at: new Date().toISOString() }).catch(() => undefined);
    }
    void trackEvent('collab_link_shared', { creator_id: profile.id, mode: 'whatsapp' });
  }, [collabUrl, profile, updateProfileMutation]);

  const handleDeclineClick = useCallback((requestId: string, buttonRef: HTMLButtonElement) => {
    lastFocusedElementRef.current = buttonRef;
    setDeclineRequestId(requestId);
    setShowDeclineDialog(true);
  }, []);

  const handleDeclineConfirm = useCallback(async () => {
    if (!declineRequestId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) { toast.error('Please log in'); return; }
      const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${declineRequestId}/decline`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || 'Failed to decline'); return; }
      toast.success('Request declined');
      const updated = await fetchPendingCollabRequestsPreview();
      if (updated) setCollabRequestsPreview(updated as CollabRequestPreview[]);
    } catch { toast.error('Failed to decline'); }
    finally { setShowDeclineDialog(false); setDeclineRequestId(null); lastFocusedElementRef.current?.focus(); }
  }, [declineRequestId, fetchPendingCollabRequestsPreview]);

  const handleDealOpen = useCallback((dealId: string) => navigate(`/creator-deal/${dealId}`), [navigate]);
  const handleNotificationOpen = useCallback((n: Notification) => {
    markAsRead(n.id);
    if (n.action_link || n.link) navigate(n.action_link || n.link || '/notifications');
  }, [markAsRead, navigate]);

  // ── Profile sync ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!profile?.id || updateProfileMutation.isPending) return;
    const patch = getCreatorProgressPatch(profile, {
      offersReceived: totalOffersReceived, offersAccepted: brandDeals.length,
      totalDeals: brandDeals.length, completedDeals: completedDealsCount,
      totalEarnings, storefrontViews,
    });
    const hasDiff = (profile.creator_stage ?? 'new') !== (patch.creator_stage ?? 'new') ||
      Number(profile.profile_completion || 0) !== patch.profile_completion;
    if (!hasDiff) return;
    void updateProfileMutation.mutateAsync({
      id: profile.id, creator_stage: patch.creator_stage, profile_completion: patch.profile_completion,
    }).catch(() => undefined);
  }, [profile, totalOffersReceived, brandDeals.length, completedDealsCount, totalEarnings, storefrontViews, updateProfileMutation]);

  useEffect(() => {
    if (showDeclineDialog && declineButtonRef.current) declineButtonRef.current.focus();
  }, [showDeclineDialog]);

  // ── Loading ────────────────────────────────────────────────────────────

  if ((sessionLoading && !session) || (isLoadingDeals && !!creatorId && !brandDealsError)) {
    return <DashboardSkeleton />;
  }

  if (brandDealsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Unable to load deals</h2>
          <p className="text-sm text-muted-foreground mb-5">Check your connection and try again.</p>
          <Button onClick={() => void refetchBrandDeals()}>
            <Loader2 className="h-4 w-4 animate-spin" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  const showOffers = collabRequestsPreview.length > 0;
  const showEarnings = totalEarnings > 0 || completedDealsCount > 0 || activeDeals.length > 0;
  const showTimeline = activeDeals.length > 0 || unreadNotifications.length > 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">

          {/* Welcome */}
          <WelcomeHeader
            firstName={profile?.first_name}
            stage={creatorStage}
            totalEarnings={totalEarnings}
            completedDealsCount={completedDealsCount}
            hasUrl={hasUrl}
          />

          {/* Section 1: Your Link — always visible */}
          <div className="mb-6">
            <CollabLinkCard
              collabUrlShort={collabUrlShort}
              collabUrl={collabUrl}
              storefrontViews={storefrontViews}
              hasUrl={hasUrl}
              profileCompletion={profile?.profile_completion ?? 0}
              onCopy={() => void copyText(collabUrl, 'Link copied')}
              onShareWhatsApp={handleShareWhatsApp}
              onPreview={() => window.open(`${collabUrl}?preview=1`, '_blank')}
              onAddInstagram={() => navigate('/creator-profile?section=profile')}
              onCompleteProfile={() => navigate('/creator-profile?section=profile')}
            />
          </div>

          {/* Section 2: Next Step — always visible, adapts to state */}
          <div className="mb-6">
            <NextStepCard data={nextStepData} />
          </div>

          {/* Section 3: Offers — when pending */}
          {showOffers && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-foreground mb-3">
                Pending offers ({collabRequestsPreview.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {collabRequestsPreview.map((request) => (
                  <OfferCard
                    key={request.id}
                    request={request}
                    onReview={() => navigate(`/collab-requests/${request.id}/brief`, { state: { request } })}
                    onDecline={() => {
                      const btn = document.activeElement as HTMLButtonElement;
                      handleDeclineClick(request.id, btn);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Deals — when active */}
          {activeDeals.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground">
                  Active deals ({activeDeals.length})
                </h2>
                <button
                  onClick={() => navigate('/creator-contracts')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  See all →
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onOpen={() => handleDealOpen(deal.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Empty state — when nothing exists */}
          {!showOffers && activeDeals.length === 0 && (
            <div className="mb-6">
              <EmptyState
                hasUrl={hasUrl}
                onAddInstagram={() => navigate('/creator-profile?section=profile')}
                onShare={handleShareWhatsApp}
              />
            </div>
          )}

          {/* Section 6: Earnings — when deals exist */}
          {showEarnings && (
            <div className="mb-6">
              <EarningsSummary
                totalEarnings={totalEarnings}
                completedDealsCount={completedDealsCount}
                activeDealsCount={activeDeals.length}
                pendingOffersCount={collabRequestsPreview.length}
              />
            </div>
          )}

          {/* Section 7: Activity Timeline */}
          {showTimeline && (
            <div className="mb-6">
              <ActivityTimeline
                deals={activeDeals}
                notifications={unreadNotifications}
                onDealClick={handleDealOpen}
                onNotificationClick={handleNotificationOpen}
              />
            </div>
          )}

          {/* Bottom spacer for sticky CTA on mobile */}
          <div className="h-24 md:hidden" />
        </main>

        {/* Sticky CTA — mobile only, when new user */}
        {(creatorStage === 'new' || creatorStage === 'link_shared') && hasUrl && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent md:hidden">
            <div className="flex gap-2 max-w-lg mx-auto">
              <Button
                className="flex-1"
                onClick={handleShareWhatsApp}
              >
                <MessageCircleMore className="h-4 w-4" /> Share on WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => void copyText(collabUrl, 'Link copied')}
              >
                <Copy className="h-4 w-4" /> Copy link
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Decline Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card border-border text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              ref={declineButtonRef}
              onClick={handleDeclineConfirm}
              className="bg-destructive hover:bg-destructive text-foreground"
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

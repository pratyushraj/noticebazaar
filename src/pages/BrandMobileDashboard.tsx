import { useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Bell, Briefcase, Camera, Check, Clock, ChevronRight, CreditCard, FileText, Handshake, Landmark, LayoutDashboard, Loader2, Lock, Mail, Menu, Moon, MoreHorizontal, Plus, RefreshCw, Search, Send, Settings, Shield, ShieldCheck, Sparkles, Sun, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { buttons as dsButtons } from '@/lib/design-system';
import { dealPrimaryCtaButtonClass, getDealPrimaryCta } from '@/lib/deals/primaryCta';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';
import { BrandSettingsPanel } from '@/pages/BrandSettings';
import { toast } from 'sonner';

type BrandTab = 'dashboard' | 'collabs' | 'creators' | 'profile';
type BrandCollabTab = 'action_required' | 'active' | 'completed';

import type { Profile, BrandDeal } from '@/types';

type BrandDashboardStats = {
  totalSent: number;
  needsAction: number;
  activeDeals: number;
  totalInvestment: number;
};

type BrandMobileDashboardProps = {
  profile?: Profile;
  requests?: BrandDeal[];
  deals?: BrandDeal[];
  stats?: BrandDashboardStats;
  initialTab?: BrandTab;
  isLoading?: boolean;
  isDemoBrand?: boolean;
  onRefresh?: () => Promise<void>;
  onLogout?: () => void | Promise<void>;
};

const formatCompactINR = (n: number | string | null | undefined) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
};

const formatCompactCount = (n: number | string | null | undefined) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return safe.toLocaleString('en-IN');
};

const formatFollowers = (n: number | string | null | undefined) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num >= 1_00_00_000) return `${(num / 1_00_00_000).toFixed(1)}Cr`.replace('.0', '') + ' followers';
  if (num >= 1_00_000) return `${(num / 1_00_000).toFixed(1)}L`.replace('.0', '') + ' followers';
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`.replace('.0', '') + ' followers';
  return `${num} followers`;
};

const timeSince = (iso: string | Date | null | undefined) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(0, Math.round(diffMs / (1000 * 60)));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
};

const hoursSince = (iso: string | Date | null | undefined) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const hrs = diffMs / (1000 * 60 * 60);
  if (!Number.isFinite(hrs) || hrs < 0) return null;
  return hrs;
};

const safeImageSrc = (url: string | null | undefined) => {
  const s = typeof url === 'string' ? url : '';
  if (!s) return undefined;
  if (s.includes('cdninstagram.com')) return undefined;
  return s;
};

const uniqBy = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
};

const uniqById = <T extends { id?: string | number }>(items: T[]) => {
  // Preserve first occurrence, avoid duplicated cards when backend returns duplicates.
  const withId = items.filter((x) => String(x?.id || '').trim());
  const withoutId = items.filter((x) => !String(x?.id || '').trim());
  return [...uniqBy(withId, (x) => String(x.id)), ...withoutId];
};

const dealFingerprint = (row: BrandDeal | null | undefined) => {
  // Prefer contract identifiers; fall back to a conservative composite.
  const signedKey = row?.signed_contract_path || row?.signed_contract_url || row?.signed_pdf_url || null;
  if (signedKey) return `signed:${String(signedKey)}`;
  const contractKey = row?.safe_contract_url || row?.contract_file_url || null;
  if (contractKey) return `contract:${String(contractKey)}`;
  const creator = String(row?.creator_id || row?.profiles?.id || '');
  const amount = String(row?.deal_amount || row?.exact_budget || '');
  const due = String(row?.due_date || row?.deadline || '');
  const deliverables = String(formatDeliverables(row) || row?.deliverables || row?.collab_type || '').toLowerCase();
  // Important: do NOT include created_at here. Some environments duplicate the same deal with different ids/timestamps.
  // This fallback is intentionally aggressive and only used when there is no contract identifier.
  return `fallback:${creator}:${amount}:${due}:${deliverables}`;
};

const uniqDeals = (rows: BrandDeal[]) => {
  // If the backend contains duplicated deals with different ids but same contract, collapse them.
  return uniqById(uniqBy(rows, (r) => dealFingerprint(r)));
};

const startOfLocalMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const sameLocalMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const normalizeStatus = (status: string | null | undefined) => String(status || '').trim().toLowerCase();

const firstNameish = (profile: Profile | null | undefined) => {
  const label = profile?.business_name || profile?.first_name || profile?.username || 'Creator';
  return String(label || 'Creator').trim() || 'Creator';
};

type SuggestedCreator = {
  id: string;
  username?: string | null;
  name: string;
  category?: string | null;
  bio?: string | null;
  profile_photo?: string | null;
  followers?: number | null;
  pricing?: {
    min?: number | null;
    avg?: number | null;
    max?: number | null;
    reel?: number | null;
  } | null;
  trust?: {
    completed_deals?: number;
    total_deals?: number;
    completion_rate?: number;
    avg_response_hours?: number | null;
  } | null;
};

function formatDeliverables(row: BrandDeal | null | undefined) {
  const d = row?.deliverables;
  if (!d) return '';
  const uniq = (parts: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const clean = String(p || '').trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
    return out;
  };
  if (typeof d === 'string') {
    const parts = uniq(
      d
        .split(/[,•\n]+/g)
        .map((x) => x.trim())
        .filter(Boolean)
    );
    // If it doesn't look like a list, keep the raw string.
    if (parts.length <= 1) return d.trim();
    return parts.slice(0, 3).join(' • ');
  }
  if (Array.isArray(d)) {
    const parts = uniq(
      d
        .map((x: any) => {
          if (!x) return null;
          if (typeof x === 'string') return x.trim();
          const label = x?.type || x?.name || x?.deliverable;
          const qty = x?.qty || x?.count || x?.quantity;
          if (label && qty) return `${qty} ${label}`;
          if (label) return String(label);
          return null;
        })
        .filter(Boolean)
    );
    return parts.slice(0, 3).join(' • ');
  }
  try {
    const asJson = JSON.stringify(d);
    return asJson.length > 5 ? asJson : '';
  } catch {
    return '';
  }
}

const formatBudget = (row: BrandDeal | null | undefined) => {
  const exact = Number(row?.exact_budget);
  if (Number.isFinite(exact) && exact > 0) return formatCompactINR(exact);
  const dealAmount = Number(row?.deal_amount);
  if (Number.isFinite(dealAmount) && dealAmount > 0) return formatCompactINR(dealAmount);
  const range = String(row?.budget_range || '').trim();
  if (range) return range;
  const barter = Number(row?.barter_value);
  if (Number.isFinite(barter) && barter > 0) return `${formatCompactINR(barter)} barter`;
  return '';
};

const effectiveDealStatus = (row: BrandDeal | null | undefined) => {
  const raw = String(row?.status || '').trim();
  const lower = raw.toLowerCase();
  const upper = raw.toUpperCase();

  // If the stored status is already in a later stage (content/payment/completion),
  // prefer that over signature-derived "fully executed". Signatures indicate the
  // contract is binding, but the deal lifecycle continues beyond signing.
  if (lower.includes('dispute') || lower.includes('disputed')) return 'DISPUTED';
  if (lower.includes('content_making') || lower.includes('content making')) return 'CONTENT_MAKING';
  if (
    lower.includes('content_delivered') ||
    lower.includes('content delivered') ||
    lower.includes('awaiting_review') ||
    lower.includes('waiting_for_review') ||
    lower.includes('waiting for review')
  ) {
    return 'CONTENT_DELIVERED';
  }
  if (lower.includes('revision_requested') || lower.includes('revision requested') || lower.includes('changes_requested') || lower.includes('changes requested')) return 'REVISION_REQUESTED';
  if (lower.includes('revision_done') || lower.includes('revision done') || lower.includes('revision_submitted') || lower.includes('revision submitted')) return 'REVISION_DONE';
  if (lower.includes('content_approved') || lower.includes('content approved') || lower.includes('approved')) return 'CONTENT_APPROVED';
  if (lower.includes('payment_released') || lower.includes('payment released')) return 'PAYMENT_RELEASED';
  if (lower === 'completed' || lower.includes('completed')) return 'COMPLETED';

  // Prefer signature signals over the raw status when present.
  const signatureSources = [
    row,
    row?.raw,
    row?.contract,
    row?.contract_data,
    row?.contract_metadata,
    row?.esign,
    row?.signature,
    row?.signatures,
  ].filter((x) => x && typeof x === 'object');

  const hasTruthyKeyMatch = (sources: any[], pattern: RegExp) => {
    for (const src of sources) {
      for (const key of Object.keys(src)) {
        if (!pattern.test(key)) continue;
        const v = (src as any)[key];
        if (v === true) return true;
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) return true;
        if (typeof v === 'string' && v.trim().length > 0) return true;
        if (v instanceof Date && !Number.isNaN(v.getTime())) return true;
      }
    }
    return false;
  };

  // Note: backend may attach `brand_signed_at` / `creator_signed_at` fields (e.g. derived from `contract_signatures`).
  // Include those here so already-signed deals never show "Signature required" incorrectly.
  const creatorSigned = hasTruthyKeyMatch(
    signatureSources,
    /(creator.*signed|signed.*creator|creator_signature|creator_esign|creator_signed_at|creatorSignedAt)/i
  );
  const brandSigned = hasTruthyKeyMatch(
    signatureSources,
    /(brand.*signed|signed.*brand|brand_signature|brand_esign|brand_signed_at|brandSignedAt)/i
  );
  if (creatorSigned && brandSigned) return 'FULLY_EXECUTED';
  if (creatorSigned && !brandSigned) return 'AWAITING_BRAND_SIGNATURE';
  if (brandSigned && !creatorSigned) return 'AWAITING_CREATOR_SIGNATURE';

  const contractState = String(row?.contract_status || row?.contractStatus || row?.contract_state || row?.contractState || '').trim().toLowerCase();
  const signingState = String(row?.contract_signing_status || row?.signing_status || row?.signature_status || '').trim().toLowerCase();
  const esign = String(row?.esign_status || '').trim().toLowerCase();

  const resolveFromText = (text: string) => {
    if (!text) return null;
    const t = text.toLowerCase();
    const hasSigned = t.includes('signed') || t.includes('sign');
    if (t.includes('fully_executed') || t.includes('fully executed') || t.includes('fully-signed') || t.includes('fully_signed') || t.includes('executed')) {
      return 'FULLY_EXECUTED' as const;
    }
    if (t === 'signed') return 'FULLY_EXECUTED' as const;
    if (!hasSigned) return null;

    const brandToken = t.includes('brand') || t.includes('client');
    const creatorToken = t.includes('creator') || t.includes('influencer') || t.includes('talent');

    if (brandToken && creatorToken) return 'FULLY_EXECUTED' as const;
    if (brandToken && !creatorToken) return 'AWAITING_CREATOR_SIGNATURE' as const;
    if (creatorToken && !brandToken) return 'AWAITING_BRAND_SIGNATURE' as const;
    return null;
  };

  const resolvedText = resolveFromText(contractState) || resolveFromText(signingState) || resolveFromText(esign);
  if (resolvedText) return resolvedText;

  const exec = String(row?.deal_execution_status || '').trim().toLowerCase();
  if (exec === 'signed' || exec === 'completed') return 'FULLY_EXECUTED';

  const contractUrl = String(row?.safe_contract_url || row?.signed_contract_url || row?.contract_file_url || '').toLowerCase();
  const hasSignedContract = Boolean(
    row?.signed_contract_url ||
    row?.signed_contract_path ||
    row?.signed_pdf_url ||
    row?.signed_at ||
    row?.contract_signed_at ||
    row?.executed_contract_url ||
    row?.fully_executed_contract_url ||
    row?.final_contract_url ||
    row?.executed_at ||
    row?.fully_executed_at ||
    esign === 'signed' ||
    // Heuristic for older schemas: signed contracts often include these tokens in the storage path / filename.
    contractUrl.includes('signed-contract') ||
    contractUrl.includes('signed-contracts')
  );
  if (hasSignedContract) return 'FULLY_EXECUTED';

  if (lower === 'fully_executed' || lower === 'executed' || lower.includes('fully_executed')) return 'FULLY_EXECUTED';
  if (lower === 'live' || lower.includes('live_deal') || lower.includes('legally active') || lower.includes('live')) return 'FULLY_EXECUTED';

  if (lower === 'signed_by_brand' || lower.includes('signed_by_brand')) return 'AWAITING_CREATOR_SIGNATURE';
  if (lower === 'signed_by_creator' || lower.includes('signed_by_creator')) return 'AWAITING_BRAND_SIGNATURE';

  // Some environments still use drafting/shipment-ish states for the contract step.
  if (lower === 'drafting' || lower.includes('shipment') || lower.includes('transit') || lower.includes('received')) return 'CONTRACT_READY';

  // Default to the raw enum-like value.
  return upper;
};

const collectSignatureHints = (row: BrandDeal | null | undefined) => {
  const sources = [
    row,
    row?.raw,
    row?.contract,
    row?.contract_data,
    row?.contract_metadata,
    row?.esign,
    row?.signature,
    row?.signatures,
  ].filter((x) => x && typeof x === 'object');

  const truthyKeys = (pattern: RegExp) => {
    const keys: string[] = [];
    for (const src of sources) {
      for (const key of Object.keys(src)) {
        if (!pattern.test(key)) continue;
        const v = (src as any)[key];
        const truthy =
          v === true ||
          (typeof v === 'number' && Number.isFinite(v) && v > 0) ||
          (typeof v === 'string' && v.trim().length > 0) ||
          (v instanceof Date && !Number.isNaN(v.getTime()));
        if (truthy) keys.push(key);
      }
    }
    return Array.from(new Set(keys)).slice(0, 6);
  };

  return {
    brand: truthyKeys(/(brand.*signed|signed.*brand|brand_signature|brand_esign|brand_signed_at)/i),
    creator: truthyKeys(/(creator.*signed|signed.*creator|creator_signature|creator_esign|creator_signed_at)/i),
  };
};

const dealStageLabel = (row: BrandDeal | null | undefined) => {
  const s = effectiveDealStatus(row);
  if (!s) return 'In progress';
  if (s === 'DISPUTED') return 'Issue raised';
  if (s === 'CONTRACT_READY' || s === 'AWAITING_BRAND_SIGNATURE') return 'Signature required';
  if (s === 'SENT' || s === 'AWAITING_CREATOR_SIGNATURE') return 'Waiting for creator signature';
  if (s === 'FULLY_EXECUTED') return 'Collaboration started';
  if (s === 'CONTENT_MAKING') return 'Creator working';
  if (s === 'REVISION_REQUESTED') return 'Waiting for revision';
  if (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE') return 'Content ready for review';
  if (s === 'COMPLETED') return 'Completed';
  return 'In progress';
};

const deadlineLabel = (row: BrandDeal | null | undefined) => {
  const raw = row?.due_date || row?.deadline;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', tone: 'danger' as const };
  if (diffDays === 0) return { text: 'Due today', tone: 'danger' as const };
  const dayText = diffDays === 1 ? 'day' : 'days';
  if (diffDays <= 2) return { text: `Due in ${diffDays} ${dayText}`, tone: 'danger' as const };
  if (diffDays <= 7) return { text: `Due in ${diffDays} ${dayText}`, tone: 'warn' as const };
  return { text: `Due in ${diffDays} ${dayText}`, tone: 'neutral' as const };
};

const offerExpiryLabel = (row: BrandDeal | null | undefined) => {
  const raw = row?.offer_expires_at || row?.expires_at || null;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return { text: 'Offer expired', tone: 'danger' as const };
  if (diffDays === 0) return { text: 'Expires today', tone: 'danger' as const };
  if (diffDays <= 2) return { text: `Expires in ${diffDays}d`, tone: 'danger' as const };
  if (diffDays <= 7) return { text: `Expires in ${diffDays}d`, tone: 'warn' as const };
  return { text: `Expires in ${diffDays}d`, tone: 'neutral' as const };
};

const brandDealCardUi = (row: BrandDeal | null | undefined) => {
  const s = effectiveDealStatus(row);
  const human = dealStageLabel({ status: s });
  const stageBadge =
    s === 'DISPUTED' ? 'ISSUE'
      : (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE') ? 'REVIEW'
        : s === 'CONTENT_MAKING' ? 'CREATE'
          : s === 'FULLY_EXECUTED' ? 'SIGNED'
            : 'CONTRACT';

  const primaryCta = getDealPrimaryCta({ role: 'brand', deal: row });
  const needsAction = primaryCta.tone === 'action' && !primaryCta.disabled;
  const primaryActionLabel = primaryCta.label;

  const statusLine =
    s === 'DISPUTED'
      ? 'Issue raised — view details'
      : s === 'COMPLETED'
        ? 'Deal completed'
        : (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE')
          ? 'Content ready — review and approve'
          : s === 'REVISION_REQUESTED'
            ? 'Waiting for creator revision'
            : s === 'CONTENT_MAKING'
              ? 'Creator working on deliverables'
              : s === 'FULLY_EXECUTED'
                ? 'Contract signed — creator can start work'
                : s === 'AWAITING_CREATOR_SIGNATURE' || s === 'SENT'
                  ? 'Waiting for creator to sign'
                  : 'Signature required to start';

  const step =
    s === 'COMPLETED' ? 5
      : (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE' || s === 'DISPUTED') ? 4
        : (s === 'CONTENT_MAKING' || s === 'REVISION_REQUESTED') ? 3
          : s === 'FULLY_EXECUTED' ? 2
            : 1;

  return { status: s, human, stageBadge, needsAction, primaryActionLabel, statusLine, step, ctaTone: primaryCta.tone, ctaDisabled: primaryCta.disabled };
};

const BrandMobileDashboard = ({
  profile,
  requests = [],
  deals = [],
  stats,
  initialTab = 'dashboard',
  isLoading = false,
  onRefresh,
  onLogout,
  isDemoBrand = false,
	}: BrandMobileDashboardProps) => {
	  const navigate = useNavigate();
	  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const subtabParam = searchParams.get('subtab');
  const highlightedDealId = searchParams.get('dealId');
  const highlightedRequestId = searchParams.get('requestId');
  const activeTab: BrandTab =
    tabParam === 'dashboard' || tabParam === 'collabs' || tabParam === 'creators' || tabParam === 'profile'
      ? tabParam
      : initialTab;
	  const activeCollabTab: BrandCollabTab = (() => {
	    const raw = String(subtabParam || '').trim().toLowerCase();
	    if (raw === 'pending' || raw === 'action_required' || raw === 'action-required' || raw === 'action') return 'action_required';
	    if (raw === 'active') return 'active';
	    if (raw === 'completed') return 'completed';
	    return 'action_required';
	  })();

	  const showSignatureDebug = useMemo(() => {
	    if (typeof window === 'undefined') return false;
	    const params = new URLSearchParams(window.location.search);
	    return params.get('debugSig') === '1';
	  }, []);

	  const setActiveTab = (tab: BrandTab, subtab?: BrandCollabTab) => {
	    const next = new URLSearchParams(searchParams);
	    next.set('tab', tab);
	    if (tab === 'collabs') {
      next.set('subtab', subtab || activeCollabTab || 'action_required');
    } else {
      next.delete('subtab');
    }
    setSearchParams(next, { replace: true });
  };

  const setDashboardCollabTab = (subtab: BrandCollabTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('subtab', subtab);
    setSearchParams(next, { replace: true });
  };
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      triggerHaptic(HapticPatterns.light);
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('light');
    };
  }, [theme]);

	  const isDark = theme === 'dark';
	  const textColor = isDark ? 'text-foreground' : 'text-muted-foreground';
	  const secondaryTextColor = isDark ? 'text-foreground/50' : 'text-muted-foreground';
	  // Match Creator dashboard light-mode tokens (MobileDashboardDemo): neutral base + iOS-like borders.
	  const bgColor = isDark ? 'bg-[#061318]' : 'bg-[#F9FAFB]';
	  const borderColor = isDark ? 'border-border' : 'border-[#E5E5EA]';
	  const cardBgColor = isDark
	    ? 'bg-secondary/6 backdrop-blur-xl'
	    : 'bg-card';

  const primaryButtonClass = cn('flex-1', dsButtons.ecosystemPrimary, 'h-10 text-[12px] disabled:opacity-50');
  const secondaryButtonClass = cn('h-10 px-4 text-[12px]', isDark ? dsButtons.ecosystemSecondaryDark : dsButtons.ecosystemSecondaryLight);

  useEffect(() => {
    // Sync activeTab with URL param on mount and whenever URL tab changes
    if (tabParam) {
      setActiveTab(tabParam as BrandTab, tabParam === 'collabs' ? activeCollabTab : undefined);
    } else {
      setActiveTab(initialTab, initialTab === 'collabs' ? activeCollabTab : undefined);
    }
  }, [tabParam]);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState<number | null>(null);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [selectedDealPage, setSelectedDealPage] = useState<any | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [isOpeningContract, setIsOpeningContract] = useState(false);
  const [brandLogoDbUrl, setBrandLogoDbUrl] = useState<string | null>(null);
  const [showBrandSigningModal, setShowBrandSigningModal] = useState(false);
  const [brandSigningDeal, setBrandSigningDeal] = useState<any | null>(null);
  const [brandSigningToken, setBrandSigningToken] = useState<string | null>(null);
  const [brandSigningEmail, setBrandSigningEmail] = useState('');
  const [brandSigningStep, setBrandSigningStep] = useState<'send' | 'verify'>('send');
  const [brandSigningOtp, setBrandSigningOtp] = useState('');
  const [isSendingBrandOTP, setIsSendingBrandOTP] = useState(false);
  const [isVerifyingBrandOTP, setIsVerifyingBrandOTP] = useState(false);
  const [isSigningBrandContract, setIsSigningBrandContract] = useState(false);
  const [brandSigningInitError, setBrandSigningInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('brandMonthlyBudgetInr');
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed) && parsed > 0) {
        setMonthlyBudgetInr(parsed);
        setBudgetDraft(String(Math.round(parsed)));
      }
    } catch {
      // ignore
    }
  }, []);

  // When the parent refreshes `deals`, re-hydrate any "detail view" state objects so
  // status/signature UI updates immediately after actions like signing.
  useEffect(() => {
    if (!Array.isArray(deals) || deals.length === 0) return;

    const findDeal = (id: any) => {
      const needle = String(id || '');
      if (!needle) return null;
      return deals.find((d: any) => String(d?.id || '') === needle) || null;
    };

    if (selectedOffer?.id) {
      const updated = findDeal(selectedOffer.id);
      if (updated && updated !== selectedOffer) setSelectedOffer(updated);
    }
    if (selectedDealPage?.id) {
      const updated = findDeal(selectedDealPage.id);
      if (updated && updated !== selectedDealPage) setSelectedDealPage(updated);
    }
  }, [deals, selectedOffer?.id, selectedDealPage?.id]);

		  const brandName = useMemo(() => {
		    const name = profile?.business_name || profile?.first_name || profile?.full_name || 'Brand';
		    return String(name || 'Brand').trim() || 'Brand';
		  }, [profile, isDemoBrand]);

  const startBrandSigningFlow = async (deal: any) => {
    if (!deal?.id) {
      toast.error('Deal details unavailable');
      return;
    }
    console.log('[BrandMobileDashboard] startBrandSigningFlow', { dealId: deal.id });
    toast.message('Opening signing…');
    setBrandSigningDeal(deal);
    setBrandSigningToken(null);
    setBrandSigningInitError(null);
    setBrandSigningOtp('');
    setBrandSigningStep('send');
    setShowBrandSigningModal(true);
  };

  useEffect(() => {
    if (!showBrandSigningModal || !brandSigningDeal?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setBrandSigningInitError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const email = session?.user?.email || profile?.email || brandSigningDeal?.brand_email || '';
        if (!cancelled) setBrandSigningEmail(String(email || ''));
        if (!accessToken) {
          if (!cancelled) setBrandSigningInitError('Authentication required. Please log in again.');
          return;
        }

        const apiBase = getApiBaseUrl();
        const resp = await fetch(`${apiBase}/api/deals/${brandSigningDeal.id}/contract-review-link`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.success || !data?.token) {
          throw new Error(data?.error || 'Failed to initialize signing');
        }
        if (!cancelled) setBrandSigningToken(String(data.token));
      } catch (e: any) {
        if (!cancelled) setBrandSigningInitError(e?.message || 'Failed to initialize signing');
      }
	    })();
	    return () => {
	      cancelled = true;
	    };
  }, [showBrandSigningModal, brandSigningDeal?.id, profile?.email]);

  const handleSendBrandOTP = async () => {
    try {
      const email = String(brandSigningEmail || '').trim();
      if (!brandSigningToken) {
        toast.error('Signing token not ready yet');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Enter a valid email address');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      setIsSendingBrandOTP(true);
      const apiBase = getApiBaseUrl();
      const resp = await fetch(`${apiBase}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: brandSigningToken, email }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) throw new Error(data?.error || 'Failed to send OTP');
      toast.success('OTP sent to your email');
      setBrandSigningStep('verify');
      triggerHaptic(HapticPatterns.success);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send OTP');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSendingBrandOTP(false);
    }
  };

  const handleVerifyAndSignBrand = async () => {
    try {
      const otp = String(brandSigningOtp || '').replace(/\D/g, '');
      if (!brandSigningToken) {
        toast.error('Signing token not ready yet');
        return;
      }
      if (otp.length !== 6) {
        toast.error('Enter the 6-digit OTP');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      setIsVerifyingBrandOTP(true);
      const apiBase = getApiBaseUrl();
      const verifyResp = await fetch(`${apiBase}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: brandSigningToken, otp }),
      });
      const verifyData = await verifyResp.json().catch(() => ({}));
      if (!verifyResp.ok || !verifyData?.success) throw new Error(verifyData?.error || 'OTP verification failed');

      setIsSigningBrandContract(true);
      const signerEmail = String(brandSigningEmail || '').trim();
      const signedAt = new Date().toISOString();
      const signPayload = {
        signerName: brandName || 'Brand',
        signerEmail,
        signerPhone: profile?.phone || null,
        contractVersionId: brandSigningDeal?.contract_version || 'v3',
        contractSnapshotHtml: brandSigningDeal?.contract_file_url
          ? `Contract URL: ${brandSigningDeal.contract_file_url}\nSigned at: ${signedAt}`
          : undefined,
        otpVerified: true,
        otpVerifiedAt: signedAt,
      };
      const signResp = await fetch(`${apiBase}/api/contract-ready-tokens/${brandSigningToken}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(signPayload),
      });
      const signData = await signResp.json().catch(() => ({}));
      if (!signResp.ok || !signData?.success) throw new Error(signData?.error || 'Failed to sign contract');

      toast.success('Contract signed');
      triggerHaptic(HapticPatterns.success);
      setShowBrandSigningModal(false);
      setBrandSigningDeal(null);
      setBrandSigningToken(null);
      await onRefresh?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sign');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsVerifyingBrandOTP(false);
      setIsSigningBrandContract(false);
    }
  };

  const closeBrandSigningModal = () => {
    setShowBrandSigningModal(false);
    setBrandSigningDeal(null);
    setBrandSigningToken(null);
    setBrandSigningInitError(null);
    setBrandSigningStep('send');
    setBrandSigningOtp('');
    setIsSendingBrandOTP(false);
    setIsVerifyingBrandOTP(false);
    setIsSigningBrandContract(false);
  };

  useEffect(() => {
    if (!showBrandSigningModal) return;
    // Reset step state when the modal opens.
    setBrandSigningInitError(null);
    setBrandSigningStep('send');
    setBrandSigningOtp('');
    setIsSendingBrandOTP(false);
    setIsVerifyingBrandOTP(false);
    setIsSigningBrandContract(false);

    // Debug: confirm portal nodes exist. If they don't, rendering is being blocked/unmounted.
    setTimeout(() => {
      try {
        const overlay = document.querySelector('[data-brand-signing-overlay]');
        const panel = document.querySelector('[data-brand-signing-panel]');
        console.log('[BrandMobileDashboard] signing modal DOM', {
          overlay: !!overlay,
          panel: !!panel,
        });
      } catch (e) {
        console.warn('[BrandMobileDashboard] signing modal DOM check failed', e);
      }
    }, 0);
  }, [showBrandSigningModal]);

	  useEffect(() => {
	    if (!profile?.id) return;
	    let cancelled = false;

	    (async () => {
	      try {
	        const { data: { session } } = await supabase.auth.getSession();
	        const token = session?.access_token;
	        if (!token) return;

	        const apiBase = getApiBaseUrl();
	        const res = await fetch(`${apiBase}/api/brand-dashboard/profile`, {
	          headers: { Authorization: `Bearer ${token}` },
	        });
	        const json = await res.json().catch(() => ({}));
	        if (cancelled) return;
	        if (res.ok && json?.success) setBrandLogoDbUrl(json?.brand?.logo_url || null);
	      } catch {
	        // ignore
	      }
	    })();

	    return () => { cancelled = true; };
	  }, [profile?.id]);

  const brandLogo = useMemo(() => {
    const src = profile?.avatar_url || profile?.logo_url || brandLogoDbUrl;
    if (src) return src;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=10B981&color=fff`;
  }, [profile?.avatar_url, profile?.logo_url, brandLogoDbUrl, brandName]);

  const hasUploadedBrandLogo = useMemo(() => {
    return !!(profile?.avatar_url || profile?.logo_url || brandLogoDbUrl);
  }, [profile?.avatar_url, profile?.logo_url, brandLogoDbUrl]);

	  const openCreateOfferSheet = () => {
	    if (hasUploadedBrandLogo) {
	      setShowActionSheet(true);
	      return;
	    }

    toast.error('Upload your brand logo first', {
      description: 'Go to Brand Settings \u2192 Upload logo \u2192 Come back and send your offer',
    });
    navigate('/brand-settings');
	  };

  const displayStats: BrandDashboardStats = useMemo(() => {
    return {
      totalSent: stats?.totalSent ?? 0,
      needsAction: stats?.needsAction ?? 0,
      activeDeals: stats?.activeDeals ?? 0,
      totalInvestment: stats?.totalInvestment ?? 0,
    };
  }, [stats]);

  const spendThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = startOfLocalMonth(now);
    return (deals || []).reduce((acc: number, d: any) => {
      const createdAt = d?.created_at ? new Date(d.created_at) : null;
      const amount = Number(d?.deal_amount) || 0;
      if (!createdAt || !(amount > 0)) return acc;
      if (createdAt >= monthStart && sameLocalMonth(createdAt, now)) return acc + amount;
      return acc;
    }, 0);
  }, [deals]);

  const budgetUsedPct = useMemo(() => {
    if (!monthlyBudgetInr || !(monthlyBudgetInr > 0)) return null;
    const pct = (Number(spendThisMonth) / monthlyBudgetInr) * 100;
    if (!Number.isFinite(pct)) return null;
    return Math.min(999, Math.max(0, Math.round(pct)));
  }, [monthlyBudgetInr, spendThisMonth]);

  const budgetRemaining = useMemo(() => {
    if (!monthlyBudgetInr || !(monthlyBudgetInr > 0)) return null;
    return Math.max(0, Math.round(monthlyBudgetInr - Number(spendThisMonth)));
  }, [monthlyBudgetInr, spendThisMonth]);

  const creatorReplies = useMemo(() => {
    // "Reply" for a brand generally means offer moved beyond "pending".
    return (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      if (!s) return false;
      return s !== 'pending';
    }).length;
  }, [requests]);

  const creatorFeed = useMemo(() => {
    const fromReqs = (requests || []).map((r: any) => ({
      id: String(r?.creator_id || r?.profiles?.id || ''),
      name: firstNameish(r?.profiles),
      username: r?.profiles?.username || '',
      avatar_url: r?.profiles?.avatar_url || '',
      status: String(r?.status || ''),
      href: '/brand-dashboard?tab=collabs',
    }));
    const fromDeals = (deals || []).map((d: any) => ({
      id: String(d?.creator_id || d?.profiles?.id || ''),
      name: firstNameish(d?.profiles),
      username: d?.profiles?.username || '',
      avatar_url: d?.profiles?.avatar_url || '',
      status: String(d?.status || ''),
      href: '/brand-dashboard?tab=collabs',
    }));
    return uniqBy([...fromReqs, ...fromDeals].filter((c) => c.id), (c) => c.id).slice(0, 12);
  }, [requests, deals]);

  const { data: suggestedCreators = [], isLoading: isLoadingSuggestedCreators } = useSupabaseQuery<SuggestedCreator[]>(
    ['brandSuggestedCreators'],
    async () => {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/creators/suggested?limit=10`);
      if (res.status === 404) return [];
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to fetch creators');
      return Array.isArray(data.creators) ? (data.creators as SuggestedCreator[]) : [];
    },
    { staleTime: 60_000 }
  );

  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorSearchResults, setCreatorSearchResults] = useState<SuggestedCreator[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);

  useEffect(() => {
    const raw = String(creatorSearch || '').trim();
    const term = raw.replace(/^@+/, '').trim();
    if (term.length < 2) {
      setCreatorSearchResults([]);
      setIsSearchingCreators(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingCreators(true);
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/creators?username=${encodeURIComponent(term)}&limit=8`, {
          signal: controller.signal,
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setCreatorSearchResults([]);
          return;
        }
        setCreatorSearchResults(Array.isArray(data.creators) ? data.creators : []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setCreatorSearchResults([]);
      } finally {
        setIsSearchingCreators(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [creatorSearch]);

	  // Pending offers = requests that haven't been accepted/declined yet
		  const pendingOffersList = useMemo(() => {
		    const base = uniqById((requests || []).filter((o: any) => {
		      const s = normalizeStatus(o?.status);
		      return s === 'pending' || s === 'countered';
		    }));
      // Sort: counters first, then expiring soonest, then newest.
      return base.sort((a: any, b: any) => {
        const aCounter = normalizeStatus(a?.status) === 'countered' ? 1 : 0;
        const bCounter = normalizeStatus(b?.status) === 'countered' ? 1 : 0;
        if (aCounter !== bCounter) return bCounter - aCounter;
        const aExp = a?.offer_expires_at || a?.expires_at || null;
        const bExp = b?.offer_expires_at || b?.expires_at || null;
        const aT = aExp ? new Date(aExp).getTime() : Number.POSITIVE_INFINITY;
        const bT = bExp ? new Date(bExp).getTime() : Number.POSITIVE_INFINITY;
        if (aT !== bT) return aT - bT;
        const aCreated = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
	      });
		  }, [requests]);

      // Backward-compatible alias (older UI used `offers`).
      const offers = pendingOffersList;

  const activeDealsList = useMemo(() => {
    // Include brand_deals that are active (not cancelled/completed)
    const fromDeals = uniqDeals((deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return true;
      if (s.includes('cancel')) return false;
      if (s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid')) return false;
      return true;
    }));
    // Also include collab_requests accepted by creator (these are active collabs)
    const fromAcceptedRequests = (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      return s === 'accepted';
    });
    // Merge: prefer brand_deals entry if we have one for same creator
    const dealCreatorIds = new Set(fromDeals.map((d: any) => String(d.creator_id || '')).filter(Boolean));
    const acceptedNotInDeals = fromAcceptedRequests.filter((r: any) => !dealCreatorIds.has(String(r.creator_id || '')));
    // Avoid merging duplicates by contract fingerprint as well.
    return uniqDeals([...fromDeals, ...acceptedNotInDeals] as any[]);
  }, [deals, requests]);

  const completedDealsList = useMemo(() => {
    return uniqDeals((deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return false;
      return s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid');
    }) as any[]);
  }, [deals]);

  const visibleCollabItems = useMemo(() => {
    if (activeCollabTab === 'active') return activeDealsList;
    if (activeCollabTab === 'completed') return completedDealsList;
    return pendingOffersList;
  }, [activeCollabTab, activeDealsList, completedDealsList, pendingOffersList]);

  useEffect(() => {
    if (activeTab !== 'collabs') return;
    if (!highlightedDealId && !highlightedRequestId) return;

    const match =
      activeDealsList.find((item: any) => String(item?.id) === String(highlightedDealId)) ||
      pendingOffersList.find((item: any) => String(item?.id) === String(highlightedRequestId)) ||
      completedDealsList.find((item: any) => String(item?.id) === String(highlightedDealId));

    if (match) {
      setSelectedOffer((current) => (current?.id === match.id ? current : match));
    }
  }, [
    activeTab,
    highlightedDealId,
    highlightedRequestId,
    activeDealsList,
    pendingOffersList,
    completedDealsList,
  ]);

  const getSmartTags = (c: SuggestedCreator) => {
    const tags: string[] = [];
    const completion = Number(c?.trust?.completion_rate ?? 0);
    const completed = Number(c?.trust?.completed_deals ?? 0);
    const avgHrs = c?.trust?.avg_response_hours ?? null;
    const rate = Number(c?.pricing?.avg ?? c?.pricing?.reel ?? 0);

    if (completion >= 95 && completed >= 5) tags.push('🔥 High reliability');
    if (avgHrs !== null && avgHrs <= 6) tags.push('⚡ Fast responder');
    if (rate > 0 && rate <= 6000) tags.push('💰 Budget friendly');
    return tags.slice(0, 2);
  };

  const getReliabilityLines = (c: SuggestedCreator) => {
    const lines: string[] = [];
    const completion = Number(c?.trust?.completion_rate ?? 0);
    const completed = Number(c?.trust?.completed_deals ?? 0);
    const avgHrs = c?.trust?.avg_response_hours ?? null;

    if (completion > 0) lines.push(`✔ ${completion}% completion`);
    if (avgHrs !== null && avgHrs > 0) lines.push(`⚡ Responds in ~${avgHrs}h`);
    if (completed > 0) lines.push(`✔ ${completed} completed deals`);
    return lines.slice(0, 3);
  };

  const notifications = useMemo(
    () =>
      [
        displayStats.needsAction > 0
          ? {
              id: 'n-action',
              title: `${displayStats.needsAction} offer${displayStats.needsAction === 1 ? '' : 's'} need your reply`,
              time: 'Today',
              href: '/brand-dashboard?tab=collabs',
            }
          : null,
        displayStats.totalSent > 0
          ? { id: 'n-sent', title: 'Offers sent this week', time: 'This week', href: '/brand-dashboard?tab=collabs' }
          : null,
      ].filter(Boolean) as any[],
    [displayStats.needsAction, displayStats.totalSent]
  );

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isBusy: isPushBusy,
    promptDismissed: isPushPromptDismissed,
    isIOSNeedsInstall,
    hasVapidKey,
    enableNotifications,
    dismissPrompt: dismissPushPrompt,
    sendTestPush,
    refreshStatus: refreshPushStatus,
  } = useDealAlertNotifications();

  const pushPromptStorageKey = useMemo(() => {
    const id = String(profile?.id || '').trim() || 'anon';
    return `brand_push_prompt_dismissed:${id}`;
  }, [profile?.id]);

  const [pushPromptDismissedLocal, setPushPromptDismissedLocal] = useState(false);

  useEffect(() => {
    try {
      setPushPromptDismissedLocal(localStorage.getItem(pushPromptStorageKey) === '1');
    } catch {
      setPushPromptDismissedLocal(false);
    }
  }, [pushPromptStorageKey]);

  const dismissPushPromptPersisted = () => {
    dismissPushPrompt();
    try {
      localStorage.setItem(pushPromptStorageKey, '1');
    } catch {
      // ignore
    }
    setPushPromptDismissedLocal(true);
  };

  const handleEnablePush = async () => {
    try {
      const result = await enableNotifications();
      if (result?.success) {
        toast.success('Notifications enabled');
      } else {
        const reason = result?.reason || 'unknown';
        if (reason === 'missing_vapid_key') toast.error('Notifications not configured yet');
        else if (reason === 'denied') toast.error('Notifications blocked in browser settings');
        else toast.error('Failed to enable notifications');
      }
    } catch {
      toast.error('Failed to enable notifications');
    }
  };

  const PageHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 px-5 py-4 mb-4">
      <button type="button"
        onClick={() => {
          triggerHaptic(HapticPatterns.light);
          setActiveSettingsPage(null);
        }}
        className={cn('p-2 -ml-2 rounded-full transition-all active:scale-90', secondaryTextColor, isDark ? 'hover:bg-card' : 'hover:bg-background')}
      >
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      <h2 className={cn('text-[20px] font-bold tracking-tight', textColor)}>{title}</h2>
    </div>
  );

  const OfferDetailsSheet = ({ offer }: { offer: any }) => {
    if (!offer) return null;
    const title = offer?.profiles ? firstNameish(offer.profiles) : offer?.creator_name || offer?.creator_email || 'Creator';
    const username = String(offer?.profiles?.username || '').trim();
    const isMarkedCompleted = normalizeStatus(offer?.status) === 'completed';
    const canMarkComplete = activeCollabTab === 'active' && !!offer?.id && !isMarkedCompleted && (offer?.deal_amount !== undefined || offer?.due_date !== undefined);
    const deliverables = formatDeliverables(offer) || offer?.collab_type || 'Collaboration';
    const budget = formatBudget(offer);
    const deadlineValue = offer?.due_date || offer?.deadline;
    const deadline = deadlineValue ? new Date(deadlineValue) : null;
    const deadlineText = deadline && !Number.isNaN(deadline.getTime())
      ? deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
    const status = String(offer?.status || '').toUpperCase() || 'PENDING';
    const contractUrl = offer?.safe_contract_url || offer?.signed_contract_url || offer?.contract_file_url || null;
    const isRequest = ['pending', 'countered', 'declined', 'expired'].includes(normalizeStatus(offer?.status)) && offer?.deal_amount === undefined;
    const sentAt = offer?.created_at || offer?.updated_at || null;
    const expires = offerExpiryLabel(offer);
    const requestStage = normalizeStatus(offer?.status) === 'countered' ? 'CREATOR COUNTERED' : 'WAITING FOR CREATOR';
    const [isRequestBusy, setIsRequestBusy] = useState(false);
    const [showCounterEditor, setShowCounterEditor] = useState(false);
    const [counterBudget, setCounterBudget] = useState<string>(() => {
      const v = offer?.exact_budget ?? offer?.deal_amount ?? '';
      return v === null || v === undefined ? '' : String(v);
    });
    const [counterDeliverables, setCounterDeliverables] = useState<string>(() => {
      const base = formatDeliverables(offer);
      return String(base || '').trim();
    });
    const isCounteredRequest = normalizeStatus(offer?.status) === 'countered';

    const updateRequest = async (path: string, body?: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}${path}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Request failed');
      }
      return data;
    };

    const acceptCounter = async () => {
      try {
        const counter = offer?.counter_offer || null;
        if (!counter) {
          toast.message('No counter offer to accept yet');
          return;
        }
        const finalPrice = counter?.final_price ?? counter?.budget ?? null;
        const deliverablesNext = counter?.deliverables ?? null;
        setIsRequestBusy(true);
        await updateRequest(`/api/brand-dashboard/requests/${offer.id}/revise`, {
          exact_budget: finalPrice,
          deliverables: deliverablesNext,
        });
        toast.success('Accepted counter and re-sent offer');
        setSelectedOffer(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to accept counter');
      } finally {
        setIsRequestBusy(false);
      }
    };

    const submitCounter = async () => {
      try {
        const amount = counterBudget ? Number(counterBudget) : null;
        const deliverablesList = counterDeliverables
          .split('•')
          .join(',')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setIsRequestBusy(true);
        await updateRequest(`/api/brand-dashboard/requests/${offer.id}/revise`, {
          exact_budget: amount,
          deliverables: deliverablesList,
        });
        toast.success('Updated and re-sent offer');
        setShowCounterEditor(false);
        setSelectedOffer(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to update offer');
      } finally {
        setIsRequestBusy(false);
      }
    };

    const declineOffer = async () => {
      try {
        setIsRequestBusy(true);
        await updateRequest(`/api/brand-dashboard/requests/${offer.id}/withdraw`);
        toast.success('Offer withdrawn');
        setSelectedOffer(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to withdraw offer');
      } finally {
        setIsRequestBusy(false);
      }
    };

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedOffer(null)}
          className="fixed inset-0 z-[140] bg-black/50 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
	          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
	          className={cn(
	            'fixed bottom-0 inset-x-0 z-[150] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl',
	            isDark ? 'bg-background border-border' : 'bg-secondary/95 backdrop-blur-xl border-[#E5E5EA]'
	          )}
	        >
	          <div className="w-12 h-1 bg-background/20 rounded-full mx-auto mb-6" />
	          <div className="max-w-md mx-auto">
	            {isRequest ? (
	              <>
	                <div className="flex items-start justify-between gap-3 mb-5">
	                  <div className="min-w-0">
	                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Pending offer</p>
	                    <h3 className={cn('text-[18px] font-bold tracking-tight truncate', textColor)}>{title}</h3>
	                    <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>{String(deliverables).replaceAll(',', ' • ')}</p>
	                  </div>
	                  <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/70 bg-card' : 'border-border text-muted-foreground bg-background')}>
	                    {requestStage}
	                  </span>
	                </div>

	                <div className="grid grid-cols-2 gap-2 mb-4">
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>You will pay</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{budget || '—'}</p>
	                  </div>
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Sent</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{sentAt ? `${timeSince(sentAt)} ago` : '—'}</p>
	                  </div>
	                </div>

	                <div className="flex items-center justify-between gap-2 mb-4">
	                  <div className={cn('px-3 py-2 rounded-xl border text-[11px] font-semibold', isDark ? 'bg-[#1C2C2A] text-primary border-primary/15' : 'bg-background text-muted-foreground border-[#E5E5EA]')}>
	                    <Landmark className="w-4 h-4 inline-block mr-2 -mt-0.5" />
	                    Payment released after content approval
	                  </div>
	                  {expires && (
	                    <div className={cn(
	                      'px-3 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-2',
	                      expires.tone === 'danger'
	                        ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-300/30' : 'bg-rose-50 text-rose-800 border-rose-200')
	                        : expires.tone === 'warn'
	                          ? (isDark ? 'bg-warning/10 text-warning border-warning/30' : 'bg-warning text-warning border-warning')
	                          : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border')
	                    )}>
	                      <Clock className="w-4 h-4" /> {expires.text}
	                    </div>
	                  )}
	                </div>

	                <div className="grid grid-cols-3 gap-2">
	                  {isCounteredRequest ? (
	                    <>
	                      <button type="button"
	                        onClick={acceptCounter}
	                        disabled={isRequestBusy}
	                        className="h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-blue-600 to-sky-600 text-foreground border-transparent"
	                      >
	                        Accept Counter
	                      </button>
	                      <button type="button"
	                        onClick={() => setShowCounterEditor(true)}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
	                        )}
	                      >
	                        Revise Terms
	                      </button>
	                      <button type="button"
	                        onClick={declineOffer}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-rose-500/10 border-rose-300/30 text-rose-200 hover:bg-rose-500/15' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
	                        )}
	                      >
	                        Withdraw
	                      </button>
	                    </>
	                  ) : (
	                    <>
	                      <button type="button"
	                        onClick={() => setShowCounterEditor(true)}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'col-span-2 h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
	                        )}
	                      >
	                        Edit Offer
	                      </button>
	                      <button type="button"
	                        onClick={declineOffer}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-rose-500/10 border-rose-300/30 text-rose-200 hover:bg-rose-500/15' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
	                        )}
	                      >
	                        Withdraw
	                      </button>
	                    </>
	                  )}
	                </div>

	                <AnimatePresence>
	                  {showCounterEditor && [
	                    <motion.div
	                      key="counterEditorBackdrop"
	                      initial={{ opacity: 0 }}
	                      animate={{ opacity: 1 }}
	                      exit={{ opacity: 0 }}
	                      className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm"
	                      onClick={() => setShowCounterEditor(false)}
	                    />,
	                    <motion.div
	                      key="counterEditorPanel"
	                      initial={{ opacity: 0, y: 12 }}
	                      animate={{ opacity: 1, y: 0 }}
	                      exit={{ opacity: 0, y: 12 }}
	                      className={cn(
	                        'fixed inset-x-0 top-[18%] z-[170] mx-auto max-w-md rounded-[2rem] border p-5 shadow-2xl',
	                        isDark ? 'bg-background border-border' : 'bg-card border-border'
	                      )}
	                    >
	                      <div className="flex items-center justify-between mb-4">
	                        <div>
	                          <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Counter offer</p>
	                          <p className={cn('text-[16px] font-black tracking-tight', textColor)}>Update terms</p>
	                        </div>
	                        <button type="button"
	                          onClick={() => setShowCounterEditor(false)}
	                          className={cn('w-10 h-10 rounded-full border flex items-center justify-center', borderColor, isDark ? 'bg-card' : 'bg-background')}
	                        >
	                          <ChevronRight className={cn('w-4 h-4 rotate-180', textColor)} />
	                        </button>
	                      </div>

	                        <div className="space-y-3">
	                          <div className={cn('rounded-2xl border p-3', cardBgColor, borderColor)}>
	                            <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Budget (₹)</p>
	                            <input
	                              value={counterBudget}
	                              onChange={(e) => setCounterBudget(e.target.value)}
	                              inputMode="numeric"
	                              className={cn('mt-2 w-full bg-transparent text-[14px] font-bold outline-none', textColor)}
	                              placeholder="10379"
	                            />
	                          </div>
	                          <div className={cn('rounded-2xl border p-3', cardBgColor, borderColor)}>
	                            <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Deliverables</p>
	                            <textarea
	                              value={counterDeliverables}
	                              onChange={(e) => setCounterDeliverables(e.target.value)}
	                              rows={3}
	                              className={cn('mt-2 w-full bg-transparent text-[13px] font-semibold outline-none resize-none', textColor)}
	                              placeholder="1 Reel, 2 Stories"
	                            />
	                          </div>
	                        </div>

	                        <div className="grid grid-cols-2 gap-2 mt-4">
	                          <button type="button"
	                            onClick={() => setShowCounterEditor(false)}
	                            disabled={isRequestBusy}
	                            className={cn('h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60', isDark ? 'bg-card border-border text-foreground' : 'bg-background border-border text-muted-foreground')}
	                          >
	                            Cancel
	                          </button>
	                          <button type="button"
	                            onClick={submitCounter}
	                            disabled={isRequestBusy}
	                            className={cn('h-12 rounded-2xl text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60', 'bg-gradient-to-r from-blue-600 to-sky-600 text-foreground')}
	                          >
	                            {isRequestBusy ? 'Saving...' : 'Send'}
	                          </button>
	                        </div>
	                    </motion.div>,
	                  ]}
	                </AnimatePresence>
	              </>
	            ) : (
	              <div className="max-w-md mx-auto">
	                <div className="flex items-start justify-between gap-3 mb-5">
	                  <div className="min-w-0">
	                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Deal offer</p>
	                    <h3 className={cn('text-[18px] font-bold tracking-tight truncate', textColor)}>{title}</h3>
	                    <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>{deliverables}</p>
	                  </div>
	                  <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/70 bg-card' : 'border-border text-muted-foreground bg-background')}>
	                    {status}
	                  </span>
	                </div>

	                <div className="grid grid-cols-2 gap-2 mb-5">
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>You’ll pay</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{budget || '—'}</p>
	                  </div>
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Deadline</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{deadlineText || '—'}</p>
	                  </div>
	                </div>

	                <div className="grid grid-cols-1 gap-2">
		                  <button type="button"
		                    onClick={async () => {
		                      triggerHaptic(HapticPatterns.light);
			                      if (!offer?.id) {
			                        toast.error('Deal details unavailable');
			                        return;
			                      }

			                      setIsOpeningContract(true);
			                      try {
			                        setSelectedOffer(null);
			                        await startBrandSigningFlow(offer);
			                      } catch (error: any) {
			                        toast.error(error?.message || 'Failed to open signing');
			                      } finally {
			                        setIsOpeningContract(false);
			                      }
				                    }}
		                    disabled={isOpeningContract}
		                    className={cn(
		                      'p-5 rounded-[1.6rem] text-left border transition active:scale-[0.98] disabled:opacity-60',
		                      isDark
	                        ? 'border-border bg-card hover:bg-secondary/50'
	                        : 'border-border bg-background hover:bg-background'
	                    )}
	                  >
	                    <p className={cn('text-[13px] font-bold', textColor)}>{isOpeningContract ? 'Opening Contract...' : 'Review Contract'}</p>
	                    <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
	                      {contractUrl ? 'Open the generated collaboration agreement' : 'Open the protected contract review page'}
	                    </p>
	                  </button>
		                  {!contractUrl && (
		                    <button type="button"
		                      onClick={async () => {
		                        // Pre-open a tab synchronously to avoid iOS popup blocking after async work.
		                        let popup: Window | null = null;
		                        try {
		                          popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
		                          if (popup) popup.opener = null;
		                        } catch {
		                          popup = null;
		                        }

		                        try {
		                          setIsGeneratingContract(true);
		                          triggerHaptic(HapticPatterns.light);
		                          const { data: { session } } = await supabase.auth.getSession();
		                          const token = session?.access_token;
		                          if (!token) {
	                            toast.error('Authentication required');
	                            return;
	                          }

	                          const apiBase = getApiBaseUrl();
	                          const response = await fetch(`${apiBase}/api/deals/${offer.id}/regenerate-contract`, {
	                            method: 'POST',
	                            headers: {
	                              'Content-Type': 'application/json',
	                              Authorization: `Bearer ${token}`,
	                            },
	                          });
	                          const data = await response.json().catch(() => ({}));
	                          if (!response.ok || !data?.success) {
	                            throw new Error(data?.error || 'Failed to generate contract');
	                          }

	                          const nextUrl = data?.contract?.url || null;
	                          if (nextUrl) {
	                            setSelectedOffer((prev: any) => prev ? {
	                              ...prev,
	                              contract_file_url: nextUrl,
	                              signed_contract_url: prev?.signed_contract_url || null,
	                              safe_contract_url: prev?.safe_contract_url || null,
	                            } : prev);
		                          }
		                          toast.success('Contract generated');
		                          if (nextUrl) {
		                            const finalUrl = String(nextUrl);
		                            if (popup && !popup.closed) popup.location.href = finalUrl;
		                            else window.location.assign(finalUrl);
		                          }
		                          await onRefresh?.();
		                          triggerHaptic(HapticPatterns.success);
		                        } catch (error: any) {
		                          try {
		                            popup?.close();
		                          } catch {
		                            // ignore
		                          }
		                          toast.error(error?.message || 'Failed to generate contract');
		                        } finally {
		                          setIsGeneratingContract(false);
		                        }
		                      }}
	                      disabled={isGeneratingContract}
	                      className={cn(
	                        'p-5 rounded-[1.6rem] text-left border transition active:scale-[0.98] disabled:opacity-60',
	                        isDark ? 'border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/15' : 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100'
	                      )}
	                    >
	                      <p className={cn('text-[13px] font-bold', isDark ? 'text-cyan-200' : 'text-cyan-800')}>
	                        {isGeneratingContract ? 'Generating contract...' : 'Generate Contract'}
	                      </p>
	                      <p className={cn('text-[12px] mt-1', isDark ? 'text-cyan-200/70' : 'text-cyan-700/80')}>
	                        Create the collaboration agreement for this deal now
	                      </p>
	                    </button>
	                  )}
	                </div>
	              </div>
		            )}
		            <div className="grid grid-cols-1 gap-2 mt-2">
		              {canMarkComplete && (
		                <button type="button"
		                  onClick={async () => {
                    if (!canSubmitCompletion) {
                      toast.message(`Cannot complete yet: ${completionBlockers.join(', ')}`);
                      return;
                    }
                    try {
                      setIsMarkingComplete(true);
                      triggerHaptic(HapticPatterns.light);
                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token;
                      if (!token) {
                        toast.error('Authentication required');
                        return;
                      }

                      const apiBase = getApiBaseUrl();
                      const response = await fetch(`${apiBase}/api/deals/${offer.id}/mark-complete`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                      });
                      const data = await response.json().catch(() => ({}));
                      if (!response.ok || !data?.success) {
                        throw new Error(data?.error || 'Failed to mark complete');
                      }

                      toast.success(data?.alreadyCompleted ? 'Deal already completed' : 'Collaboration marked complete');
                      setSelectedOffer(null);
                      await onRefresh?.();
                      setActiveTab('collabs', 'completed');
                      triggerHaptic(HapticPatterns.success);
                    } catch (error: any) {
                      toast.error(error?.message || 'Failed to mark collaboration complete');
                    } finally {
                      setIsMarkingComplete(false);
                    }
                  }}
                  disabled={isMarkingComplete || !canSubmitCompletion}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-60',
                    isDark ? 'bg-primary/10 border-primary/25 hover:bg-primary/15' : 'bg-primary border-primary hover:bg-primary'
                  )}
                >
                  <p className={cn('text-[13px] font-bold', isDark ? 'text-primary' : 'text-primary')}>
                    {isMarkingComplete ? 'Marking complete...' : 'Mark collaboration complete'}
                  </p>
                  <p className={cn('text-[12px] mt-1', isDark ? 'text-primary/70' : 'text-primary/80')}>
                    {canSubmitCompletion
                      ? 'All required obligations are done. Move this deal to completed.'
                      : `Complete after ${completionBlockers.join(', ')}.`}
                  </p>
		                </button>
		              )}
              <button type="button"
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSelectedOffer(null);
                  if (username) {
                    navigate(`/creator/${username}`);
                    return;
                  }
                  toast.message('Creator profile unavailable');
                }}
                className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
              >
                <p className={cn('text-[13px] font-bold', textColor)}>View creator profile</p>
                <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Open the creator page in the same app</p>
              </button>
              <button type="button"
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSelectedOffer(null);
                  setActiveTab('collabs', normalizeStatus(offer?.status) === 'accepted' ? 'active' : activeCollabTab);
                }}
                className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
              >
                <p className={cn('text-[13px] font-bold', textColor)}>Back to {activeCollabTab} list</p>
                <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Keep reviewing offers without leaving this screen</p>
              </button>
	              <button type="button"
	                onClick={() => setSelectedOffer(null)}
	                className={cn('h-12 rounded-2xl font-bold text-[13px] transition-all active:scale-[0.99]', isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}
	              >
	                Close
	              </button>
	            </div>
          </div>
        </motion.div>
      </>
    );
  };

  const BrandDealDetailScreen = ({ offer }: { offer: any }) => {
    if (!offer) return null;

    const contractSectionRef = useRef<HTMLDivElement | null>(null);
    const deliverablesSectionRef = useRef<HTMLDivElement | null>(null);
    const progressSectionRef = useRef<HTMLDivElement | null>(null);
    const contentSectionRef = useRef<HTMLDivElement | null>(null);

	    const [isReviewingContent, setIsReviewingContent] = useState(false);
	    const [isReleasingPayment, setIsReleasingPayment] = useState(false);
      const [isUpdatingShipping, setIsUpdatingShipping] = useState(false);
	    const [showPaymentProofBox, setShowPaymentProofBox] = useState(false);
	    const [paymentReferenceDraft, setPaymentReferenceDraft] = useState('');
	    const [paymentDateDraft, setPaymentDateDraft] = useState(() => new Date().toISOString().slice(0, 10));
	    const [paymentNotesDraft, setPaymentNotesDraft] = useState('');
	    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
      const [showShippingBox, setShowShippingBox] = useState(false);
      const [courierNameDraft, setCourierNameDraft] = useState('');
      const [trackingNumberDraft, setTrackingNumberDraft] = useState('');
      const [trackingUrlDraft, setTrackingUrlDraft] = useState('');
      const [expectedDeliveryDateDraft, setExpectedDeliveryDateDraft] = useState('');
	    const [showRevisionBox, setShowRevisionBox] = useState(false);
	    const [revisionFeedbackDraft, setRevisionFeedbackDraft] = useState('');
	    const [showDisputeBox, setShowDisputeBox] = useState(false);
	    const [disputeNotesDraft, setDisputeNotesDraft] = useState('');

    const creatorName = firstNameish(offer?.profiles);
    const creatorUsername = String(offer?.profiles?.username || '').trim();
    const deliverables = formatDeliverables(offer) || offer?.collab_type || 'Collaboration';
    const amount = Number(offer?.deal_amount || offer?.exact_budget || 0);
    const deadlineValue = offer?.due_date || offer?.deadline;
    const deadline = deadlineValue ? new Date(deadlineValue) : null;
    const deadlineText = deadline && !Number.isNaN(deadline.getTime())
      ? deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const diffDays = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
    const dueTone = diffDays === null ? secondaryTextColor : diffDays < 0 ? 'text-rose-500' : diffDays <= 7 ? 'text-warning' : 'text-info';
    const contractUrl = offer?.safe_contract_url || offer?.signed_contract_url || offer?.contract_file_url || null;
    const usageRights = offer?.usage_rights || offer?.usage_type || 'Organic social media only';
    const usageDuration = offer?.usage_duration || '90 days limit';
    const paymentReference = String(offer?.utr_number || offer?.payment_reference || '').trim();
    const paymentReceivedDate = String(offer?.payment_received_date || '').trim();
    const paymentProofUrl = String(offer?.payment_proof_url || '').trim();
    const paymentNotes = String(offer?.payment_notes || '').trim();
    const creatorPayeeName = String(offer?.profiles?.bank_account_name || creatorName || 'Creator').trim();
    const creatorUpiId = String(offer?.profiles?.bank_upi || '').trim();
    const collabKind = String(offer?.collab_type || offer?.deal_type || '').trim().toLowerCase();
    const requiresPayment = typeof offer?.requires_payment === 'boolean'
      ? Boolean(offer.requires_payment)
      : (collabKind === 'paid' || collabKind === 'both' || collabKind === 'hybrid' || collabKind === 'paid_barter' || (collabKind !== 'barter' && amount > 0));
    const requiresShipping = typeof offer?.requires_shipping === 'boolean'
      ? Boolean(offer.requires_shipping)
      : typeof offer?.shipping_required === 'boolean'
        ? Boolean(offer.shipping_required)
        : (collabKind === 'barter' || collabKind === 'both' || collabKind === 'hybrid' || collabKind === 'paid_barter');
    const shippingStatus = String(offer?.shipping_status || '').trim().toLowerCase();
    const shippingDelivered = shippingStatus === 'delivered' || shippingStatus === 'received';
    const trackingNumber = String(offer?.tracking_number || '').trim();
    const trackingUrl = String(offer?.tracking_url || '').trim();
    const courierName = String(offer?.courier_name || '').trim();
    const expectedDeliveryDate = String(offer?.expected_delivery_date || '').trim();

			  const normalizedDealStatus = effectiveDealStatus(offer);
			  const canReviewContent = normalizedDealStatus === 'CONTENT_DELIVERED' || normalizedDealStatus === 'REVISION_DONE';
    const canReleasePayment = requiresPayment && normalizedDealStatus === 'CONTENT_APPROVED';
    const contentApprovedForCompletion =
      normalizedDealStatus === 'CONTENT_APPROVED' ||
      normalizedDealStatus === 'PAYMENT_RELEASED' ||
      normalizedDealStatus === 'COMPLETED';
    const paymentReleasedForCompletion =
      !requiresPayment ||
      normalizedDealStatus === 'PAYMENT_RELEASED' ||
      normalizedDealStatus === 'COMPLETED';
    const shippingSatisfiedForCompletion = !requiresShipping || shippingDelivered;
    const completionBlockers = [
      !contentApprovedForCompletion ? 'content approval is still pending' : null,
      !shippingSatisfiedForCompletion ? 'product delivery is not confirmed yet' : null,
      !paymentReleasedForCompletion ? 'payment has not been released yet' : null,
    ].filter(Boolean) as string[];
    const canSubmitCompletion = completionBlockers.length === 0;
			  const cardUi = brandDealCardUi(offer);
	      const primaryCta = getDealPrimaryCta({ role: 'brand', deal: offer });

			  const dealUi = (() => {
			    const label = cardUi.human || 'In progress';
			    const tone =
			      normalizedDealStatus === 'COMPLETED'
			        ? (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-background text-muted-foreground border-border')
			        : primaryCta.tone === 'action'
			          ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
			          : primaryCta.tone === 'waiting'
			            ? (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border')
			            : (isDark ? 'bg-info/10 text-info border-sky-500/25' : 'bg-info text-info border-sky-200');

			    const stepIndex = Math.max(0, Math.min(4, (cardUi.step || 1) - 1));
			    return { label, tone, cta: primaryCta.label, stepIndex };
	    })();

    const copyText = async (value: string, label: string) => {
      const text = String(value || '').trim();
      if (!text) {
        toast.error(`${label} not available`);
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
      } catch {
        toast.error(`Failed to copy ${label.toLowerCase()}`);
      }
    };

    const getContractViewUrl = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        if (!offer?.id) {
          toast.error('Deal details unavailable');
          return null;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          toast.error('Authentication required');
          return null;
        }

		        const apiBase = getApiBaseUrl();
		        const response = await fetch(`${apiBase}/api/deals/${offer.id}/contract-review-link`, {
		          headers: { Authorization: `Bearer ${token}` },
		        });
		        const data = await response.json().catch(() => ({}));
		        const nextUrl = data?.signUrl || data?.viewUrl || null;
		        if (response.ok && data?.success && nextUrl) {
		          return String(nextUrl);
		        }

		        if (contractUrl) return contractUrl;
		        throw new Error(data?.error || 'Failed to open contract');
	      } catch (error: any) {
	        if (contractUrl) return contractUrl;
	        toast.error(error?.message || 'Contract not generated yet');
	        return null;
      }
    };

    // iOS/Safari blocks `window.open()` if it happens after an async boundary (await/fetch).
    // Workaround: open a blank tab synchronously on click, then redirect it once the URL is resolved.
    const openUrlFromUserGesture = async (resolveUrl: () => Promise<string | null>) => {
      let popup: Window | null = null;
      try {
        popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
        // Best-effort hardening; safe even if browser ignores it.
        if (popup) popup.opener = null;
      } catch {
        popup = null;
      }

      const url = await resolveUrl();
      if (!url) {
        try {
          popup?.close();
        } catch {
          // ignore
        }
        return;
      }

      if (popup && !popup.closed) {
        try {
          popup.location.href = url;
          return;
        } catch {
          // If we can't navigate the popup (or it got blocked), fallback to same-tab navigation.
        }
      }
      window.location.assign(url);
    };

    const openContract = async () => {
      setIsOpeningContract(true);
      try {
        await startBrandSigningFlow(offer);
      } finally {
        setIsOpeningContract(false);
      }
    };

    const generateContract = async () => {
      // Pre-open a tab synchronously to avoid iOS popup blocking after async work.
      let popup: Window | null = null;
      try {
        popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
        if (popup) popup.opener = null;
      } catch {
        popup = null;
      }

      try {
        setIsGeneratingContract(true);
        triggerHaptic(HapticPatterns.light);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/deals/${offer.id}/regenerate-contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'Failed to generate contract');
        }

        const nextUrl = data?.contract?.url || null;
        const nextOffer = nextUrl ? { ...offer, contract_file_url: nextUrl } : offer;
        setSelectedDealPage(nextOffer);
        setSelectedOffer(nextOffer);
	        toast.success('Contract generated');
	        if (nextUrl) {
	          try {
	            const response = await fetch(`${apiBase}/api/deals/${offer.id}/contract-review-link`, {
	              headers: { Authorization: `Bearer ${token}` },
	            });
	            const view = await response.json().catch(() => ({}));
	            const viewUrl = view?.signUrl || view?.viewUrl || null;
	            const finalUrl =
	              response.ok && view?.success && viewUrl ? String(viewUrl) : String(nextUrl);
              if (popup && !popup.closed) popup.location.href = finalUrl;
              else window.location.assign(finalUrl);
	          } catch (_) {
            const finalUrl = String(nextUrl);
            if (popup && !popup.closed) popup.location.href = finalUrl;
            else window.location.assign(finalUrl);
	          }
	        }
	        await onRefresh?.();
	        triggerHaptic(HapticPatterns.success);
      } catch (error: any) {
        try {
          popup?.close();
        } catch {
          // ignore
        }
        toast.error(error?.message || 'Failed to generate contract');
      } finally {
        setIsGeneratingContract(false);
      }
    };

    const copyDealLink = async () => {
      try {
        setIsOpeningContract(true);
        const url = await getContractViewUrl();
        if (!url) return;
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to copy link');
      } finally {
        setIsOpeningContract(false);
      }
    };

    const scrollToRef = (ref: MutableRefObject<HTMLDivElement | null>) => {
      const el = ref.current;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

	    const onPrimaryCta = async () => {
	      const cta = getDealPrimaryCta({ role: 'brand', deal: offer });
	      if (cta.disabled) {
	        toast.message(cta.label);
	        return;
	      }

	      if (cta.action === 'review_sign_contract') {
	        await openContract();
	        return;
	      }

	      if (cta.action === 'review_content') {
	        scrollToRef(contentSectionRef);
	        toast.message('Review the submitted content below.');
	        return;
	      }

	      if (cta.action === 'track_progress') {
	        scrollToRef(progressSectionRef);
	        return;
	      }

	      if (cta.action === 'view_collaboration') {
	        scrollToRef(deliverablesSectionRef);
	        return;
	      }

	      if (cta.action === 'view_summary' || cta.action === 'view_details') {
	        scrollToRef(progressSectionRef);
	        return;
	      }

	      if (cta.action === 'view_issue') {
	        scrollToRef(contentSectionRef);
	        toast.message('This deal has an issue raised. Review the notes below.');
	        return;
	      }
	    };

    const patchDeal = async (path: string, body?: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const apiBase = getApiBaseUrl();
      const resp = await fetch(`${apiBase}${path}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Request failed');
      }
      return data;
    };

    const approveContent = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        setIsReviewingContent(true);
        await patchDeal(`/api/deals/${offer.id}/review-content`, { status: 'approved' });
        toast.success('Content approved');
        // Optimistic UI update (avoid requiring a manual refresh to see CTA/progress changes).
        setSelectedDealPage((prev) => (prev?.id === offer.id ? { ...prev, status: 'CONTENT_APPROVED', progress_percentage: 95, brand_approval_status: 'approved', updated_at: new Date().toISOString() } : prev));
        setShowRevisionBox(false);
        setRevisionFeedbackDraft('');
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to approve content');
      } finally {
        setIsReviewingContent(false);
      }
    };

    const updateShipping = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        const tracking = String(trackingNumberDraft || '').trim();
        if (!tracking) {
          toast.error('Tracking number is required');
          return;
        }
        setIsUpdatingShipping(true);
        await patchDeal(`/api/deals/${offer.id}/shipping/update`, {
          status: 'shipped',
          courier_name: String(courierNameDraft || '').trim() || undefined,
          tracking_number: tracking,
          tracking_url: String(trackingUrlDraft || '').trim() || undefined,
          expected_delivery_date: String(expectedDeliveryDateDraft || '').trim() || undefined,
        });
        toast.success('Shipping updated');
        setSelectedDealPage((prev) => (
          prev?.id === offer.id
            ? {
                ...prev,
                shipping_status: 'shipped',
                courier_name: String(courierNameDraft || '').trim() || null,
                tracking_number: tracking,
                tracking_url: String(trackingUrlDraft || '').trim() || null,
                expected_delivery_date: String(expectedDeliveryDateDraft || '').trim() || null,
                updated_at: new Date().toISOString(),
              }
            : prev
        ));
        setShowShippingBox(false);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to update shipping');
      } finally {
        setIsUpdatingShipping(false);
      }
    };

    const requestRevision = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        const feedback = String(revisionFeedbackDraft || '').trim();
        if (!feedback) {
          toast.error('Add a revision note for the creator');
          return;
        }
        setIsReviewingContent(true);
        await patchDeal(`/api/deals/${offer.id}/review-content`, { status: 'changes_requested', feedback });
        toast.success('Revision requested');
        setSelectedDealPage((prev) =>
          prev?.id === offer.id
            ? { ...prev, status: 'Content Making', progress_percentage: 85, brand_approval_status: 'changes_requested', brand_feedback: feedback, updated_at: new Date().toISOString() }
            : prev
        );
        setShowRevisionBox(false);
        setRevisionFeedbackDraft('');
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to request revision');
      } finally {
        setIsReviewingContent(false);
      }
    };

    const raiseDispute = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        const disputeNotes = String(disputeNotesDraft || '').trim();
        setIsReviewingContent(true);
        await patchDeal(`/api/deals/${offer.id}/review-content`, { status: 'disputed', disputeNotes });
        toast.success('Issue raised');
        setSelectedDealPage((prev) =>
          prev?.id === offer.id
            ? { ...prev, status: 'DISPUTED', brand_approval_status: 'disputed', dispute_notes: disputeNotes || null, updated_at: new Date().toISOString() }
            : prev
        );
        setShowDisputeBox(false);
        setDisputeNotesDraft('');
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to raise issue');
      } finally {
        setIsReviewingContent(false);
      }
    };

    const releasePayment = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        if (!creatorUpiId) {
          toast.error('Creator UPI ID missing', { description: 'Ask the creator to add a UPI ID before releasing payment.' });
          return;
        }
        const paymentReference = String(paymentReferenceDraft || '').trim();
        if (!paymentReference) {
          toast.error('Payment reference is required');
          return;
        }
        setIsReleasingPayment(true);
        let paymentProofUrl: string | null = null;
        if (paymentProofFile) {
          const fileExt = paymentProofFile.name.split('.').pop()?.toLowerCase() || 'jpg';
          const filePath = `${profile?.id || 'brand'}/payment-proofs/${offer.id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).upload(filePath, paymentProofFile, {
            cacheControl: '3600',
            upsert: false,
          });
          if (uploadError) {
            throw new Error(`Payment proof upload failed: ${uploadError.message}`);
          }
          const { data: publicUrlData } = supabase.storage.from(CREATOR_ASSETS_BUCKET).getPublicUrl(filePath);
          paymentProofUrl = publicUrlData?.publicUrl || null;
        }

        const payload = {
          paymentReference,
          paymentReceivedDate: paymentDateDraft || undefined,
          paymentNotes: String(paymentNotesDraft || '').trim() || undefined,
          paymentProofUrl: paymentProofUrl || undefined,
        };

        await patchDeal(`/api/deals/${offer.id}/release-payment`, payload);
        toast.success('Payment released');
        setSelectedDealPage((prev) => (
          prev?.id === offer.id
            ? {
                ...prev,
                status: 'PAYMENT_RELEASED',
                payment_released_at: new Date().toISOString(),
                payment_received_date: payload.paymentReceivedDate || new Date().toISOString(),
                utr_number: paymentReference,
                payment_proof_url: paymentProofUrl,
                payment_notes: payload.paymentNotes || null,
                updated_at: new Date().toISOString(),
              }
            : prev
        ));
        setShowPaymentProofBox(false);
        setPaymentReferenceDraft('');
        setPaymentDateDraft(new Date().toISOString().slice(0, 10));
        setPaymentNotesDraft('');
        setPaymentProofFile(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to release payment');
      } finally {
        setIsReleasingPayment(false);
      }
    };

    const DealCard = ({ children, className }: { children: ReactNode; className?: string }) => (
      <div
        className={cn(
          'rounded-3xl border shadow-[0_10px_40px_rgba(2,6,23,0.06)] overflow-hidden',
          isDark ? 'bg-card border-border' : 'bg-card border-border',
          className
        )}
      >
        {children}
      </div>
    );

    const SectionTitle = ({ children }: { children: ReactNode }) => (
      <h4 className={cn('text-[13px] font-black uppercase tracking-wider mb-3 opacity-50', textColor)}>{children}</h4>
    );

    const Pill = ({ children }: { children: ReactNode }) => (
      <div className={cn('rounded-2xl border px-4 py-3 text-[14px] font-black', isDark ? 'bg-card border-border text-foreground' : 'bg-card border-border text-muted-foreground')}>
        {children}
      </div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        className={cn(
          'fixed inset-0 z-[200] overflow-y-auto',
          isDark ? 'bg-[#061318]' : 'bg-[#F9FAFB]'
        )}
      >
        <div className={cn('px-5 py-3.5 flex items-center justify-between border-b sticky top-0 z-[210]', isDark ? 'bg-[#061318]/92 backdrop-blur-xl border-border' : 'bg-card border-border')}>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); setSelectedDealPage(null); }} className={cn('w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90', borderColor, isDark ? 'bg-card hover:bg-secondary/50' : 'bg-card hover:bg-background')}>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div>
              <h2 className={cn('text-[16px] font-bold tracking-tight leading-tight', textColor)}>Deal Detail</h2>
              <p className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40 leading-tight', textColor)}>{creatorName || 'Creator'}</p>
            </div>
          </div>
          <button type="button"
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              toast.message('More actions coming next.');
            }}
            className={cn('w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90', borderColor, isDark ? 'bg-card hover:bg-secondary/50' : 'bg-card hover:bg-background')}
          >
            <MoreHorizontal className={cn('w-5 h-5 opacity-60', textColor)} />
          </button>
        </div>

        <div className="px-5 pt-5 pb-40 max-w-md md:max-w-2xl mx-auto">
          {/* Hero */}
          <DealCard className="mb-6">
            <div className="p-5 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-background" />
              <div className="relative">
	                <div className="flex items-center justify-between gap-3 mb-4">
	                  <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest', dealUi.tone)}>
	                    {dealUi.label}
	                  </span>
	                  <span className={cn('inline-flex px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest', offer?.collab_type === 'barter' ? (isDark ? 'bg-warning/10 text-warning border-warning/20' : 'bg-warning text-warning border-warning') : (isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary'))}>
	                    {offer?.collab_type === 'barter' ? 'BARTER' : 'PAID CAMPAIGN'}
	                  </span>
	                </div>
	
	                {showSignatureDebug && (
	                  <div className={cn('text-[11px] font-semibold mb-3', secondaryTextColor)}>
	                    {(() => {
	                      const hints = collectSignatureHints(offer);
	                      const status = effectiveDealStatus(offer);
	                      const raw = String(offer?.status || offer?.raw?.status || '—');
	                      const esign = String(offer?.esign_status || offer?.raw?.esign_status || offer?.contract_status || offer?.raw?.contract_status || '');
	                      return (
	                        <span>
	                          debugSig: status={status} raw={raw} esign={esign || '—'} brandKeys=[{hints.brand.join(',') || '—'}] creatorKeys=[{hints.creator.join(',') || '—'}]
	                        </span>
	                      );
	                    })()}
	                  </div>
	                )}

	                <p className={cn('text-[42px] font-black leading-none tracking-tight', textColor)}>
	                  {amount > 0 ? formatCompactINR(amount) : '—'}
	                  <span className={cn('text-[18px] font-bold ml-2 opacity-60', textColor)}>Offer</span>
                </p>
                <p className={cn('text-[14px] font-bold mt-3', isDark ? 'text-muted-foreground' : 'text-muted-foreground')}>
                  {String(deliverables).replaceAll(',', ' •')}
                </p>

                {typeof offer?.campaign_description === 'string' && offer.campaign_description.trim() && (
                  <div className={cn('mt-4 rounded-2xl border px-4 py-3', isDark ? 'bg-card border-border' : 'bg-secondary/80 border-border')}>
                    <p className={cn('text-[10px] font-black uppercase tracking-[0.16em] opacity-50 mb-1', textColor)}>Campaign brief</p>
                    <p className={cn('text-[12px] font-semibold leading-relaxed whitespace-pre-wrap', isDark ? 'text-foreground/80' : 'text-muted-foreground')}>
                      {offer.campaign_description.trim()}
                    </p>
                  </div>
                )}

                <div className={cn('flex items-center gap-3 w-full border-t pt-4 mt-5', isDark ? 'border-border' : 'border-border')}>
                  <Avatar className={cn('w-11 h-11 border shadow-sm', isDark ? 'border-border' : 'border-border')}>
                    <AvatarImage src={offer?.profiles?.avatar_url || offer?.profiles?.profile_image_url || ''} alt={creatorName || 'Creator'} />
                    <AvatarFallback className={cn(isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}>
                      {(creatorName || 'C').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn('text-[15px] font-black tracking-tight truncate', textColor)}>{creatorName || 'Creator'}</p>
                      <ShieldCheck className="w-4 h-4 text-info" strokeWidth={2.5} />
                    </div>
                    <p className={cn('text-[11px] font-semibold mt-0.5', secondaryTextColor)}>Verified Creator</p>
                  </div>
                </div>
              </div>
            </div>
          </DealCard>

          {/* Progress */}
          <div ref={progressSectionRef} className="mb-6">
            <SectionTitle>Timeline</SectionTitle>
            <DealCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className={cn('text-[14px] font-black', textColor)}>Deal progress</p>
                  <p className={cn('text-[12px] font-semibold', secondaryTextColor)}>{dealUi.label}</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['Contract', 'Signed', 'Create', 'Deliver', 'Done'].map((step, idx) => (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={cn('h-2 w-full rounded-full', idx <= dealUi.stepIndex ? (isDark ? 'bg-gradient-to-r from-emerald-400 to-sky-400' : 'bg-gradient-to-r from-emerald-500 to-sky-500') : (isDark ? 'bg-secondary/50' : 'bg-background'))} />
                      <span className={cn('text-[10px] font-black tracking-tight text-center', idx <= dealUi.stepIndex ? textColor : secondaryTextColor)}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DealCard>
          </div>

          {/* Quick info */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <DealCard>
              <div className="p-4">
                <p className={cn('text-[11px] font-black uppercase tracking-wider mb-2 opacity-50', textColor)}>
                  {requiresPayment ? 'Payout method' : requiresShipping ? 'Fulfillment' : 'Deal type'}
                </p>
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-primary/15' : 'bg-primary/10')}>
                    <Landmark className={cn('w-4 h-4', isDark ? 'text-primary' : 'text-primary')} />
                  </div>
                  <span className={cn('text-[14px] font-black leading-tight', textColor)}>
                    {requiresPayment ? 'UPI' : requiresShipping ? 'Product' : 'Collab'}
                    <br />
                    {requiresPayment ? 'Default payout' : requiresShipping ? 'Shipping required' : 'No payout needed'}
                  </span>
                </div>
              </div>
            </DealCard>
            <DealCard>
              <div className="p-4">
                <p className={cn('text-[11px] font-black uppercase tracking-wider mb-2 opacity-50', textColor)}>Deadline</p>
                <p className={cn('text-[14px] font-black leading-tight', textColor)}>{deadlineText}</p>
                <span className={cn('text-[11px] font-black tracking-tight flex items-center mt-2', dueTone)}>
                  ⚡ {diffDays === null ? 'No deadline set' : diffDays > 0 ? `${diffDays} days remaining` : 'Overdue'}
                </span>
              </div>
            </DealCard>
          </div>

	          {/* Contract */}
	          <div ref={contractSectionRef} className="mb-6">
	            <SectionTitle>Contract</SectionTitle>
	            <DealCard>
	              <div className="p-5">
	                {(() => {
	                  const isSignedStage =
	                    normalizedDealStatus === 'FULLY_EXECUTED' ||
	                    normalizedDealStatus === 'CONTENT_MAKING' ||
	                    normalizedDealStatus === 'CONTENT_DELIVERED' ||
	                    normalizedDealStatus === 'COMPLETED';
		                  const contractTitle = isSignedStage
		                    ? 'Signed and active'
		                    : normalizedDealStatus === 'AWAITING_BRAND_SIGNATURE'
		                      ? 'Your signature required'
		                      : normalizedDealStatus === 'AWAITING_CREATOR_SIGNATURE'
		                        ? 'Waiting for creator signature'
		                        : (normalizedDealStatus === 'CONTRACT_READY' || normalizedDealStatus === 'SENT')
		                          ? (contractUrl ? 'Ready for signature' : 'Contract is being prepared')
		                        : contractUrl
		                          ? 'Ready for review'
		                          : 'Contract is being prepared';
	                  const contractDescription = isSignedStage
	                    ? 'Next: confirm deliverables and execution timeline.'
	                    : normalizedDealStatus === 'AWAITING_BRAND_SIGNATURE'
	                      ? 'Open the contract and sign to start the collaboration.'
	                      : normalizedDealStatus === 'AWAITING_CREATOR_SIGNATURE'
	                        ? 'You’ve signed. We’ll notify you once the creator signs.'
	                        : contractUrl
	                          ? 'Open the protected contract view or copy the link.'
	                          : 'Generate the agreement to lock terms and start execution.';
	                  const badgeText = isSignedStage
	                    ? 'SIGNED'
	                    : normalizedDealStatus === 'AWAITING_BRAND_SIGNATURE'
	                      ? 'READY'
	                      : contractUrl
	                        ? 'READY'
	                        : 'PENDING';
	                  const badgeTone = isSignedStage
	                    ? (isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary')
	                    : contractUrl
	                      ? (isDark ? 'bg-info/10 text-info border-sky-500/20' : 'bg-info text-info border-sky-200')
	                      : (isDark ? 'bg-warning/10 text-warning border-warning/20' : 'bg-warning text-warning border-warning');
	                  return (
	                    <div className="flex items-start justify-between gap-3 mb-4">
	                      <div className="min-w-0">
	                        <p className={cn('text-[16px] font-black leading-tight', textColor)}>{contractTitle}</p>
	                        <p className={cn('text-[12px] font-semibold mt-1', secondaryTextColor)}>{contractDescription}</p>
	                      </div>
	                      <span className={cn('px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border', badgeTone)}>
	                        {badgeText}
	                      </span>
	                    </div>
	                  );
	                })()}

	                <div className={cn('rounded-2xl border px-4 py-3 mb-4', isDark ? 'bg-card border-border' : 'bg-background border-border')}>
	                  <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Document</p>
                  <p className={cn('text-[13px] font-bold truncate', textColor)}>
                    {contractUrl ? decodeURIComponent(String(contractUrl).split('/').pop() || 'collaboration-contract.pdf') : 'Contract will appear here'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={openContract}
                    disabled={isOpeningContract || isGeneratingContract}
                    className={cn(
                      'h-12 rounded-2xl font-black text-[13px] border transition active:scale-[0.98] disabled:opacity-60',
                      isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
                    )}
                  >
                    Open
                  </button>
                  <button type="button"
                    onClick={copyDealLink}
                    disabled={isOpeningContract || isGeneratingContract}
                    className={cn(
                      'h-12 rounded-2xl font-black text-[13px] border transition active:scale-[0.98] disabled:opacity-60',
                      isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
                    )}
                  >
                    Copy Link
                  </button>
                </div>

                {!contractUrl && (
                  <button type="button"
                    onClick={generateContract}
                    disabled={isOpeningContract || isGeneratingContract}
                    className={cn(
                      'mt-3 h-12 w-full rounded-2xl font-black text-[13px] transition active:scale-[0.98] disabled:opacity-60',
                      'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground shadow-[0_10px_35px_rgba(16,185,129,0.20)]'
                    )}
                  >
                    Generate Contract
                  </button>
                )}
              </div>
            </DealCard>
          </div>

          {/* Deliverables */}
          <div ref={deliverablesSectionRef} className="mb-6">
            <SectionTitle>Deliverables</SectionTitle>
            <div className="flex flex-wrap gap-3">
              {String(deliverables)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .map((item, index) => (
                  <Pill key={`${item}-${index}`}>{item}</Pill>
                ))}
            </div>
          </div>

          {requiresShipping && (
            <div className="mb-6">
              <SectionTitle>Shipping</SectionTitle>
              <DealCard>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={cn('text-[18px] font-black tracking-tight', textColor)}>Product fulfillment</p>
                      <p className={cn('text-[13px] font-semibold mt-1', secondaryTextColor)}>
                        Shipping is tracked separately from content and payment.
                      </p>
                    </div>
                    <span className={cn(
                      'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border',
                      shippingDelivered
                        ? (isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary')
                        : shippingStatus === 'shipped'
                          ? (isDark ? 'bg-info/10 text-info border-sky-500/20' : 'bg-info text-info border-sky-200')
                          : (isDark ? 'bg-warning/10 text-warning border-warning/20' : 'bg-warning text-warning border-warning')
                    )}>
                      {shippingDelivered ? 'DELIVERED' : shippingStatus === 'shipped' ? 'SHIPPED' : 'PENDING'}
                    </span>
                  </div>

                  {(courierName || trackingNumber || trackingUrl || expectedDeliveryDate) && (
                    <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-secondary/3 border-border' : 'bg-card border-border')}>
                      {courierName && (
                        <div>
                          <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Courier</p>
                          <p className={cn('text-[13px] font-semibold', textColor)}>{courierName}</p>
                        </div>
                      )}
                      {trackingNumber && (
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50', textColor)}>Tracking</p>
                            <button type="button"
                              onClick={() => { void copyText(trackingNumber, 'Tracking number'); }}
                              className={cn('text-[11px] font-black uppercase tracking-wider', isDark ? 'text-info' : 'text-info')}
                            >
                              Copy
                            </button>
                          </div>
                          <p className={cn('text-[13px] font-semibold break-all', textColor)}>{trackingNumber}</p>
                        </div>
                      )}
                      {expectedDeliveryDate && (
                        <div>
                          <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Expected delivery</p>
                          <p className={cn('text-[13px] font-semibold', textColor)}>
                            {new Date(expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {trackingUrl && (
                        <a href={trackingUrl} target="_blank" rel="noreferrer" className={cn('inline-flex items-center gap-2 text-[13px] font-bold underline', isDark ? 'text-info' : 'text-info')}>
                          <FileText className="w-4 h-4" />
                          Open tracking link
                        </a>
                      )}
                    </div>
                  )}

                  {!shippingDelivered && (
                    !showShippingBox ? (
                      <button type="button"
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setCourierNameDraft(courierName);
                          setTrackingNumberDraft(trackingNumber);
                          setTrackingUrlDraft(trackingUrl);
                          setExpectedDeliveryDateDraft(expectedDeliveryDate ? expectedDeliveryDate.slice(0, 10) : '');
                          setShowShippingBox(true);
                        }}
                        className={cn('h-12 w-full rounded-2xl font-black text-[13px] transition active:scale-[0.98]', 'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground')}
                      >
                        {shippingStatus === 'shipped' ? 'Update shipping' : 'Add shipping details'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className={cn('text-[12px] font-black mb-2', textColor)}>Courier name</p>
                          <input
                            value={courierNameDraft}
                            onChange={(e) => setCourierNameDraft(e.target.value)}
                            placeholder="Blue Dart, Delhivery, DHL..."
                            className={cn('w-full h-12 rounded-2xl px-4 text-[13px] font-semibold outline-none border', isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-background border-border text-muted-foreground placeholder:text-muted-foreground')}
                          />
                        </div>
                        <div>
                          <p className={cn('text-[12px] font-black mb-2', textColor)}>Tracking number (required)</p>
                          <input
                            value={trackingNumberDraft}
                            onChange={(e) => setTrackingNumberDraft(e.target.value)}
                            placeholder="Enter shipment tracking number"
                            className={cn('w-full h-12 rounded-2xl px-4 text-[13px] font-semibold outline-none border', isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-background border-border text-muted-foreground placeholder:text-muted-foreground')}
                          />
                        </div>
                        <div>
                          <p className={cn('text-[12px] font-black mb-2', textColor)}>Tracking URL (optional)</p>
                          <input
                            value={trackingUrlDraft}
                            onChange={(e) => setTrackingUrlDraft(e.target.value)}
                            placeholder="https://..."
                            className={cn('w-full h-12 rounded-2xl px-4 text-[13px] font-semibold outline-none border', isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-background border-border text-muted-foreground placeholder:text-muted-foreground')}
                          />
                        </div>
                        <div>
                          <p className={cn('text-[12px] font-black mb-2', textColor)}>Expected delivery (optional)</p>
                          <input
                            type="date"
                            value={expectedDeliveryDateDraft}
                            onChange={(e) => setExpectedDeliveryDateDraft(e.target.value)}
                            className={cn('w-full h-12 rounded-2xl px-4 text-[13px] font-semibold outline-none border', isDark ? 'bg-card border-border text-foreground' : 'bg-background border-border text-muted-foreground')}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button"
                            onClick={() => {
                              triggerHaptic(HapticPatterns.light);
                              setShowShippingBox(false);
                            }}
                            className={cn('h-11 rounded-2xl font-black text-[12px] border transition active:scale-[0.98]', isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background')}
                          >
                            Cancel
                          </button>
                          <button type="button"
                            onClick={updateShipping}
                            disabled={isUpdatingShipping}
                            className={cn('h-11 rounded-2xl font-black text-[12px] transition active:scale-[0.98] disabled:opacity-60', 'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground')}
                          >
                            {isUpdatingShipping ? 'Saving…' : shippingStatus === 'shipped' ? 'Update shipping' : 'Mark as shipped'}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </DealCard>
            </div>
          )}

          {/* Content delivery + review */}
          {(normalizedDealStatus === 'CONTENT_MAKING' ||
            normalizedDealStatus === 'CONTENT_DELIVERED' ||
            normalizedDealStatus === 'REVISION_REQUESTED' ||
            normalizedDealStatus === 'REVISION_DONE' ||
            normalizedDealStatus === 'CONTENT_APPROVED' ||
            normalizedDealStatus === 'PAYMENT_RELEASED' ||
            normalizedDealStatus === 'COMPLETED') && (
            <div ref={contentSectionRef} className="mb-6">
              <SectionTitle>{canReviewContent ? 'Content Review' : 'Content'}</SectionTitle>
              <DealCard>
                <div className="p-5">
                  {(() => {
                    const contentUrl = String(offer?.content_submission_url || offer?.content_url || '').trim();
                    const caption = String(offer?.content_caption || '').trim();
                    const drive = String(offer?.content_drive_link || '').trim();
                    const notes = String(offer?.content_notes || '').trim();
                    const deliveryStatusRaw = String(offer?.content_delivery_status || '').trim().toLowerCase();
                    const deliveryStatus = deliveryStatusRaw === 'posted' ? 'posted' : deliveryStatusRaw === 'draft' ? 'draft' : '';
                    const feedback = String(offer?.brand_feedback || '').trim();

                    const canReview = canReviewContent;
                    const waitingRevision =
                      normalizedDealStatus === 'REVISION_REQUESTED' ||
                      (normalizedDealStatus === 'CONTENT_MAKING' && String(offer?.brand_approval_status || '').toLowerCase().includes('changes_requested'));
                    const isCompleted = normalizedDealStatus === 'COMPLETED';
                    const isDisputed = normalizedDealStatus === 'DISPUTED';

                    const linksFromDeal = Array.isArray((offer as any)?.content_links) ? ((offer as any)?.content_links as any[]) : [];
                    const contentLinks = Array.from(
                      new Set(
                        [contentUrl, ...linksFromDeal.map((v) => String(v || '').trim()), drive]
                          .map((v) => String(v || '').trim())
                          .filter(Boolean)
                      )
                    );

                    return (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cn('text-[16px] font-black leading-tight', textColor)}>
                              {isDisputed ? 'Issue raised' : isCompleted ? 'Completed' : canReview ? 'Review content' : waitingRevision ? 'Revision requested' : 'In progress'}
                            </p>
                            <p className={cn('text-[12px] font-semibold mt-1', secondaryTextColor)}>
                              {normalizedDealStatus === 'CONTENT_MAKING'
                                ? waitingRevision
                                  ? 'Waiting for creator to submit the updated links.'
                                  : 'Waiting for creator to deliver the content links.'
                                : canReview
                                  ? 'Open the links, then approve, request a revision, or raise an issue.'
                                  : waitingRevision
                                    ? 'Waiting for creator to submit a revision.'
                                    : isCompleted
                                      ? 'Content approved. Deal completed.'
                                      : isDisputed
                                        ? 'This deal is in dispute.'
                                        : '—'}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border',
                              canReview
                                ? (isDark ? 'bg-warning/10 text-warning border-warning/20' : 'bg-warning text-warning border-warning')
                                : isCompleted
                                  ? (isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary')
                                  : isDisputed
                                    ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200')
                                    : waitingRevision
                                      ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200')
                                      : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-background text-muted-foreground border-border')
                            )}
                          >
                            {canReview ? 'NEEDS REVIEW' : isCompleted ? 'COMPLETED' : isDisputed ? 'DISPUTED' : waitingRevision ? 'REVISION' : 'WAITING'}
                          </span>
                        </div>

                        <div className={cn('rounded-2xl border px-4 py-3', isDark ? 'bg-card border-border' : 'bg-background border-border')}>
                          <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Content Links</p>
                          {contentLinks.length ? (
                            <div className="space-y-2">
                              {contentLinks.map((link, index) => (
                                <a
                                  key={`${link}-${index}`}
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn('text-[13px] font-bold break-all underline block', isDark ? 'text-info' : 'text-info')}
                                >
                                  {link}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className={cn('text-[13px] font-bold', secondaryTextColor)}>Not submitted yet</p>
                          )}
                        </div>

                        {(caption || notes || deliveryStatus) && (
                          <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-secondary/3 border-border' : 'bg-card border-border')}>
                            {deliveryStatus && (
                              <div>
                                <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Status</p>
                                <p className={cn('text-[13px] font-semibold', isDark ? 'text-foreground/80' : 'text-muted-foreground')}>
                                  {deliveryStatus === 'posted' ? 'Already posted' : 'Draft for review'}
                                </p>
                              </div>
                            )}
                            {caption && (
                              <div>
                                <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Caption</p>
                                <p className={cn('text-[13px] font-semibold whitespace-pre-wrap', isDark ? 'text-foreground/80' : 'text-muted-foreground')}>{caption}</p>
                              </div>
                            )}
                            {notes && (
                              <div>
                                <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Message</p>
                                <p className={cn('text-[13px] font-semibold whitespace-pre-wrap', isDark ? 'text-foreground/80' : 'text-muted-foreground')}>{notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {feedback && (
                          <div className={cn('rounded-2xl border p-4', isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200')}>
                            <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', isDark ? 'text-rose-200' : 'text-rose-700')}>Revision note</p>
                            <p className={cn('text-[13px] font-semibold whitespace-pre-wrap', isDark ? 'text-rose-100/90' : 'text-rose-700')}>{feedback}</p>
                          </div>
                        )}

                        {requiresPayment && (canReleasePayment || normalizedDealStatus === 'PAYMENT_RELEASED' || normalizedDealStatus === 'COMPLETED') && (
                          <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-card border-border' : 'bg-card border-border')}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className={cn('text-[16px] font-black leading-tight', textColor)}>
                                  {normalizedDealStatus === 'PAYMENT_RELEASED' || normalizedDealStatus === 'COMPLETED' ? 'Payment proof submitted' : 'Release payment'}
                                </p>
                                <p className={cn('text-[12px] font-semibold mt-1', secondaryTextColor)}>
                                  {normalizedDealStatus === 'PAYMENT_RELEASED' || normalizedDealStatus === 'COMPLETED'
                                    ? 'Payment evidence recorded for this collaboration.'
                                    : 'Add the payment reference before marking payment as released.'}
                                </p>
                              </div>
                              <span className={cn(
                                'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border',
                                normalizedDealStatus === 'PAYMENT_RELEASED' || normalizedDealStatus === 'COMPLETED'
                                  ? (isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary')
                                  : (isDark ? 'bg-warning/10 text-warning border-warning/20' : 'bg-warning text-warning border-warning')
                              )}>
                                {normalizedDealStatus === 'PAYMENT_RELEASED' || normalizedDealStatus === 'COMPLETED' ? 'RECORDED' : 'REQUIRED'}
                              </span>
                            </div>

                            <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-primary/5 border-primary/15' : 'bg-primary/70 border-primary')}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-60 mb-1', textColor)}>Pay creator</p>
                                  <p className={cn('text-[14px] font-black', textColor)}>UPI payout details</p>
                                  <p className={cn('text-[12px] font-semibold mt-1', secondaryTextColor)}>Use this UPI ID when sending payment for this collaboration.</p>
                                </div>
                                <span className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border', isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-card text-primary border-primary')}>
                                  UPI
                                </span>
                              </div>

                              <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-secondary/3 border-border' : 'bg-card border-primary')}>
                                <div>
                                  <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Payee name</p>
                                  <p className={cn('text-[13px] font-semibold break-all', textColor)}>{creatorPayeeName || 'Creator'}</p>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between gap-3 mb-1">
                                    <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50', textColor)}>UPI ID</p>
                                    {creatorUpiId && (
                                      <button type="button"
                                        onClick={() => { void copyText(creatorUpiId, 'UPI ID'); }}
                                        className={cn('text-[11px] font-black uppercase tracking-wider', isDark ? 'text-info' : 'text-info')}
                                      >
                                        Copy
                                      </button>
                                    )}
                                  </div>
                                  <p className={cn('text-[13px] font-semibold break-all', textColor)}>{creatorUpiId || 'Creator has not added a UPI ID yet'}</p>
                                </div>
                              </div>
                            </div>

                            {(paymentReference || paymentReceivedDate || paymentProofUrl || paymentNotes) && (
                              <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-secondary/3 border-border' : 'bg-background border-border')}>
                                {paymentReference && (
                                  <div>
                                    <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Reference</p>
                                    <p className={cn('text-[13px] font-semibold break-all', textColor)}>{paymentReference}</p>
                                  </div>
                                )}
                                {paymentReceivedDate && (
                                  <div>
                                    <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Paid on</p>
                                    <p className={cn('text-[13px] font-semibold', textColor)}>
                                      {new Date(paymentReceivedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                )}
                                {paymentNotes && (
                                  <div>
                                    <p className={cn('text-[11px] font-black uppercase tracking-wider opacity-50 mb-1', textColor)}>Notes</p>
                                    <p className={cn('text-[13px] font-semibold whitespace-pre-wrap', textColor)}>{paymentNotes}</p>
                                  </div>
                                )}
                                {paymentProofUrl && (
                                  <a
                                    href={paymentProofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn('inline-flex items-center gap-2 text-[13px] font-bold underline', isDark ? 'text-info' : 'text-info')}
                                  >
                                    <FileText className="w-4 h-4" />
                                    View payment proof
                                  </a>
                                )}
                              </div>
                            )}

                            {canReleasePayment && (
                              <>
                                {!showPaymentProofBox ? (
                                  <button type="button"
                                    onClick={() => {
                                      triggerHaptic(HapticPatterns.light);
                                      if (!creatorUpiId) {
                                        toast.error('Creator UPI ID missing', { description: 'Ask the creator to add a UPI ID before releasing payment.' });
                                        return;
                                      }
                                      setShowPaymentProofBox(true);
                                    }}
                                    className={cn('h-12 w-full rounded-2xl font-black text-[13px] transition active:scale-[0.98]', 'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground')}
                                  >
                                    Add payment proof
                                  </button>
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <p className={cn('text-[12px] font-black mb-2', textColor)}>Payment reference / UTR (required)</p>
                                      <input
                                        value={paymentReferenceDraft}
                                        onChange={(e) => setPaymentReferenceDraft(e.target.value)}
                                        placeholder="Enter UTR, bank ref, or transaction id"
                                        className={cn('w-full h-12 rounded-2xl px-4 text-[13px] font-semibold outline-none border', isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-background border-border text-muted-foreground placeholder:text-muted-foreground')}
                                      />
                                    </div>
                                    <div>
                                      <p className={cn('text-[12px] font-black mb-2', textColor)}>Payment date</p>
                                      <input
                                        type="date"
                                        value={paymentDateDraft}
                                        onChange={(e) => setPaymentDateDraft(e.target.value)}
                                        className={cn('w-full h-12 rounded-2xl px-4 text-[13px] font-semibold outline-none border', isDark ? 'bg-card border-border text-foreground' : 'bg-background border-border text-muted-foreground')}
                                      />
                                    </div>
                                    <div>
                                      <p className={cn('text-[12px] font-black mb-2', textColor)}>Receipt / screenshot (optional)</p>
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null;
                                          if (file && file.size > 5 * 1024 * 1024) {
                                            toast.error('Receipt must be 5 MB or smaller');
                                            e.target.value = '';
                                            return;
                                          }
                                          setPaymentProofFile(file);
                                        }}
                                        className={cn('block w-full text-[12px] font-semibold', isDark ? 'text-foreground/80 file:text-foreground' : 'text-muted-foreground')}
                                      />
                                      {paymentProofFile && (
                                        <p className={cn('text-[11px] font-semibold mt-2', secondaryTextColor)}>{paymentProofFile.name}</p>
                                      )}
                                    </div>
                                    <div>
                                      <p className={cn('text-[12px] font-black mb-2', textColor)}>Notes (optional)</p>
                                      <textarea
                                        value={paymentNotesDraft}
                                        onChange={(e) => setPaymentNotesDraft(e.target.value)}
                                        placeholder="Add bank/account/payment notes"
                                        className={cn('w-full min-h-[92px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none border resize-none', isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-background border-border text-muted-foreground placeholder:text-muted-foreground')}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button type="button"
                                        onClick={() => {
                                          triggerHaptic(HapticPatterns.light);
                                          setShowPaymentProofBox(false);
                                        }}
                                        className={cn('h-11 rounded-2xl font-black text-[12px] border transition active:scale-[0.98]', isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background')}
                                      >
                                        Cancel
                                      </button>
                                      <button type="button"
                                        onClick={releasePayment}
                                        disabled={isReleasingPayment}
                                        className={cn('h-11 rounded-2xl font-black text-[12px] transition active:scale-[0.98] disabled:opacity-60', 'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground')}
                                      >
                                        {isReleasingPayment ? 'Saving…' : 'Release payment'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {canReview && (
                          <div className="space-y-2">
                            <button type="button"
                              onClick={approveContent}
                              disabled={isReviewingContent}
                              className={cn(
                                'h-12 w-full rounded-2xl font-black text-[13px] transition active:scale-[0.98] disabled:opacity-60',
                                'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground'
                              )}
                            >
                              {isReviewingContent ? 'Saving…' : 'Approve content'}
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button"
                                onClick={() => {
                                  triggerHaptic(HapticPatterns.light);
                                  setShowRevisionBox((v) => !v);
                                  setShowDisputeBox(false);
                                }}
                                disabled={isReviewingContent}
                                className={cn(
                                  'h-12 rounded-2xl font-black text-[13px] border transition active:scale-[0.98] disabled:opacity-60',
                                  isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
                                )}
                              >
                                Request revision
                              </button>
                              <button type="button"
                                onClick={() => {
                                  triggerHaptic(HapticPatterns.light);
                                  setShowDisputeBox((v) => !v);
                                  setShowRevisionBox(false);
                                }}
                                disabled={isReviewingContent}
                                className={cn(
                                  'h-12 rounded-2xl font-black text-[13px] border transition active:scale-[0.98] disabled:opacity-60',
                                  isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-200 hover:bg-rose-500/15' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                )}
                              >
                                Raise issue
                              </button>
                            </div>
                          </div>
                        )}

                        {showRevisionBox && (
                          <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-card border-border' : 'bg-card border-border')}>
                            <p className={cn('text-[12px] font-black', textColor)}>Revision note (required)</p>
                            <textarea
                              value={revisionFeedbackDraft}
                              onChange={(e) => setRevisionFeedbackDraft(e.target.value)}
                              placeholder="What should the creator change?"
                              className={cn(
                                'w-full min-h-[92px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none border resize-none',
                                isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-background border-border text-muted-foreground placeholder:text-muted-foreground'
                              )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button"
                                onClick={() => {
                                  triggerHaptic(HapticPatterns.light);
                                  setShowRevisionBox(false);
                                }}
                                className={cn(
                                  'h-11 rounded-2xl font-black text-[12px] border transition active:scale-[0.98]',
                                  isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
                                )}
                              >
                                Cancel
                              </button>
                              <button type="button"
                                onClick={requestRevision}
                                disabled={isReviewingContent}
                                className={cn(
                                  'h-11 rounded-2xl font-black text-[12px] transition active:scale-[0.98] disabled:opacity-60',
                                  isDark ? 'bg-rose-600 text-foreground' : 'bg-rose-600 text-foreground'
                                )}
                              >
                                {isReviewingContent ? 'Sending…' : 'Send note'}
                              </button>
                            </div>
                          </div>
                        )}

                        {showDisputeBox && (
                          <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200')}>
                            <p className={cn('text-[12px] font-black', isDark ? 'text-rose-200' : 'text-rose-700')}>Issue details (optional)</p>
                            <textarea
                              value={disputeNotesDraft}
                              onChange={(e) => setDisputeNotesDraft(e.target.value)}
                              placeholder="What went wrong? Add any context for support."
                              className={cn(
                                'w-full min-h-[92px] rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none border resize-none',
                                isDark ? 'bg-card border-border text-foreground placeholder:text-foreground/30' : 'bg-card border-rose-200 text-muted-foreground placeholder:text-muted-foreground'
                              )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button"
                                onClick={() => {
                                  triggerHaptic(HapticPatterns.light);
                                  setShowDisputeBox(false);
                                }}
                                className={cn(
                                  'h-11 rounded-2xl font-black text-[12px] border transition active:scale-[0.98]',
                                  isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-rose-200 text-rose-700 hover:bg-rose-100'
                                )}
                              >
                                Cancel
                              </button>
                              <button type="button"
                                onClick={raiseDispute}
                                disabled={isReviewingContent}
                                className={cn(
                                  'h-11 rounded-2xl font-black text-[12px] transition active:scale-[0.98] disabled:opacity-60',
                                  'bg-rose-600 text-foreground'
                                )}
                              >
                                {isReviewingContent ? 'Saving…' : 'Raise issue'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </DealCard>
            </div>
          )}

          {/* Usage rights */}
          <div className="mb-6">
            <SectionTitle>Usage Rights</SectionTitle>
            <DealCard>
              <div className="p-5">
                <p className={cn('text-[14px] font-black leading-tight', textColor)}>{usageRights}</p>
                <p className={cn('text-[12px] font-semibold mt-1', secondaryTextColor)}>{usageDuration}</p>
              </div>
            </DealCard>
          </div>

          {/* Legal protection */}
          <div className="mb-6">
            <SectionTitle>Legal Protection</SectionTitle>
            <div className={cn('rounded-3xl border p-5 relative overflow-hidden', isDark ? 'bg-primary/8 border-primary/20' : 'bg-primary border-primary')}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/12 to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-[0_6px_18px_rgba(16,185,129,0.28)]">
                  <ShieldCheck className="w-6 h-6 text-foreground" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-black text-[15px] leading-tight', isDark ? 'text-primary' : 'text-primary')}>Protected by Creator Armour</p>
                  <p className={cn('text-[12px] font-semibold mt-1', isDark ? 'text-primary/70' : 'text-primary/80')}>Contract + rights + dispute support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky action CTA */}
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-[220] border-t',
            isDark ? 'bg-[#061318] border-border' : 'bg-card border-border'
          )}
        >
          <div
            className="max-w-md md:max-w-2xl mx-auto px-5 pt-4"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
          >
	            <motion.button
	              whileTap={{ scale: 0.98 }}
	              onClick={onPrimaryCta}
	              disabled={isOpeningContract || isGeneratingContract || primaryCta.disabled}
	              className={cn(
	                'w-full h-14 rounded-2xl shadow-[0_14px_45px_rgba(2,6,23,0.22)] transition-all flex items-center justify-center active:scale-[0.99] disabled:opacity-60',
	                dealPrimaryCtaButtonClass(primaryCta.tone),
	                primaryCta.disabled && 'cursor-not-allowed active:scale-100'
	              )}
	            >
	              <span className="text-[16px] font-black">
	                {isOpeningContract ? 'Opening…' : isGeneratingContract ? 'Generating…' : primaryCta.label}
	              </span>
	            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderNotificationSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pb-20"
    >
      <PageHeader title="Notifications" />
      <div className="px-5 space-y-6">
        <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-card divide-[#2C2C2E]' : 'bg-card divide-[#E5E5EA] shadow-sm', 'divide-y')}>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-info/20 text-info' : 'bg-info/15 text-info')}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Push Alerts</p>
                <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Active on this device' : 'Receive deal updates'}</p>
              </div>
            </div>
            <button type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (isPushSubscribed) {
                  toast.info('To disable, please use your browser settings.');
                } else {
                  await handleEnablePush();
                }
              }}
              className={cn(
                'w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out',
                isPushSubscribed ? 'bg-primary' : isDark ? 'bg-[#39393D]' : 'bg-[#E9E9EB]'
              )}
            >
              <motion.div
                animate={{ x: isPushSubscribed ? 22 : 2 }}
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow-md"
              />
            </button>
          </div>

          {isPushSubscribed && (
            <button type="button"
              disabled={isPushBusy}
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                const res = await sendTestPush();
                if (res.success) toast.success('Test notification sent!');
                else toast.error('Failed: ' + res.reason);
              }}
              className={cn('w-full py-4 text-[13px] font-bold text-center transition-all active:bg-opacity-50', isDark ? 'text-info active:bg-card' : 'text-info active:bg-background')}
            >
              {isPushBusy ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}
        </div>

        <div className={cn('p-5 rounded-[24px] border', borderColor, isDark ? 'bg-card' : 'bg-card shadow-sm')}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-40 mb-1', textColor)}>Current Status</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <p className={cn('text-[12px]', textColor)}>
                  <span className="opacity-50">Supported:</span> {isPushSupported ? 'Yes' : 'No'}
                </p>
                <p className={cn('text-[12px]', textColor)}>
                  <span className="opacity-50">Permission:</span> {pushPermission}
                </p>
              </div>
            </div>
            <button type="button"
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                await refreshPushStatus();
                toast.success('Status refreshed');
              }}
              className={cn('p-2 rounded-xl border transition-all active:scale-95', isDark ? 'border-border bg-card' : 'border-border bg-card')}
            >
              <RefreshCw className={cn('w-4 h-4 opacity-60', textColor)} />
            </button>
          </div>
          {isIOSNeedsInstall && (
            <p className={cn('text-[12px] opacity-60', isDark ? 'text-warning/80' : 'text-warning')}>
              iOS requires “Add to Home Screen” to support push notifications.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const showPushPrompt =
    isPushSupported &&
    hasVapidKey &&
    !isPushSubscribed &&
    !isPushPromptDismissed &&
    !pushPromptDismissedLocal &&
    activeTab === 'dashboard' &&
    !activeSettingsPage;

  const renderBrandSigningPortal = (): ReactNode => {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <AnimatePresence>
        {showBrandSigningModal && (
          <>
            <motion.div
              key="brandSigningOverlay"
              data-brand-signing-overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[40000] bg-black/70 backdrop-blur-xl"
            />
            <div
              key="brandSigningPanelWrap"
              data-brand-signing-panel
              className="fixed left-1/2 top-1/2 z-[40010] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                className="rounded-3xl border border-border bg-neutral-950/95 text-foreground shadow-2xl shadow-black/60 overflow-hidden"
              >
              <div className="px-6 pt-6 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground/50">Contract</p>
                    <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                      <FileText className="w-5 h-5 text-info" />
                      Sign Agreement
                    </h3>
                    <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                      {brandSigningStep === 'send'
                        ? 'We will send a secure OTP to your email to verify your identity and sign the contract.'
                        : 'Enter the 6-digit code sent to your email to complete signing.'}
                    </p>
                  </div>
                  <button type="button"
                    onClick={closeBrandSigningModal}
                    className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary/50 flex items-center justify-center"
                    aria-label="Close"
                  >
                    <ChevronRight className="w-4 h-4 rotate-45 text-foreground/70" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {brandSigningInitError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {brandSigningInitError}
                  </div>
                )}

                {!brandSigningToken && !brandSigningInitError && (
                  <div className="rounded-2xl border border-border bg-card px-4 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-foreground/70" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Preparing signing…</p>
                      <p className="text-xs text-foreground/60">Fetching your secure contract token.</p>
                    </div>
                  </div>
                )}

                {brandSigningToken && brandSigningStep === 'send' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-300 tracking-wide uppercase flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email for OTP
                      </label>
                      <input
                        value={brandSigningEmail}
                        onChange={(e) => setBrandSigningEmail(e.target.value)}
                        placeholder="you@company.com"
                        inputMode="email"
                        autoComplete="email"
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3 text-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 outline-none transition-all placeholder:text-neutral-500"
                      />
                    </div>

                    <motion.button
                      onClick={handleSendBrandOTP}
                      disabled={isSendingBrandOTP || !!brandSigningInitError}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-info hover:bg-info py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                    >
                      {isSendingBrandOTP ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending OTP…
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Send OTP
                        </>
                      )}
                    </motion.button>
                  </>
                )}

                {brandSigningToken && brandSigningStep === 'verify' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-300 tracking-wide uppercase">OTP Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={brandSigningOtp}
                        onChange={(e) => setBrandSigningOtp(e.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3.5 text-center text-3xl tracking-[0.32em] font-mono text-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 outline-none transition-all placeholder:text-neutral-500 placeholder:tracking-normal"
                      />
                      <p className="text-xs text-neutral-400">Code expires in 10 minutes.</p>
                    </div>

                    <motion.button
                      onClick={handleVerifyAndSignBrand}
                      disabled={isVerifyingBrandOTP || isSigningBrandContract || brandSigningOtp.replace(/\D/g, '').length !== 6}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary hover:bg-primary py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                    >
                      {isVerifyingBrandOTP || isSigningBrandContract ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isSigningBrandContract ? 'Signing…' : 'Verifying…'}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Verify & Sign
                        </>
                      )}
                    </motion.button>

                    <button type="button"
                      onClick={() => {
                        setBrandSigningStep('send');
                        setBrandSigningOtp('');
                      }}
                      disabled={isVerifyingBrandOTP || isSigningBrandContract}
                      className="w-full text-xs text-neutral-400 hover:text-neutral-200 py-2 transition-all tracking-wide font-semibold"
                    >
                      Resend OTP
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400 border-t border-border px-6 py-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure OTP-based e-signature powered by Creator Armour</span>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  if (selectedDealPage) {
    return (
      <>
        {renderBrandSigningPortal()}
        <BrandDealDetailScreen offer={selectedDealPage} />
      </>
    );
  }

  return (
    <div className={cn('fixed inset-0 font-sans selection:bg-primary/25 overflow-hidden', bgColor, textColor)}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
          <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-primary/20 rounded-full blur-[140px]" />
          <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-info/18 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-primary/12 rounded-full blur-[170px]" />
        </div>
      )}

	      {!isDark && (
	        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
	          <div className="absolute inset-0 bg-background" />
	        </div>
	      )}

      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-[60]"
        style={{ transform: `translateY(${pullDistance - 44}px)`, opacity: pullDistance > 10 ? 1 : 0 }}
      >
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#0B0F14]/90 border-border' : 'bg-secondary/90 border-border')}>
          {isRefreshing ? <Loader2 className={cn('w-5 h-5 animate-spin', isDark ? 'text-foreground/60' : 'text-muted-foreground')} /> : <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-primary/70' : 'bg-primary/70')} />}
        </div>
      </div>

      <div
        className="h-full overflow-y-auto overflow-x-hidden relative z-10 pb-[110px] scrollbar-hide"
        onTouchStart={(e) => {
          if (isRefreshing) return;
          const target = e.currentTarget as HTMLDivElement;
          if (target.scrollTop > 0) return;
          if (e.touches.length !== 1) return;
          setStartY(e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (isRefreshing) return;
          const target = e.currentTarget as HTMLDivElement;
          if (target.scrollTop > 0) return;
          if (startY <= 0) return;
          const dy = e.touches[0].clientY - startY;
          if (dy <= 0) return;
          setPullDistance(Math.min(90, dy));
        }}
        onTouchEnd={async () => {
          if (isRefreshing) return;
          const shouldRefresh = pullDistance > 60;
          setStartY(0);
          setPullDistance(0);
          if (!shouldRefresh || !onRefresh) return;

          setIsRefreshing(true);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
          }
        }}
        onScroll={(e) => {
          if ((e.currentTarget as HTMLDivElement).scrollTop > 10 && pullDistance > 0) {
            setPullDistance(0);
            setStartY(0);
          }
        }}
      >
        <div className="max-w-md md:max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>

              {/* Brand Getting Started Banner — shown when no deals exist */}
              {!isLoading && deals.length === 0 && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-info">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-info flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-muted-foreground">Get started with your first deal</p>
                      <p className="text-[12px] text-muted-foreground">Pick a creator and send a protected offer</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { n: 1, label: 'Find a creator in your niche', action: () => navigate('/discover-creators') },
                      { n: 2, label: 'Send a protected offer', action: () => navigate('/brand-dashboard?tab=creators') },
                      { n: 3, label: 'Track deals and get paid', action: () => navigate('/brand-dashboard?tab=collabs') },
                    ].map(step => (
                      <button
                        key={step.n}
                        onClick={step.action}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-info hover:border-info active:scale-[0.98] transition-all text-left"
                      >
                        <span className="w-6 h-6 rounded-full bg-info text-foreground text-[11px] font-black flex items-center justify-center">{step.n}</span>
                        <span className="text-[13px] font-semibold text-muted-foreground">{step.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <button type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setShowActionSheet(true);
                  }}
                  className={cn('w-10 h-10 -ml-1 rounded-2xl border flex items-center justify-center transition-all active:scale-95', isDark ? 'border-border bg-card text-foreground/70' : 'border-border bg-secondary/80 text-muted-foreground shadow-sm')}
                >
                  <Menu className="w-6 h-6" strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-2 font-semibold text-[16px] tracking-tight">
                  <Shield className={cn('w-4 h-4', isDark ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={textColor}>Brand Console</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                    }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'flex items-center gap-1 px-2.5 h-10 rounded-2xl border transition-all duration-300',
                      isDark ? 'bg-card border-border text-foreground/70' : 'bg-secondary/80 border-border text-muted-foreground shadow-sm'
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isDark ? (
                        <motion.span
                          key="moon"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="sun"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-[10px] font-bold tracking-wide">{isDark ? 'Dark' : 'Light'}</span>
                  </motion.button>

                  <div className="relative">
                    <button type="button"
                      onClick={() => setNotificationsOpen((v) => !v)}
                      className={cn('relative w-11 h-11 rounded-2xl border flex items-center justify-center transition-all active:scale-95', isDark ? 'border-border bg-card text-foreground/70' : 'border-border bg-secondary/80 text-muted-foreground shadow-sm')}
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 text-[8px] font-black flex items-center justify-center text-foreground"
                          style={{ borderColor: isDark ? '#0B0F14' : '#F9FAFB' }}
                        >
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && (
                      <div
                        className={cn(
                          'absolute right-0 mt-3 w-[300px] max-w-[calc(100vw-32px)] rounded-[24px] border shadow-2xl p-4 z-50 overflow-hidden',
                          isDark
                            ? 'bg-[#0A0A0B]/95 backdrop-blur-xl border-border text-foreground'
                            : 'bg-secondary/95 backdrop-blur-xl border-border/60 text-muted-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className={cn('text-[11px] font-black uppercase tracking-[0.2em]', isDark ? 'text-foreground/40' : 'text-muted-foreground')}>
                            Updates
                          </p>
                          <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', isDark ? 'bg-primary' : 'bg-primary')} />
                        </div>
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                          {notifications.map((n: any) => (
                            <button type="button"
                              key={n.id}
                              onClick={() => {
                                setNotificationsOpen(false);
                                if (n.href) navigate(n.href);
                              }}
	                              className={cn(
	                                'w-full text-left p-3 rounded-2xl border transition-all active:scale-[0.98]',
		                                isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-secondary/80 border-[#E5E5EA] hover:bg-card backdrop-blur-xl'
	                              )}
	                            >
                              <p className={cn('text-[13px] font-bold leading-tight', textColor)}>{n.title}</p>
                              <p className={cn('text-[11px] mt-1 opacity-50', textColor)}>{n.time}</p>
                            </button>
                          ))}
                          {notifications.length === 0 && (
                            <div className={cn('p-6 text-center rounded-2xl border', isDark ? 'border-border bg-card' : 'border-border bg-card')}>
                              <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No updates yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="button"
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setActiveTab('profile');
                    }}
                    className={cn('w-10 h-10 rounded-2xl border overflow-hidden transition-all active:scale-95', borderColor, isDark ? 'bg-card' : 'bg-secondary/80 shadow-sm')}
                  >
                    <img alt={brandName} src={brandLogo} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>

              {activeTab === 'dashboard' && (
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn('text-[12px] font-black uppercase tracking-[0.18em] opacity-35', textColor)}>Welcome back</p>
                    <h1 className={cn('text-[28px] font-semibold tracking-tight leading-tight mt-1', textColor)}>{brandName}</h1>
                    <p className={cn('text-[13px] mt-2 opacity-60', textColor)}>
                      Find creators. Send protected offers. Get quality content.
                    </p>
                  </div>
                </div>
              )}
            </div>

	            <div className="px-5">
	              <>
	              {activeTab === 'dashboard' && (
	                <>
                  {showPushPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'mb-5 p-4 rounded-[24px] border shadow-sm',
                        isDark ? 'bg-card border-border' : 'bg-secondary/80 border-border'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-primary/15' : 'bg-primary/10')}>
                          <Bell className={cn('w-5 h-5', isDark ? 'text-primary' : 'text-primary')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                          <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
                            {isIOSNeedsInstall
                              ? 'On iPhone/iPad, install the app (Add to Home Screen) to receive notifications.'
                              : 'Get notified when creators reply and deals need action.'}
                          </p>
                          {pushPermission === 'denied' && (
                            <p className={cn('text-[12px] mt-2', isDark ? 'text-warning/80' : 'text-warning')}>
                              Notifications are blocked in your browser settings.
                            </p>
                          )}
	                          <div className="flex gap-2 mt-3">
	                            <button
	                              type="button"
	                              disabled={isPushBusy || pushPermission === 'denied' || isIOSNeedsInstall}
	                              onClick={handleEnablePush}
	                              className={primaryButtonClass}
	                            >
	                              Enable
	                            </button>
	                            <button
	                              type="button"
	                              onClick={() => dismissPushPromptPersisted()}
	                              className={secondaryButtonClass}
	                            >
	                              Later
	                            </button>
	                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!hasUploadedBrandLogo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'mb-5 p-4 rounded-[24px] border shadow-sm',
                        isDark ? 'bg-warning/10 border-warning/20' : 'bg-warning/80 border-warning'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-warning/15' : 'bg-warning/10')}>
                          <Camera className={cn('w-5 h-5', isDark ? 'text-warning' : 'text-warning')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[13px] font-bold', textColor)}>Upload your brand logo</p>
                          <p className={cn('text-[12px] mt-1 opacity-70', textColor)}>
                            Required before sending offers—creators respond faster when they recognize you.
                          </p>
	                          <div className="flex gap-2 mt-3">
	                            <button
	                              type="button"
	                              onClick={() => navigate('/brand-settings')}
	                              className={cn('px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest', isDark ? 'bg-secondary/50 text-foreground hover:bg-secondary/15' : 'bg-card text-muted-foreground border border-warning')}
	                            >
	                              Upload logo
	                            </button>
	                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

	                  {(() => {
	                    const activeValue = (activeDealsList || []).reduce((sum: number, d: any) => sum + Number(d?.deal_amount || d?.exact_budget || 0), 0);
	                    const pendingCounterCount = pendingOffersList.filter((r: any) => normalizeStatus(r?.status) === 'countered').length;
                      const offersExpiringSoon = pendingOffersList.filter((r: any) => {
                        const raw = r?.offer_expires_at || r?.expires_at || null;
                        const d = raw ? new Date(raw) : null;
                        if (!d || Number.isNaN(d.getTime())) return false;
                        const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
                        return diffDays >= 0 && diffDays <= 2;
                      }).length;
                      const contractsWaitingSignature = activeDealsList.filter((d: any) => {
                        const s = effectiveDealStatus(d);
                        return s === 'CONTRACT_READY' || s === 'SENT' || s === 'AWAITING_BRAND_SIGNATURE';
                      }).length;
	                    const needsActionDeals = activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction).length;
	                    const needsActionTotal = pendingCounterCount + needsActionDeals;
		                    const contentPendingReview = activeDealsList.filter((d: any) => {
                          const s = effectiveDealStatus(d);
                          return s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE';
                        }).length;
                      const attentionTotal = pendingCounterCount + contractsWaitingSignature + contentPendingReview;
	                    const newToday = activeDealsList.filter((d: any) => {
	                      const created = d?.created_at ? new Date(d.created_at) : null;
	                      if (!created || Number.isNaN(created.getTime())) return false;
	                      const now = new Date();
	                      return created.toDateString() === now.toDateString();
	                    }).length;

	                    return (
	                      <>
                          {attentionTotal > 0 && (
                            <motion.button
                              type="button"
                              onClick={() => {
                                triggerHaptic(HapticPatterns.light);
                                setActiveTab('collabs', 'action_required');
                              }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.02 }}
                              className={cn(
                                'mb-4 w-full text-left p-4 rounded-[24px] border transition-all active:scale-[0.99]',
                                borderColor,
                                isDark ? 'bg-card hover:bg-secondary/[0.07]' : 'bg-secondary/80 backdrop-blur-xl shadow-sm hover:bg-card'
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Needs your attention</p>
                                  <p className={cn('text-[13px] mt-1 font-bold', textColor)}>
                                    {attentionTotal} item{attentionTotal === 1 ? '' : 's'} need your response
                                  </p>
                                </div>
                                <ChevronRight className={cn('w-5 h-5 opacity-30 mt-1', textColor)} />
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {contractsWaitingSignature > 0 && (
                                  <span className={cn('px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-warning/25 bg-warning/10 text-warning' : 'border-warning bg-warning text-warning')}>
                                    {contractsWaitingSignature} waiting for signature
                                  </span>
                                )}
                                {pendingCounterCount > 0 && (
                                  <span className={cn('px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-rose-500/25 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                                    {pendingCounterCount} counter{pendingCounterCount === 1 ? '' : 's'} to review
                                  </span>
                                )}
                                {offersExpiringSoon > 0 && (
                                  <span className={cn('px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-warning/25 bg-warning/10 text-warning' : 'border-warning bg-warning text-warning')}>
                                    {offersExpiringSoon} expiring soon
                                  </span>
                                )}
                                {contentPendingReview > 0 && (
                                  <span className={cn('px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-sky-500/25 bg-info/10 text-info' : 'border-sky-200 bg-info text-info')}>
                                    {contentPendingReview} content to review
                                  </span>
                                )}
                              </div>
                            </motion.button>
                          )}

	                        {/* Performance (motivational) */}
	                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className={cn('mb-4 rounded-[32px] border overflow-hidden relative', isDark ? 'border-border bg-card' : 'border-primary/70 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 shadow-[0_22px_48px_rgba(16,185,129,0.26)]')}>
		                          <div
                                className={cn(
                                  'absolute inset-0 pointer-events-none',
                                  isDark ? 'bg-background' : 'bg-white/10'
                                )}
                              />
	                          <div className="relative p-5">
	                            <div className="flex flex-col gap-4">
	                              <div className="min-w-0">
	                                <p className={cn('text-[11px] font-black uppercase tracking-[0.2em]', isDark ? 'opacity-50 text-foreground' : 'text-foreground/80')}>Campaign value running</p>
	                                <p className={cn('text-[34px] font-black tracking-tight leading-none mt-2', isDark ? textColor : 'text-foreground')}>
	                                  ₹<CountUp end={Number(activeValue) || 0} duration={1.5} separator="," decimals={0} />
	                                </p>
	                                <p className={cn('text-[13px] font-bold mt-2', isDark ? 'text-foreground/70' : 'text-foreground/85')}>
	                                  {activeDealsList.length === 0 ? 'No active deals yet — send your first offer' : `Across ${activeDealsList.length} active collaboration${activeDealsList.length === 1 ? '' : 's'}`}
	                                </p>
	                                <div className="mt-3 flex flex-wrap gap-2">
	                                  {(newToday > 0 || contentPendingReview > 0) && (
	                                    <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-warning/25 bg-warning/10 text-warning' : 'border-border bg-secondary/50 text-foreground')}>
	                                      {newToday > 0 ? `+${newToday} new today` : `${contentPendingReview} delivered`}
	                                    </span>
	                                  )}
	                                </div>
	                              </div>
		                              <div className="flex items-center gap-3">
		                              <button
		                                type="button"
		                                onClick={() => {
		                                  triggerHaptic(HapticPatterns.light);
		                                  if (needsActionTotal > 0) setActiveTab('collabs', 'action_required');
		                                  else openCreateOfferSheet();
		                                }}
	                                className={cn(
	                                  'w-full sm:w-auto px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-[0.99]',
	                                  needsActionTotal > 0
	                                    ? 'bg-card text-muted-foreground border-transparent shadow-[0_12px_30px_rgba(255,255,255,0.18)]'
	                                    : (isDark ? 'border-border bg-card text-foreground/80 hover:bg-secondary/50' : 'border-border bg-secondary/50 text-foreground hover:bg-secondary/15')
	                                )}
	                              >
	                                {needsActionTotal > 0 ? 'Review actions' : 'Send offer'}
	                              </button>
	                              {needsActionTotal > 0 && (
	                                <p className={cn('text-[12px] font-medium', isDark ? secondaryTextColor : 'text-foreground/80')}>
	                                  {needsActionTotal} item{needsActionTotal === 1 ? '' : 's'} need your response
	                                </p>
	                              )}
	                              </div>
	                            </div>
	                          </div>
	                        </motion.div>

	                        {/* Meaningful stats */}
	                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cn('grid grid-cols-2 gap-3 mb-5')}>
	                          {[
	                            { label: 'Active collaborations', value: activeDealsList.length },
	                            { label: 'Action required', value: needsActionTotal, tone: needsActionTotal > 0 ? 'warn' : 'neutral' },
	                          ].map((item: any) => (
	                            <div key={item.label} className={cn('min-h-[96px] p-4 rounded-[24px] border', cardBgColor, borderColor)}>
	                              <p className={cn('text-[10px] font-black uppercase tracking-[0.16em] opacity-45', textColor)}>{item.label}</p>
	                              {isLoading ? (
	                                <div className={cn('h-5 rounded-md mt-3 animate-pulse', isDark ? 'bg-secondary/50' : 'bg-background')} />
	                              ) : (
	                                <p className={cn('text-[20px] font-black tracking-tight mt-3', item.tone === 'warn' ? (isDark ? 'text-warning' : 'text-warning') : textColor)}>
                                    <CountUp end={Number(item.value) || 0} duration={1.2} separator="," decimals={0} />
                                  </p>
	                              )}
	                            </div>
	                          ))}
	                          <div className={cn('col-span-2 p-4 rounded-[24px] border flex items-center justify-between gap-3', cardBgColor, borderColor)}>
	                            <div className="min-w-0">
	                              <p className={cn('text-[10px] font-black uppercase tracking-[0.16em] opacity-45', textColor)}>Content to review</p>
	                              <p className={cn('text-[13px] mt-1', secondaryTextColor)}>
	                                {contentPendingReview > 0 ? 'New creator delivery is ready for review.' : 'No pending content reviews right now.'}
	                              </p>
	                            </div>
	                            {isLoading ? (
	                              <div className={cn('h-8 w-12 rounded-md animate-pulse', isDark ? 'bg-secondary/50' : 'bg-background')} />
	                            ) : (
	                              <p className={cn('text-[24px] font-black tracking-tight shrink-0', contentPendingReview > 0 ? (isDark ? 'text-warning' : 'text-warning') : textColor)}>
                                  <CountUp end={Number(contentPendingReview) || 0} duration={1.2} separator="," decimals={0} />
                                </p>
	                            )}
	                          </div>
	                        </motion.div>

	                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-8">
	                          <div className="flex items-center justify-between mb-3">
	                            <div>
	                              <p className={cn('text-[12px] font-black', textColor)}>Collaborations</p>
	                              <p className={cn('text-[12px] mt-1', secondaryTextColor)}>
	                                {activeCollabTab === 'action_required'
	                                  ? 'Review pending offers and counters first.'
	                                  : activeCollabTab === 'active'
	                                    ? 'Track live collaborations and deadlines.'
	                                    : 'See completed work and closed deals.'}
	                              </p>
	                            </div>
		                            <button
		                              type="button"
		                              onClick={() => setActiveTab('collabs', activeCollabTab)}
		                              className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}
		                            >
	                              View all
	                            </button>
	                          </div>
	                          <div className={cn('mb-4 rounded-[24px] border p-1.5 flex gap-1.5 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.08)]', isDark ? 'bg-secondary/[0.06] border-border' : 'bg-secondary/75 border-primary/80')}>
	                            {[
		                              { key: 'action_required', label: 'Action Required', count: offers.length },
	                              { key: 'active', label: 'Active', count: activeDealsList.length },
	                              { key: 'completed', label: 'Completed', count: completedDealsList.length },
	                            ].map((item) => {
	                              const isSelected = activeCollabTab === item.key;
	                              return (
		                                <button
		                                  type="button"
		                                  key={item.key}
		                                  onClick={() => {
		                                    triggerHaptic(HapticPatterns.light);
		                                    setDashboardCollabTab(item.key as BrandCollabTab);
		                                  }}
	                                  className={cn(
	                                    'flex-1 rounded-[20px] px-3 py-3 text-left transition-all active:scale-[0.98] border backdrop-blur-lg',
	                                    isSelected
	                                      ? isDark
	                                        ? 'bg-secondary/90 text-muted-foreground border-border/40 shadow-[0_10px_30px_rgba(255,255,255,0.08)]'
	                                        : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-foreground border-primary/70 shadow-[0_12px_30px_rgba(16,185,129,0.24)]'
	                                      : isDark
	                                        ? 'text-foreground/70 border-border/5 hover:bg-secondary/[0.05]'
	                                        : 'text-muted-foreground border-border/50 hover:bg-secondary/60'
	                                  )}
	                                >
	                                  <p className={cn('text-[10px] font-black uppercase tracking-widest', isSelected ? 'opacity-80' : 'opacity-50')}>{item.label}</p>
	                                  <p className="mt-1 text-[16px] font-black">{item.count}</p>
	                                </button>
	                              );
	                            })}
	                          </div>
		                          <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.10)]', borderColor, isDark ? 'bg-secondary/[0.04] shadow-black/20' : 'bg-card shadow-sm')}>
	                            <div className={cn('p-4 backdrop-blur-md', isDark ? 'border-b border-border bg-secondary/[0.03]' : 'border-b border-border/80 bg-secondary/45')}>
	                              <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>
	                                {activeCollabTab === 'action_required' ? 'Action Required' : activeCollabTab === 'active' ? 'Active Deals' : 'Completed Deals'}
	                              </p>
	                            </div>
	                            {visibleCollabItems.length === 0 ? (
	                              <div className="p-8 text-center">
	                                <p className={cn('text-[12px] font-bold opacity-50', textColor)}>
	                                  {activeCollabTab === 'action_required'
	                                    ? 'All caught up! Send an offer to get started.'
	                                    : activeCollabTab === 'active'
	                                      ? 'No active collabs — complete a deal first'
	                                      : 'No completed collabs yet — finish an active deal'}
	                                </p>
	                                {activeCollabTab === 'action_required' && (
                                  <Button type="button" onClick={() => openCreateOfferSheet()} className={cn('mt-4 rounded-2xl', isDark ? 'bg-primary hover:bg-primary text-foreground' : 'bg-primary hover:bg-primary text-foreground')}>
	                                    <Send className="w-4 h-4 mr-2" /> Send new offer
	                                  </Button>
	                                )}
	                              </div>
	                            ) : (
	                              <div className="p-4 space-y-3">
	                                {visibleCollabItems.slice(0, 3).map((item: any) => {
	                                  const isPendingItem = activeCollabTab === 'action_required';
	                                  const isCompletedItem = activeCollabTab === 'completed';
	                                  const creatorName = firstNameish(item?.profiles) || 'Creator';
	                                  const creatorMeta = item?.profiles?.username || item?.creator_email || item?.creator_name || 'Creator';
	                                  const amount = Number(item?.deal_amount || item?.exact_budget || 0);
	                                  const due = isPendingItem ? offerExpiryLabel(item) : deadlineLabel(item);
	                                  if (isPendingItem) {
	                                    const sentIso = item?.created_at || item?.updated_at || null;
	                                    const sentSince = sentIso ? timeSince(sentIso) : '';
	                                    const sentHours = sentIso ? hoursSince(sentIso) : null;
	                                    const exp = offerExpiryLabel(item);
	                                    const isCountered = normalizeStatus(item?.status) === 'countered';
	                                    const isNoResponse = !isCountered && sentHours !== null && sentHours >= 24;
	                                    const statusLabel = isCountered ? 'CREATOR COUNTERED' : isNoResponse ? 'NO RESPONSE YET' : 'WAITING FOR CREATOR';

	                                    const urgencyParts: string[] = [];
	                                    if (sentSince) urgencyParts.push(`Sent ${sentSince}`);
	                                    if (exp?.text) urgencyParts.push(exp.text);
	                                    else if (isNoResponse) urgencyParts.push('No response');
	                                    const urgencyText = urgencyParts.join(' • ');

	                                    const statusTone = isCountered
	                                      ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
	                                      : isNoResponse
	                                        ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
	                                        : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border');

	                                    const urgencyTone =
	                                      exp?.tone === 'danger'
	                                        ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-300/30' : 'bg-rose-50 text-rose-800 border-rose-200')
	                                        : exp?.tone === 'warn'
	                                          ? (isDark ? 'bg-warning/10 text-warning border-warning/30' : 'bg-warning text-warning border-warning')
	                                          : isNoResponse
	                                            ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
	                                            : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border');

	                                    const attentionBorder =
	                                      exp?.tone === 'danger'
	                                        ? (isDark ? 'border-rose-500/30' : 'border-rose-200')
	                                        : exp?.tone === 'warn' || isNoResponse
	                                          ? (isDark ? 'border-warning/25' : 'border-warning')
	                                          : '';

	                                    return (
	                                      <motion.div
	                                        key={item.id}
	                                        whileTap={{ scale: 0.99 }}
	                                        role="button"
	                                        tabIndex={0}
	                                        onClick={() => setSelectedOffer(item)}
	                                        className={cn(
	                                          'w-full p-4 rounded-3xl border text-left transition backdrop-blur-xl',
	                                          borderColor,
	                                          attentionBorder,
	                                          isDark ? 'bg-secondary/[0.04]' : 'bg-secondary/85 shadow-[0_10px_35px_rgba(2,6,23,0.06)]'
	                                        )}
	                                      >
	                                        <div className="flex flex-wrap items-center gap-2 mb-2">
	                                          <span className={cn('inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest', statusTone)}>
	                                            {isCountered ? (
	                                              <AlertTriangle className={cn('w-4 h-4', isDark ? 'text-warning' : 'text-warning')} strokeWidth={2.5} />
	                                            ) : (
	                                              <Clock className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={2.5} />
	                                            )}
	                                            {statusLabel}
	                                          </span>
	                                          {urgencyText && (
	                                            <span className={cn('px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest', urgencyTone)}>
	                                              {urgencyText}
	                                            </span>
	                                          )}
	                                        </div>
	                                        <p className={cn('text-[12px] font-semibold mb-3', secondaryTextColor)}>
	                                          {isCountered ? 'Review counter terms.' : 'Follow up or edit the offer.'}
	                                        </p>

	                                        <div className="flex items-start justify-between gap-3 mb-3">
	                                          <div className="flex items-center gap-3 min-w-0">
	                                            <Avatar className={cn('w-11 h-11 border shadow-sm shrink-0', isDark ? 'border-border' : 'border-border')}>
	                                              <AvatarImage src={safeImageSrc(item?.profiles?.avatar_url || item?.profiles?.profile_image_url || '')} alt={creatorName} />
	                                              <AvatarFallback className={cn(isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}>
	                                                {creatorName.slice(0, 1).toUpperCase()}
	                                              </AvatarFallback>
	                                            </Avatar>
	                                            <div className="min-w-0">
	                                              <p className={cn('text-[15px] font-black truncate', textColor)}>{creatorName}</p>
	                                              <p className={cn('text-[11px] mt-1 font-semibold truncate', secondaryTextColor)}>{creatorMeta}</p>
	                                            </div>
	                                          </div>
	                                          <div className="text-right shrink-0">
	                                            <p className={cn('text-[18px] font-black tracking-tight', textColor)}>{amount > 0 ? formatCompactINR(amount) : '—'}</p>
	                                            <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-40 mt-1', isDark ? 'text-primary' : 'text-primary')}>Campaign budget</p>
	                                          </div>
	                                        </div>

	                                        <p className={cn('text-[12px] font-bold mb-3', isDark ? 'text-muted-foreground' : 'text-muted-foreground')}>
	                                          {String(formatDeliverables(item) || item?.collab_type || 'Deliverables').replaceAll(',', ' • ')}
	                                        </p>

	                                        <div className={cn('rounded-2xl border px-3.5 py-2.5 mb-3 text-[11px] font-semibold', isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary')}>
	                                          <Landmark className="w-4 h-4 inline-block mr-2 -mt-0.5" />
	                                          Payment released after content approval
	                                        </div>

		                                        <button
		                                          type="button"
		                                          onClick={(e) => {
		                                            e.stopPropagation();
		                                            triggerHaptic(HapticPatterns.light);
		                                            setSelectedOffer(item);
	                                          }}
	                                          className={cn('h-11 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]', 'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground shadow-[0_14px_34px_rgba(16,185,129,0.22)]')}
	                                        >
	                                          Review & Take Action
	                                        </button>
	                                      </motion.div>
	                                    );
		                                  }
			                                  const ui = brandDealCardUi(item);
		                                  return (
		                                    <motion.div
		                                      key={item.id}
		                                      whileTap={{ scale: 0.985 }}
		                                      className={cn(
		                                        'w-full p-4 rounded-3xl border transition-all duration-300 group active:scale-[0.99] relative text-left backdrop-blur-xl',
		                                        borderColor,
		                                        isDark ? 'bg-secondary/[0.04]' : 'bg-secondary/85 shadow-[0_10px_35px_rgba(2,6,23,0.06)]'
		                                      )}
		                                    >
		                                      <div className="flex items-start justify-between gap-3 mb-3.5">
		                                        <div className="flex items-center gap-3 min-w-0">
		                                          <Avatar className={cn('w-11 h-11 border shadow-sm shrink-0', isDark ? 'border-border' : 'border-border')}>
		                                            <AvatarImage src={safeImageSrc(item?.profiles?.avatar_url || item?.profiles?.profile_image_url || '')} alt={creatorName} />
		                                            <AvatarFallback className={cn(isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}>
		                                              {creatorName.slice(0, 1).toUpperCase()}
		                                            </AvatarFallback>
		                                          </Avatar>
		                                          <div className="min-w-0">
		                                            <h4 className={cn('text-[15px] font-black tracking-tight truncate', textColor)}>{creatorName}</h4>
		                                            <p className={cn('text-[11px] font-semibold mt-0.5 truncate', secondaryTextColor)}>{creatorMeta}</p>
		                                          </div>
		                                        </div>
		                                        <div className="text-right shrink-0 pl-3">
		                                          <p className={cn('text-[20px] font-black tracking-tight leading-none', isDark ? 'text-foreground' : 'text-muted-foreground')}>
		                                            {amount > 0 ? formatCompactINR(amount) : '—'}
		                                          </p>
		                                        </div>
		                                      </div>

		                                      <div className="flex items-center justify-between gap-3 text-[12px] font-semibold mb-3">
		                                        <div className={cn('min-w-0 truncate', secondaryTextColor)}>
		                                          {String(formatDeliverables(item) || item?.collab_type || 'Collaboration').replaceAll(',', ' • ')}
		                                        </div>
		                                        {due?.text && (
		                                          <div className={cn(
		                                            'shrink-0 flex items-center gap-1.5',
		                                            due.tone === 'danger'
		                                              ? (isDark ? 'text-rose-200' : 'text-rose-700')
		                                              : due.tone === 'warn'
		                                                ? (isDark ? 'text-warning' : 'text-warning')
		                                                : secondaryTextColor
		                                          )}>
		                                            <Clock className="w-3.5 h-3.5" />
		                                            <span className="font-bold">{due.text}</span>
		                                          </div>
		                                        )}
		                                      </div>

			                              <p className={cn(
			                                'text-[13px] font-black mb-3',
			                                ui.needsAction
			                                  ? (isDark ? 'text-warning' : 'text-warning')
			                                  : (isDark ? 'text-foreground/80' : 'text-muted-foreground')
			                              )}>
			                                {ui.statusLine}
			                              </p>

			                              {showSignatureDebug && (
			                                <div className={cn('text-[11px] font-semibold mb-3', secondaryTextColor)}>
			                                  {(() => {
			                                    const hints = collectSignatureHints(item);
			                                    const status = effectiveDealStatus(item);
			                                    const raw = String(item?.status || item?.raw?.status || '—');
			                                    const esign = String(item?.esign_status || item?.raw?.esign_status || item?.contract_status || item?.raw?.contract_status || '');
			                                    return (
			                                      <span>
			                                        debugSig: status={status} raw={raw} esign={esign || '—'} brandKeys=[{hints.brand.join(',') || '—'}] creatorKeys=[{hints.creator.join(',') || '—'}]
			                                      </span>
			                                    );
			                                  })()}
			                                </div>
			                              )}

		                                      <div className="flex items-center justify-between">
		                                        <div className="flex items-center gap-1.5">
		                                          {Array.from({ length: 5 }).map((_, i) => (
		                                            <span
		                                              key={i}
		                                              className={cn(
		                                                'h-1.5 w-6 rounded-full',
		                                                i < ui.step
		                                                  ? (isDark ? 'bg-primary/80' : 'bg-primary')
		                                                  : (isDark ? 'bg-secondary/50' : 'bg-background')
		                                              )}
		                                            />
		                                          ))}
		                                        </div>
		                                      </div>

					                              <button
					                                type="button"
					                                onClick={() => {
					                                  triggerHaptic(HapticPatterns.light);
					                                  if (activeCollabTab === 'active') setSelectedDealPage(item);
					                                  else setSelectedOffer(item);
				                                }}
				                                disabled={Boolean((ui as any)?.ctaDisabled)}
				                                className={cn(
				                                  'mt-4 h-12 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]',
				                                  dealPrimaryCtaButtonClass((ui as any)?.ctaTone || (ui.needsAction ? 'action' : 'view')),
				                                  Boolean((ui as any)?.ctaDisabled) && 'opacity-60 cursor-not-allowed active:scale-100'
				                                )}
				                              >
				                                {ui.primaryActionLabel}
				                              </button>
		                                    </motion.div>
		                                  );
			                                })}
		                              </div>
		                            )}
	                          </div>
	                        </motion.div>
	                      </>
	                    );
	                  })()}

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Suggested creators</p>
                        <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Pick based on reliability — not views.</p>
                      </div>
                      <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}>
                        View all
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
	                      {(isLoadingSuggestedCreators ? Array.from({ length: 3 }).map((_, i) => ({ id: `sk-${i}`, name: 'Creator' })) : suggestedCreators.slice(0, 6)).map((c: any) => (
	                        <div key={c.id} className={cn('min-w-[290px] p-4 rounded-[24px] border', cardBgColor, borderColor, isDark ? '' : 'shadow-[0_18px_45px_rgba(15,23,42,0.08)]')}>
	                          <div className="flex items-center gap-3">
	                            <Avatar className="w-11 h-11">
	                              <AvatarImage src={safeImageSrc(c.profile_photo || c.avatar_url)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-60 truncate', textColor)}>
                                {(c.category || 'Creator')}{c.followers ? ` • ${formatFollowers(c.followers)}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>From</p>
                              <p className={cn('text-[12px] font-bold', textColor)}>{formatCompactINR(c?.pricing?.avg ?? c?.pricing?.reel ?? 0)} / reel</p>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1">
                            {getReliabilityLines(c).map((line) => (
                              <p key={line} className={cn('text-[12px] opacity-70', textColor)}>{line}</p>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {getSmartTags(c).map((t) => (
                              <span key={t} className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-background')}>
                                {t}
                              </span>
                            ))}
                            {getSmartTags(c).length === 0 && (
                              <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-background')}>
                                ✔ Verified profile
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button type="button"
                              onClick={() => {
                                const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                                if (!handle) {
                                  triggerHaptic(HapticPatterns.light);
                                  setActiveTab('creators');
                                  return;
                                }
                                triggerHaptic(HapticPatterns.light);
                                navigate(`/${handle}`);
                              }}
                              className={cn('flex-1 py-2.5 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.98]', isDark ? 'border-border bg-card hover:bg-secondary/50 text-foreground' : 'border-border bg-card hover:bg-background text-muted-foreground')}
                            >
                              View profile
                            </button>
                            <button type="button"
                              onClick={() => {
                                const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                                if (!handle) {
                                  triggerHaptic(HapticPatterns.light);
                                  toast.error('Creator username missing', { description: 'Please try another creator.' });
                                  return;
                                }
                                triggerHaptic(HapticPatterns.success);
                                navigate(`/${handle}?offer=true`);
                              }}
                              className={cn('flex-1 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98]', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-foreground' : 'bg-gradient-to-br from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-foreground')}
                            >
                              Send offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn('p-6 rounded-[2.5rem] border relative overflow-hidden mb-10', isDark ? 'bg-background border-border/5' : 'bg-card border-border shadow-sm')}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                      <Plus size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/12 flex items-center justify-center">
                        <Plus className={cn('w-5 h-5', isDark ? 'text-primary' : 'text-primary')} />
                      </div>
                      <div>
                        <h3 className={cn('text-[15px] font-bold tracking-tight', textColor)}>Quick actions</h3>
                        <p className={cn('text-[11px] opacity-40 uppercase font-black tracking-widest', textColor)}>Shortcuts</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button type="button"
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setActiveTab('creators');
                        }}
                        className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background shadow-sm')}
                      >
                        <User className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Find creators</span>
                      </button>
                      <button type="button"
                        onClick={() => { triggerHaptic(HapticPatterns.success); openCreateOfferSheet(); }}
                        className={cn(
                          'flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]',
                          isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-primary/30 hover:from-emerald-400 hover:to-sky-400 text-foreground shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-primary/40 hover:from-emerald-500 hover:to-sky-500 text-foreground shadow-lg'
                        )}
                      >
                        <Send className="w-4 h-4 mb-2 opacity-90" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Send offer</span>
                      </button>
                      <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background shadow-sm')}>
                        <Handshake className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Collabs</span>
                      </button>
                      <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); toast.message('Payments', { description: 'Invoices, GST, UPI payouts — coming soon.' }); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background shadow-sm')}>
                        <CreditCard className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Payments</span>
                      </button>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
                      </div>
                      <button type="button" onClick={() => setActiveTab('collabs', 'action_required')} className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}>
                        View all
                      </button>
                    </div>
	                    <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-secondary/[0.04] shadow-black/20' : 'bg-card shadow-sm')}>
	                      <button
	                        type="button"
	                        onClick={() => {
	                          triggerHaptic(HapticPatterns.light);
	                          setActiveTab('collabs', 'action_required');
	                        }}
                        className={cn('w-full p-4 flex items-center justify-between transition-all active:scale-[0.995] backdrop-blur-md', isDark ? 'border-b border-border hover:bg-secondary/[0.06]' : 'border-b border-border/80 hover:bg-secondary/60')}
                      >
                        <p className={cn('text-[12px] font-bold', textColor)}>Action Required</p>
	                        <p className={cn('text-[12px] font-bold', textColor)}>{offers.length}</p>
                      </button>
	                      <button
	                        type="button"
	                        onClick={() => {
	                          triggerHaptic(HapticPatterns.light);
	                          setActiveTab('collabs', 'active');
	                        }}
                        className={cn('w-full p-4 flex items-center justify-between transition-all active:scale-[0.995] backdrop-blur-md', isDark ? 'border-b border-border hover:bg-secondary/[0.06]' : 'border-b border-border/80 hover:bg-secondary/60')}
                      >
                        <p className={cn('text-[12px] font-bold', textColor)}>Active</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{activeDealsList.length}</p>
                      </button>
	                      <button
	                        type="button"
	                        onClick={() => {
	                          triggerHaptic(HapticPatterns.light);
	                          setActiveTab('collabs', 'completed');
	                        }}
                        className={cn('w-full p-4 flex items-center justify-between transition-all active:scale-[0.995]', isDark ? 'hover:bg-card' : 'hover:bg-background')}
                      >
                        <p className={cn('text-[12px] font-bold', textColor)}>Completed</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{completedDealsList.length}</p>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}

	              {activeTab === 'collabs' && (
	                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
	                  {(() => {
	                    const needsActionDeals = activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction);
	                    const needsActionOffers = pendingOffersList.filter((r: any) => normalizeStatus(r?.status) === 'countered');
	                    const needsActionTotal = needsActionDeals.length + needsActionOffers.length;
	                    return (
	                      <>
	                  <div className="flex items-center justify-between mb-4">
	                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
	                    <div className="flex items-center gap-3">
	                      {needsActionTotal > 0 && (
	                        <div className={cn('px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')}>
	                          {needsActionTotal} need your review
	                        </div>
	                      )}
	                      <button type="button" onClick={() => setActiveTab('dashboard')} className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}>
	                      Back
	                      </button>
	                    </div>
	                  </div>

		                  {/* Keep the summary pill in the header; avoid duplicating the same items again in a separate widget. */}

		                  <div className={cn('mb-4 rounded-[22px] border p-1 flex gap-1 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.10)]', isDark ? 'bg-secondary/[0.06] border-border' : 'bg-secondary/80 border-border/70')}>
		                    {[
			                      { key: 'action_required', label: 'Action Required', count: offers.length },
		                      { key: 'active', label: 'Active', count: activeDealsList.length },
		                      { key: 'completed', label: 'Completed', count: completedDealsList.length },
		                    ].map((item) => {
		                      const isSelected = activeCollabTab === item.key;
		                      return (
			                        <button
			                          type="button"
			                          key={item.key}
			                          onClick={() => {
			                            triggerHaptic(HapticPatterns.light);
			                            setActiveTab('collabs', item.key as BrandCollabTab);
			                          }}
		                          className={cn(
		                            'flex-1 h-11 rounded-[18px] px-3 transition-all active:scale-[0.98] flex items-center justify-center gap-2',
		                            isSelected
		                              ? isDark
		                                ? 'bg-card text-muted-foreground shadow-[0_10px_28px_rgba(255,255,255,0.06)]'
		                                : 'bg-[#2563EB] text-foreground shadow-[0_12px_30px_rgba(37,99,235,0.22)]'
		                              : isDark
		                                ? 'text-foreground/70 hover:bg-secondary/[0.05]'
		                                : 'text-muted-foreground hover:bg-secondary/60'
		                          )}
		                        >
		                          <span className={cn('text-[11px] font-black uppercase tracking-widest', isSelected ? 'opacity-95' : 'opacity-70')}>{item.label}</span>
		                          <span
		                            className={cn(
		                              'px-2 py-1 rounded-full text-[10px] font-black tabular-nums',
		                              isSelected
		                                ? (isDark ? 'bg-background/10 text-muted-foreground' : 'bg-secondary/20 text-foreground')
		                                : (isDark ? 'bg-card text-foreground/60' : 'bg-background text-muted-foreground')
		                            )}
		                          >
		                            {item.count}
		                          </span>
		                        </button>
		                      );
		                    })}
		                  </div>

		                  <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-secondary/[0.04] shadow-black/20' : 'bg-card shadow-sm')}>
	                    <div className={cn('p-4 backdrop-blur-md', isDark ? 'border-b border-border bg-secondary/[0.03]' : 'border-b border-border/80 bg-secondary/45')}>
	                      <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>
	                        {activeCollabTab === 'action_required' ? 'Action Required' : activeCollabTab === 'active' ? 'Active Deals' : 'Completed Deals'}
	                      </p>
	                    </div>
                    {visibleCollabItems.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[12px] font-bold opacity-50', textColor)}>
                          {activeCollabTab === 'action_required'
                            ? 'All caught up! Send an offer to get started.'
                            : activeCollabTab === 'active'
                              ? 'No active collabs — complete a deal first'
                              : 'No completed collabs yet — finish an active deal'}
                        </p>
                        {activeCollabTab === 'action_required' && (
                          <Button type="button" onClick={() => openCreateOfferSheet()} className={cn('mt-4 rounded-2xl', isDark ? 'bg-primary hover:bg-primary text-foreground' : 'bg-primary hover:bg-primary text-foreground')}>
                            <Send className="w-4 h-4 mr-2" /> Send new offer
                          </Button>
                        )}
                      </div>
                    ) : (
	                      <div className="p-4 space-y-4 pb-44">
	                        {visibleCollabItems.slice(0, 20).map((item: any) => {
	                          const isPendingItem = activeCollabTab === 'action_required';
	                          const isCompletedItem = activeCollabTab === 'completed';
		                          const due = isPendingItem ? offerExpiryLabel(item) : deadlineLabel(item);
	                          const amount = Number(item?.deal_amount || item?.exact_budget || 0);
	                          const creatorName = firstNameish(item?.profiles) || 'Creator';
	                          const creatorMeta = item?.profiles?.username || item?.creator_email || item?.creator_name || 'Creator';
	                          if (isPendingItem) {
	                            const sentIso = item?.created_at || item?.updated_at || null;
	                            const sentSince = sentIso ? timeSince(sentIso) : '';
	                            const sentHours = sentIso ? hoursSince(sentIso) : null;
	                            const exp = offerExpiryLabel(item);
	                            const isCountered = normalizeStatus(item?.status) === 'countered';
	                            const isNoResponse = !isCountered && sentHours !== null && sentHours >= 24;
	                            const statusLabel = isCountered ? 'CREATOR COUNTERED' : isNoResponse ? 'NO RESPONSE YET' : 'WAITING FOR CREATOR';

	                            const stageTone = isCountered
	                              ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
	                              : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border');

                              const statusTone = isCountered
                                ? stageTone
                                : isNoResponse
                                  ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
                                  : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border');

                              const urgencyParts: string[] = [];
                              if (sentSince) urgencyParts.push(`Sent ${sentSince}`);
                              if (exp?.text) urgencyParts.push(exp.text);
                              else if (isNoResponse) urgencyParts.push('No response');
                              const urgencyText = urgencyParts.join(' • ');

                              const urgencyTone =
                                exp?.tone === 'danger'
                                  ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-300/30' : 'bg-rose-50 text-rose-800 border-rose-200')
                                  : exp?.tone === 'warn'
                                    ? (isDark ? 'bg-warning/10 text-warning border-warning/30' : 'bg-warning text-warning border-warning')
                                    : isNoResponse
                                      ? (isDark ? 'bg-warning/10 text-warning border-warning/25' : 'bg-warning text-warning border-warning')
                                      : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border');

                              const attentionBorder =
                                exp?.tone === 'danger'
                                  ? (isDark ? 'border-rose-500/30' : 'border-rose-200')
                                  : exp?.tone === 'warn' || isNoResponse
                                    ? (isDark ? 'border-warning/25' : 'border-warning')
                                    : '';

	                            return (
	                              <motion.div
	                                key={item.id}
	                                whileTap={{ scale: 0.985 }}
	                                className={cn(
	                                  'w-full p-4 rounded-3xl border transition-all duration-300 backdrop-blur-xl',
	                                  borderColor,
                                    attentionBorder,
	                                  isDark
	                                    ? 'bg-secondary/[0.04] shadow-[0_10px_35px_rgba(0,0,0,0.25)]'
	                                    : 'bg-secondary/85 shadow-[0_10px_35px_rgba(2,6,23,0.06)]'
	                                )}
	                              >
	                                <div className="flex flex-wrap items-center gap-2 mb-2">
	                                  <span className={cn('inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest', statusTone)}>
	                                    {isCountered ? (
	                                      <AlertTriangle className={cn('w-4 h-4', isDark ? 'text-warning' : 'text-warning')} strokeWidth={2.5} />
	                                    ) : (
	                                      <Clock className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={2.5} />
	                                    )}
	                                    {statusLabel}
	                                  </span>
                                  {urgencyText && (
                                    <span className={cn('px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest', urgencyTone)}>
                                      {urgencyText}
                                    </span>
                                  )}
	                                </div>
                                  <p className={cn('text-[12px] font-semibold mb-3', secondaryTextColor)}>
                                    {isCountered
                                      ? 'Creator proposed changes — review and update the offer.'
                                      : 'You can follow up or modify the offer.'}
                                  </p>

	                                <div className="flex items-start justify-between mb-3">
	                                  <div className="flex items-center gap-3 min-w-0">
	                                    <Avatar className={cn('w-11 h-11 border shadow-sm shrink-0', isDark ? 'border-border' : 'border-border')}>
	                                      <AvatarImage src={safeImageSrc(item?.profiles?.avatar_url || item?.profiles?.profile_image_url || '')} alt={creatorName} />
	                                      <AvatarFallback className={cn(isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}>
	                                        {creatorName.slice(0, 1).toUpperCase()}
	                                      </AvatarFallback>
	                                    </Avatar>
	                                    <div className="min-w-0">
	                                      <p className={cn('text-[15px] font-black tracking-tight truncate', textColor)}>{creatorName}</p>
	                                      <div className="flex items-center gap-1.5 mt-0.5">
	                                        <ShieldCheck className="w-3.5 h-3.5 text-info" />
	                                        <span className={cn('text-[10px] font-black uppercase tracking-widest opacity-40 truncate', textColor)}>{creatorMeta}</span>
	                                      </div>
	                                    </div>
	                                  </div>
	                                  <div className="text-right shrink-0 pl-3">
	                                    <p className={cn('text-[20px] font-black tracking-tight leading-none', isDark ? 'text-foreground' : 'text-muted-foreground')}>
	                                      {amount > 0 ? formatCompactINR(amount) : '—'}
	                                    </p>
	                                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-40 mt-1', isDark ? 'text-primary' : 'text-primary')}>
	                                      Campaign budget
	                                    </p>
	                                  </div>
	                                </div>

	                                <div className="flex items-center justify-between gap-3 mb-3">
	                                  <div className={cn('text-[13px] font-bold', isDark ? 'text-muted-foreground' : 'text-muted-foreground')}>
	                                    {String(formatDeliverables(item) || item?.collab_type || 'Deliverables').replaceAll(',', ' • ')}
	                                  </div>
	                                </div>

	                                <div className={cn('rounded-2xl border px-3.5 py-2.5 mb-3 text-[11px] font-semibold', isDark ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary text-primary border-primary')}>
	                                  <Landmark className="w-4 h-4 inline-block mr-2 -mt-0.5" />
	                                  Payment released after content approval
	                                </div>

		                                <button
		                                  type="button"
		                                  onClick={() => {
		                                    triggerHaptic(HapticPatterns.light);
		                                    setSelectedOffer(item);
		                                  }}
	                                  className={cn(
	                                    'h-11 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]',
	                                    'bg-gradient-to-r from-emerald-600 to-sky-600 text-foreground shadow-[0_14px_34px_rgba(16,185,129,0.22)]'
	                                  )}
	                                >
	                                  Review & Take Action
	                                </button>

                                  {(!isCountered && (isNoResponse || exp?.tone === 'danger' || exp?.tone === 'warn')) && (
                                    <div className="mt-2 flex items-start justify-between gap-3">
                                      <p className={cn('text-[11px] font-semibold', secondaryTextColor)}>
                                        {isNoResponse ? 'Tip: Follow up after 24h for faster replies.' : 'Tip: Creators respond faster when offers are reviewed quickly.'}
                                      </p>
	                                      <button
	                                        type="button"
	                                        onClick={(e) => {
	                                          e.stopPropagation();
	                                          triggerHaptic(HapticPatterns.light);
	                                          toast.message('Send reminder', { description: 'Coming soon.' });
                                        }}
                                        className={cn('text-[11px] font-black uppercase tracking-widest shrink-0', isDark ? 'text-info' : 'text-info')}
                                      >
                                        Send reminder
                                      </button>
                                    </div>
                                  )}
	                              </motion.div>
	                            );
	                          }

		                          const ui = brandDealCardUi(item);

			                          return (
		                            <motion.div
		                              key={item.id}
		                              whileTap={{ scale: 0.985 }}
		                              className={cn(
		                                'w-full p-4 rounded-3xl border transition-all duration-300 group active:scale-[0.99] relative text-left backdrop-blur-xl',
		                                borderColor,
		                                isDark
		                                  ? 'bg-secondary/[0.04] hover:bg-secondary/[0.06] shadow-[0_10px_35px_rgba(0,0,0,0.25)]'
		                                  : 'bg-secondary/85 shadow-[0_10px_35px_rgba(2,6,23,0.06)] hover:bg-secondary/95'
		                              )}
		                            >
		                              <div className="flex items-start justify-between mb-3.5">
		                                <div className="flex items-center gap-3 min-w-0">
		                                  <Avatar className={cn('w-11 h-11 border shadow-sm shrink-0', isDark ? 'border-border' : 'border-border')}>
		                                    <AvatarImage src={safeImageSrc(item?.profiles?.avatar_url || item?.profiles?.profile_image_url || '')} alt={creatorName} />
		                                    <AvatarFallback className={cn(isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}>
		                                      {creatorName.slice(0, 1).toUpperCase()}
		                                    </AvatarFallback>
		                                  </Avatar>
		                                  <div className="min-w-0">
		                                    <h4 className={cn('text-[15px] font-black tracking-tight truncate', textColor)}>{creatorName}</h4>
		                                    <p className={cn('text-[11px] font-semibold mt-0.5 truncate', secondaryTextColor)}>{creatorMeta}</p>
		                                  </div>
		                                </div>
			                                <div className="text-right shrink-0 pl-3">
			                                  <p className={cn('text-[20px] font-black tracking-tight leading-none', isDark ? 'text-foreground' : 'text-muted-foreground')}>
			                                    {amount > 0 ? formatCompactINR(amount) : '—'}
			                                  </p>
			                                </div>
			                              </div>

		                              <div className="flex items-center justify-between gap-3 text-[12px] font-semibold mb-3">
		                                <div className={cn('min-w-0 truncate', secondaryTextColor)}>
		                                  {String(formatDeliverables(item) || item?.collab_type || 'Collaboration').replaceAll(',', ' • ')}
		                                </div>
		                                {due?.text && (
		                                  <div className={cn(
		                                    'shrink-0 flex items-center gap-1.5',
		                                    due.tone === 'danger'
		                                      ? (isDark ? 'text-rose-200' : 'text-rose-700')
		                                      : due.tone === 'warn'
		                                        ? (isDark ? 'text-warning' : 'text-warning')
		                                        : secondaryTextColor
		                                  )}>
		                                    <Clock className="w-3.5 h-3.5" />
		                                    <span className="font-bold">{due.text}</span>
		                                  </div>
		                                )}
		                              </div>

		                              <p className={cn(
		                                'text-[13px] font-black mb-3',
		                                ui.needsAction
		                                  ? (isDark ? 'text-warning' : 'text-warning')
		                                  : (isDark ? 'text-foreground/80' : 'text-muted-foreground')
		                              )}>
		                                {ui.statusLine}
		                              </p>

		                              <div className="flex items-center justify-between">
		                                <div className="flex items-center gap-1.5">
		                                  {Array.from({ length: 5 }).map((_, i) => (
		                                    <span
		                                      key={i}
		                                      className={cn(
		                                        'h-1.5 w-6 rounded-full',
		                                        i < ui.step
		                                          ? (isDark ? 'bg-primary/80' : 'bg-primary')
		                                          : (isDark ? 'bg-secondary/50' : 'bg-background')
		                                      )}
		                                    />
		                                  ))}
		                                </div>
		                              </div>

					                              <button
					                                type="button"
					                                onClick={(e) => {
				                                  triggerHaptic(HapticPatterns.light);
				                                  if (activeCollabTab === 'active') setSelectedDealPage(item);
				                                  else setSelectedOffer(item);
				                                }}
				                                disabled={Boolean((ui as any)?.ctaDisabled)}
			                                className={cn(
			                                  'mt-4 h-12 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]',
				                                  dealPrimaryCtaButtonClass((ui as any)?.ctaTone || (ui.needsAction ? 'action' : 'view')),
				                                  Boolean((ui as any)?.ctaDisabled) && 'opacity-60 cursor-not-allowed active:scale-100'
			                                )}
			                              >
			                                {ui.primaryActionLabel}
			                              </button>
	                            </motion.div>
	                          );
	                        })}
	                      </div>
                    )}
	                  </div>
	                      </>
	                    );
	                  })()}
	                </motion.div>
	              )}

              {activeTab === 'creators' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Creators</h2>
                    <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}>
                      Browse
                    </button>
                  </div>

                  <div className={cn('mb-5 rounded-[22px] border px-4 py-3', borderColor, isDark ? 'bg-secondary/[0.04]' : 'bg-card')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', isDark ? 'bg-card' : 'bg-background')}>
                        <Search className={cn('h-4 w-4', isDark ? 'text-foreground/70' : 'text-muted-foreground')} />
                      </div>
                      <input
                        value={creatorSearch}
                        onChange={(e) => setCreatorSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          const handle = String(creatorSearch || '').trim().replace(/^@+/, '').trim();
                          if (!handle) return;
                          triggerHaptic(HapticPatterns.light);
                          navigate(`/${handle}`);
                        }}
                        placeholder="Search by @username"
                        className={cn(
                          'flex-1 bg-transparent outline-none text-[13px] font-semibold placeholder:font-medium',
                          isDark ? 'text-foreground placeholder:text-foreground/35' : 'text-muted-foreground placeholder:text-muted-foreground'
                        )}
                        inputMode="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      {isSearchingCreators && <Loader2 className={cn('h-4 w-4 animate-spin', isDark ? 'text-foreground/60' : 'text-muted-foreground')} />}
                    </div>
                    {creatorSearchResults.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {creatorSearchResults.slice(0, 4).map((c: any) => (
	                          <button
	                            type="button"
	                            key={c.id}
	                            onClick={() => {
	                              const handle = String(c.username || '').trim().replace(/^@+/, '');
	                              if (!handle) return;
                              triggerHaptic(HapticPatterns.light);
                              navigate(`/${handle}`);
                            }}
                            className={cn(
                              'w-full text-left flex items-center gap-3 rounded-2xl px-3 py-2 border transition active:scale-[0.99]',
                              isDark ? 'border-border bg-secondary/[0.03] hover:bg-secondary/[0.06]' : 'border-border bg-background hover:bg-background'
                            )}
                          >
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={safeImageSrc(c.profile_photo || c.avatar)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[13px] font-black truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] truncate', secondaryTextColor)}>@{String(c.username || '').replace(/^@+/, '')}</p>
                            </div>
                            <ChevronRight className={cn('h-4 w-4', isDark ? 'text-foreground/40' : 'text-muted-foreground')} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discovery cards (makes the platform feel real immediately) */}
                  <div className="mb-5">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Suggested</p>
                        <p className={cn('text-[12px] mt-1', secondaryTextColor)}>Shortlist reliable creators with clear pricing.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {(isLoadingSuggestedCreators ? Array.from({ length: 3 }).map((_, i) => ({ id: `sk-${i}`, name: 'Creator' })) : suggestedCreators.slice(0, 10)).map((c: any) => (
                        <div key={c.id} className={cn('min-w-[292px] p-4 rounded-[28px] border', isDark ? 'bg-card border-border' : 'bg-secondary/90 border-primary shadow-[0_14px_40px_rgba(15,23,42,0.08)]')}>
                          <div className="flex items-start gap-3 mb-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={safeImageSrc(c.profile_photo || c.avatar)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[14px] font-black truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] mt-1 opacity-60 truncate', textColor)}>
                                {(c.category || c.niche || 'Creator')}{c.followers ? ` • ${formatFollowers(c.followers)}` : ''}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-45', textColor)}>From</p>
                              <p className={cn('text-[13px] font-black mt-1', textColor)}>{formatCompactINR(c?.pricing?.avg ?? c?.pricing?.reel ?? c.rate ?? 0)}</p>
                              <p className={cn('text-[10px] mt-0.5', secondaryTextColor)}>/ reel</p>
                            </div>
                          </div>

                          <div className={cn('rounded-2xl border px-3 py-3 space-y-1.5', isDark ? 'border-border bg-secondary/[0.04]' : 'border-border bg-background/90')}>
                            {getReliabilityLines(c).map((line) => (
                              <p key={line} className={cn('text-[12px] font-medium', textColor)}>{line}</p>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {getSmartTags(c).map((t) => (
                              <span key={t} className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-card')}>
                                {t}
                              </span>
                            ))}
                            {getSmartTags(c).length === 0 && (
                              <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-card')}>
                                ✔ Verified profile
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button type="button"
                              onClick={() => {
                                const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                                if (!handle) {
                                  triggerHaptic(HapticPatterns.light);
                                  setActiveTab('creators');
                                  return;
                                }
                                triggerHaptic(HapticPatterns.light);
                                navigate(`/${handle}`);
                              }}
                              className={cn('flex-1 py-3 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.98]', isDark ? 'border-border bg-card hover:bg-secondary/50 text-foreground' : 'border-border bg-card hover:bg-background text-muted-foreground')}
                            >
                              View profile
                            </button>
                            <button type="button"
                              onClick={() => {
                                const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                                if (!handle) {
                                  triggerHaptic(HapticPatterns.light);
                                  toast.error('Creator username missing', { description: 'Please try another creator.' });
                                  return;
                                }
                                triggerHaptic(HapticPatterns.success);
                                // Go straight to the creator link page and open the offer flow.
                                navigate(`/${handle}?offer=true`);
                              }}
	                              className={cn('flex-1 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98]', isDark ? 'bg-gradient-to-br from-blue-500 to-sky-500 hover:from-blue-400 hover:to-sky-400 text-foreground' : 'bg-gradient-to-br from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-foreground')}
                            >
                              Send offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

	                  <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-secondary/[0.04] shadow-black/20' : 'bg-card shadow-sm')}>
                    {creatorFeed.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[13px] font-bold', textColor)}>Find creators to collaborate with.</p>
                        <p className={cn('text-[12px] opacity-60 mt-2', textColor)}>Browse our creator database and send your first offer.</p>
                        <div className="flex flex-col gap-2 mt-5">
                          <Button type="button" onClick={() => navigate('/creators')} className={cn('rounded-2xl', isDark ? 'bg-primary hover:bg-primary text-foreground' : 'bg-primary hover:bg-primary text-foreground')}>
                            <User className="w-4 h-4 mr-2" /> Browse creators
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => toast.message('Import creator link', { description: 'Coming soon.' })}
                            className={cn('rounded-2xl', isDark ? 'border-border bg-card text-foreground hover:bg-secondary/50' : 'border-border bg-card text-muted-foreground hover:bg-background')}
                          >
                            Import creator link
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                        {creatorFeed.map((c) => (
                          <button type="button" key={c.id} onClick={() => c.href && navigate(c.href)} className={cn('w-full flex items-center gap-3 p-4 transition-all active:scale-[0.99] backdrop-blur-md', isDark ? 'hover:bg-secondary/[0.05]' : 'hover:bg-secondary/60')}>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={safeImageSrc(c.avatar_url)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>{c.username ? `@${c.username}` : 'Creator'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.status && (
                                <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-card')}>
                                  {c.status}
                                </span>
                              )}
                              <ChevronRight className={cn('w-4 h-4 opacity-30', textColor)} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pb-32">
                  <div
                    className={cn(
                      'mb-5 p-5 rounded-[28px] border overflow-hidden relative',
                      borderColor,
                      isDark ? 'bg-secondary/[0.04]' : 'bg-secondary/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
                    )}
                  >
                    <div className="absolute inset-0 pointer-events-none bg-background" />
                    <div className="relative flex items-center gap-4">
                      <Avatar className={cn('w-14 h-14 border shadow-sm', isDark ? 'border-border' : 'border-border')}>
                        <AvatarImage src={brandLogo} alt={brandName} />
                        <AvatarFallback>{brandName.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[18px] font-black tracking-tight truncate', textColor)}>{brandName}</p>
                        <p className={cn('text-[12px] mt-1 opacity-60 truncate', textColor)}>Brand account</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-border bg-card text-foreground/70' : 'border-border bg-card text-muted-foreground')}>
                            Verified Business
                          </span>
                          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-primary/20 bg-primary/10 text-primary' : 'border-primary bg-primary text-primary')}>
                            Protected by Creator Armour
                          </span>
                          {!hasUploadedBrandLogo && (
                            <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-warning/25 bg-warning/10 text-warning' : 'border-warning bg-warning text-warning')}>
                              Logo required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!hasUploadedBrandLogo && (
                      <div className={cn('relative mt-4 p-3 rounded-2xl border flex items-center justify-between gap-3', isDark ? 'bg-warning/10 border-warning/20' : 'bg-warning/70 border-warning')}>
                        <div className="min-w-0">
                          <p className={cn('text-[12px] font-bold', textColor)}>Upload your logo to send offers</p>
                          <p className={cn('text-[11px] mt-0.5 opacity-70', textColor)}>Creators respond faster when they recognize you.</p>
                        </div>
	                        <button
	                          type="button"
	                          onClick={() => navigate('/brand-settings')}
	                          className={cn('px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap', isDark ? 'bg-secondary/50 text-foreground hover:bg-secondary/15' : 'bg-card text-muted-foreground border border-warning')}
	                        >
                          Upload
                        </button>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const pendingNeedsAction = pendingOffersList.filter((r: any) => normalizeStatus(r?.status) === 'countered').length;
                    const activeNeedsAction = activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction).length;
                    const needsActionTotal = pendingNeedsAction + activeNeedsAction;
	                    const contentPendingReview = activeDealsList.filter((d: any) => {
                        const s = effectiveDealStatus(d);
                        return s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE';
                      }).length;
                    return (
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        {[
                          { label: 'Active', value: activeDealsList.length, tone: 'neutral' },
                          { label: 'Need action', value: needsActionTotal, tone: needsActionTotal > 0 ? 'warn' : 'neutral' },
                          { label: 'Review', value: contentPendingReview, tone: contentPendingReview > 0 ? 'warn' : 'neutral' },
                        ].map((item) => (
                          <div key={item.label} className={cn('p-3 rounded-[20px] border', cardBgColor, borderColor)}>
                            <p className={cn('text-[10px] font-black uppercase tracking-[0.16em] opacity-45', textColor)}>{item.label}</p>
                            <p className={cn('text-[18px] font-black tracking-tight mt-2', item.tone === 'warn' ? (isDark ? 'text-warning' : 'text-warning') : textColor)}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                    <motion.div key="settings-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <BrandSettingsPanel embedded onLogout={() => { void onLogout?.(); }} />
                    </motion.div>
                </motion.div>
              )}
	              </>
	            </div>
          </motion.div>
        </div>
      </div>

      <div className={cn('fixed bottom-0 inset-x-0 border-t z-50 transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-border bg-secondary/90')} style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-3 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1 w-14">
            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-foreground' : 'text-muted-foreground') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-foreground font-bold' : 'text-muted-foreground font-bold') : cn('font-medium', secondaryTextColor))}>Home</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className="flex flex-col items-center gap-1 w-14 relative">
            <User className={cn('w-[22px] h-[22px]', activeTab === 'creators' ? (isDark ? 'text-foreground' : 'text-muted-foreground') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'creators' ? (isDark ? 'text-foreground font-bold' : 'text-muted-foreground font-bold') : cn('font-medium', secondaryTextColor))}>Creators</span>
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { triggerHaptic(HapticPatterns.success); openCreateOfferSheet(); }} className="relative flex flex-col items-center -mt-8">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-4 border-[#061318] text-foreground shadow-[0_4px_30px_rgba(16,185,129,0.28)] hover:shadow-[0_6px_40px_rgba(14,165,233,0.20)] ring-1 ring-emerald-300/30' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-4 border-white text-foreground shadow-lg hover:shadow-xl ring-1 ring-slate-200')}>
              <Plus className="w-7 h-7" />
            </div>
            <span className={cn('text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap', isDark ? 'text-muted-foreground' : 'text-muted-foreground')}>Create</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1 w-14">
            <Handshake className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? (isDark ? 'text-foreground' : 'text-muted-foreground') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'collabs' ? (isDark ? 'text-foreground font-bold' : 'text-muted-foreground font-bold') : cn('font-medium', secondaryTextColor))}>Collabs</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
            <Settings className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-foreground' : 'text-muted-foreground') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-foreground font-bold' : 'text-muted-foreground font-bold') : cn('font-medium', secondaryTextColor))}>Account</span>
          </motion.button>
        </div>
      </div>

	      <AnimatePresence>
	        {showActionSheet && [
	          <motion.div
	            key="actionSheetBackdrop"
	            initial={{ opacity: 0 }}
	            animate={{ opacity: 1 }}
	            exit={{ opacity: 0 }}
	            onClick={() => setShowActionSheet(false)}
	            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
	          />,
	          <motion.div
	            key="actionSheetPanel"
	            initial={{ y: '100%' }}
	            animate={{ y: 0 }}
	            exit={{ y: '100%' }}
	            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
	            className={cn('fixed bottom-0 inset-x-0 z-[110] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl', isDark ? 'bg-background border-border' : 'bg-card border-border')}
	          >
	              <div className="w-12 h-1 bg-background/20 rounded-full mx-auto mb-6" />
	              <div className="max-w-md mx-auto">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-foreground' : 'text-muted-foreground')}>Start a collaboration</h2>
                    <p className={cn('text-[13px] mt-1 opacity-60', isDark ? 'text-foreground' : 'text-muted-foreground')}>Send an offer, then track it end-to-end.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
	                  <button type="button"
	                    onClick={() => {
	                      if (!hasUploadedBrandLogo) {
	                        toast.error('Upload your brand logo first', {
	                          description: 'Go to Brand Settings \u2192 Upload logo \u2192 Come back and send your offer',
	                        });
	                        setShowActionSheet(false);
                        navigate('/brand-settings');
                        return;
                      }
                      setShowActionSheet(false);
                      // Stay inside the brand console (avoid jumping to the public directory page).
                      setActiveTab('creators');
                    }}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all active:scale-[0.99]',
                      isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-primary/30 hover:from-emerald-400 hover:to-sky-400 text-foreground shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-primary/40 hover:from-emerald-500 hover:to-sky-500 text-foreground shadow-lg'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-secondary/50' : 'bg-secondary/50')}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black uppercase tracking-widest">Send new offer</p>
                        <p className="text-[12px] opacity-75 mt-1">Pick a creator and send a protected offer</p>
                      </div>
                    </div>
                  </button>

                  <button type="button"
                    onClick={() => {
                      setShowActionSheet(false);
                      setActiveTab('creators');
                    }}
                    className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                  >
                    <p className={cn('text-[13px] font-bold', textColor)}>Browse creators</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Search and shortlist profiles</p>
                  </button>

                  <button type="button" onClick={() => { setShowActionSheet(false); toast.message('Import creator profile', { description: 'Coming soon.' }); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Import creator profile</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Paste a link to add quickly</p>
                  </button>

                  <div className="pt-2">
                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Notifications</p>
                  </div>
                  {!isPushSubscribed && isPushSupported && (
                    <button type="button"
                      disabled={isPushBusy}
                      onClick={async () => {
                        await handleEnablePush();
                        setShowActionSheet(false);
                      }}
                      className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-50', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                    >
                      <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                      <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Get notified when creators reply</p>
                    </button>
                  )}
                </div>
              </div>
	          </motion.div>,
	        ]}
	      </AnimatePresence>
	      <AnimatePresence>
	        {showBudgetModal && [
	          <motion.div
	            key="budgetModalBackdrop"
	            initial={{ opacity: 0 }}
	            animate={{ opacity: 1 }}
	            exit={{ opacity: 0 }}
	            onClick={() => setShowBudgetModal(false)}
	            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl"
	          />,
	          <motion.div
	            key="budgetModalPanel"
	            initial={{ opacity: 0, scale: 0.92, y: 20 }}
	            animate={{ opacity: 1, scale: 1, y: 0 }}
	            exit={{ opacity: 0, scale: 0.92, y: 20 }}
	            className={cn(
	              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-[90%] max-w-sm rounded-[2rem] border p-6 shadow-2xl',
	              isDark ? 'bg-background border-border' : 'bg-card border-border'
	            )}
	          >
	              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className={cn('text-lg font-bold', textColor)}>Monthly budget</h3>
                  <p className={cn('text-xs opacity-60', textColor)}>Used to show “remaining budget” alerts</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn('text-[11px] font-black uppercase tracking-widest mb-1.5 block opacity-50', textColor)}>Budget (INR)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="e.g. 100000"
                    value={budgetDraft}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                    className={cn(
                      'w-full h-12 px-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none',
                      isDark ? 'bg-card border-border text-foreground' : 'bg-background border-border text-muted-foreground'
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className={cn('flex-1 h-12 rounded-xl font-bold text-sm', isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}
                  >
                    Cancel
                  </button>
	                  <button type="button"
	                    onClick={() => {
	                      const parsed = Number(budgetDraft);
	                      if (!Number.isFinite(parsed) || parsed <= 0) {
	                        toast.error('Enter a valid budget amount');
	                        return;
	                      }
                      try {
                        localStorage.setItem('brandMonthlyBudgetInr', String(Math.round(parsed)));
                      } catch {
                        // ignore
                      }
                      setMonthlyBudgetInr(Math.round(parsed));
                      setShowBudgetModal(false);
                      toast.success('Budget saved');
                    }}
	                    className={cn("flex-[2] h-12 rounded-xl text-sm active:scale-95 flex items-center justify-center gap-2", dsButtons.ecosystemPrimary)}
	                  >
	                    Save budget
	                  </button>
                </div>
              </div>
	          </motion.div>,
	        ]}
	      </AnimatePresence>

	      <AnimatePresence>
	        {selectedOffer && <OfferDetailsSheet key={selectedOffer?.id || 'offer'} offer={selectedOffer} />}
	      </AnimatePresence>

		        {renderBrandSigningPortal()}
	    </div>
	  );
};

export default BrandMobileDashboard;

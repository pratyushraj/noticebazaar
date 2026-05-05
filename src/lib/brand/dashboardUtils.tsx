import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Profile, BrandDeal } from '@/types';
import { getCanonicalDealStatus } from '@/lib/deals/primaryCta';
import { isBarterLikeCollab, isPaidLikeCollab } from '@/lib/deals/collabType';
import { optimizeImage } from '@/lib/utils/image';

export const renderClickableLinks = (text: string, isDark: boolean) => {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 hover:decoration-emerald-500 transition-all inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      );
    }
    return part;
  });
};

export const formatCompactINR = (n: number | string | null | undefined) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  const hasDecimals = safe % 1 !== 0;
  if (safe < 100 || hasDecimals) {
    return `₹${safe.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${safe.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const timeSince = (iso: string | Date | null | undefined) => {
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

export const normalizeStatus = (status: string | null | undefined) => String(status || '').trim().toLowerCase();

export const firstNameish = (profile: Profile | null | undefined, fallbackName?: string) => {
  const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const label = nameParts || profile?.business_name || profile?.username || fallbackName || 'Creator';
  return String(label || 'Creator').trim() || 'Creator';
};

export function getSelectedPackageLabel(row: BrandDeal | null | undefined) {
  const packageLabel = row?.selected_package_label || 
                       (row as any)?.package_label ||
                       (row as any)?.package_name ||
                       (row as any)?.form_data?.selected_package_label || 
                       (row as any)?.raw?.selected_package_label || 
                       (row as any)?.raw?.form_data?.selected_package_label ||
                       (row as any)?.form_data?.package_label ||
                       (row as any)?.raw?.package_name ||
                       (row as any)?.raw?.package?.name;
  
  if (packageLabel && String(packageLabel).trim()) {
    return String(packageLabel).trim();
  }

  if (row?.campaign_description) {
    const packageMatch = row.campaign_description.match(/(?:\|\|Package:|Selected package:)\s*([^|\n]+)/i);
    if (packageMatch && packageMatch[1]) {
      return packageMatch[1].trim();
    }
  }

  return '';
}

export function formatDeliverables(row: BrandDeal | null | undefined) {
  const d = (row as any)?.request_deliverables || row?.deliverables;
  if (!d) return '';

  const uniq = (parts: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const clean = String(p || '').trim();
      if (!clean) continue;
      const key = clean.toLowerCase()
        .replace(/unboxing \/ review/g, 'review / unboxing')
        .replace(/unboxing or review/g, 'review / unboxing')
        .replace(/product unboxing/g, 'product review')
        .replace(/\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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

export function formatPackageSummary(row: BrandDeal | null | undefined) {
  return getSelectedPackageLabel(row) || formatDeliverables(row) || row?.collab_type || 'Collaboration';
}

export const formatBudget = (row: BrandDeal | null | undefined) => {
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

export const offerExpiryLabel = (row: BrandDeal | null | undefined) => {
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

export const effectiveDealStatus = (row: BrandDeal | null | undefined) => {
  return getCanonicalDealStatus(row);
};

export const safeImageSrc = (url: string | null | undefined) => {
  return optimizeImage(url, { width: 300, height: 300, fit: 'cover' });
};

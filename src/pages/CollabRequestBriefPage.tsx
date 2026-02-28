"use client";

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { Lock } from 'lucide-react';

type CollabRequestStatus = 'pending' | 'accepted' | 'countered' | 'declined';
type CollabType = 'paid' | 'barter' | 'hybrid' | 'both';

interface CollabRequest {
  id: string;
  brand_name: string;
  brand_email: string;
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

const parseDeliverables = (deliverables: string | string[]): string[] => {
  if (Array.isArray(deliverables)) return deliverables;
  try {
    return JSON.parse(deliverables);
  } catch {
    return [];
  }
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
  const request = state?.request as CollabRequest | undefined;

  if (!request || request.id !== requestId) {
    navigate('/collab-requests', { replace: true });
    return null;
  }

  const deliverablesList = parseDeliverables(request.deliverables);
  const subtitle = isBarterLike(request.collab_type) ? 'Barter collaboration' : (request.brand_name ?? 'Brand');

  return (
    <CreatorNavigationWrapper
      title="Full brief"
      subtitle={subtitle}
      compactHeader
      showBackButton
      backTo="/collab-requests"
      backIconOnly
    >
      <div className={cn(spacing.loose, "pb-24")}>
        <div className="rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 p-4 sm:p-5 space-y-4">
          {/* Brand + type */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h2 className="text-lg font-bold text-white uppercase break-words flex-1">{request.brand_name ?? 'Brand'}</h2>
            <span className={cn(
              "flex-shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium border",
              request.collab_type === 'barter' ? "bg-blue-500/20 text-blue-200 border-blue-500/30" : request.collab_type === 'paid' ? "bg-green-500/20 text-green-200 border-green-500/30" : "bg-purple-500/20 text-purple-200 border-purple-500/30"
            )}>
              {collabTypeLabel(request.collab_type)}
            </span>
          </div>
          {request.brand_email && (
            <p className="text-xs text-purple-300/70">{request.brand_email}</p>
          )}

          {/* Value + deadline */}
          <div className="flex flex-wrap items-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.06] border border-white/[0.06]">
            {isBarterLike(request.collab_type) && request.barter_product_image_url && (
              <img
                src={request.barter_product_image_url}
                alt="Barter product"
                loading="lazy"
                className="h-10 w-10 rounded-lg object-cover border border-white/15 flex-shrink-0"
              />
            )}
            <span className="text-sm font-semibold text-white">{formatBudget(request)}</span>
            {request.deadline && (
              <>
                <span className="text-purple-400/60 text-sm">•</span>
                <span className="text-sm text-purple-200/90">
                  Deadline: {new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </>
            )}
          </div>

          {/* Requested deliverables */}
          {deliverablesList.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-purple-300/60 uppercase tracking-wider mb-2">Requested deliverables</p>
              <div className="flex flex-wrap gap-1.5">
                {deliverablesList.map((d, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-white/10 text-purple-200/90 bg-white/[0.04]">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full campaign description */}
          <div>
            <p className="text-[10px] font-medium text-purple-300/60 uppercase tracking-wider mb-1.5">Campaign description</p>
            <p className="text-sm text-purple-200 leading-relaxed whitespace-pre-wrap">
              {request.campaign_description || '—'}
            </p>
          </div>

          <p className="text-[10px] text-purple-300/50 flex items-center gap-1.5 pt-2">
            <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
            This request is timestamped and protected by Creator Armour
          </p>
        </div>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestBriefPage;



import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Loader2, Copy, Image as ImageIcon, Gift, ChevronDown, ChevronUp, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
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

import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { useCollabRequests, type CollabRequest } from '@/lib/hooks/useCollabRequests';
import { buildCollabLink, normalizeCollabHandle } from '@/lib/utils/collabLink';

const isHybrid = (collabType: CollabRequest['collab_type']) => collabType === 'hybrid' || collabType === 'both';
const isPaidLike = (collabType: CollabRequest['collab_type']) => collabType === 'paid' || isHybrid(collabType);
const isBarterLike = (collabType: CollabRequest['collab_type']) => collabType === 'barter' || isHybrid(collabType);
const getCollabTypeLabel = (collabType: CollabRequest['collab_type']) => {
  if (collabType === 'paid') return 'Paid';
  if (collabType === 'barter') return 'Barter';
  return 'Hybrid';
};

const CollabRequestsPage = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const { requests, isLoading: loading, error, invalidate } = useCollabRequests(profile?.id);
  const [selectedRequest, setSelectedRequest] = useState<CollabRequest | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [failedBarterImages, setFailedBarterImages] = useState<Record<string, boolean>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);

  const getProductImageUrl = (request: CollabRequest) => String(request.barter_product_image_url || '').trim();

  useEffect(() => {
    if (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load collaboration requests';
      if (msg === 'Session expired' || msg === 'Not authenticated') {
        toast.error('Session expired. Please refresh the page.');
      } else {
        toast.error(msg);
      }
    }
  }, [error]);

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

    if (Array.isArray(deliverables)) {
      return deliverables.map(normalizeDeliverable).filter(Boolean);
    }

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

  const parseStringList = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [value].filter(Boolean);
      } catch {
        return [value].filter(Boolean);
      }
    }
    return [];
  };

  const parseAddons = (value: any): string[] => {
    const list = Array.isArray(value) ? value : [];
    return list
      .map((addon: any) => {
        const label = String(addon?.label || '').trim();
        if (!label) return '';
        const price = Number(addon?.price || 0);
        return price > 0 ? `${label} (+₹${price.toLocaleString('en-IN')})` : label;
      })
      .filter(Boolean);
  };

  const formatBudget = (request: CollabRequest): string => {
    if (isPaidLike(request.collab_type)) {
      if (request.exact_budget) {
        return `₹${request.exact_budget.toLocaleString()}`;
      }
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
      if (request.barter_value) {
        return `Barter (₹${request.barter_value.toLocaleString()})`;
      }
      return 'Barter';
    }
    return 'Not specified';
  };

  const acceptRequest = (request: CollabRequest) => {
    if (!request) return;
    setAcceptingRequestId(request.id);
    navigate(`/collab-requests/${request.id}/brief`, { state: { request } });
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to decline requests');
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/collab-requests/${selectedRequest.id}/decline`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        trackEvent('creator_declined_request', { request_id: selectedRequest?.id, creator_id: profile?.id });
        toast.success('Request declined');
        invalidate();
        setShowDeclineDialog(false);
        setSelectedRequest(null);
      } else {
        toast.error(data.error || 'Failed to decline request');
      }
    } catch (error) {
      toast.error('Failed to decline request. Please try again.');
    }
  };

  const copyCollabLink = () => {
    const usernameForLink = normalizeCollabHandle(profile?.instagram_handle || profile?.username);
    if (usernameForLink) {
      const link = buildCollabLink(usernameForLink);
      navigator.clipboard.writeText(link).then(() => {
        toast.success('Collab link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link. Please try again.');
      });
    } else {
      toast.error('Add your Instagram handle first to share your collab link.');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const counteredRequests = requests.filter(r => r.status === 'countered');

  if (loading) {
    return (
      <CreatorNavigationWrapper title="Collaboration Requests" subtitle="Manage incoming brand requests">
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-info" />
          </div>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  const usernameForLink = normalizeCollabHandle(profile?.instagram_handle || profile?.username);
  const hasUsername = Boolean(usernameForLink);



  const openDeclineConfirm = (request: CollabRequest) => {
    setSelectedRequest(request);
    setShowDeclineDialog(true);
  };

  return (
    <CreatorNavigationWrapper title="Collaboration Requests" subtitle="Manage incoming brand requests">
      <div className={cn(spacing.loose, "pb-24")}>
        <div className="mb-4 rounded-xl border border-border bg-secondary/[0.05] px-4 py-3">
          <p className="text-info text-sm font-medium">Requests from brands using your public link</p>
          <p className="text-info/75 text-xs mt-0.5">
            {pendingRequests.length} pending • newest first
          </p>
        </div>


        {/* Empty state or request cards */}
        {pendingRequests.length === 0 ? (
          <Card className="rounded-2xl bg-card border border-border overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-card0 flex items-center justify-center mx-auto mb-5">
                <Briefcase className="h-10 w-10 text-info/80" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No pending requests</h3>
              {hasUsername ? (
                <>
                  <p className="text-sm text-info/80 mb-6 max-w-xs mx-auto">
                    Share your collab link — brands that visit will be able to send you deal requests.
                  </p>
                  <Button
                    onClick={copyCollabLink}
                    className="w-full min-h-[44px] font-medium bg-secondary/15 hover:bg-secondary/25 border border-border text-foreground"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Collab Link
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-info/80 mb-4 max-w-xs mx-auto">
                    Add your Instagram handle to get your collab link.
                  </p>
                  <Button
                    onClick={() => navigate('/creator-profile?section=profile')}
                    className="w-full min-h-[44px] font-medium bg-info hover:bg-info text-foreground"
                  >
                    Add Instagram handle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Request cards — now clickable via Link to satisfy user request */
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const deliverablesList = parseDeliverables(request.deliverables);
              const requirementsList = parseStringList(request.content_requirements);
              const barterTypesList = parseStringList(request.barter_types);
              const addonsList = parseAddons(request.selected_addons);
              const packageLabel = String(request.selected_package_label || request.campaign_goal || '').trim();
              const isDescriptionExpanded = !!expandedDescriptions[request.id];
              const productImageUrl = getProductImageUrl(request);
              return (
                <Card
                  key={request.id}
                  className={cn(
                    "rounded-2xl bg-card border border-border overflow-hidden flex flex-col",
                    "select-none transition-all duration-200",
                    "backdrop-blur-[40px] saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.3)] group"
                  )}
                >
                  {/* Header: Incoming Brand Request — darker purple band */}
                  <div className="bg-gradient-to-r from-blue-800/90 to-blue-700/90 px-4 py-2 text-center border-b border-border">
                    <h2 className="text-xs font-bold text-foreground tracking-wide uppercase">
                      Incoming Brand Request
                    </h2>
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1 space-y-3.5">
                    {/* Brand name + Barter tag on same row; contact below */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-bold text-foreground leading-tight flex items-center gap-2">
                          {request.brand_name ?? 'Brand'}
                          {request.brand_verified && <ShieldCheck className="h-5 w-5 text-info flex-shrink-0" aria-label="Verified brand" />}
                        </h3>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-foreground shrink-0",
                          request.collab_type === 'paid' && "bg-green-500/30 border border-green-400/40",
                          request.collab_type === 'barter' && "bg-info/40 border border-info/50",
                          isHybrid(request.collab_type) && "bg-info/40 border border-info/50"
                        )}>
                          {getCollabTypeLabel(request.collab_type)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-0.5 break-all">
                        {request.brand_email}
                        {request.brand_instagram && (
                          <>
                            <span className="mx-1.5 opacity-40">•</span>
                            <span className="text-info/90">
                              {request.brand_instagram.startsWith('@') ? request.brand_instagram : `@${request.brand_instagram}`}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Estimated value — gift icon + label + bold ₹ */}
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-info/90 shrink-0" aria-hidden />
                      <span className="text-sm text-foreground/85">Estimated value</span>
                      <span className="text-lg font-bold text-foreground ml-auto">
                        {formatBudget(request)}
                      </span>
                    </div>

                    {(packageLabel || request.content_quantity || request.content_duration || requirementsList.length > 0 || barterTypesList.length > 0 || addonsList.length > 0) && (
                      <div className="rounded-xl border border-border bg-secondary/[0.06] p-3 space-y-2">
                        {packageLabel && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/50">Package</span>
                            <span className="text-sm font-bold text-foreground text-right">{packageLabel}</span>
                          </div>
                        )}
                        {(request.content_quantity || request.content_duration) && (
                          <div className="flex flex-wrap gap-1.5">
                            {request.content_quantity && (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card border border-border">
                                Qty: {request.content_quantity}
                              </span>
                            )}
                            {request.content_duration && (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card border border-border">
                                Duration: {request.content_duration}
                              </span>
                            )}
                          </div>
                        )}
                        {requirementsList.length > 0 && (
                          <p className="text-xs leading-relaxed text-foreground/75">
                            Requirements: {requirementsList.join(', ')}
                          </p>
                        )}
                        {addonsList.length > 0 && (
                          <p className="text-xs leading-relaxed text-foreground/75">
                            Add-ons: {addonsList.join(', ')}
                          </p>
                        )}
                        {barterTypesList.length > 0 && (
                          <p className="text-xs leading-relaxed text-foreground/75">
                            Barter value: {barterTypesList.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Deadline */}
                    {request.deadline && (
                      <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <Clock className="h-4 w-4 text-foreground/50 shrink-0" aria-hidden />
                        <span>{new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}

                    {/* Product preview */}
                    {isBarterLike(request.collab_type) && (productImageUrl || failedBarterImages[request.id]) && (
                      <div className="w-full rounded-lg overflow-hidden bg-secondary/[0.08] border border-border aspect-[4/3] min-h-[120px] relative">
                        {productImageUrl && !failedBarterImages[request.id] ? (
                          <>
                            <img

                              src={productImageUrl}
                              alt="Barter product"
                              className="w-full h-full object-cover"
                              onError={() => setFailedBarterImages((prev) => ({ ...prev, [request.id]: true }))}
                            />
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/40 gap-2">
                            <ImageIcon className="h-10 w-10" aria-hidden />
                            <span className="text-xs">Product preview</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deliverables */}
                    {deliverablesList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {deliverablesList.slice(0, 3).map((d, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-foreground/95 bg-card0 border border-border"
                          >
                            {d}
                          </span>
                        ))}
                        {deliverablesList.length > 3 && (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-foreground/75 bg-card border border-border">
                            +{deliverablesList.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Campaign Description - Now directly on card */}
                    {request.campaign_description && (
                      <div className="pt-1.5 border-t border-border mt-1">
                        <p className="text-[11px] font-medium text-info/60 uppercase tracking-wider mb-1">
                          Campaign details
                        </p>
                        <p className={cn(
                          "text-sm text-info/95 leading-relaxed whitespace-pre-wrap",
                          !isDescriptionExpanded && "[display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden"
                        )}>
                          {request.campaign_description}
                        </p>
                        {request.campaign_description.length > 170 && (
                          <button type="button"
                            onClick={() => setExpandedDescriptions((prev) => ({ ...prev, [request.id]: !prev[request.id] }))}
                            className="mt-1.5 inline-flex items-center gap-1 text-xs text-info hover:text-foreground"
                          >
                            {isDescriptionExpanded ? (
                              <>
                                Show less <ChevronUp className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                Read more <ChevronDown className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Primary CTA */}
                    <div className="mt-auto pt-1.5 space-y-2.5">
                      <div className="space-y-1">
                        <Button
                          disabled={acceptingRequestId === request.id}
                          onClick={(e) => { e.stopPropagation(); acceptRequest(request); }}
                          className={cn(
                            "w-full min-h-[44px] font-bold text-foreground rounded-xl text-sm transition-colors duration-200",
                            "shadow-[0_2px_12px_rgba(16,185,129,0.25)] border-0",
                            acceptingRequestId === request.id
                              ? "bg-primary/60 text-primary opacity-70 cursor-not-allowed"
                              : "bg-primary hover:bg-primary"
                          )}
                        >
                          {acceptingRequestId === request.id ? 'Generating contract…' : 'Accept & Generate Contract'}
                        </Button>
<p className="text-[11px] text-center text-foreground/55">
                          A contract is auto-generated and sent to the brand.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 py-0.5">
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/collab-requests/${request.id}/brief`, { state: { request } }); }}
                          className="text-sm font-medium text-indigo-200 hover:text-foreground min-h-[44px] px-1.5"
                        >
                          Counter
                        </button>
                        <span className="w-px h-4 bg-secondary/30" />
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); openDeclineConfirm(request); }}
                          className="text-sm font-medium text-[#FCA5A5] hover:text-foreground min-h-[44px] px-1.5"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Counter sent section */}
        <div className="mt-8 space-y-4">
          <p className="text-info/80 text-sm">Counter sent — awaiting brand response</p>
          {counteredRequests.map((request) => (
            <Card key={request.id} className="rounded-[20px] bg-card border border-border overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {request.brand_name}
                    {request.brand_verified && <ShieldCheck className="h-5 w-5 text-info flex-shrink-0" aria-label="Verified brand" />}
                  </h3>
                  <span className="text-[11px] font-medium bg-info/20 text-info px-2 py-0.5 rounded-md">Counter Sent</span>
                </div>
                {(request.counter_offer?.final_price || request.counter_offer?.notes) && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    {request.counter_offer.final_price && (
                      <p className="text-sm text-indigo-200">
                        Your price: <span className="font-semibold text-foreground">₹{request.counter_offer.final_price.toLocaleString('en-IN')}</span>
                      </p>
                    )}
                    {request.counter_offer.notes && (
                      <p className="text-sm text-foreground/60 truncate">{request.counter_offer.notes}</p>
                    )}
                    <p className="text-xs text-foreground/40">Waiting for brand response</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Decline confirmation */}
        <AlertDialog open={showDeclineDialog} onOpenChange={(showDeclineDialog) => setShowDeclineDialog(showDeclineDialog)}>
          <AlertDialogContent className="bg-[#0f172a] border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Decline this offer?</AlertDialogTitle>
              <AlertDialogDescription className="text-foreground/70">
                The brand will be notified. You can't undo this.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDecline} className="bg-destructive hover:bg-destructive">Yes, decline</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestsPage;

"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Check,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Lock,
  FileCheck,
  Image as ImageIcon,
  Gift,
  ShoppingBag,
  FileEdit,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { useCollabRequests, type CollabRequest } from '@/lib/hooks/useCollabRequests';

const CollabRequestsPage = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const { requests, isLoading: loading, error, invalidate } = useCollabRequests(profile?.id);
  const [selectedRequest, setSelectedRequest] = useState<CollabRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [campaignDescriptionExpanded, setCampaignDescriptionExpanded] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [failedBarterImages, setFailedBarterImages] = useState<Record<string, boolean>>({});

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

  const parseDeliverables = (deliverables: string | string[]): string[] => {
    if (Array.isArray(deliverables)) return deliverables;
    try {
      return JSON.parse(deliverables);
    } catch {
      return [];
    }
  };

  const formatBudget = (request: CollabRequest): string => {
    if (request.collab_type === 'paid' || request.collab_type === 'both') {
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
    if (request.collab_type === 'barter' || request.collab_type === 'both') {
      if (request.barter_value) {
        return `Barter (₹${request.barter_value.toLocaleString()})`;
      }
      return 'Barter';
    }
    return 'Not specified';
  };

  const acceptRequest = async (request: CollabRequest) => {
    if (!request) return;

    try {
      setAcceptingRequestId(request.id);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to accept requests');
        setAcceptingRequestId(null);
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/collab-requests/${request.id}/accept`,
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
        trackEvent('creator_accepted_request', {
          deal_id: data.deal?.id,
          creator_id: profile?.id,
          collab_type: selectedRequest?.collab_type || 'paid',
        });
        if (data.needs_delivery_details) {
          toast.success('Share delivery details to proceed');
          invalidate();
          setShowDetailModal(false);
          setSelectedRequest(null);
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}/delivery-details`);
        } else {
          if (data.contract) {
            toast.success('Contract generated and ready for signing');
          } else {
            toast.success('Collaboration request accepted! Deal created successfully.');
          }
          invalidate();
          setShowDetailModal(false);
          setSelectedRequest(null);
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}`);
        }
      } else {
        toast.error(data.error || 'Please review details before accepting');
      }
    } catch (error) {
      toast.error('Please review details before accepting');
    } finally {
      setAcceptingRequestId(null);
    }
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
        setShowDetailModal(false);
      } else {
        toast.error(data.error || 'Failed to decline request');
      }
    } catch (error) {
      toast.error('Failed to decline request. Please try again.');
    }
  };

  const copyCollabLink = () => {
    const usernameForLink = profile?.instagram_handle || profile?.username;
    if (usernameForLink) {
      const link = `${window.location.origin}/collab/${usernameForLink}`;
      navigator.clipboard.writeText(link);
      toast.success('Collab link copied to clipboard!');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const counteredRequests = requests.filter(r => r.status === 'countered');

  if (loading) {
    return (
      <CreatorNavigationWrapper title="Collaboration Requests" subtitle="Manage incoming brand requests">
        <div className={cn(spacing.loose, "pb-24")}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  const usernameForLink = profile?.instagram_handle || profile?.username;
  const hasUsername = usernameForLink && usernameForLink.trim() !== '';

  const openDetail = (request: CollabRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const openDeclineConfirm = (request: CollabRequest) => {
    setSelectedRequest(request);
    setShowDeclineDialog(true);
  };

  return (
    <CreatorNavigationWrapper title="Collaboration Requests" subtitle="Manage incoming brand requests">
      <div className={cn(spacing.loose, "pb-24")}>
        {pendingRequests.length > 0 && (
          <p className="text-purple-200/80 text-sm mb-4">Requests from brands using your public link</p>
        )}

        {/* Empty state or request cards */}
        {pendingRequests.length === 0 ? (
          <Card className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
                <Briefcase className="h-10 w-10 text-purple-300/80" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No brand requests yet</h3>
              <p className="text-sm text-purple-200/80 mb-6 max-w-xs mx-auto">
                Share your collab link to receive protected deals
              </p>
              {hasUsername && (
                <Button
                  onClick={copyCollabLink}
                  className="w-full min-h-[44px] font-medium bg-white/15 hover:bg-white/25 border border-white/20 text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Collab Link
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Request cards — compact default, tap to expand; Accept Deal primary, Counter/Decline secondary */
          <div className="space-y-6">
            {pendingRequests.map((request) => {
              const deliverablesList = parseDeliverables(request.deliverables);
              const isExpanded = expandedCardId === request.id;
              return (
                <Card
                  key={request.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('a')) setExpandedCardId((id) => (id === request.id ? null : request.id)); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedCardId((id) => (id === request.id ? null : request.id)); } }}
                  className={cn(
                    "rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col",
                    "cursor-pointer select-none transition-all duration-200",
                    "hover:border-white/20 active:scale-[0.99]",
                    "backdrop-blur-[40px] saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  )}
                >
                  {/* Header: Incoming Brand Request — darker purple band */}
                  <div className="bg-gradient-to-r from-purple-800/90 to-indigo-800/90 px-4 py-2 text-center border-b border-white/10">
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      Incoming Brand Request
                    </h2>
                  </div>
                  <CardContent className="p-3 flex flex-col flex-1 space-y-3">
                    {/* Brand name + Barter tag on same row; contact below */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {request.brand_name ?? 'Brand'}
                        </h3>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white shrink-0",
                          request.collab_type === 'paid' && "bg-green-500/30 border border-green-400/40",
                          request.collab_type === 'barter' && "bg-purple-500/40 border border-purple-400/50",
                          request.collab_type === 'both' && "bg-purple-500/40 border border-purple-400/50"
                        )}>
                          {request.collab_type === 'paid' ? 'Paid' : request.collab_type === 'barter' ? 'Barter' : 'Both'}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mt-0.5">{request.brand_email}</p>
                    </div>

                    {/* Estimated value — gift icon + label + bold ₹ */}
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-300/90 shrink-0" aria-hidden />
                      <span className="text-sm text-white/80">Estimated value</span>
                      <span className="text-base font-bold text-white ml-auto">
                        {formatBudget(request)}
                      </span>
                    </div>
                    {/* Deadline for paid-only (no product preview block) */}
                    {request.collab_type === 'paid' && request.deadline && (
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <ShoppingBag className="h-4 w-4 text-white/50 shrink-0" aria-hidden />
                        <span>{new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}

                    {/* Product preview — large image, label bottom-left, date top-right */}
                    {(request.collab_type === 'barter' || request.collab_type === 'both') && (request.barter_product_image_url || failedBarterImages[request.id]) && (
                      <div className="w-full rounded-lg overflow-hidden bg-white/[0.08] border border-white/10 aspect-[4/3] min-h-[120px] relative">
                        {request.barter_product_image_url && !failedBarterImages[request.id] ? (
                          <>
                            <span className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-lg text-[10px] font-medium text-white/95 bg-black/50 backdrop-blur-sm">
                              Product preview
                            </span>
                            {request.deadline && (
                              <span className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-white/95 bg-black/50 backdrop-blur-sm">
                                <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                                {new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                            <img
                              src={request.barter_product_image_url}
                              alt="Barter product"
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={() => setFailedBarterImages((prev) => ({ ...prev, [request.id]: true }))}
                            />
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2">
                            <ImageIcon className="h-10 w-10" aria-hidden />
                            <span className="text-xs">Product preview</span>
                            {request.deadline && (
                              <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/60">
                                <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                                {new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deliverables — pill tags (always visible) */}
                    {deliverablesList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {deliverablesList.slice(0, 5).map((d, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-white/95 bg-white/10 border border-white/20"
                          >
                            {d}
                          </span>
                        ))}
                        {deliverablesList.length > 5 && (
                          <span className="inline-flex px-2 py-1 text-xs text-white/60">+{deliverablesList.length - 5}</span>
                        )}
                      </div>
                    )}

                    {/* Expanded: campaign description + open full brief */}
                    {isExpanded && (
                      <div className="space-y-1.5 pt-1.5 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                        {request.campaign_description && (
                          <p className="text-sm text-purple-200/90 line-clamp-3 leading-snug">
                            {request.campaign_description}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDetail(request); }}
                          className="text-xs text-purple-300/80 hover:text-purple-200 font-medium"
                        >
                          Open full brief →
                        </button>
                      </div>
                    )}
                    {!isExpanded && (
                      <p className="text-xs text-purple-300/60">Tap to expand</p>
                    )}

                    {/* Primary CTA — Accept Deal (Purple→Blue); Counter (outline); Decline (soft red) */}
                    <div className="mt-auto pt-1.5 space-y-2.5">
                      <div>
                        <Button
                          type="button"
                          disabled={acceptingRequestId === request.id}
                          onClick={(e) => { e.stopPropagation(); acceptRequest(request); }}
                          className={cn(
                            "w-full min-h-[44px] font-bold text-white rounded-xl text-sm transition-colors duration-200",
                            "shadow-[0_2px_12px_rgba(139,92,246,0.25)] border-0",
                            acceptingRequestId === request.id
                              ? "bg-[#4C1D95] text-[#A78BFA] opacity-70 cursor-not-allowed"
                              : "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5]"
                          )}
                        >
                          {acceptingRequestId === request.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 mr-2" />
                              Generating contract…
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 shrink-0 mr-2" aria-hidden />
                              Accept Deal
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-white/50 mt-1.5 text-center">Contract auto-generated • No payment risk</p>
                      </div>
                      <div className="flex items-center justify-center gap-3 py-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/collab-requests/${request.id}/counter`, { state: { request } }); }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium border border-[#A78BFA] bg-transparent text-[#DDD6FE] hover:bg-purple-500/10 rounded-lg px-3 py-2 transition-colors"
                        >
                          <FileEdit className="h-4 w-4 shrink-0" aria-hidden />
                          Counter
                        </button>
                        <span className="w-px h-4 bg-white/30" aria-hidden />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDeclineConfirm(request); }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium border border-red-700/50 bg-transparent text-[#FCA5A5] hover:bg-red-500/10 rounded-lg px-3 py-2 transition-colors"
                          aria-label="Decline"
                        >
                          <XCircle className="h-4 w-4 shrink-0" aria-hidden />
                          Decline
                        </button>
                      </div>
                      <p className="text-[10px] text-purple-300/60 flex items-center justify-center gap-1.5" role="status">
                        <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
                        Legally protected by Creator Armour
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Counter sent — locked, timestamp, trust */}
        {counteredRequests.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-purple-200/80 text-sm">Counter sent — awaiting brand response</p>
            {counteredRequests.map((request) => {
              const counterDate = request.updated_at ? new Date(request.updated_at) : null;
              return (
                <Card key={request.id} className="rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 border-blue-500/20 overflow-hidden">
                  <CardContent className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-white truncate">{(request.collab_type === 'barter' || request.collab_type === 'both') ? 'Barter Collaboration' : request.brand_name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30 shrink-0">Counter Sent</span>
                    </div>
                    <div className="pt-2 border-t border-white/5 space-y-1.5" role="status" aria-label="Counter status and legal protection">
                      <p className="text-xs text-purple-300/70 flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 flex-shrink-0 text-blue-400/80" aria-hidden />
                        Counter sent{' '}
                        {counterDate ? (
                          <time dateTime={counterDate.toISOString()}>{counterDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</time>
                        ) : (
                          '—'
                        )}{' '}
                        — legally recorded
                      </p>
                      <p className="text-[11px] text-purple-300/60 flex items-center gap-1.5">
                        <Lock className="h-3 w-3 flex-shrink-0 text-white/40" aria-hidden />
                        Auto-contracted & legally protected
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail modal: full brief + Accept / Counter / Decline / View full brief */}
        <Dialog open={showDetailModal} onOpenChange={(open) => {
          setShowDetailModal(open);
          if (!open) setCampaignDescriptionExpanded(false);
        }}>
          <DialogContent className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-white/20 text-white max-h-[90vh] overflow-y-auto p-4 sm:p-5 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-lg sm:w-full">
            <DialogHeader className="space-y-1 pb-2 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-white text-lg leading-tight">
                  {(selectedRequest?.collab_type === 'barter' || selectedRequest?.collab_type === 'both') ? 'Barter Collaboration' : `${selectedRequest?.brand_name ?? ''} — Full brief`}
                </DialogTitle>
                {(selectedRequest?.collab_type === 'barter' || selectedRequest?.collab_type === 'both') && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/20 text-purple-200/90 bg-white/5">
                    Barter
                  </span>
                )}
              </div>
              <DialogDescription className="text-purple-300/70 text-xs">
                {selectedRequest?.brand_email}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 pt-0">
                {/* Deal Summary — what do I get & by when */}
                <div className="flex items-center gap-3 py-3 px-3 rounded-xl bg-white/[0.06] border border-white/10">
                  {(selectedRequest.collab_type === 'barter' || selectedRequest.collab_type === 'both') && selectedRequest.barter_product_image_url && (
                    <img
                      src={selectedRequest.barter_product_image_url}
                      alt="Barter product"
                      loading="lazy"
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover border border-white/15 ring-1 ring-white/10 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-base">{formatBudget(selectedRequest)}</p>
                    {selectedRequest.deadline && (
                      <p className="text-sm text-purple-200/90 mt-0.5">
                        Deadline: {new Date(selectedRequest.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Requested Deliverables — compact grid */}
                <div>
                  <p className="text-[11px] font-medium text-purple-300/60 uppercase tracking-wider mb-2">Requested Deliverables</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {parseDeliverables(selectedRequest.deliverables).map((d, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-white/10 text-purple-200/90 bg-white/[0.04]">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Campaign description — ~4 lines, Read more toggle */}
                <div>
                  <p className="text-[11px] font-medium text-purple-300/60 uppercase tracking-wider mb-1.5">Campaign description</p>
                  <p className={cn(
                    "text-sm text-purple-200 leading-relaxed whitespace-pre-wrap",
                    !campaignDescriptionExpanded && "line-clamp-4"
                  )}>
                    {selectedRequest.campaign_description || '—'}
                  </p>
                  {(selectedRequest.campaign_description ?? '').length > 180 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCampaignDescriptionExpanded((v) => !v); }}
                      className="text-xs font-medium text-purple-300/90 hover:text-purple-200 mt-1 transition-colors"
                    >
                      {campaignDescriptionExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                      <Button
                        disabled={selectedRequest ? acceptingRequestId === selectedRequest.id : false}
                        onClick={() => selectedRequest && acceptRequest(selectedRequest)}
                        className="w-full min-h-[44px] font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0"
                      >
                        {selectedRequest && acceptingRequestId === selectedRequest.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating contract…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accept & Generate Contract
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => { if (selectedRequest) { navigate(`/collab-requests/${selectedRequest.id}/counter`, { state: { request: selectedRequest } }); setShowDetailModal(false); } }} className="w-full border-white/25 text-purple-200 hover:bg-white/10">
                        Counter Offer
                      </Button>
                      <Button variant="outline" onClick={() => { setShowDeclineDialog(true); setShowDetailModal(false); }} className="w-full border-red-500/30 text-red-200 hover:bg-red-500/10">
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                    <p className="text-[10px] text-purple-300/50 flex items-center justify-center gap-1.5 pt-1">
                      <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
                      Auto-contracted & legally protected
                    </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Decline confirmation */}
        <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <AlertDialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-white/20 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Decline collaboration request</AlertDialogTitle>
              <AlertDialogDescription className="text-purple-200">
                This will send a polite decline to {selectedRequest?.brand_name}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedRequest && handleDecline()} className="bg-red-600 hover:bg-red-700">Decline</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestsPage;


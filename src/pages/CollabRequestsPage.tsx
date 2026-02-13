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
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
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
          setSelectedRequest(null);
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}/delivery-details`);
        } else {
          if (data.contract) {
            toast.success('Contract generated and ready for signing');
          } else {
            toast.success('Collaboration request accepted! Deal created successfully.');
          }
          invalidate();
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
          /* Request cards — now clickable via Link to satisfy user request */
          <div className="space-y-6">
            {pendingRequests.map((request) => {
              const deliverablesList = parseDeliverables(request.deliverables);
              return (
                <Card
                  key={request.id}
                  className={cn(
                    "rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex flex-col",
                    "select-none transition-all duration-200",
                    "backdrop-blur-[40px] saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.3)] group"
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

                    {/* Deadline */}
                    {request.deadline && (
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <ShoppingBag className="h-4 w-4 text-white/50 shrink-0" aria-hidden />
                        <span>{new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}

                    {/* Product preview */}
                    {(request.collab_type === 'barter' || request.collab_type === 'both') && (request.barter_product_image_url || failedBarterImages[request.id]) && (
                      <div className="w-full rounded-lg overflow-hidden bg-white/[0.08] border border-white/10 aspect-[4/3] min-h-[120px] relative">
                        {request.barter_product_image_url && !failedBarterImages[request.id] ? (
                          <>
                            <span className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-lg text-[10px] font-medium text-white/95 bg-black/50 backdrop-blur-sm">
                              Product preview
                            </span>
                            <img
                              src={request.barter_product_image_url}
                              alt="Barter product"
                              className="w-full h-full object-cover"
                              onError={() => setFailedBarterImages((prev) => ({ ...prev, [request.id]: true }))}
                            />
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2">
                            <ImageIcon className="h-10 w-10" aria-hidden />
                            <span className="text-xs">Product preview</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deliverables */}
                    {deliverablesList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {deliverablesList.map((d, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-white/95 bg-white/10 border border-white/20"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Campaign Description - Now directly on card */}
                    {request.campaign_description && (
                      <div className="pt-1.5 border-t border-white/10 mt-1">
                        <p className="text-[11px] font-medium text-purple-300/60 uppercase tracking-wider mb-1">
                          Campaign details
                        </p>
                        <p className="text-sm text-purple-100/90 leading-relaxed whitespace-pre-wrap">
                          {request.campaign_description}
                        </p>
                      </div>
                    )}

                    {/* Primary CTA */}
                    <div className="mt-auto pt-1.5 space-y-2.5">
                      <Button
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
                        {acceptingRequestId === request.id ? 'Generating contract…' : 'Accept Deal'}
                      </Button>
                      <div className="flex items-center justify-center gap-3 py-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/collab-requests/${request.id}/counter`, { state: { request } }); }}
                          className="text-sm font-medium text-[#DDD6FE] hover:text-white"
                        >
                          Counter
                        </button>
                        <span className="w-px h-4 bg-white/30" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDeclineConfirm(request); }}
                          className="text-sm font-medium text-[#FCA5A5] hover:text-white"
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
        {counteredRequests.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-purple-200/80 text-sm">Counter sent — awaiting brand response</p>
            {counteredRequests.map((request) => (
              <Card key={request.id} className="rounded-[20px] bg-white/5 border border-white/10 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{request.brand_name}</h3>
                    <span className="text-[11px] font-medium bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-md">Counter Sent</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Decline confirmation */}
        <AlertDialog open={showDeclineDialog} onOpenChange={(showDeclineDialog) => setShowDeclineDialog(showDeclineDialog)}>
          <AlertDialogContent className="bg-purple-900 border-white/20 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Decline request?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDecline} className="bg-red-600">Decline</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestsPage;

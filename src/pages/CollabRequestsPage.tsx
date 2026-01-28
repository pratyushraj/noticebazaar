"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  Lock,
  ChevronRight,
  Pencil,
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
import { formatRelativeTime } from '@/lib/utils/time';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';

type CollabRequestStatus = 'pending' | 'accepted' | 'countered' | 'declined';
type CollabType = 'paid' | 'barter' | 'both';

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
  updated_at?: string;
  creator_id: string;
}

const CollabRequestsPage = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CollabRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [campaignDescriptionExpanded, setCampaignDescriptionExpanded] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchRequests();
    }
  }, [profile?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Get current session (Supabase auto-refreshes tokens)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[CollabRequestsPage] No session:', sessionError);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests`,
        {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        console.error('[CollabRequestsPage] Unauthorized - token may be invalid');
        toast.error('Session expired. Please refresh the page.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        console.error('[CollabRequestsPage] API error:', data);
        toast.error(data.error || 'Failed to load collaboration requests');
      }
    } catch (error: any) {
      console.error('[CollabRequestsPage] Fetch error:', error);
      toast.error('Failed to load collaboration requests');
    } finally {
      setLoading(false);
    }
  };

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
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests/${request.id}/accept`,
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
        if (data.contract) {
          toast.success('Contract generated. Waiting for brand signature.');
        } else {
          toast.success('Collaboration request accepted! Deal created successfully.');
        }
        fetchRequests();
        setShowDetailModal(false);
        setSelectedRequest(null);
        if (data.deal?.id) {
          navigate(`/creator-contracts/${data.deal.id}`);
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests/${selectedRequest.id}/decline`,
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
        toast.success('Request declined');
        fetchRequests();
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
  const collabLink = hasUsername ? `${window.location.origin}/collab/${usernameForLink}` : '';

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
        {/* Collab link always at top — Copy Link + Preview as Brand */}
        {hasUsername && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 flex items-center gap-2">
                <code className={cn("text-sm text-purple-200 truncate flex-1")}>
                  {collabLink.replace(/^https?:\/\//, '')}
                </code>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCollabLink}
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/60 hover:text-purple-100"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/collab/${usernameForLink}`, '_blank')}
                  className="border-purple-400/40 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/60 hover:text-purple-100"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview as Brand
                </Button>
              </div>
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <p className="text-purple-200/80 text-sm mb-4">Requests from brands using your public link</p>
        )}

        {/* Empty state or request cards */}
        {pendingRequests.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6">
                <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">No brand requests yet</h3>
                <p className="text-purple-200/80 text-sm mb-6 max-w-md mx-auto">
                  Share your collab link so brands can send structured requests instead of DMs.
                </p>
                <div className="text-left max-w-sm mx-auto space-y-3 mb-6">
                  <p className="text-xs font-medium text-purple-300/80 uppercase tracking-wider">Get your first request</p>
                  <ol className="space-y-2.5 text-sm text-purple-200 list-decimal list-inside">
                    <li>Share your collab link in your Instagram bio</li>
                    <li>Reply to brand emails with this link</li>
                    <li>Pin the link in WhatsApp or your email signature</li>
                  </ol>
                </div>
                {hasUsername && (
                  <Button
                    onClick={copyCollabLink}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Collab Link
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Request cards — polished for clarity, trust, fast decision-making */
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const deliverablesList = parseDeliverables(request.deliverables);
              return (
                <Card
                  key={request.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(request)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(request); } }}
                  className={cn(
                    "rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden flex flex-col",
                    "cursor-pointer select-none",
                    "hover:border-purple-500/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
                    "active:scale-[0.99] transition-all duration-200"
                  )}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col flex-1 space-y-5">
                    {/* 1. Card header: "Barter Collaboration" for barter/both, brand for paid; pills right; stronger title/timestamp hierarchy */}
                    <div className="space-y-0.5">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <h3 className="text-lg font-bold text-white break-words flex-1 min-w-0 leading-tight">
                          {(request.collab_type === 'barter' || request.collab_type === 'both') ? 'Barter Collaboration' : request.brand_name}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-white/20 text-purple-200/90 bg-white/5">
                            {request.collab_type === 'paid' ? 'Paid' : request.collab_type === 'barter' ? 'Barter' : 'Both'}
                          </span>
                          {request.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/20 text-amber-200 border border-amber-500/30">
                              Pending
                            </span>
                          )}
                          {request.status === 'accepted' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-500/20 text-green-200 border border-green-500/30">
                              Accepted
                            </span>
                          )}
                          {request.status === 'countered' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                              Counter Sent
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-purple-300/40">
                        {formatRelativeTime(new Date(request.created_at))}
                      </p>
                    </div>

                    {/* 2. Value + meta row: [Product image left] Barter (₹996) • 3 deliverables • 10 Feb 2026 — reduced icon noise, one line where possible */}
                    <div className="flex flex-wrap items-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.06] border border-white/[0.06]">
                      {(request.collab_type === 'barter' || request.collab_type === 'both') && request.barter_product_image_url && (
                        <img
                          src={request.barter_product_image_url}
                          alt="Barter product"
                          loading="lazy"
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg object-cover border border-white/15 ring-1 ring-white/10 flex-shrink-0"
                        />
                      )}
                      <span className="text-sm font-semibold text-white">
                        {formatBudget(request)}
                      </span>
                      <span className="text-purple-400/60 text-sm">•</span>
                      <span className="text-sm text-purple-200/90">
                        {deliverablesList.length} {deliverablesList.length === 1 ? 'deliverable' : 'deliverables'}
                      </span>
                      {request.deadline && (
                        <>
                          <span className="text-purple-400/60 text-sm">•</span>
                          <span className="text-sm text-purple-200/90">
                            {new Date(request.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* 3. Description — 2 lines max, ellipsis; "View full brief →" secondary link */}
                    {request.campaign_description && (
                      <div className="space-y-1">
                        <p className="text-sm text-purple-200/90 line-clamp-2 break-words leading-snug">
                          {request.campaign_description}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openDetail(request); }}
                          className="text-xs font-medium text-purple-300/90 hover:text-purple-200 inline-flex items-center gap-1 transition-colors"
                        >
                          View full brief
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* 4. Deliverable tags — smaller pills, lower opacity, cap 3 + "+N more" */}
                    {deliverablesList.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-purple-300/40 uppercase tracking-wider">
                          Requested Deliverables
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {deliverablesList.slice(0, 3).map((d, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border border-white/10 text-purple-200/80 bg-white/[0.04]"
                            >
                              {d}
                            </span>
                          ))}
                          {deliverablesList.length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-purple-300/60 bg-white/[0.04] border border-white/10">
                              +{deliverablesList.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. Primary CTA — Accept Deal (full-width, high emphasis); helper; secondary Counter | Decline; trust line */}
                    <div className="mt-auto pt-4 space-y-3">
                      <Button
                        type="button"
                        disabled={acceptingRequestId === request.id}
                        onClick={(e) => { e.stopPropagation(); acceptRequest(request); }}
                        className={cn(
                          "w-full min-h-[44px] font-semibold text-white",
                          "bg-gradient-to-r from-purple-600 to-indigo-600",
                          "hover:from-purple-500 hover:to-indigo-500",
                          "shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]",
                          "border-0 rounded-xl transition-all duration-200",
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        {acceptingRequestId === request.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                            Generating contract…
                          </>
                        ) : (
                          'Accept Deal'
                        )}
                      </Button>
                      <p className="text-[11px] text-purple-300/60 text-center leading-snug px-1">
                        You can still counter before signing the contract
                      </p>
                      <div className="w-full flex items-stretch gap-3 py-1 min-h-[44px]">
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/collab-requests/${request.id}/counter`, { state: { request } }); }}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-0 shadow-[0_2px_12px_rgba(139,92,246,0.3)] touch-manipulation"
                          aria-label="Open counter-offer flow"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Counter
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openDeclineConfirm(request); }}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-0 shadow-[0_2px_12px_rgba(139,92,246,0.3)] touch-manipulation"
                          aria-label="Decline request"
                        >
                          <XCircle className="h-3.5 w-3.5" aria-hidden />
                          Decline
                        </Button>
                      </div>
                      <p className="text-[10px] text-purple-300/25 flex items-center justify-center gap-1.5" role="status">
                        <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
                        Legally timestamped & protected by Creator Armour
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
            {counteredRequests.map((request) => (
              <Card key={request.id} className="rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 border-blue-500/20 overflow-hidden">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">{(request.collab_type === 'barter' || request.collab_type === 'both') ? 'Barter Collaboration' : request.brand_name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">Counter Sent</span>
                  </div>
                  <p className="text-xs text-purple-300/60 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
                    Counter sent on {request.updated_at ? new Date(request.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} — legally recorded
                  </p>
                  <p className="text-[10px] text-purple-300/25 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
                    All counters are logged, timestamped, and protected by Creator Armour
                  </p>
                </CardContent>
              </Card>
            ))}
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
                    <p className="text-[10px] text-purple-300/25 flex items-center justify-center gap-1.5 pt-1">
                      <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
                      This request is timestamped and legally protected by Creator Armour
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


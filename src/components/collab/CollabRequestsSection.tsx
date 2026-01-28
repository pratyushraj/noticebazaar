import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Clock,
  Loader2,
  Copy,
  ExternalLink,
  DollarSign
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatRelativeTime } from '@/lib/utils/time';
import { getApiBaseUrl } from '@/lib/utils/api';

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
  counter_offer: {
    final_price?: number | null;
    deliverables?: string | null;
    payment_terms?: string | null;
    notes?: string | null;
    countered_at?: string;
  } | null;
  created_at: string;
}

type CollabAction = 'accept' | 'counter' | 'decline' | null;

interface CollabRequestsSectionProps {
  /** When provided, the section does not show its own collab link bar (hero owns it). */
  copyCollabLink?: () => void;
  usernameForLink?: string;
}

const CollabRequestsSection = ({ copyCollabLink, usernameForLink: usernameFromParent }: CollabRequestsSectionProps) => {
  const navigate = useNavigate();
  const { profile, user } = useSession();
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CollabRequest | null>(null);
  const [action, setAction] = useState<CollabAction>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDeliverables, setCounterDeliverables] = useState('');
  const [counterNotes, setCounterNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Get current session (Supabase auto-refreshes tokens)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[CollabRequestsSection] No session:', sessionError);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/collab-requests`,
        {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        console.error('[CollabRequestsSection] Unauthorized - token may be invalid');
        toast.error('Session expired. Please refresh the page.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        console.error('[CollabRequestsSection] API error:', data);
        toast.error(data.error || 'Failed to load collaboration requests');
      }
    } catch (error: any) {
      console.error('[CollabRequestsSection] Fetch error:', error);
      toast.error('Failed to load collaboration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: CollabRequest) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to accept requests');
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
        if (data.contract) {
          toast.success('Contract generated. Waiting for brand signature.');
        } else {
          toast.success('Collaboration request accepted! Deal created successfully.');
        }
        fetchRequests();
        setAction(null);
        setSelectedRequest(null);
        if (data.deal?.id) {
          // Redirect to deal detail page (contract tab if contract exists)
          navigate(`/creator-contracts/${data.deal.id}`);
        }
      } else {
        toast.error(data.error || 'Failed to accept request');
      }
    } catch (error) {
      toast.error('Failed to accept request. Please try again.');
    }
  };

  const handleCounter = async () => {
    if (!selectedRequest) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to submit counter offers');
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/collab-requests/${selectedRequest.id}/counter`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            final_price: counterPrice || undefined,
            deliverables: counterDeliverables || undefined,
            notes: counterNotes || undefined,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Counter offer submitted!');
        fetchRequests();
        setAction(null);
        setSelectedRequest(null);
        setCounterPrice('');
        setCounterDeliverables('');
        setCounterNotes('');
      } else {
        toast.error(data.error || 'Failed to submit counter offer');
      }
    } catch (error) {
      toast.error('Failed to submit counter offer. Please try again.');
    }
  };

  const handleDecline = async (request: CollabRequest) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to decline requests');
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/collab-requests/${request.id}/decline`,
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
        setAction(null);
        setSelectedRequest(null);
      } else {
        toast.error(data.error || 'Failed to decline request');
      }
    } catch (error) {
      toast.error('Failed to decline request. Please try again.');
    }
  };

  const usernameResolved = usernameFromParent ?? profile?.instagram_handle ?? profile?.username;
  const hasUsername = Boolean(usernameResolved && usernameResolved.trim() !== '');
  const doCopyCollabLink = copyCollabLink ?? (() => {
    if (!usernameResolved) return;
    navigator.clipboard.writeText(`${window.location.origin}/collab/${usernameResolved}`);
    toast.success('Collab link copied to clipboard!');
  });

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

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="space-y-4" data-section="collab-requests">
        <h2 className="text-lg font-semibold text-white break-words">Brand Requests</h2>
        <div className="rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden p-4 sm:p-5 space-y-4 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="flex items-center justify-center py-6 gap-2 text-purple-300/80 text-sm">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>Loading requests…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white break-words" data-section="collab-requests">Brand Requests</h2>

      {/* Requests List or Empty State — no duplicate link bar; hero owns Collab Link */}
      {pendingRequests.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-5">
            <div className="text-center">
              <Briefcase className="h-10 w-10 text-purple-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-semibold text-white mb-1 break-words">No brand requests yet</h3>
              <p className="text-sm text-purple-200/80 mb-2 break-words">Brands apply through your collab link — not DMs.</p>
              <p className="text-xs text-purple-300/70 mb-4 break-words">Every request is timestamped & legally protected.</p>
              {hasUsername && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={doCopyCollabLink}
                    className="w-full min-h-[44px] bg-purple-600/40 hover:bg-purple-600/50 border border-purple-400/50 text-purple-100 font-medium"
                  >
                    <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
                    Copy Collab Link
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => usernameResolved && window.open(`/collab/${usernameResolved}`, '_blank')}
                    className="w-full min-h-[44px] text-purple-300/90 hover:text-purple-200 text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    Preview as brand
                  </Button>
                </div>
              )}
              {!hasUsername && (
                <p className="text-xs text-purple-300/70 break-words">Complete your profile to get your collab link.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-purple-300/70">
                  {pendingRequests.length === 1 
                    ? 'You have a new collaboration request waiting'
                    : 'You have new collaboration requests waiting'}
                </p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                {pendingRequests.length}
              </Badge>
            </div>

            {/* Preview of first request */}
            {pendingRequests[0] && (
              <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-white mb-1">{pendingRequests[0].brand_name}</h4>
                    <p className="text-xs text-purple-300/70">{pendingRequests[0].brand_email}</p>
                  </div>
                </div>
                
                {/* Quick Scan: Budget, Type, Deadline - Visually Grouped */}
                <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs font-semibold text-white">{formatBudget(pendingRequests[0])}</span>
                  </div>
                  <span className="text-purple-400/50">•</span>
                  <Badge
                    className={
                      pendingRequests[0].collab_type === 'paid'
                        ? 'bg-green-500/20 text-green-300 border-green-500/30 text-xs px-2 py-0.5'
                        : pendingRequests[0].collab_type === 'barter'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs px-2 py-0.5'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-2 py-0.5'
                    }
                  >
                    {pendingRequests[0].collab_type === 'paid' ? 'Paid' : pendingRequests[0].collab_type === 'barter' ? 'Barter' : 'Both'}
                  </Badge>
                  {pendingRequests[0].deadline && (
                    <>
                      <span className="text-purple-400/50">•</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-xs text-purple-200">{new Date(pendingRequests[0].deadline).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Barter product image thumbnail (optional) */}
                {(pendingRequests[0].collab_type === 'barter' || pendingRequests[0].collab_type === 'both') && pendingRequests[0].barter_product_image_url && (
                  <div className="mb-3 flex items-center gap-2">
                    <img
                      src={pendingRequests[0].barter_product_image_url}
                      alt="Barter product"
                      loading="lazy"
                      className="rounded-lg object-cover max-h-14 w-14 border border-white/10 flex-shrink-0"
                    />
                  </div>
                )}
                
                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300/70">Deliverables:</span>
                    <span className="text-white">{parseDeliverables(pendingRequests[0].deliverables).slice(0, 2).join(', ')}{parseDeliverables(pendingRequests[0].deliverables).length > 2 ? '...' : ''}</span>
                  </div>
                </div>
                <p className="text-xs text-purple-200/70 line-clamp-2 mb-3">
                  {pendingRequests[0].campaign_description}
                </p>
                
                {/* Trust Line */}
                <div className="mb-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-purple-300/70 text-center leading-relaxed">
                    This collaboration will be legally protected if accepted via Creator Armour
                  </p>
                </div>
                
                <div className="text-xs text-purple-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(pendingRequests[0].created_at)}
                </div>
              </div>
            )}

            {/* View All Button */}
            <Button
              onClick={() => navigate('/collab-requests')}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Requests ({pendingRequests.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Accept Dialog */}
      <AlertDialog open={action === 'accept' && !!selectedRequest}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Collaboration Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              This will create a new deal and generate a contract for{' '}
              {selectedRequest?.brand_name}. The brand will receive a signing link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAction(null);
                setSelectedRequest(null);
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleAccept(selectedRequest)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Accept & Create Deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Counter Offer Dialog */}
      <AlertDialog open={action === 'counter' && !!selectedRequest}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-white/20 text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Counter Offer</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              Submit a counter offer to {selectedRequest?.brand_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Final Price (₹)</Label>
              <Input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder="Enter your price"
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white">Deliverables</Label>
              <Textarea
                value={counterDeliverables}
                onChange={(e) => setCounterDeliverables(e.target.value)}
                placeholder="Specify deliverables..."
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white">Notes (Optional)</Label>
              <Textarea
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                placeholder="Add any notes..."
                className="bg-white/5 border-white/20 text-white mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAction(null);
                setSelectedRequest(null);
                setCounterPrice('');
                setCounterDeliverables('');
                setCounterNotes('');
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCounter}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Submit Counter Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Dialog */}
      <AlertDialog open={action === 'decline' && !!selectedRequest}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900 to-indigo-900 border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Collaboration Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              This will send a polite decline message to {selectedRequest?.brand_name}.
              You can't undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAction(null);
                setSelectedRequest(null);
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleDecline(selectedRequest)}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollabRequestsSection;


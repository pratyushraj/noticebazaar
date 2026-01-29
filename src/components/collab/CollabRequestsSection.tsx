import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  MessageSquare, 
  Loader2,
  ExternalLink,
  ChevronRight,
  Share2,
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
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';

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
        trackEvent('creator_accepted_request', {
          deal_id: data.deal?.id,
          creator_id: profile?.id,
          collab_type: selectedRequest?.collab_type || 'paid',
        });
        if (data.needs_delivery_details) {
          toast.success('Share delivery details to proceed');
          fetchRequests();
          setAction(null);
          setSelectedRequest(null);
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}/delivery-details`);
        } else {
          if (data.contract) {
            toast.success('Contract generated and ready for signing');
          } else {
            toast.success('Collaboration request accepted! Deal created successfully.');
          }
          fetchRequests();
          setAction(null);
          setSelectedRequest(null);
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}`);
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
        trackEvent('creator_countered_request', {
          request_id: selectedRequest?.id,
          creator_id: profile?.id,
          collab_type: selectedRequest?.collab_type || 'paid',
        });
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
        trackEvent('creator_declined_request', { request_id: request.id, creator_id: profile?.id });
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
        <Card className="rounded-[20px] saturate-[180%] border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-200">
          <CardContent className="py-4 px-5">
            <div className="text-center">
              <Briefcase className="h-10 w-10 text-purple-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-semibold text-white mb-1 break-words">No brand requests yet</h3>
              <p className="text-sm text-purple-200/80 mb-3 break-words">Brands apply through your collab link — not DMs.</p>
              {hasUsername && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={doCopyCollabLink}
                    className="w-full min-h-[48px] bg-purple-600/50 hover:bg-purple-600/60 border border-purple-400/50 text-purple-100 font-medium"
                  >
                    <Share2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    Share Collab Link
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => usernameResolved && window.open(`/collab/${usernameResolved}`, '_blank')}
                    className="w-full min-h-[48px] text-purple-300/90 hover:text-purple-200 text-sm"
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
        <Card className="rounded-[20px] saturate-[180%] border border-purple-400/30 bg-gradient-to-br from-purple-500/15 via-white/8 to-indigo-500/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200">
          <CardContent className="py-4 px-5 space-y-3">
            {/* Title row: heading + badge inline */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white break-words">
                New Brand Requests ({pendingRequests.length})
              </h3>
              <Badge className="shrink-0 bg-purple-500/30 text-purple-200 border-purple-400/40 text-sm font-medium">
                {pendingRequests.length}
              </Badge>
            </div>
            <p className="text-sm text-purple-200/90 break-words">
              Brands are waiting for your response
            </p>

            {/* CTA — dominant, thumb-friendly */}
            <div className="space-y-1.5 pt-0.5">
              <Button
                onClick={() => navigate('/collab-requests')}
                className="w-full min-h-[48px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg border-0"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                Review & Accept Deals
                <Badge variant="secondary" className="ml-2 bg-white/25 text-white text-xs font-medium border-0">
                  {pendingRequests.length}
                </Badge>
                <ChevronRight className="h-4 w-4 ml-1 flex-shrink-0" aria-hidden />
              </Button>
              <p className="text-xs text-purple-300/60 break-words text-center">
                Faster replies increase acceptance rate
              </p>
            </div>
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


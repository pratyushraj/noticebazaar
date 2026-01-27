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
  Lightbulb,
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

const CollabRequestsSection = () => {
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests`,
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests/${selectedRequest.id}/counter`,
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
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests/${request.id}/decline`,
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

  const copyCollabLink = () => {
    // Use Instagram handle first, then fallback to username (same logic as CreatorProfile)
    const usernameForLink = profile?.instagram_handle || profile?.username || 'your-username';
    const link = `${window.location.origin}/collab/${usernameForLink}`;
    navigator.clipboard.writeText(link);
    toast.success('Collab link copied to clipboard!');
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

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Collab Link */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2" data-section="collab-requests">Incoming Brand Requests</h2>
          <p className="text-purple-200 text-sm mb-1">
            Brands submit collaboration requests via your public link
          </p>
          <p className="text-purple-300/80 text-xs font-medium">
            Respond within 48 hours to improve acceptance rate
          </p>
        </div>
        {/* Public collab link — clear, scannable */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          {(() => {
            const usernameForLink = profile?.instagram_handle || profile?.username;
            const hasUsername = usernameForLink && usernameForLink.trim() !== '';
            if (!hasUsername) return null;
            return (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-300/70 mb-1.5 font-medium">Your public collab link — one link, share everywhere</p>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10">
                    <code className="text-sm text-purple-100 truncate">
                      creatorarmour.com/collab/{usernameForLink}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyCollabLink}
                      className="h-8 w-8 p-0 text-purple-300 hover:text-white flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
            variant="outline"
            onClick={() => {
              const usernameForLink = profile?.instagram_handle || profile?.username;
              if (usernameForLink) {
                window.open(`/collab/${usernameForLink}`, '_blank');
              } else {
                toast.error('Username not set. Please update your profile.');
              }
            }}
            className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Link
          </Button>
              </>
            );
          })()}
        </div>
      </div>

      {/* Educational Tip */}
      <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-purple-200/80 leading-relaxed">
          <span className="font-medium text-purple-200">Tip:</span> Add your collab link to Instagram bio to stop brand DMs.
        </p>
      </div>

      {/* Requests List */}
      {pendingRequests.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-6">
            <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">
                No brand requests yet — add your collab link to your bio to get started
            </h3>
              <p className="text-sm text-purple-200/80 mb-4 max-w-md mx-auto leading-relaxed">
                One secure link replaces back-and-forth DMs. Share it; brands submit requests there.
              </p>
              <div className="inline-block rounded-lg bg-purple-500/15 border border-purple-400/25 px-4 py-3 max-w-md">
                <p className="text-sm text-purple-100 font-medium mb-1">Legally protected from day one</p>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Every request through this link is logged, timestamped, and legally protected by Creator Armour. No loose DMs — one clear record.
                </p>
              </div>
            </div>

            {/* Action Checklist */}
            <div className="mb-6 text-left max-w-md mx-auto">
              <p className="text-xs text-purple-300/70 mb-3 font-medium">
                Get your first collaboration request:
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5 text-sm text-purple-200">
                  <span className="text-purple-300 font-semibold flex-shrink-0 mt-0.5">1️⃣</span>
                  <span>Add this link to your Instagram bio</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-purple-200">
                  <span className="text-purple-300 font-semibold flex-shrink-0 mt-0.5">2️⃣</span>
                  <span>Reply to brand DMs with this link</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-purple-200">
                  <span className="text-purple-300 font-semibold flex-shrink-0 mt-0.5">3️⃣</span>
                  <span>Pin it in your WhatsApp or Email signature</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            {(() => {
              // Use Instagram handle first, then fallback to username (same logic as CreatorProfile)
              const usernameForLink = profile?.instagram_handle || profile?.username;
              const hasUsername = usernameForLink && usernameForLink.trim() !== '';
              
              if (!hasUsername) {
                return (
                  <div className="text-center">
                    <p className="text-sm text-purple-300/70 mb-3">
                      Complete your profile to activate your collab link
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
              <Button
                onClick={copyCollabLink}
                variant="outline"
                    className="bg-purple-500/20 border-purple-400/50 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400/70 w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Collab Link
              </Button>
                  <Button
                    onClick={() => window.open(`/collab/${usernameForLink}`, '_blank')}
                    variant="outline"
                    className="border-purple-400/30 text-purple-300/80 hover:bg-purple-500/10 hover:text-purple-200 w-full sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                    Open as a brand would — see the form and fields
                  </Button>
                </div>
              );
            })()}

            {/* Future Features Hint */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-purple-300/60 text-center">
                Coming soon: Auto-generated contracts • Payment tracking • Brand ratings
              </p>
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


"use client";

import { useState, useEffect } from 'react';
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
  ArrowLeft
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
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { typography, spacing } from '@/lib/design-system';

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
  created_at: string;
  creator_id: string;
}

const CollabRequestsPage = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CollabRequest | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

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

  const handleAccept = async () => {
    if (!selectedRequest) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to accept requests');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-requests/${selectedRequest.id}/accept`,
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
        setShowAcceptDialog(false);
        setSelectedRequest(null);
        if (data.deal?.id) {
          navigate(`/creator-contracts/${data.deal.id}`);
        }
      } else {
        toast.error(data.error || 'Failed to accept request');
      }
    } catch (error) {
      toast.error('Failed to accept request. Please try again.');
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
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const declinedRequests = requests.filter(r => r.status === 'declined');

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

  return (
    <CreatorNavigationWrapper title="Collaboration Requests" subtitle="Manage incoming brand requests">
      <div className={cn(spacing.loose, "pb-24")}>
        {/* Header with Collab Link */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className={cn(typography.h2, "mb-2")}>Collaboration Requests</h2>
            <p className="text-purple-200 text-sm">
              Brands submit collaboration requests via your public link
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const usernameForLink = profile?.instagram_handle || profile?.username;
              const hasUsername = usernameForLink && usernameForLink.trim() !== '';
              
              if (!hasUsername) return null;
              
              return (
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <code className="text-sm text-purple-200">
                    creatorarmour.com/collab/{usernameForLink}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCollabLink}
                    className="h-8 w-8 p-0 text-purple-300 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              );
            })()}
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
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Link
            </Button>
          </div>
        </div>

        {/* Educational Tip */}
        <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-6">
          <Briefcase className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
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
                  No brand requests yet — share this link in your bio to start receiving paid collaborations.
                </h3>
                <p className="text-purple-200 text-sm">
                  Brands will be able to submit structured collaboration requests instead of sending DMs.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="bg-white/5 backdrop-blur-md border-white/10 hover:border-purple-500/30 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{request.brand_name}</h3>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                            {request.collab_type === 'paid' ? 'Paid' : request.collab_type === 'barter' ? 'Barter' : 'Both'}
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-300/70">{request.brand_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-purple-300/60 mb-1">
                          {formatRelativeTime(new Date(request.created_at))}
                        </p>
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          Pending
                        </Badge>
                      </div>
                    </div>

                    {/* Budget */}
                    {request.collab_type === 'paid' || request.collab_type === 'both' ? (
                      <div>
                        <p className="text-xs text-purple-300/60 mb-1">Budget</p>
                        <p className="text-sm font-medium text-white">
                          {request.exact_budget 
                            ? `₹${request.exact_budget.toLocaleString()}`
                            : request.budget_range || 'Not specified'}
                        </p>
                      </div>
                    ) : null}

                    {/* Budget */}
                    <div>
                      <p className="text-xs text-purple-300/60 mb-1">
                        {request.collab_type === 'paid' ? 'Budget' : request.collab_type === 'barter' ? 'Product Value' : 'Offer'}
                      </p>
                      <p className="text-sm font-medium text-white">
                        {formatBudget(request)}
                      </p>
                    </div>

                    {/* Deliverables */}
                    <div>
                      <p className="text-xs text-purple-300/60 mb-1">Deliverables</p>
                      <div className="flex flex-wrap gap-2">
                        {parseDeliverables(request.deliverables).map((deliverable, idx) => (
                          <Badge key={idx} variant="outline" className="border-white/20 text-purple-200">
                            {deliverable}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Deadline */}
                    {request.deadline && (
                      <div>
                        <p className="text-xs text-purple-300/60 mb-1">Deadline</p>
                        <p className="text-sm text-white">
                          {new Date(request.deadline).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Campaign Description */}
                    {request.campaign_description && (
                      <div>
                        <p className="text-xs text-purple-300/60 mb-1">Campaign Description</p>
                        <p className="text-sm text-purple-200 line-clamp-3">
                          {request.campaign_description}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowAcceptDialog(true);
                        }}
                        className="flex-1 border-green-500/30 text-green-300 hover:bg-green-500/10"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDeclineDialog(true);
                        }}
                        className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Accept Dialog */}
        <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Accept Collaboration Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to accept this collaboration request from {selectedRequest?.brand_name}? 
                This will create a new deal in your contracts section.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAccept}>Accept</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Decline Dialog */}
        <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline Collaboration Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to decline this collaboration request from {selectedRequest?.brand_name}? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDecline} className="bg-red-600 hover:bg-red-700">
                Decline
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestsPage;


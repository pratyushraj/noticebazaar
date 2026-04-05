import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import BrandDealsStats from '@/components/creator-contracts/BrandDealsStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Clock, CheckCircle2, ArrowRightLeft, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useBrandCollabRequests, acceptCounterOffer, declineCounterOffer } from '@/lib/hooks/useBrandCollabRequests';

type BrandTab = 'sent' | 'countered' | 'active' | 'completed';

const BrandDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [tab, setTab] = useState<BrandTab>('sent');
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isBrandUser = profile?.role === 'brand';
  const { requests: brandRequests, invalidate: invalidateRequests } = useBrandCollabRequests();

  // ── Counter offer actions ────────────────────────────────────────────

  const handleAcceptCounter = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const result = await acceptCounterOffer(requestId);
      if (result.success) {
        toast.success('Counter accepted! Deal created.');
        await invalidateRequests();
        if (result.deal_id) navigate(`/brand-deal/${result.deal_id}`);
        else setTab('active');
      } else {
        toast.error(result.error || 'Failed to accept counter');
      }
    } catch {
      toast.error('Failed to accept counter');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineCounter = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const result = await declineCounterOffer(requestId);
      if (result.success) {
        toast.success('Counter declined');
        await invalidateRequests();
      } else {
        toast.error(result.error || 'Failed to decline counter');
      }
    } catch {
      toast.error('Failed to decline counter');
    } finally {
      setActionLoading(null);
    }
  };

  // Derived: countered requests (need brand action)
  const counteredRequests = brandRequests.filter(r => r.status === 'countered');
  const pendingRequests = brandRequests.filter(r => r.status === 'pending');

  useEffect(() => {
    if (!profile?.id || !isBrandUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    supabase
      .from('brand_deals')
      .select('*')
      .eq('brand_id', profile.id as any)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error('[BrandDashboard] Failed to fetch deals:', error);
          setDeals([]);
        } else {
          setDeals((data as unknown as BrandDeal[]) || []);
        }
        setIsLoading(false);
      });
  }, [profile?.id, isBrandUser]);

  // Sent = awaiting creator response (brand sent offer, waiting)
  const sentDeals = deals.filter(deal => {
    const s = (deal.status || '').toLowerCase();
    return !s || s === 'pending' || s === 'sent' || s === 'awaiting response' ||
      s.includes('awaiting') || s.includes('proposal') || s.includes('sent');
  });

  // Active = in progress (accepted, content being made, submitted, approved, payment pending)
  const activeDeals = deals.filter(deal => {
    const s = (deal.status || '').toLowerCase();
    return s.includes('accepted') || s.includes('in_progress') || s.includes('live') ||
      s.includes('making') || s.includes('submitted') || s.includes('delivered') ||
      s.includes('approved') || s.includes('revision') || s.includes('changes') ||
      (s.includes('payment') && !s.includes('completed') && !s.includes('received'));
  });

  // Completed = done
  const completedDeals = deals.filter(deal => {
    const s = (deal.status || '').toLowerCase();
    return s.includes('completed') || s.includes('vested') || s.includes('received');
  });

  const displayedDeals =
    tab === 'sent' ? sentDeals :
    tab === 'active' ? activeDeals :
    completedDeals;

  const getStageColor = (status: string | null | undefined) => {
    if (!status) return 'bg-yellow-500/20 text-yellow-400';
    const s = status.toLowerCase();
    if (s.includes('awaiting') || (!s && tab === 'sent')) return 'bg-yellow-500/20 text-yellow-400';
    if (s.includes('content') && s.includes('making')) return 'bg-info/20 text-info';
    if (s.includes('delivered') || s.includes('submitted')) return 'bg-secondary/20 text-secondary';
    if (s.includes('approved')) return 'bg-primary/20 text-primary';
    if (s.includes('payment') && (s.includes('sent') || s.includes('pending'))) return 'bg-yellow-500/20 text-yellow-400';
    if (s.includes('payment') && (s.includes('received') || s.includes('complete'))) return 'bg-green-500/20 text-green-400';
    if (s.includes('revision') || s.includes('change')) return 'bg-warning/20 text-warning';
    if (s.includes('completed') || s.includes('vested')) return 'bg-green-500/20 text-green-400';
    if (s.includes('declined') || s.includes('rejected') || s.includes('cancelled')) return 'bg-destructive/20 text-destructive';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusLabel = (status: string | null | undefined): string => {
    if (!status) return 'Awaiting response';
    const s = status.toLowerCase();
    if (s.includes('awaiting') && !s.includes('approved')) return 'Awaiting response';
    if (s.includes('proposal') || s === 'pending' || s === 'sent') return 'Awaiting response';
    if (s.includes('accepted')) return 'Accepted';
    if (s.includes('content') && s.includes('making')) return 'Content in progress';
    if (s.includes('delivered') || s.includes('submitted')) return 'Content submitted';
    if (s.includes('approved')) return 'Approved';
    if (s.includes('revision') || s.includes('changes')) return 'Changes requested';
    if (s.includes('payment') && s.includes('sent')) return 'Payment sent';
    if (s.includes('payment') && s.includes('received')) return 'Payment received';
    if (s.includes('completed') || s.includes('vested')) return 'Completed';
    if (s.includes('declined') || s.includes('rejected')) return 'Declined';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getTimeAgo = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getExpiresIn = (expiresAt: string | null | undefined): { label: string; tone: 'danger' | 'warning' | 'normal' } | null => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (diff < 0) return { label: 'Expired', tone: 'danger' };
    if (days >= 3) return { label: `Expires in ${days}d`, tone: 'normal' };
    if (days >= 1) return { label: `Expires in ${days}d`, tone: 'warning' };
    if (hours > 0) return { label: `Expires in ${hours}h`, tone: 'danger' };
    return { label: 'Expiring soon', tone: 'danger' };
  };

  if (!isBrandUser) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-foreground flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-xl font-bold mb-3">Brand account required</h2>
          <p className="text-foreground/60 mb-6">This section is for brand accounts only.</p>
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary">
            Go to Creator Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-foreground pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-secondary mb-1">Brand Armour</p>
        {profile?.first_name && (
          <p className="text-sm text-foreground/50 mb-3">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile.first_name}
          </p>
        )}
        <h1 className="text-3xl font-black tracking-tight">Brand Dashboard</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats */}
        <BrandDealsStats allDeals={deals} isLoading={isLoading} />

        {/* Primary Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/brand-new-deal')}
            className="flex-1 h-12 bg-secondary hover:bg-secondary font-bold text-foreground rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Send New Offer
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setTab('sent')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
              tab === 'sent' ? 'text-secondary border-b-2 border-purple-400' : 'text-foreground/50 hover:text-foreground/70'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Sent ({pendingRequests.length})
          </button>
          <button
            onClick={() => setTab('countered')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
              tab === 'countered' ? 'text-secondary border-b-2 border-purple-400' : 'text-foreground/50 hover:text-foreground/70'
            )}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Counter ({counteredRequests.length})
            {counteredRequests.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning/20 text-warning text-[10px] font-bold">
                {counteredRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('active')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors whitespace-nowrap',
              tab === 'active' ? 'text-secondary border-b-2 border-purple-400' : 'text-foreground/50 hover:text-foreground/70'
            )}
          >
            Active ({activeDeals.length})
          </button>
          <button
            onClick={() => setTab('completed')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors whitespace-nowrap',
              tab === 'completed' ? 'text-secondary border-b-2 border-purple-400' : 'text-foreground/50 hover:text-foreground/70'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            Done ({completedDeals.length})
          </button>
        </div>

        {/* Deals List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : tab === 'countered' ? (
          /* Countered offers — direct accept/decline */
          counteredRequests.length === 0 ? (
            <Card className="bg-card border-border rounded-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No counter offers</h3>
                <p className="text-sm text-foreground/60 mb-6">
                  When a creator counters your offer, it will appear here for you to review.
                </p>
                <Button
                  onClick={() => navigate('/brand-new-deal')}
                  className="bg-secondary hover:bg-secondary font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Send New Offer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {counteredRequests.map((request) => {
                const isLoading = actionLoading === request.id;
                return (
                  <Card
                    key={request.id}
                    className="bg-card border-warning/40 rounded-2xl overflow-hidden"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-warning/20 text-warning">
                              Counter received
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground truncate">
                            {request.creator_name}
                          </h3>
                          {request.creator_instagram && (
                            <p className="text-sm text-foreground/60">@{request.creator_instagram}</p>
                          )}
                          {request.counter_offer?.final_price && (
                            <p className="text-sm font-semibold text-warning mt-1">
                              Counter: ₹{request.counter_offer.final_price.toLocaleString('en-IN')}
                            </p>
                          )}
                          {request.counter_offer?.notes && (
                            <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
                              Note: {request.counter_offer.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-foreground">
                            {request.collab_type === 'barter' ? 'Barter' : `₹${(request.exact_budget ?? 0).toLocaleString('en-IN')}`}
                          </p>
                        </div>
                      </div>

                      {/* Accept / Decline CTAs — direct on dashboard */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => handleAcceptCounter(request.id)}
                          disabled={isLoading}
                          className="flex-1 h-10 bg-green-600 hover:bg-green-700 font-bold text-foreground rounded-xl flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Accept Counter
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeclineCounter(request.id)}
                          disabled={isLoading}
                          className="flex-1 h-10 border-border font-semibold text-foreground/70 hover:text-destructive hover:border-destructive/40 rounded-xl flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              Decline
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : tab === 'sent' && pendingRequests.length > 0 ? (
          /* Pending offers — from brandRequests (collab_requests) */
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              let deliverablesArray: string[] = [];
              try {
                deliverablesArray = typeof request.deliverables === 'string'
                  ? JSON.parse(request.deliverables)
                  : Array.isArray(request.deliverables)
                    ? request.deliverables
                    : [];
              } catch { deliverablesArray = []; }

              return (
                <Card
                  key={request.id}
                  className="bg-card border-border rounded-2xl overflow-hidden hover:border-border transition-colors cursor-pointer"
                  onClick={() => navigate(`/brand-request/${request.id}`)}
                  role="article"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground truncate">
                            {request.creator_name}
                          </h3>
                          {request.creator_instagram && (
                            <span className="text-xs text-secondary">@{request.creator_instagram}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/60 mt-1">
                          {deliverablesArray.slice(0, 2).join(', ')}
                          {deliverablesArray.length > 2 && ` +${deliverablesArray.length - 2}`}
                        </p>
                        <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sent {getTimeAgo(request.created_at)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-foreground">
                          {request.collab_type === 'barter' ? 'Barter' : `₹${(request.exact_budget ?? 0).toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-xs text-foreground/40">awaiting response</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : tab === 'active' && activeDeals.length > 0 ? (
          /* Active deals */
          <div className="space-y-3">
            {activeDeals.map((deal) => (
              <Card
                key={deal.id}
                className="bg-card border-border rounded-2xl overflow-hidden hover:border-border transition-colors cursor-pointer"
                onClick={() => navigate(`/brand-deal/${deal.id}`)}
                role="article"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground truncate">
                          {deal.brand_name || 'Brand'}
                        </h3>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', getStageColor(deal.status))}>
                          {getStatusLabel(deal.status)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60 mt-1">
                        {deal.deliverables ? `${deal.deliverables} · ` : ''}{formatDate(deal.due_date || deal.created_at)}
                      </p>
                      {/* Action hint */}
                      <div className="mt-3 flex items-center gap-2">
                        {deal.status?.toLowerCase().includes('submitted') || deal.status?.toLowerCase().includes('delivered') ? (
                          <span className="text-xs text-secondary font-medium">Review content →</span>
                        ) : deal.status?.toLowerCase().includes('approved') ? (
                          <span className="text-xs text-primary font-medium">Pay creator →</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-foreground">
                        {deal.deal_type === 'barter' ? 'Barter' : formatCurrency(deal.deal_amount)}
                      </p>
                    </div>
                  </div>
                  {deal.progress_percentage != null && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${deal.progress_percentage}%` }} />
                      </div>
                      <p className="text-[10px] text-foreground/40 mt-1">{deal.progress_percentage}% complete</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tab === 'completed' && completedDeals.length > 0 ? (
          /* Completed deals */
          <div className="space-y-3">
            {completedDeals.map((deal) => (
              <Card
                key={deal.id}
                className="bg-card border-border rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => navigate(`/brand-deal/${deal.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground truncate">
                          {deal.brand_name || 'Brand'}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400">
                          Done
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60 mt-1">
                        {deal.deliverables ? `${deal.deliverables} · ` : ''}{formatDate(deal.due_date || deal.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-foreground">
                        {deal.deal_type === 'barter' ? 'Barter' : formatCurrency(deal.deal_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty state for all tabs */
          <Card className="bg-card border-border rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                {tab === 'sent' ? <Clock className="h-8 w-8 text-secondary" /> :
                 tab === 'active' ? <Plus className="h-8 w-8 text-secondary" /> :
                 <CheckCircle2 className="h-8 w-8 text-secondary" />}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {tab === 'sent' ? 'No pending offers' :
                 tab === 'active' ? 'No active deals' : 'No completed deals'}
              </h3>
              <p className="text-sm text-foreground/60 mb-6">
                {tab === 'sent' ? "You haven't sent any offers yet. Find a creator to collaborate with." :
                 tab === 'active' ? "You don't have any deals in progress." : "Your completed deals will appear here."}
              </p>
              <Button
                onClick={() => navigate('/brand-new-deal')}
                className="bg-secondary hover:bg-secondary font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                {tab === 'sent' ? 'Find Creators' : 'Send an Offer'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BrandBottomNav />
    </div>
  );
};

export default BrandDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import BrandDealsStats from '@/components/creator-contracts/BrandDealsStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type BrandTab = 'sent' | 'active' | 'completed';

const BrandDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [tab, setTab] = useState<BrandTab>('sent');
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isBrandUser = profile?.role === 'brand';

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
    if (s.includes('content') && s.includes('making')) return 'bg-blue-500/20 text-blue-400';
    if (s.includes('delivered') || s.includes('submitted')) return 'bg-purple-500/20 text-purple-400';
    if (s.includes('approved')) return 'bg-emerald-500/20 text-emerald-400';
    if (s.includes('payment') && (s.includes('sent') || s.includes('pending'))) return 'bg-yellow-500/20 text-yellow-400';
    if (s.includes('payment') && (s.includes('received') || s.includes('complete'))) return 'bg-green-500/20 text-green-400';
    if (s.includes('revision') || s.includes('change')) return 'bg-amber-500/20 text-amber-400';
    if (s.includes('completed') || s.includes('vested')) return 'bg-green-500/20 text-green-400';
    if (s.includes('declined') || s.includes('rejected') || s.includes('cancelled')) return 'bg-red-500/20 text-red-400';
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
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-xl font-bold mb-3">Brand account required</h2>
          <p className="text-white/60 mb-6">This section is for brand accounts only.</p>
          <Button onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-500">
            Go to Creator Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-purple-300 mb-1">Brand Armour</p>
        {profile?.first_name && (
          <p className="text-sm text-white/50 mb-3">
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
            className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Send New Offer
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setTab('sent')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors flex items-center gap-1.5',
              tab === 'sent' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/50 hover:text-white/70'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Sent ({sentDeals.length})
          </button>
          <button
            onClick={() => setTab('active')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors',
              tab === 'active' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/50 hover:text-white/70'
            )}
          >
            Active ({activeDeals.length})
          </button>
          <button
            onClick={() => setTab('completed')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors',
              tab === 'completed' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/50 hover:text-white/70'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            Done ({completedDeals.length})
          </button>
        </div>

        {/* Deals List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : displayedDeals.length === 0 ? (
          <Card className="bg-white/5 border-white/10 rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                {tab === 'sent' ? <Clock className="h-8 w-8 text-purple-400" /> :
                 tab === 'active' ? <Plus className="h-8 w-8 text-purple-400" /> :
                 <CheckCircle2 className="h-8 w-8 text-purple-400" />}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {tab === 'sent' ? 'No pending offers' :
                 tab === 'active' ? 'No active deals' : 'No completed deals'}
              </h3>
              <p className="text-sm text-white/60 mb-6">
                {tab === 'sent' ? "You haven't sent any offers yet. Find a creator to collaborate with." :
                 tab === 'active' ? "You don't have any deals in progress." : "Your completed deals will appear here."}
              </p>
              <Button
                onClick={() => navigate('/brand-new-deal')}
                className="bg-purple-600 hover:bg-purple-500 font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                {tab === 'sent' ? 'Find Creators' : 'Send an Offer'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedDeals.map((deal) => (
              <Card
                key={deal.id}
                className="bg-white/5 border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/brand-deal/${deal.id}`)}
                role="article"
                aria-label={`Deal with ${deal.brand_name || 'Brand'}, ${getStatusLabel(deal.status)}, ${deal.deal_type === 'barter' ? 'Barter' : formatCurrency(deal.deal_amount)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white truncate">
                          {deal.brand_name || 'Brand'}
                        </h3>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', getStageColor(deal.status))}>
                          {getStatusLabel(deal.status)}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mt-1">
                        {deal.deliverables ? `${deal.deliverables} · ` : ''}{formatDate(deal.due_date || deal.created_at)}
                      </p>
                      {tab === 'sent' && (
                        <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Sent {getTimeAgo(deal.created_at)}
                          {(() => {
                            const exp = getExpiresIn((deal as any).expires_at);
                            if (!exp) return null;
                            return (
                              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${exp.tone === 'danger' ? 'bg-red-500/20 text-red-400' : exp.tone === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'}`}>
                                {exp.label}
                              </span>
                            );
                          })()}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-white">
                        {deal.deal_type === 'barter' ? 'Barter' : formatCurrency(deal.deal_amount)}
                      </p>
                      {deal.deal_type !== 'barter' && (
                        <p className="text-xs text-white/40">deal value</p>
                      )}
                    </div>
                  </div>

                  {/* Action hint for active deals */}
                  {tab === 'active' && (
                    <div className="mt-3 flex items-center gap-2">
                      {deal.status?.toLowerCase().includes('submitted') || deal.status?.toLowerCase().includes('delivered') ? (
                        <span className="text-xs text-purple-400 font-medium">Review content →</span>
                      ) : deal.status?.toLowerCase().includes('approved') ? (
                        <span className="text-xs text-emerald-400 font-medium">Pay creator →</span>
                      ) : null}
                    </div>
                  )}

                  {/* Progress bar */}
                  {deal.progress_percentage != null && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${deal.progress_percentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">{deal.progress_percentage}% complete</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BrandBottomNav />
    </div>
  );
};

export default BrandDashboard;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { BrandDeal } from '@/types';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import BrandDealsStats from '@/components/creator-contracts/BrandDealsStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSignOut } from '@/lib/hooks/useAuth';

type BrandTab = 'active' | 'all';

const BrandDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user, session } = useSession();
  const signOutMutation = useSignOut();
  const [tab, setTab] = useState<BrandTab>('active');
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const metadataRole = typeof user?.user_metadata?.role === 'string'
    ? user.user_metadata.role
    : typeof user?.user_metadata?.account_mode === 'string'
      ? user.user_metadata.account_mode
      : '';
  const isBrandUser = profile?.role === 'brand' || metadataRole === 'brand';

  useEffect(() => {
    if (!isBrandUser || !session?.access_token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const loadDeals = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/brand-dashboard/deals`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json?.success) {
          console.error('[BrandDashboard] Failed to fetch deals:', json);
          setDeals([]);
          setIsLoading(false);
          return;
        }

        setDeals((json.deals as BrandDeal[]) || []);
      } catch (error) {
        console.error('[BrandDashboard] Failed to fetch deals:', error);
        setDeals([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDeals();
  }, [isBrandUser, session?.access_token]);

  // Filter deals by stage
  const activeDeals = deals.filter(deal => {
    const stage = deal.status?.toLowerCase();
    return !['completed', 'cancelled', 'declined'].includes(stage || '');
  });

  const completedDeals = deals.filter(deal => {
    const stage = deal.status?.toLowerCase();
    return stage === 'completed';
  });

  const displayedDeals = tab === 'active' ? activeDeals : deals;

  const getStageColor = (status: string | null) => {
    if (!status) return 'bg-slate-500/20 text-slate-400';
    const s = status.toLowerCase();
    if (s.includes('content') && s.includes('making')) return 'bg-blue-500/20 text-blue-400';
    if (s.includes('delivered') || s.includes('submitted')) return 'bg-purple-500/20 text-purple-400';
    if (s.includes('approved') || s.includes('signed')) return 'bg-emerald-500/20 text-emerald-400';
    if (s.includes('payment') || s.includes('paid')) return 'bg-green-500/20 text-green-400';
    if (s.includes('revision')) return 'bg-amber-500/20 text-amber-400';
    if (s.includes('completed')) return 'bg-green-500/20 text-green-400';
    if (s.includes('cancelled') || s.includes('declined')) return 'bg-red-500/20 text-red-400';
    return 'bg-blue-500/20 text-blue-400';
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-purple-300 mb-1">Brand Armour</p>
            {profile?.first_name && (
              <p className="text-sm text-white/50 mb-3">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile.first_name}
              </p>
            )}
            <h1 className="text-3xl font-black tracking-tight">Brand Dashboard</h1>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => signOutMutation.mutate()}
            disabled={signOutMutation.isPending}
            className="h-11 border-white/15 bg-white/5 text-white hover:bg-white/10 font-black sm:min-w-[132px]"
          >
            {signOutMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {signOutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
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
            onClick={() => setTab('active')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors',
              tab === 'active' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/50 hover:text-white/70'
            )}
          >
            Active ({activeDeals.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={cn(
              'pb-3 px-1 text-sm font-semibold transition-colors',
              tab === 'all' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/50 hover:text-white/70'
            )}
          >
            All ({deals.length})
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
                <Plus className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {tab === 'active' ? 'No active deals' : 'No deals yet'}
              </h3>
              <p className="text-sm text-white/60 mb-6">
                {tab === 'active'
                  ? "You don't have any active collaborations right now."
                  : 'Start by sending an offer to a creator.'}
              </p>
              <Button
                onClick={() => navigate('/brand-new-deal')}
                className="bg-purple-600 hover:bg-purple-500 font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Send First Offer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedDeals.map((deal) => (
              <Link
                key={deal.id}
                to={`/brand-deal/${deal.id}`}
                data-deal-id={deal.id}
                className="block"
              >
                <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white truncate">
                            {deal.brand_name || 'Brand'}
                          </h3>
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', getStageColor(deal.status))}>
                            {deal.status || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-white/60 mt-1">
                          {deal.deliverables ? `${deal.deliverables} · ` : ''}{formatDate(deal.due_date || deal.created_at)}
                        </p>
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
              </Link>
            ))}
          </div>
        )}
      </div>

      <BrandBottomNav />
    </div>
  );
};

export default BrandDashboard;

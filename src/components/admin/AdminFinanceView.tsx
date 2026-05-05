import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Input } from '@/components/ui/input';

export function AdminFinanceView() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState<Record<string, string>>({});

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['admin_payouts'],
    queryFn: async () => {
      if (!session?.access_token) return [];
      const res = await fetch(`${getApiBaseUrl()}/api/admin/payouts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payouts');
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!session?.access_token,
    refetchInterval: 30000,
  });

  const releaseMutation = useMutation({
    mutationFn: async ({ id, utr }: { id: string; utr: string }) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/payouts/${id}/release`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ utr_number: utr }),
      });
      if (!res.ok) throw new Error('Failed to release payout');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Payout marked as released!');
      queryClient.invalidateQueries({ queryKey: ['admin_payouts'] });
      setReleasingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to release payout');
      setReleasingId(null);
    },
  });

  const handleRelease = (dealId: string) => {
    const utr = utrInput[dealId]?.trim();
    if (!utr || utr.length < 4) {
      toast.error('Please enter a valid UTR/Reference number');
      return;
    }
    setReleasingId(dealId);
    releaseMutation.mutate({ id: dealId, utr });
  };

  const refundMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/deals/${id}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to process refund');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Refund initiated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin_payouts'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to process refund');
    },
  });

  const autoApproveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/escrow/run-auto-approval`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Auto-approval failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Successfully approved ${data.result?.processed || 0} stale deals!`);
      queryClient.invalidateQueries({ queryKey: ['admin_payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin_metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to run auto-approval');
    },
  });

  const forceApproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/payouts/${id}/force-approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to force approve');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Deal forcefully approved!');
      queryClient.invalidateQueries({ queryKey: ['admin_payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin_metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to force approve');
    },
  });

  const pendingPayouts = payouts.filter((p: any) => p.status === 'CONTENT_APPROVED');
  const releasedPayouts = payouts.filter((p: any) => p.status === 'PAYMENT_RELEASED');
  const refundablePayouts = payouts.filter((p: any) => p.status === 'CONTENT_MAKING' || p.status === 'DISPUTED');
  const deliveredPayouts = payouts.filter((p: any) => p.status === 'CONTENT_DELIVERED');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Escrow & Payouts</h2>
            <p className="text-slate-400 text-sm">Manage funds securely held and manually release to creators after the hold expires.</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('This will find and approve all deals that have been in CONTENT_DELIVERED for more than 72 hours. Continue?')) {
                autoApproveMutation.mutate();
              }
            }}
            disabled={autoApproveMutation.isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {autoApproveMutation.isPending ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Auto-Approve Stale Deals
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Releases ({pendingPayouts.length})
          </h2>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/10" />
              ))}
            </div>
          ) : pendingPayouts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-[2.5rem]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-300 font-bold">All caught up!</p>
              <p className="text-sm text-slate-500">No pending payouts waiting to be released.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((deal: any) => {
                const releaseDate = deal.payout_release_at ? new Date(deal.payout_release_at) : new Date(deal.brand_approved_at || Date.now());
                const canRelease = isPast(releaseDate);
                const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                const upi = profile?.payout_upi;
                const upiVerified = !!profile?.upi_verified_at;

                return (
                  <div key={deal.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 space-y-4 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-emerald-400">DEAL #{deal.id.split('-')[0]}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black">
                            BRAND: {deal.brand_name || 'UNKNOWN'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {profile?.first_name} {profile?.last_name} (@{profile?.username})
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Payout Amount</p>
                        <p className="text-2xl font-black text-emerald-400 tracking-tight">₹{(deal.deal_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-black/40 border border-white/5">
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Creator UPI ID</p>
                        {upi ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-slate-200">{upi}</span>
                            {upiVerified ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-red-400 flex items-center gap-1 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> NOT SET</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">Release Schedule</p>
                        <div className="flex items-center gap-2">
                          {canRelease ? (
                            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Ready to release
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                              <Clock className="w-4 h-4" /> Unlocks {formatDistanceToNow(releaseDate, { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {canRelease && (
                      <div className="flex items-end gap-3 pt-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1.5 ml-1">UTR / Reference after manual transfer</label>
                          <Input
                            placeholder="e.g., UPI ref 1234567890"
                            value={utrInput[deal.id] || ''}
                            onChange={e => setUtrInput(p => ({ ...p, [deal.id]: e.target.value }))}
                            className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus:ring-emerald-500/20"
                          />
                        </div>
                        <button
                          onClick={() => handleRelease(deal.id)}
                          disabled={releasingId === deal.id || !upi}
                          className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-[0_8px_20px_rgba(16,185,129,0.2)]"
                        >
                          {releasingId === deal.id ? 'Releasing...' : 'Mark Paid'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {deliveredPayouts.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-500" />
                Ghosted Deliveries ({deliveredPayouts.length})
              </h2>
              <div className="space-y-4">
                {deliveredPayouts.map((deal: any) => {
                  const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                  return (
                    <div key={deal.id} className="bg-purple-900/10 border border-purple-500/20 rounded-[2rem] p-6 flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-purple-400">DEAL #{deal.id.split('-')[0]}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black">
                            BRAND: {deal.brand_name || 'UNKNOWN'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">
                          {profile?.first_name} {profile?.last_name} (@{profile?.username})
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Force approve deal #${deal.id.split('-')[0]}? This will immediately move it to the pending payouts queue.`)) {
                            forceApproveMutation.mutate(deal.id);
                          }
                        }}
                        disabled={forceApproveMutation.isPending}
                        className="px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-all active:scale-95"
                      >
                        {forceApproveMutation.isPending ? 'Approving...' : 'Force Approve'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              History
            </h2>
            <div className="space-y-3">
              {releasedPayouts.slice(0, 10).map((deal: any) => {
                const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                return (
                  <div key={deal.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-300">
                        @{profile?.username}
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        ₹{(deal.deal_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-500" />
                      Released {formatDistanceToNow(new Date(deal.payment_released_at || deal.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                );
              })}
              {releasedPayouts.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-slate-600 bg-white/5 rounded-3xl border border-white/5">
                  No recent payouts
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Escrow (Refundable)
            </h2>
            <div className="space-y-3">
              {refundablePayouts.map((deal: any) => {
                const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                return (
                  <div key={deal.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-300">
                        @{profile?.username}
                      </span>
                      <span className="text-sm font-black text-amber-400">
                        ₹{(deal.deal_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border",
                        deal.status === 'DISPUTED' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {deal.status}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to refund ₹${deal.deal_amount} for deal #${deal.id.split('-')[0]}? The platform fee will be retained.`)) {
                            refundMutation.mutate(deal.id);
                          }
                        }}
                        disabled={refundMutation.isPending}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        {refundMutation.isPending ? '...' : `Refund`}
                      </button>
                    </div>
                  </div>
                );
              })}
              {refundablePayouts.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-slate-600 bg-white/5 rounded-3xl border border-white/5">
                  No active escrow
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, IndianRupee, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
// Removed date-fns to prevent build blockers
const isPast = (date: Date | string | number) => new Date(date).getTime() < Date.now();

const formatDistanceToNow = (date: Date | string | number, options?: { addSuffix?: boolean }) => {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(Math.abs(diff) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let result = '';
  if (days > 0) result = `${days} day${days > 1 ? 's' : ''}`;
  else if (hours > 0) result = `${hours} hour${hours > 1 ? 's' : ''}`;
  else if (minutes > 0) result = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  else result = 'just now';

  if (options?.addSuffix) {
    return diff > 0 ? `${result} ago` : `in ${result}`;
  }
  return result;
};
import { Input } from '@/components/ui/input';

export default function AdminPayouts() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState<Record<string, string>>({});
  const [reconcileRequestId, setReconcileRequestId] = useState('');
  const [reconcilePaymentId, setReconcilePaymentId] = useState('');
  const [reconcileAmountPaid, setReconcileAmountPaid] = useState('');

  const { data: payouts = [], isLoading, refetch } = useQuery({
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

  const { data: metrics } = useQuery({
    queryKey: ['admin_metrics'],
    queryFn: async () => {
      if (!session?.access_token) return null;
      const res = await fetch(`${getApiBaseUrl()}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    },
    enabled: !!session?.access_token,
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

  const reconcileMutation = useMutation({
    mutationFn: async (payload: { requestId: string; paymentId?: string; amountPaid?: string }) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/reconcile-collab-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reconcile request');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Request reconciled successfully');
      setReconcileRequestId('');
      setReconcilePaymentId('');
      setReconcileAmountPaid('');
      queryClient.invalidateQueries({ queryKey: ['admin_payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin_metrics'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reconcile request');
    },
  });

  const pendingPayouts = payouts.filter((p: any) => p.status === 'CONTENT_APPROVED');
  const releasedPayouts = payouts.filter((p: any) => p.status === 'PAYMENT_RELEASED');
  const refundablePayouts = payouts.filter((p: any) => p.status === 'CONTENT_MAKING' || p.status === 'DISPUTED');
  const deliveredPayouts = payouts.filter((p: any) => p.status === 'CONTENT_DELIVERED');

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Creator Payouts</h1>
              <p className="text-slate-400">Manage money securely held in Razorpay and manually release to creators after the 3-day hold expires.</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('This will find and approve all deals that have been in CONTENT_DELIVERED for more than 72 hours. Continue?')) {
                  autoApproveMutation.mutate();
                }
              }}
              disabled={autoApproveMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
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

        {/* Escrow Health Metrics */}
        {metrics?.escrow && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Volume Locked</p>
              <p className="text-xl font-bold text-white">₹{metrics.escrow.totalVolumeLocked.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pending Payouts</p>
              <p className="text-xl font-bold text-emerald-400">₹{metrics.escrow.payoutVolumePending.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg. Approval Time</p>
              <p className="text-xl font-bold text-white">{Math.round(metrics.escrow.averageApprovalVelocityHours)}h</p>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ghosting Rate</p>
              <p className={cn("text-xl font-bold", metrics.escrow.ghostingRate > 15 ? "text-amber-400" : "text-white")}>
                {Math.round(metrics.escrow.ghostingRate)}%
              </p>
            </div>
          </div>
        )}

        {/* Acquisition & Onboarding Metrics */}
        {metrics?.onboarding && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-900/20 border border-indigo-500/10 p-4 rounded-xl">
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Total Signups</p>
              <p className="text-xl font-bold text-white">{metrics.onboarding.totalSignups.toLocaleString()}</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/10 p-4 rounded-xl">
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Incomplete Onboarding</p>
              <p className="text-xl font-bold text-white">{metrics.onboarding.droppedOffCount.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-900/20 border border-emerald-500/10 p-4 rounded-xl">
              <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Completion Rate</p>
              <p className="text-xl font-bold text-white">{Math.round(metrics.onboarding.completionRate)}%</p>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Visitors (24h)</p>
              <p className="text-xl font-bold text-white">4,281</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Reconcile Stuck Request
              </h2>
              <p className="text-sm text-slate-400">
                Use this when a collab request has a payment but no linked deal yet.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={reconcileRequestId}
                  onChange={(e) => setReconcileRequestId(e.target.value)}
                  placeholder="Request ID"
                  className="bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <input
                  value={reconcilePaymentId}
                  onChange={(e) => setReconcilePaymentId(e.target.value)}
                  placeholder="Payment ID (optional)"
                  className="bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <input
                  value={reconcileAmountPaid}
                  onChange={(e) => setReconcileAmountPaid(e.target.value)}
                  placeholder="Amount paid (optional)"
                  className="bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!reconcileRequestId.trim()) {
                      toast.error('Request ID is required');
                      return;
                    }
                    reconcileMutation.mutate({
                      requestId: reconcileRequestId.trim(),
                      paymentId: reconcilePaymentId.trim() || undefined,
                      amountPaid: reconcileAmountPaid.trim() || undefined,
                    });
                  }}
                  disabled={reconcileMutation.isPending}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {reconcileMutation.isPending ? <Clock className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Reconcile Request
                </button>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Releases ({pendingPayouts.length})
            </h2>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />
                ))}
              </div>
            ) : pendingPayouts.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">All caught up!</p>
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
                    <div key={deal.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-emerald-400">Deal #{deal.id.split('-')[0]}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Brand: {deal.brand_name || 'Unknown'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {profile?.first_name} {profile?.last_name} (@{profile?.username})
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 mb-1">Payout Amount</p>
                          <p className="text-xl font-black text-emerald-400">₹{(deal.deal_amount || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-lg bg-black/40 border border-white/5">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Creator UPI ID</p>
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
                            <span className="text-sm text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Not set</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Release Schedule</p>
                          <div className="flex items-center gap-2">
                            {canRelease ? (
                              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Ready to release
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-amber-400 flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Unlocks {formatDistanceToNow(releaseDate, { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canRelease && (
                        <div className="flex items-end gap-3 pt-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 block mb-1">Your UTR / Reference after manual transfer</label>
                            <Input
                              placeholder="e.g., UPI ref 1234567890"
                              value={utrInput[deal.id] || ''}
                              onChange={e => setUtrInput(p => ({ ...p, [deal.id]: e.target.value }))}
                              className="bg-black/50 border-white/10 text-white h-10"
                            />
                          </div>
                          <button
                            onClick={() => handleRelease(deal.id)}
                            disabled={releasingId === deal.id || !upi}
                            className="h-10 px-6 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0"
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

            {/* Force Approve Section */}
            {deliveredPayouts.length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-500" />
                  Ghosted Deliveries ({deliveredPayouts.length})
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Creators have delivered content, but the brand hasn't approved it yet. Use this to manually push the deal to the payout stage.
                </p>
                {deliveredPayouts.map((deal: any) => {
                  const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                  return (
                    <div key={deal.id} className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-purple-400">Deal #{deal.id.split('-')[0]}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Brand: {deal.brand_name || 'Unknown'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">
                          {profile?.first_name} {profile?.last_name} (@{profile?.username})
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Status: CONTENT_DELIVERED</p>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Force approve deal #${deal.id.split('-')[0]}? This will immediately move it to the pending payouts queue.`)) {
                              forceApproveMutation.mutate(deal.id);
                            }
                          }}
                          disabled={forceApproveMutation.isPending}
                          className="px-4 py-2 rounded-lg font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors"
                        >
                          {forceApproveMutation.isPending ? 'Approving...' : 'Force Approve'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Recently Released
            </h2>

            <div className="space-y-3">
              {releasedPayouts.slice(0, 10).map((deal: any) => {
                const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                return (
                  <div key={deal.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        @{profile?.username}
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        ₹{(deal.deal_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Released {formatDistanceToNow(new Date(deal.payment_released_at || deal.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                );
              })}
              {releasedPayouts.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-500 bg-white/5 rounded-xl border border-white/10">
                  No recent payouts
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Escrow (Refundable)
            </h2>

            <div className="space-y-3">
              {refundablePayouts.map((deal: any) => {
                const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
                return (
                  <div key={deal.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">
                        @{profile?.username}
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        ₹{(deal.deal_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        deal.status === 'DISPUTED' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
                        className="text-xs font-bold px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        {refundMutation.isPending ? 'Processing...' : `Refund ₹${(deal.deal_amount || 0).toLocaleString()}`}
                      </button>
                    </div>
                  </div>
                );
              })}
              {refundablePayouts.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-500 bg-white/5 rounded-xl border border-white/10">
                  No deals currently in escrow
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

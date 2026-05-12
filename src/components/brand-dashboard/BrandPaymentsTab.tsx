import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, CreditCard, ChevronRight, TrendingDown, TrendingUp,
  FileText, Download, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { formatCompactINR } from '@/lib/deals/format';
import type { BrandDeal } from '@/types';

/** Resolve creator name from deal — on the brand side, `profiles` is the creator. */
const resolveCreatorName = (deal: any): string => {
  const p = deal?.profiles;
  if (p?.first_name) {
    return `${p.first_name}${p.last_name ? ` ${p.last_name}` : ''}`;
  }
  if (p?.business_name) return p.business_name;
  if (p?.username) return `@${p.username}`;
  // Fallback fields sometimes present on the deal itself
  if (deal?.creator_name) return deal.creator_name;
  return 'Creator';
};

interface BrandPaymentsTabProps {
  isDark: boolean;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  deals: BrandDeal[];
  triggerHaptic: () => void;
  onSelectDeal?: (deal: BrandDeal) => void;
}

type PaymentStatus = 'paid' | 'active' | 'pending';

const getPaymentStatus = (deal: any): PaymentStatus => {
  const s = String(deal?.status || '').toLowerCase();
  if (s.includes('completed') || s.includes('payment_released') || s.includes('paid')) return 'paid';
  if (
    s.includes('content') || s.includes('making') || s.includes('delivered') ||
    s.includes('revision') || s.includes('approved') || s.includes('fully_executed') ||
    s.includes('signed') || s.includes('active')
  ) return 'active';
  return 'pending';
};

const BrandPaymentsTab: React.FC<BrandPaymentsTabProps> = ({
  isDark,
  textColor,
  secondaryTextColor,
  borderColor,
  deals,
  triggerHaptic,
  onSelectDeal,
}) => {
  // Compute stats from actual deal data
  const stats = React.useMemo(() => {
    let totalSpent = 0;
    let activeCommitments = 0;
    let completedCount = 0;
    let activeCount = 0;

    for (const deal of deals) {
      const amount = Number(deal?.deal_amount || (deal as any)?.exact_budget || 0);
      const status = getPaymentStatus(deal);
      if (status === 'paid') {
        totalSpent += amount;
        completedCount++;
      } else if (status === 'active') {
        activeCommitments += amount;
        activeCount++;
      }
    }

    return { totalSpent, activeCommitments, completedCount, activeCount, totalDeals: deals.length };
  }, [deals]);

  // Group deals by payment status
  const groupedDeals = React.useMemo(() => {
    const groups: Record<PaymentStatus, any[]> = { paid: [], active: [], pending: [] };
    for (const deal of deals) {
      const status = getPaymentStatus(deal);
      groups[status].push(deal);
    }
    // Sort each group by amount (descending)
    for (const key of Object.keys(groups) as PaymentStatus[]) {
      groups[key].sort((a, b) => (Number(b?.deal_amount) || 0) - (Number(a?.deal_amount) || 0));
    }
    return groups;
  }, [deals]);

  const hasDeals = deals.length > 0;

  return (
    <div className="px-5 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-36">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
            Payments
          </h2>
          <p className={cn('text-sm font-medium mt-0.5', isDark ? 'text-slate-500' : 'text-slate-400')}>
            Track your creator payouts and budgets
          </p>
        </div>
      </div>

      {/* Investment Overview Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'p-6 rounded-[2rem] border mb-6 relative overflow-hidden',
          isDark ? 'bg-[#0A1628]/80 border-white/[0.06]' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50',
        )}
      >
        {/* Ambient glow */}
        <div className={cn(
          'absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[60px] pointer-events-none',
          isDark ? 'bg-sky-500/[0.06]' : 'bg-blue-100/40',
        )} />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <p className={cn('text-[10px] font-bold uppercase tracking-[0.2em] mb-2', isDark ? 'text-slate-500' : 'text-slate-400')}>
              Total Investment
            </p>
            <h3 className={cn('text-3xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {formatCompactINR(stats.totalSpent + stats.activeCommitments)}
            </h3>
            {stats.totalDeals > 0 && (
              <p className={cn('text-xs font-medium mt-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Across {stats.totalDeals} deal{stats.totalDeals !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            isDark ? 'bg-sky-500/10' : 'bg-blue-50',
          )}>
            <CreditCard className={cn('w-6 h-6', isDark ? 'text-sky-400' : 'text-blue-600')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className={cn(
            'p-4 rounded-2xl border',
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-orange-50/40 border-orange-100/50',
          )}>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className={cn('w-3 h-3', isDark ? 'text-amber-400' : 'text-orange-500')} />
              <p className={cn('text-[10px] font-bold uppercase tracking-[0.15em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Active
              </p>
            </div>
            <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {formatCompactINR(stats.activeCommitments)}
            </p>
            <p className={cn('text-[10px] font-medium mt-0.5', isDark ? 'text-slate-600' : 'text-slate-400')}>
              {stats.activeCount} deal{stats.activeCount !== 1 ? 's' : ''} in progress
            </p>
          </div>
          <div className={cn(
            'p-4 rounded-2xl border',
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-green-50/40 border-green-100/50',
          )}>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className={cn('w-3 h-3', isDark ? 'text-emerald-400' : 'text-green-500')} />
              <p className={cn('text-[10px] font-bold uppercase tracking-[0.15em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Completed
              </p>
            </div>
            <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              {formatCompactINR(stats.totalSpent)}
            </p>
            <p className={cn('text-[10px] font-medium mt-0.5', isDark ? 'text-slate-600' : 'text-slate-400')}>
              {stats.completedCount} deal{stats.completedCount !== 1 ? 's' : ''} paid
            </p>
          </div>
        </div>
      </motion.div>

      {/* Deal Payouts List */}
      {hasDeals ? (
        <>
          {/* Active deals */}
          {groupedDeals.active.length > 0 && (
            <div className="mb-6">
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em] mb-3 px-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Active Commitments
              </p>
              <div className={cn('rounded-[1.5rem] border overflow-hidden', isDark ? 'bg-[#0A1628]/60 border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm')}>
                {groupedDeals.active.map((deal, idx) => {
                  const creatorName = resolveCreatorName(deal);
                  return (
                    <div
                      key={deal.id || idx}
                      className={cn(
                        'p-4 flex items-center justify-between transition-colors border-b last:border-0 cursor-pointer',
                        isDark ? 'border-white/[0.04] active:bg-white/[0.02]' : 'border-slate-100 active:bg-slate-50',
                      )}
                      onClick={() => { triggerHaptic(); onSelectDeal?.(deal); }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-xl overflow-hidden shrink-0 border',
                          isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-50 border-slate-100',
                        )}>
                          <BrandIcon
                            logo={deal?.profiles?.avatar_url}
                            name={creatorName}
                            isDark={isDark}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className={cn('text-[14px] font-bold truncate', isDark ? 'text-white' : 'text-slate-900')}>
                            {creatorName}
                          </p>
                          <p className={cn('text-[11px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                            {deal.status === 'CONTENT_MAKING' ? '✅ Payment successful ⏳ Waiting for creator' : 'In progress'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-[14px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                                                    {formatCompactINR(deal.deal_amount || (deal as any).exact_budget)}
                        </p>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                          isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-orange-50 text-orange-600 border border-orange-100',
                        )}>
                          Active
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed deals */}
          {groupedDeals.paid.length > 0 && (
            <div className="mb-6">
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em] mb-3 px-1', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Completed Payouts
              </p>
              <div className={cn('rounded-[1.5rem] border overflow-hidden', isDark ? 'bg-[#0A1628]/60 border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm')}>
                {groupedDeals.paid.map((deal, idx) => {
                  const creatorName = resolveCreatorName(deal);
                  return (
                    <div
                      key={deal.id || idx}
                      className={cn(
                        'p-4 flex items-center justify-between transition-colors border-b last:border-0 cursor-pointer',
                        isDark ? 'border-white/[0.04] active:bg-white/[0.02]' : 'border-slate-100 active:bg-slate-50',
                      )}
                      onClick={() => { triggerHaptic(); onSelectDeal?.(deal); }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-xl overflow-hidden shrink-0 border',
                          isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-50 border-slate-100',
                        )}>
                          <BrandIcon
                            logo={deal?.profiles?.avatar_url}
                            name={creatorName}
                            isDark={isDark}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className={cn('text-[14px] font-bold truncate', isDark ? 'text-white' : 'text-slate-900')}>
                            {creatorName}
                          </p>
                          <p className={cn('text-[11px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                            Campaign Payout
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-[14px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                                                    {formatCompactINR(deal.deal_amount || (deal as any).exact_budget)}
                        </p>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                          isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-green-50 text-green-600 border border-green-100',
                        )}>
                          Paid
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="py-20 text-center px-6">
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
            isDark ? 'bg-white/[0.04]' : 'bg-slate-50',
          )}>
            <Wallet className={cn('w-8 h-8', isDark ? 'text-slate-600' : 'text-slate-300')} />
          </div>
          <h3 className={cn('text-lg font-bold mb-1', isDark ? 'text-white' : 'text-slate-900')}>
            No deals yet
          </h3>
          <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-500' : 'text-slate-400')}>
            Send collab offers to creators to start tracking your investment and payouts here.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {hasDeals && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button className={cn(
            'p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all active:scale-[0.98]',
            isDark ? 'bg-[#0A1628]/60 border-white/[0.06] hover:bg-white/[0.03]' : 'bg-white border-slate-200 shadow-sm hover:shadow-md',
          )}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-sky-500/10' : 'bg-blue-50')}>
              <FileText className={cn('w-5 h-5', isDark ? 'text-sky-400' : 'text-blue-600')} />
            </div>
            <div>
              <p className={cn('text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>Invoices</p>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Download all
              </p>
            </div>
          </button>
          <button className={cn(
            'p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all active:scale-[0.98]',
            isDark ? 'bg-[#0A1628]/60 border-white/[0.06] hover:bg-white/[0.03]' : 'bg-white border-slate-200 shadow-sm hover:shadow-md',
          )}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-50')}>
              <Download className={cn('w-5 h-5', isDark ? 'text-purple-400' : 'text-purple-600')} />
            </div>
            <div>
              <p className={cn('text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>Spend Report</p>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Export CSV
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandPaymentsTab;

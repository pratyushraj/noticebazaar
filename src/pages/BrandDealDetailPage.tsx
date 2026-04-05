import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDealById } from '@/lib/hooks/useBrandDeals';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, IndianRupee,
  FileText, Copy, ExternalLink, Calendar, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BrandDealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { profile } = useSession();

  const { data: deal, isLoading } = useBrandDealById(dealId, profile?.id, 'brand');

  const getStageColor = (status: string | null) => {
    if (!status) return 'bg-slate-500/20 text-slate-400';
    const s = status.toLowerCase();
    if (s.includes('content') && s.includes('making')) return 'bg-blue-500/20 text-blue-400';
    if (s.includes('delivered') || s.includes('submitted')) return 'bg-purple-500/20 text-purple-400';
    if (s.includes('approved') || s.includes('signed')) return 'bg-emerald-500/20 text-emerald-400';
    if (s.includes('payment') || s.includes('paid')) return 'bg-green-500/20 text-green-400';
    if (s.includes('revision')) return 'bg-amber-500/20 text-amber-400';
    if (s.includes('completed')) return 'bg-green-500/20 text-green-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const copyDealLink = () => {
    if (deal?.id) {
      const link = `${window.location.origin}/deal/${deal.id}`;
      navigator.clipboard.writeText(link).then(() => {
        toast.success('Deal link copied!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-3">Deal not found</h2>
          <Button onClick={() => navigate('/brand-dashboard')} className="bg-purple-600 hover:bg-purple-500">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{deal.brand_name || 'Deal'}</h1>
            {(deal as any).brand_verified && (
              <ShieldCheck className="h-5 w-5 text-blue-400 flex-shrink-0" aria-label="Verified brand" />
            )}
          </div>
          <span className={cn('text-xs px-3 py-1 rounded-full font-medium', getStageColor(deal.status))}>
            {deal.status || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Deal Value Card */}
        <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Deal Value</p>
                <p className="text-2xl font-black text-white">
                  {deal.deal_type === 'barter' ? 'Free products' : formatCurrency(deal.deal_amount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Due Date</p>
                <p className="text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/40" />
                  {formatDate(deal.due_date)}
                </p>
              </div>
            </div>

            {/* Progress */}
            {deal.progress_percentage != null && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>Progress</span>
                  <span>{deal.progress_percentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${deal.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deliverables */}
        {deal.deliverables && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Deliverables</p>
              <p className="text-base font-medium text-white">{deal.deliverables}</p>
            </CardContent>
          </Card>
        )}

        {/* Contract */}
        {deal.contract_file_url && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Contract</p>
              <Button
                onClick={() => window.open(deal.contract_file_url!, '_blank')}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                View Contract
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        {deal.deal_type !== 'barter' && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Payment</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Amount</span>
                  <span className="font-semibold text-white">{formatCurrency(deal.deal_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Expected date</span>
                  <span className="font-semibold text-white">{formatDate(deal.payment_expected_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Status</span>
                  <span className="font-semibold text-white">
                    {deal.payment_received_date ? 'Received' : 'Pending'}
                  </span>
                </div>
              </div>
              {!deal.payment_received_date && (
                <Button
                  onClick={() => toast.success('Payment marked as received!')}
                  className="w-full h-11 mt-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Payment Received
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={copyDealLink}
            className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-white rounded-xl flex items-center justify-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Deal Link
          </Button>
        </div>
      </div>

      <BrandBottomNav />
    </div>
  );
};

export default BrandDealDetailPage;

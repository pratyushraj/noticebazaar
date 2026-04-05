import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDealById, useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, IndianRupee,
  FileText, Copy, ExternalLink, Calendar, ShieldCheck, Link as LinkIcon,
  ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, Send, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BrandDealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { profile } = useSession();
  const { data: deal, isLoading } = useBrandDealById(dealId, profile?.id, 'brand');
  const updateDeal = useUpdateBrandDeal();

  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [brandFeedback, setBrandFeedback] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isUpdating, setIsUpdating] = useState(false);

  const isContentSubmitted = deal?.status?.toLowerCase().includes('submitted') ||
    deal?.status?.toLowerCase().includes('delivered') ||
    deal?.content_submission_url;
  const isContentApproved = deal?.status?.toLowerCase().includes('approved') ||
    deal?.brand_approval_status?.toLowerCase() === 'approved';
  const isPaymentSent = !!(deal as any)?.payment_sent_at;
  const isPaymentReceived = !!(deal as any)?.payment_received_date;
  const isCompleted = deal?.status?.toLowerCase().includes('completed') ||
    deal?.status?.toLowerCase().includes('vested');

  const getStageColor = (status: string | null | undefined) => {
    if (!status) return 'bg-slate-500/20 text-slate-400';
    const s = status.toLowerCase();
    if (s.includes('awaiting') || s.includes('pending') || s.includes('sent') && !s.includes('paid')) return 'bg-yellow-500/20 text-yellow-400';
    if (s.includes('content') && s.includes('making')) return 'bg-blue-500/20 text-blue-400';
    if (s.includes('delivered') || s.includes('submitted')) return 'bg-purple-500/20 text-purple-400';
    if (s.includes('approved')) return 'bg-emerald-500/20 text-emerald-400';
    if (s.includes('payment') && s.includes('sent')) return 'bg-green-500/20 text-green-400';
    if (s.includes('payment') && s.includes('received')) return 'bg-green-500/20 text-green-400';
    if (s.includes('revision') || s.includes('change')) return 'bg-amber-500/20 text-amber-400';
    if (s.includes('completed') || s.includes('vested')) return 'bg-green-500/20 text-green-400';
    if (s.includes('declined') || s.includes('rejected')) return 'bg-red-500/20 text-red-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const getStatusLabel = (status: string | null | undefined): string => {
    if (!status) return 'Unknown';
    const s = status.toLowerCase();
    if (s.includes('awaiting') && s.includes('response')) return 'Awaiting response';
    if (s.includes('content') && s.includes('making')) return 'Content in progress';
    if (s.includes('delivered') || s.includes('submitted')) return 'Content submitted';
    if (s.includes('approved')) return 'Approved';
    if (s.includes('payment') && s.includes('sent')) return 'Payment sent';
    if (s.includes('payment') && s.includes('received')) return 'Payment received';
    if (s.includes('revision') || s.includes('change')) return 'Changes requested';
    if (s.includes('completed') || s.includes('vested')) return 'Completed';
    if (s.includes('declined') || s.includes('rejected')) return 'Declined';
    if (s.includes('awaiting') && s.includes('product')) return 'Awaiting product';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
      navigator.clipboard.writeText(link).then(() => toast.success('Deal link copied!')).catch(() => toast.error('Failed to copy'));
    }
  };

  const handleApproveContent = async () => {
    if (!deal?.id) return;
    setIsUpdating(true);
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        creator_id: deal.creator_id,
        brand_approval_status: 'approved',
        status: 'Approved',
      } as any);
      toast.success('Content approved!');
      setShowApproveModal(false);
    } catch {
      toast.error('Failed to approve content');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!deal?.id || !brandFeedback.trim()) {
      toast.error('Please describe what needs to be changed');
      return;
    }
    setIsUpdating(true);
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        creator_id: deal.creator_id,
        brand_approval_status: 'changes_requested',
        brand_feedback: brandFeedback.trim(),
        status: 'Changes Requested',
      } as any);
      toast.success('Feedback sent to creator');
      setShowChangesModal(false);
      setBrandFeedback('');
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkPaymentSent = async () => {
    if (!deal?.id) return;
    setIsUpdating(true);
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        creator_id: deal.creator_id,
        payment_sent_at: new Date().toISOString(),
        status: 'Payment Sent',
      } as any);
      toast.success('Payment marked as sent!');
      setShowMarkPaidModal(false);
    } catch {
      toast.error('Failed to mark payment as sent');
    } finally {
      setIsUpdating(false);
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
          <Button onClick={() => navigate('/brand-dashboard')} className="bg-purple-600 hover:bg-purple-500">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const contentLinks: string[] = [];
  if ((deal as any)?.content_links) {
    try {
      const parsed = JSON.parse((deal as any).content_links);
      if (Array.isArray(parsed)) contentLinks.push(...parsed);
    } catch {}
  }
  if (deal?.content_submission_url) contentLinks.push(deal.content_submission_url);
  const uniqueLinks = [...new Set(contentLinks)].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button onClick={() => navigate('/brand-dashboard')} className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{deal.brand_name || 'Deal'}</h1>
            <p className="text-sm text-white/60 mt-1">with {deal.platform || 'Instagram'} · {deal.deliverables || 'Collab'}</p>
          </div>
          <span className={cn('text-xs px-3 py-1 rounded-full font-medium', getStageColor(deal.status))}>
            {getStatusLabel(deal.status)}
          </span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">

        {/* ===== ACTION CARD: Content Review ===== */}
        {isContentSubmitted && !isContentApproved && (
          <Card className="bg-purple-900/30 border-purple-500/30 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-purple-300">Creator submitted content</p>
                  <p className="text-xs text-purple-300/60">Review and approve or request changes</p>
                </div>
              </div>

              {/* Content Links */}
              {uniqueLinks.length > 0 && (
                <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-2">
                  {uniqueLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 break-all">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {link}
                    </a>
                  ))}
                </div>
              )}

              {/* Creator's note */}
              {(deal as any)?.content_notes && (
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <p className="text-xs text-white/50 mb-1">Note from creator</p>
                  <p className="text-sm text-white/80">{(deal as any).content_notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowChangesModal(true)}
                  className="flex-1 h-11 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Request Changes
                </Button>
                <Button
                  onClick={() => setShowApproveModal(true)}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== ACTION CARD: Payment ===== */}
        {isContentApproved && !isPaymentSent && deal.deal_type !== 'barter' && (
          <Card className="bg-emerald-900/30 border-emerald-500/30 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Payment pending</p>
                  <p className="text-xs text-emerald-300/60">Pay outside the platform, then mark as sent</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/60">Amount to pay</span>
                  <span className="text-xl font-black text-white">{formatCurrency(deal.deal_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Pay by</span>
                  <span className="text-sm text-white/80">{formatDate(deal.payment_expected_date)}</span>
                </div>
              </div>

              <Button
                onClick={() => setShowMarkPaidModal(true)}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-bold text-white rounded-xl flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                I've Paid — Mark as Sent
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== Deal Value Card ===== */}
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
            {deal.progress_percentage != null && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>Progress</span><span>{deal.progress_percentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${deal.progress_percentage}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== Deliverables ===== */}
        {deal.deliverables && (
          <Card className="bg-white/5 border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Deliverables</p>
              <p className="text-base font-medium text-white">{deal.deliverables}</p>
            </CardContent>
          </Card>
        )}

        {/* ===== Contract ===== */}
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

        {/* ===== Payment Status ===== */}
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
                  <span className={cn('font-semibold', isPaymentReceived ? 'text-green-400' : isPaymentSent ? 'text-yellow-400' : 'text-white/60')}>
                    {isPaymentReceived ? 'Received' : isPaymentSent ? 'Sent — awaiting confirmation' : 'Pending'}
                  </span>
                </div>
                {isPaymentSent && !isPaymentReceived && (
                  <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-xs text-yellow-300">⏳ Waiting for creator to confirm receipt. They'll get a notification.</p>
                  </div>
                )}
                {isPaymentReceived && (
                  <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-300">✅ Creator confirmed payment received. Deal complete!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== Actions ===== */}
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

      {/* ===== APPROVE MODAL ===== */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Approve content</h3>
            </div>
            <p className="text-white/70 mb-4 text-sm">
              Once approved, payment will be due within 7 days. Make sure you've reviewed the content.
            </p>
            <div className="bg-white/5 rounded-xl p-3 mb-6">
              <p className="text-xs text-white/50 mb-1">Amount due to creator</p>
              <p className="text-2xl font-black text-white">{formatCurrency(deal.deal_amount)}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowApproveModal(false)} className="flex-1 h-11 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleApproveContent} disabled={isUpdating} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl flex items-center justify-center gap-2">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REQUEST CHANGES MODAL ===== */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Request changes</h3>
            </div>
            <p className="text-white/70 mb-3 text-sm">Tell the creator exactly what needs to be different.</p>
            <textarea
              value={brandFeedback}
              onChange={(e) => setBrandFeedback(e.target.value)}
              placeholder="e.g. The product wasn't visible in the reel. Can you redo with the pack clearly shown for 5+ seconds?"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none mb-4"
            />
            <div className="flex gap-3">
              <Button onClick={() => { setShowChangesModal(false); setBrandFeedback(''); }} className="flex-1 h-11 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleRequestChanges} disabled={isUpdating || !brandFeedback.trim()} className="flex-1 h-11 bg-orange-600 hover:bg-orange-500 font-bold text-white rounded-xl flex items-center justify-center gap-2">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Feedback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MARK PAYMENT SENT MODAL ===== */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Mark payment as sent</h3>
            </div>
            <p className="text-white/70 mb-4 text-sm">
              Confirm that you've transferred the payment outside Creator Armour. The creator will be notified to confirm receipt.
            </p>
            <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-white/60">Amount</span>
                <span className="font-bold text-white">{formatCurrency(deal.deal_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Method</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="GPay">GPay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowMarkPaidModal(false)} className="flex-1 h-11 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleMarkPaymentSent} disabled={isUpdating} className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 font-bold text-white rounded-xl flex items-center justify-center gap-2">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Yes, Payment Sent
              </Button>
            </div>
          </div>
        </div>
      )}

      <BrandBottomNav />
    </div>
  );
};

export default BrandDealDetailPage;

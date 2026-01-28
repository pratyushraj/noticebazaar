"use client";

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Loader2, Plus, Minus, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { spacing } from '@/lib/design-system';
import { getApiBaseUrl } from '@/lib/utils/api';

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
  barter_product_image_url?: string | null;
  campaign_description: string;
  deliverables: string | string[];
  usage_rights: boolean;
  deadline: string | null;
  status: CollabRequestStatus;
  created_at: string;
  creator_id: string;
}

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
    if (request.exact_budget) return `₹${request.exact_budget.toLocaleString()}`;
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
    if (request.barter_value) return `Barter (₹${request.barter_value.toLocaleString()})`;
    return 'Barter';
  }
  return 'Not specified';
};

const CollabRequestCounterPage = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const request = state?.request as CollabRequest | undefined;

  const [counterPrice, setCounterPrice] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [counterPaymentTerms, setCounterPaymentTerms] = useState('');
  const [counterSplitMilestones, setCounterSplitMilestones] = useState(false);
  const [counterDeadline, setCounterDeadline] = useState('');
  const [counterDeliverablesList, setCounterDeliverablesList] = useState<{ id: string; name: string; platform?: string; quantity?: string }[]>([]);
  const [counterProductValue, setCounterProductValue] = useState('');
  const [counterSubmitting, setCounterSubmitting] = useState(false);

  useEffect(() => {
    if (!request || request.id !== requestId) {
      navigate('/collab-requests', { replace: true });
      return;
    }
    const dl = parseDeliverables(request.deliverables);
    setCounterDeliverablesList(dl.map((name, i) => ({ id: `d-${i}-${Date.now()}`, name, platform: '', quantity: '' })));
    setCounterPrice(request.exact_budget ? String(request.exact_budget) : '');
    setCounterNotes('');
    setCounterPaymentTerms('');
    setCounterSplitMilestones(false);
    setCounterDeadline(request.deadline ? request.deadline.slice(0, 10) : '');
    setCounterProductValue(request.barter_value ? String(request.barter_value) : '');
  }, [request, requestId, navigate]);

  const buildCounterPayload = (): { final_price?: number; deliverables?: string; payment_terms?: string; notes?: string } => {
    if (!request) return {};
    const t = request.collab_type;
    const validDeliverables = counterDeliverablesList.filter((d) => (d.name || '').trim());
    const deliverablesJson = validDeliverables.length > 0
      ? JSON.stringify(validDeliverables.map((d) => ({ name: d.name.trim(), platform: d.platform?.trim() || undefined, quantity: d.quantity?.trim() || undefined })))
      : undefined;
    let notes = counterNotes?.trim() || '';
    let final_price: number | undefined;
    let payment_terms: string | undefined;

    if (t === 'paid') {
      final_price = counterPrice ? parseFloat(counterPrice) : undefined;
      payment_terms = counterSplitMilestones ? (counterPaymentTerms || '50% upfront, 50% on delivery') : undefined;
      if (counterDeadline) notes = (notes ? notes + '\n\n' : '') + `Suggested deadline: ${counterDeadline}`;
    } else if (t === 'barter') {
      final_price = counterProductValue ? parseFloat(counterProductValue) : undefined;
      if (counterDeadline) notes = (notes ? notes + '\n\n' : '') + `Suggested deadline: ${counterDeadline}`;
    } else if (t === 'both') {
      final_price = counterPrice ? parseFloat(counterPrice) : undefined;
      payment_terms = counterSplitMilestones ? (counterPaymentTerms || '50% upfront, 50% on delivery') : undefined;
      if (counterDeadline) notes = (notes ? notes + '\n\n' : '') + `Suggested deadline: ${counterDeadline}`;
    }
    return {
      final_price: final_price ?? (deliverablesJson ? 0 : undefined),
      deliverables: deliverablesJson || (counterDeliverablesList.length > 0 ? JSON.stringify(counterDeliverablesList.map((d) => d.name)) : undefined),
      payment_terms,
      notes: notes || undefined,
    };
  };

  const handleCounter = async () => {
    if (!request) return;
    const payload = buildCounterPayload();
    if (!payload.final_price && !payload.deliverables) {
      toast.error('Please add a counter amount or deliverables.');
      return;
    }
    try {
      setCounterSubmitting(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Please log in to submit counter offers');
        setCounterSubmitting(false);
        return;
      }
      const response = await fetch(
        `${getApiBaseUrl()}/api/collab-requests/${request.id}/counter`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success('Counter offer submitted!');
        navigate('/collab-requests', { replace: true });
      } else {
        toast.error(data.error || 'Failed to submit counter offer');
      }
    } catch (error) {
      toast.error('Failed to submit counter offer. Please try again.');
    } finally {
      setCounterSubmitting(false);
    }
  };

  if (!request || request.id !== requestId) {
    return null;
  }

  const subtitle = (request.collab_type === 'barter' || request.collab_type === 'both') ? 'Barter collaboration' : (request.brand_name ?? 'Brand');

  return (
    <CreatorNavigationWrapper
      title="Counter Offer"
      subtitle={subtitle}
      compactHeader
      showBackButton
      backTo="/collab-requests"
      backIconOnly
    >
      <div className={cn(spacing.loose, "pb-40")}>
        <div className="rounded-[20px] bg-white/5 backdrop-blur-md border border-white/10 p-4 sm:p-5 space-y-4">
          {(request.collab_type === 'paid' || request.collab_type === 'both') && (
            <>
              <div>
                <p className="text-[11px] font-medium text-purple-300/70 uppercase tracking-wider mb-1">Current offer (reference)</p>
                <p className="text-sm text-purple-200">{formatBudget(request)}</p>
              </div>
              <div>
                <Label className="text-purple-200">Your Counter Amount (₹)</Label>
                <Input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder="e.g. 20000" className="bg-white/10 border-white/20 text-white mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="milestones" checked={counterSplitMilestones} onCheckedChange={(c) => setCounterSplitMilestones(!!c)} className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-500" />
                <Label htmlFor="milestones" className="text-sm text-purple-200 cursor-pointer">Split payment into milestones</Label>
              </div>
              {counterSplitMilestones && (
                <Input value={counterPaymentTerms} onChange={(e) => setCounterPaymentTerms(e.target.value)} placeholder="e.g. 50% upfront, 50% on delivery" className="bg-white/10 border-white/20 text-white text-sm" />
              )}
            </>
          )}
          {request.collab_type === 'barter' && (
            <div>
              <Label className="text-purple-200">Your Expected Product Value (₹)</Label>
              <Input type="number" value={counterProductValue} onChange={(e) => setCounterProductValue(e.target.value)} placeholder="e.g. 5000" className="bg-white/10 border-white/20 text-white mt-1 min-h-[44px] h-11" />
              <p className="text-[10px] text-purple-300/60 mt-1.5">This is the value you expect in return for the deliverables</p>
            </div>
          )}
          <div>
            <Label className="text-purple-200">What will you deliver?</Label>
            <div className="space-y-1.5 mt-1">
              {counterDeliverablesList.map((d) => {
                const qty = Math.max(0, parseInt(d.quantity || '0', 10) || 0);
                return (
                  <div key={d.id} className="p-2.5 rounded-lg bg-white/[0.06] border border-white/10 flex items-center gap-2 flex-wrap">
                    <Input value={d.name} onChange={(e) => setCounterDeliverablesList((prev) => prev.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)))} placeholder="Deliverable type" className="flex-1 min-w-0 bg-white/10 border-white/20 text-white text-sm min-h-[40px]" />
                    <div className="flex items-center rounded-lg border border-white/20 bg-white/10 overflow-hidden">
                      <button type="button" onClick={() => setCounterDeliverablesList((prev) => prev.map((x) => (x.id === d.id ? { ...x, quantity: String(Math.max(0, qty - 1)) } : x)))} className="p-2 text-white/80 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                      <span className="min-w-[2rem] text-center text-sm text-white tabular-nums">{qty}</span>
                      <button type="button" onClick={() => setCounterDeliverablesList((prev) => prev.map((x) => (x.id === d.id ? { ...x, quantity: String(qty + 1) } : x)))} className="p-2 text-white/80 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="Increase"><Plus className="h-4 w-4" /></button>
                    </div>
                    <button type="button" onClick={() => setCounterDeliverablesList((prev) => prev.filter((x) => x.id !== d.id))} className="p-1 rounded text-red-300/80 hover:text-red-300 hover:bg-red-500/15" aria-label="Remove"><X className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={() => setCounterDeliverablesList((prev) => [...prev, { id: `d-${Date.now()}`, name: '', platform: '', quantity: '' }])} className="w-full border-white/20 text-purple-200 hover:bg-white/10 min-h-[44px]"><Plus className="h-4 w-4 mr-2" />Add another deliverable</Button>
            </div>
          </div>
          <div>
            <Label className="text-purple-200">Proposed Delivery Date</Label>
            <p className="text-[10px] text-purple-300/60 mb-1">You can adjust this if you need more time</p>
            <div className="relative mt-1">
              <Input type="date" value={counterDeadline} onChange={(e) => setCounterDeadline(e.target.value)} className="bg-white/10 border-white/20 text-white min-h-[44px] pl-3 pr-10" />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" aria-hidden />
            </div>
          </div>
          <div>
            <Label className="text-purple-200">Message to Brand (optional)</Label>
            <Textarea value={counterNotes} onChange={(e) => setCounterNotes(e.target.value)} placeholder="Explain briefly why you're proposing this change" className="bg-white/10 border-white/20 text-white mt-1 min-h-[4.5rem] resize-y" rows={3} />
          </div>
          <p className="text-[10px] text-purple-300/50 flex items-center gap-1.5">
            <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />
            Counters are logged and legally timestamped by Creator Armour
          </p>
        </div>

        {/* Sticky action bar — above bottom nav */}
        <div className="fixed left-0 right-0 z-40 p-4 pt-3 pb-2 bg-gradient-to-t from-purple-900 via-purple-900/98 to-transparent pointer-events-none" style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="pointer-events-auto flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" onClick={() => navigate('/collab-requests')} className="flex-1 border-white/20 text-purple-200 hover:bg-white/10 min-h-[42px]">Cancel</Button>
            <Button onClick={handleCounter} disabled={counterSubmitting} className="flex-1 min-h-[42px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white">
              {counterSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : 'Send Counter'}
            </Button>
          </div>
        </div>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CollabRequestCounterPage;

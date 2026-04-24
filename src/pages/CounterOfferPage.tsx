

import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { cn } from '@/lib/utils';
import { ShieldCheck, Loader2, ArrowLeft, X, CheckCircle2, AlertCircle, Clock, Instagram, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';

interface CounterOfferPayload {
  final_price?: string;
  deliverables?: string;
  notes?: string;
}

const CounterOfferPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useSession();

  // Get request from navigation state, or fetch it
  const initialRequest = location.state?.request;
  const [request, setRequest] = useState(initialRequest || location.state?.request);
  const [loading, setLoading] = useState(!initialRequest);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [counterPrice, setCounterPrice] = useState('');
  const [counterDeliverables, setCounterDeliverables] = useState('');
  const [counterNotes, setCounterNotes] = useState('');

  // Load the request if not passed via state
  useState(() => {
    if (!initialRequest && requestId) {
      const loadRequest = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const apiBase = getApiBaseUrl();
          const response = await fetch(`${apiBase}/api/collab-requests/${requestId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await response.json();
          if (data?.request) {
            setRequest(data.request);
          }
        } catch (e) {
          console.error('Failed to load request', e);
        } finally {
          setLoading(false);
        }
      };
      loadRequest();
    }
  });

  if (loading) {
    return (
      <CreatorNavigationWrapper title="Counter Offer" showBackButton onBack={() => navigate(-1)}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-info" />
        </div>
      </CreatorNavigationWrapper>
    );
  }

  if (!request) {
    return (
      <CreatorNavigationWrapper title="Counter Offer" showBackButton onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">Request not found</p>
          <button
            onClick={() => navigate('/creator-dashboard')}
            className="px-6 py-3 bg-info text-white rounded-xl font-bold"
          >
            Go to Dashboard
          </button>
        </div>
      </CreatorNavigationWrapper>
    );
  }

  const isBarterLike = request.collab_type === 'barter' || request.collab_type === 'hybrid';

  const handleSubmit = async () => {
    if (!counterPrice.trim() && !counterDeliverables.trim() && !counterNotes.trim()) {
      toast.error('Please fill in at least one field to counter');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error('Please log in to submit counter offers');
        return;
      }

      const apiBase = getApiBaseUrl();
      const payload: CounterOfferPayload = {};
      if (counterPrice.trim()) payload.final_price = counterPrice.trim();
      if (counterDeliverables.trim()) payload.deliverables = counterDeliverables.trim();
      if (counterNotes.trim()) payload.notes = counterNotes.trim();

      const response = await fetch(`${apiBase}/api/collab-requests/${requestId}/counter`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        toast.error(data?.error || 'Failed to submit counter offer');
        return;
      }

      trackEvent('creator_countered_request', {
        request_id: requestId,
        creator_id: profile?.id,
      });

      toast.success('Counter offer sent! Brand will review.');
      navigate('/creator-dashboard?tab=deals&subtab=pending', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit counter offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deliverablesList = Array.isArray(request.deliverables)
    ? request.deliverables
    : request.deliverables
      ? request.deliverables.split(',').map((d: string) => d.trim())
      : [];

  return (
    <CreatorNavigationWrapper
      title="Counter Offer"
      showBackButton
      onBack={() => navigate(-1)}
    >
      <div className="min-h-screen bg-background">
        {/* Brand Info Header */}
        <div className="mx-5 mt-4 p-4 rounded-2xl border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{request.brand_name}</p>
              <p className="text-xs text-muted-foreground">Verified Brand</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-background">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Their Offer</p>
              <p className="text-[16px] font-black">
                {isBarterLike ? '—' : `₹${(request.exact_budget || 0).toLocaleString('en-IN')}`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-background">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Type</p>
              <p className="text-[11px] font-bold capitalize">{request.collab_type}</p>
            </div>
          </div>
          {request.deadline && (
            <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Deadline: {new Date(request.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="mx-5 mt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Deliverables</p>
          <div className="flex flex-wrap gap-2">
            {deliverablesList.map((d: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-info/10 text-info text-xs font-bold">
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Counter Form */}
        <div className="mx-5 mt-6 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Your Counter</p>

          {!isBarterLike && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Your price (₹)</label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder={`e.g. ${request.exact_budget ? Number(request.exact_budget) + 2000 : 15000}`}
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-base"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Deliverables you want</label>
            <input
              type="text"
              value={counterDeliverables}
              onChange={(e) => setCounterDeliverables(e.target.value)}
              placeholder={deliverablesList.join(', ')}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Notes for the brand</label>
            <textarea
              value={counterNotes}
              onChange={(e) => setCounterNotes(e.target.value)}
              placeholder="Any changes or conditions you want to mention..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 text-base resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mx-5 mt-6 mb-10">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[15px] shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:scale-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Counter Offer
              </>
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full h-12 mt-3 rounded-2xl border border-border bg-card text-muted-foreground font-bold text-[14px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CounterOfferPage;

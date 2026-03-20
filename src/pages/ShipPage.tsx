"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Package, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';

interface DealSummary {
  dealId: string;
  creatorName: string;
  creatorCity: string | null;
  productDescription: string;
  brandName: string;
}

export default function ShipPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DealSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  useEffect(() => {
    if (!token?.trim()) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/shipping/${encodeURIComponent(token.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.creatorName !== undefined) {
          setSummary({
            dealId: data.dealId,
            creatorName: data.creatorName,
            creatorCity: data.creatorCity ?? null,
            productDescription: data.productDescription ?? '',
            brandName: data.brandName ?? 'Brand',
          });
          setError(null);
          trackEvent('shipping_link_opened', { deal_id: data.dealId });
        } else {
          setError(data.error || 'This link is invalid or has expired.');
        }
      })
      .catch(() => setError('Unable to load. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token?.trim() || !courierName.trim() || !trackingNumber.trim()) {
      toast.error('Please fill in courier name and tracking number.');
      return;
    }
    setSubmitting(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBaseUrl}/api/shipping/${encodeURIComponent(token.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_name: courierName.trim(),
          tracking_number: trackingNumber.trim(),
          tracking_url: trackingUrl.trim() || undefined,
          expected_delivery_date: expectedDeliveryDate.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        trackEvent('shipping_marked_shipped', { deal_id: summary?.dealId });
        toast.success('Shipping details saved. The creator has been notified.');
      } else {
        toast.error(data.error || 'Failed to save. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-white/80">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Link invalid or expired</h1>
          <p className="text-white/70">{error}</p>
          <p className="text-white/50 text-sm mt-4">Please contact the creator for a new link.</p>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Shipping details saved</h1>
          <p className="text-white/70">The creator has been notified and can track the package.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Update Shipping Details</h1>
            <p className="text-white/60 text-sm">Barter collaboration with {summary.creatorName}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm text-white/80 space-y-1">
          <p><span className="text-white/50">Creator:</span> {summary.creatorName}{summary.creatorCity ? ` · ${summary.creatorCity}` : ''}</p>
          <p><span className="text-white/50">Product / deal:</span> {summary.productDescription || 'As per agreement'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Courier name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. Blue Dart, Delhivery"
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Tracking number <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1234567890"
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Tracking URL (optional)</label>
            <input
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Expected delivery date (optional)</label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Mark as Shipped'}
          </button>
        </form>

        <p className="text-white/40 text-xs mt-4 text-center">This link is valid for 14 days. No login required.</p>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Fashion', 'Beauty', 'Lifestyle', 'Food & Beverage', 'Tech & Gadgets', 'Fitness & Health', 'Travel', 'Gaming', 'Education', 'Home & Decor', 'Other'];
const BUDGETS = ['Under ₹5,000', '₹5,000 – ₹15,000', '₹15,000 – ₹50,000', '₹50,000 – ₹1 Lakh', 'Above ₹1 Lakh'];
const CREATOR_COUNTS = ['1–2 creators', '3–5 creators', '5–10 creators', '10+ creators'];

interface ShortlistFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export const ShortlistForm: React.FC<ShortlistFormProps> = ({ onSuccess, compact = false }) => {
  const [form, setForm] = useState({
    brand_name: '',
    contact: '',
    category: '',
    budget: '',
    creator_count: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.brand_name || !form.contact || !form.category || !form.budget) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase.from('brand_leads').insert([form]);
    setLoading(false);
    if (dbError) {
      setError('Something went wrong. Please try again or WhatsApp us directly.');
      return;
    }
    setDone(true);
    onSuccess?.();
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
        </div>
        <h3 className="text-2xl font-black text-[#0F172A]">You're on the list!</h3>
        <p className="text-[#64748B] font-medium max-w-sm">
          We'll send you a curated shortlist of creators within <strong>48 hours</strong>. Keep an eye on your WhatsApp / email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">Brand / Company Name *</label>
          <input
            type="text"
            placeholder="e.g. Nykaa, Boat, Mamaearth"
            value={form.brand_name}
            onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
            className="w-full h-12 px-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] text-[#0F172A] font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all placeholder:text-[#CBD5E1]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">WhatsApp / Email *</label>
          <input
            type="text"
            placeholder="Your WhatsApp number or email"
            value={form.contact}
            onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
            className="w-full h-12 px-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] text-[#0F172A] font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all placeholder:text-[#CBD5E1]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">Category *</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full h-12 px-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] text-[#0F172A] font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all appearance-none"
          >
            <option value="">Select your niche</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">Campaign Budget *</label>
          <select
            value={form.budget}
            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
            className="w-full h-12 px-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] text-[#0F172A] font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all appearance-none"
          >
            <option value="">Select budget range</option>
            {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">How many creators?</label>
          <select
            value={form.creator_count}
            onChange={e => setForm(f => ({ ...f, creator_count: e.target.value }))}
            className="w-full h-12 px-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] text-[#0F172A] font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all appearance-none"
          >
            <option value="">Optional</option>
            {CREATOR_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">Brief (optional)</label>
          <input
            type="text"
            placeholder="e.g. Reel + Story for product launch"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full h-12 px-4 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] text-[#0F172A] font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all placeholder:text-[#CBD5E1]"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-2xl bg-[#16A34A] hover:bg-[#15803D] text-white font-black text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/25 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
        ) : (
          <>Get my free shortlist <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
      <p className="text-center text-[12px] font-medium text-[#94A3B8]">
        Free. No spam. We'll reach out within 48 hours.
      </p>
    </form>
  );
};

interface ShortlistModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShortlistModal: React.FC<ShortlistModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get free creator shortlist"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-6 py-5 flex items-center justify-between z-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Free Creator Shortlist</p>
            <h2 className="text-xl font-black text-[#0F172A] mt-0.5">Tell us about your campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8FAF9] hover:bg-[#E5E7EB] text-[#64748B] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <ShortlistForm onSuccess={() => setTimeout(onClose, 2500)} compact />
        </div>
      </div>
    </div>
  );
};

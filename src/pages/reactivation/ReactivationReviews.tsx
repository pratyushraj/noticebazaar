import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Bot,
  RefreshCw,
  Send,
  Edit3,
  Check,
  Building2,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoogleReview {
  id: string;
  commenterName: string;
  avatarUrl?: string;
  rating: number;
  comment: string;
  timeAgo: string;
  status: 'replied' | 'pending' | 'escalated';
  aiReplyDraft?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_REVIEWS: GoogleReview[] = [
  {
    id: 'r1',
    commenterName: 'Priya Sen',
    rating: 5,
    comment: 'The root canal session was completely painless. Dr. Priya Sharma is very gentle and explained every step. Highly recommend this clinic!',
    timeAgo: '4 hours ago',
    status: 'replied',
    aiReplyDraft: 'Thank you Priya Sen! 💙 We are thrilled to hear you had a painless root canal experience with Dr. Priya Sharma. We always strive to provide gentle care and clear explanations. See you next time!',
  },
  {
    id: 'r2',
    commenterName: 'Amit Verma',
    rating: 5,
    comment: 'Great infrastructure and polite staff. Visited for scaling and polishing last week. Free parking pass was helpful too.',
    timeAgo: '1 day ago',
    status: 'pending',
    aiReplyDraft: 'Hi Amit Verma! Thank you for the 5-star review! 🌟 We are glad you liked our modern infrastructure and polite staff during your scaling session. Happy to know the parking pass was convenient. See you again!',
  },
  {
    id: 'r3',
    commenterName: 'Karan Malhotra',
    rating: 2,
    comment: 'Clean clinic but wait times are extremely high. Had to wait 45 minutes past my scheduled slot for a dental consult.',
    timeAgo: '2 days ago',
    status: 'escalated',
    aiReplyDraft: 'Dear Karan Malhotra, we sincerely apologize for the 45-minute delay past your scheduled appointment time. We value your feedback and would like to make this right. Please contact our clinic manager at manager@smiledental.com or call +91 98765 43210 so we can address this directly.',
  },
  {
    id: 'r4',
    commenterName: 'Neha Das',
    rating: 5,
    comment: 'Got my clear aligners from here and the 3D smile design mockup was super detailed. Excited for my alignment results.',
    timeAgo: '4 days ago',
    status: 'replied',
    aiReplyDraft: 'Thank you Neha Das! 🦷 We are excited for your clear aligner journey and glad the 3D smile design was helpful. We look forward to seeing your beautiful results!',
  },
];

export default function ReactivationReviews() {
  const [reviews, setReviews] = useState<GoogleReview[]>(MOCK_REVIEWS);
  const [tone, setTone] = useState<'professional' | 'warm' | 'casual'>('warm');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [postingId, setPostingId] = useState<string | null>(null);

  const handlePostReply = (id: string) => {
    setPostingId(id);
    setTimeout(() => {
      setReviews(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'replied' } : r))
      );
      setPostingId(null);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }, 1500);
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = (id: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, aiReplyDraft: editingText } : r))
    );
    setEditingId(null);
  };

  return (
    <div className="min-h-full space-y-6 pb-8 text-slate-800 relative">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Google Reviews Autoreply</h2>
          <p className="text-sm text-slate-500 mt-1">Manage Google Business reviews and automate responses via AI</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-200">
          <Building2 size={15} className="text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700">Smile Dental Clinic (Patna)</span>
        </div>
      </div>

      {/* ── Configuration Panel ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          className="md:col-span-2 rounded-2xl border border-white/[0.06] p-5 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">AI Autoreply Settings</h3>
            <p className="text-[11px] text-slate-400">Configure rules for automatically responding to customer reviews</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Brand Tone & Voice</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500/60 transition-all"
              >
                <option value="warm">Warm & Friendly (Enthusiastic)</option>
                <option value="professional">Professional & Direct</option>
                <option value="casual">Casual & Relaxed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Automation Mode</label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 h-[42px]">
                <span className="text-xs font-medium text-slate-700">Enable Autoreply</span>
                <button
                  onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  className={`relative w-8 h-4.5 rounded-full transition-colors ${autoReplyEnabled ? 'bg-indigo-500' : 'bg-slate-100'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all absolute top-0.5 ${autoReplyEnabled ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div
          className="rounded-2xl border border-white/[0.06] p-5 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Performance Overview</h3>
            <p className="text-[11px] text-slate-400">Stats from linked Google Profile</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <p className="text-lg font-bold text-indigo-600">4.8 ★</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">Avg Rating</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <p className="text-lg font-bold text-emerald-700">145</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">Replies Posted</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Review Feed ── */}
      <div
        className="rounded-2xl border border-white/[0.06] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Live Review Feed</h3>
            <p className="text-[11px] text-slate-400">Manage and post drafts generated by auto-reply backend</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {reviews.map((rev) => {
            const isEditing = editingId === rev.id;
            const isPending = rev.status === 'pending';
            const isEscalated = rev.status === 'escalated';

            return (
              <div key={rev.id} className="p-6 space-y-4 hover:bg-slate-50 transition-all">
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600">
                      {rev.commenterName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{rev.commenterName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">• {rev.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status chip */}
                  <div>
                    {rev.status === 'replied' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
                        <CheckCircle2 size={11} /> Auto Replied
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/15 text-amber-700 border border-amber-500/25">
                        <Clock size={11} /> AI Draft Ready
                      </span>
                    )}
                    {isEscalated && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse">
                        <AlertTriangle size={11} /> Escalated (1-3★)
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-700 italic pl-12 leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* AI Reply Block */}
                {rev.aiReplyDraft && (
                  <div className="pl-12">
                    <div className="bg-white/60 border border-indigo-200 rounded-xl p-4 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          <Bot size={13} /> AI Reply Draft
                        </div>
                        {isPending && !isEditing && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStartEdit(rev.id, rev.aiReplyDraft!)}
                              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handlePostReply(rev.id)}
                              disabled={postingId === rev.id}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-800 text-[11px] font-semibold transition-all"
                            >
                              {postingId === rev.id ? (
                                <RefreshCw size={11} className="animate-spin" />
                              ) : (
                                <Send size={11} />
                              )}
                              Post Reply
                            </button>
                          </div>
                        )}
                        {isEscalated && !isEditing && (
                          <button
                            onClick={() => handleStartEdit(rev.id, rev.aiReplyDraft!)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 text-[11px] font-semibold transition-all"
                          >
                            <Edit3 size={11} /> Review & Approve
                          </button>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => handleSaveEdit(rev.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-800 text-[11px] font-semibold transition-all"
                          >
                            <Check size={11} /> Save
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <textarea
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-indigo-500/50 outline-none resize-none min-h-[72px]"
                        />
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {rev.aiReplyDraft}
                        </p>
                      )}

                      {rev.status === 'replied' && (
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Response posted to Google Business
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

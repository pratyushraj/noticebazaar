import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useSession } from '@/contexts/SessionContext';
import {
  RefreshCw,
  Sparkles,
  Send,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Edit3,
  MessageCircle,
  Users,
  Calendar,
  Clock,
  Info,
  CheckSquare,
  Square,
  Zap,
  Star,
  Gift,
  Handshake,
  Bell,
  Repeat2,
  Phone,
  X,
  TrendingUp,
  BarChart3,
  Eye,
  MessageSquare,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CampaignType {
  id: string;
  label: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface AudienceSegment {
  id: string;
  label: string;
  count: number;
  description: string;
}

interface GeneratedMessage {
  id: string;
  label: string;
  day: string;
  content: string;
  cta: string;
  ctaColor: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  status: 'Active' | 'Lapsed' | 'VIP' | 'New';
  city: string;
}

interface CampaignForm {
  name: string;
  type: string;
  businessName: string;
  location: string;
  industry: string;
  offerDescription: string;
  segment: string;
}

interface BroadcastStats {
  sent: number;
  delivered: number;
  read: number;
  replied: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CAMPAIGN_TYPES: CampaignType[] = [
  {
    id: 'reactivation',
    label: 'Reactivation Offer',
    emoji: '🔄',
    icon: Repeat2,
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-200',
    description: 'Win back lost customers',
  },
  {
    id: 'festival',
    label: 'Festival Offer',
    emoji: '🎉',
    icon: Gift,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-200',
    description: 'Season & festive deals',
  },
  {
    id: 'launch',
    label: 'New Service Launch',
    emoji: '✨',
    icon: Sparkles,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-200',
    description: 'Announce new offerings',
  },
  {
    id: 'referral',
    label: 'Referral Campaign',
    emoji: '🤝',
    icon: Handshake,
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-200',
    description: 'Get word-of-mouth leads',
  },
  {
    id: 'review',
    label: 'Review Request',
    emoji: '⭐',
    icon: Star,
    color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
    description: 'Boost your online reputation',
  },
  {
    id: 'reminder',
    label: 'Appointment Reminder',
    emoji: '📅',
    icon: Bell,
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30',
    description: 'Reduce no-shows',
  },
];

const SEGMENTS: AudienceSegment[] = [
  {
    id: 'lapsed-rct',
    label: 'Lapsed RCT (No Crown) 🚨',
    count: 14,
    description: 'RCT sitting done but Cap/Crown is pending trial',
  },
  {
    id: 'no-visit-6m',
    label: 'No Visit 6+ Months',
    count: 143,
    description: 'Last visit over 6 months ago',
  },
  {
    id: 'teeth-cleaning',
    label: 'Teeth Cleaning Patients',
    count: 87,
    description: 'Had cleaning in last year',
  },
  {
    id: 'whitening',
    label: 'Whitening Patients',
    count: 54,
    description: 'Got whitening treatment',
  },
  {
    id: 'orthodontics',
    label: 'Orthodontics Patients',
    count: 31,
    description: 'Braces / aligner patients',
  },
  {
    id: 'new-patients',
    label: 'New Patients (< 30 days)',
    count: 22,
    description: 'Recently onboarded',
  },
  {
    id: 'vip',
    label: 'VIP Patients',
    count: 18,
    description: 'High-value repeat customers',
  },
  {
    id: 'all',
    label: 'All Customers',
    count: 312,
    description: 'Entire customer database',
  },
];

const INDUSTRIES = [
  'Dental Clinic',
];

const MOCK_CUSTOMERS: Customer[] = [];

const GENERATED_MESSAGES: GeneratedMessage[] = [
  {
    id: 'msg1',
    label: 'WhatsApp Message',
    day: 'Day 1 — Primary',
    cta: 'BOOK',
    ctaColor: 'bg-emerald-50 text-emerald-300 border-emerald-200',
    content: `Hi {{Name}}! 👋

We miss you at Smile Dental Clinic!

It's been a while since your last visit, and we'd love to welcome you back.

🎉 EXCLUSIVE OFFER just for you:
20% off your next Teeth Cleaning!

Valid this month only. Book now:
📞 Call: 98765 43210
💬 Reply 'BOOK' to this message

Smile Dental Team ✨`,
  },
  {
    id: 'msg2',
    label: 'Follow-Up',
    day: 'Day 3 — Follow-Up',
    cta: 'YES',
    ctaColor: 'bg-blue-50 text-blue-300 border-blue-200',
    content: `Hi {{Name}}, did you see our offer? 😊

We still have slots available this week for your Teeth Cleaning with 20% off.

Don't let this slip! Our patients who book within 48 hours get priority scheduling.

Reply 'YES' and we'll confirm your appointment ⚡`,
  },
  {
    id: 'msg3',
    label: 'Final Reminder',
    day: 'Day 6 — Last Chance',
    cta: 'CONFIRM',
    ctaColor: 'bg-amber-50 text-amber-300 border-amber-200',
    content: `Last reminder {{Name}} ⏰

Your exclusive offer expires tomorrow!

🦷 Teeth Cleaning @ just ₹640 (save ₹160)

Book in 1 click: Reply 'CONFIRM' or call 98765 43210

We look forward to seeing your smile! 😄`,
  },
];

// ─── Typewriter Hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed: number = 18, start: boolean = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!start) {
      setDisplayed('');
      setDone(false);
      indexRef.current = 0;
      return;
    }

    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        setDone(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, start]);

  return { displayed, done };
}

// ─── Message Card ─────────────────────────────────────────────────────────────

interface MessageCardProps {
  message: GeneratedMessage;
  index: number;
  startDelay: number;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, index, startDelay }) => {
  const [started, setStarted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [displayContent, setDisplayContent] = useState(message.content);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  const { displayed, done } = useTypewriter(displayContent, 14, started);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setStarted(false);
    setDisplayContent(displayContent + ' ');
    setTimeout(() => {
      setDisplayContent(message.content);
      setStarted(true);
    }, 200);
  };

  const handleSaveEdit = () => {
    setDisplayContent(editContent);
    setEditing(false);
  };

  const charCount = displayContent.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: startDelay / 1000, duration: 0.4, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={13} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-800 leading-none">{message.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{message.day}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* CTA Badge */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider ${message.ctaColor}`}
          >
            Reply: '{message.cta}'
          </span>
          {/* Open rate */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
            <TrendingUp size={10} className="text-emerald-700" />
            <span className="text-[10px] font-bold text-emerald-700">67% open</span>
          </div>
        </div>
      </div>

      {/* Message Body */}
      <div className="px-4 py-4">
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-[13px] text-slate-800 leading-relaxed font-mono resize-none outline-none rounded-lg p-3 min-h-[160px]"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#1e293b',
            }}
            autoFocus
          />
        ) : (
          <div className="relative">
            {/* WhatsApp-style bubble */}
            <div
              className="rounded-xl p-4 font-mono text-[12.5px] leading-relaxed relative"
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16,185,129,0.12)',
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                minHeight: '140px',
              }}
            >
              {done ? displayContent : displayed}
              {!done && started && (
                <span
                  className="inline-block w-[2px] h-[14px] ml-0.5 rounded-sm bg-indigo-400 align-text-bottom"
                  style={{ animation: 'caretBlink 0.8s ease-in-out infinite' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Footer bar */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {/* Char count */}
            <span
              className="text-[10px] px-2 py-0.5 rounded-md font-mono"
              style={{
                background: '#f1f5f9',
                color: '#64748b',
              }}
            >
              {charCount} chars
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Regenerate */}
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <RefreshCw size={11} />
              Regenerate
            </button>

            {/* Edit / Save */}
            {editing ? (
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
                style={{
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#a5b4fc',
                }}
              >
                <Check size={11} />
                Save
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                <Edit3 size={11} />
                Edit
              </button>
            )}

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150"
              style={{
                background: copied ? '#ecfdf5' : '#ffffff',
                border: copied ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                color: copied ? '#047857' : '#64748b',
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = ['Build Campaign', 'Generate Messages', 'Broadcast'];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => (
  <div className="flex items-center gap-0">
    {STEPS.map((label, i) => {
      const stepNum = i + 1;
      const isActive = stepNum === currentStep;
      const isCompleted = stepNum < currentStep;
      const isLast = i === STEPS.length - 1;

      return (
        <React.Fragment key={stepNum}>
          <div className="flex items-center gap-0 sm:gap-2">
            {/* Circle */}
            <motion.div
              animate={{
                background: isCompleted
                  ? '#6366f1'
                  : isActive
                  ? 'rgba(99,102,241,0.2)'
                  : 'rgba(255,255,255,0.05)',
                borderColor: isCompleted || isActive ? '#6366f1' : 'rgba(255,255,255,0.12)',
              }}
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            >
              {isCompleted ? (
                <Check size={13} className="text-slate-800" />
              ) : (
                <span
                  className={`text-[11px] font-bold ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {stepNum}
                </span>
              )}
            </motion.div>
            {/* Label — hidden on xs, visible on sm+ */}
            <span
              className={`hidden sm:inline text-[12px] font-medium whitespace-nowrap transition-colors duration-200 ${
                isActive ? 'text-slate-800' : isCompleted ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
          {/* Connector */}
          {!isLast && (
            <motion.div
              animate={{
                background: isCompleted ? '#6366f1' : '#f1f5f9',
              }}
              className="h-px mx-3 flex-1"
              style={{ minWidth: 24 }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Campaign Preview Card ────────────────────────────────────────────────────

interface CampaignPreviewCardProps {
  form: CampaignForm;
  selectedSegment: AudienceSegment | undefined;
  selectedType: CampaignType | undefined;
}

const CampaignPreviewCard: React.FC<CampaignPreviewCardProps> = ({
  form,
  selectedSegment,
  selectedType,
}) => (
  <div
    className="rounded-2xl p-5 h-full flex flex-col gap-4"
    style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
    }}
  >
    <div className="flex items-center gap-2 mb-1">
      <Sparkles size={13} className="text-indigo-600" />
      <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
        Campaign Preview
      </span>
    </div>

    {/* Type badge */}
    {selectedType && (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border self-start bg-gradient-to-r ${selectedType.color}`}
      >
        <span className="text-base leading-none">{selectedType.emoji}</span>
        <span className="text-[11px] font-semibold text-slate-700">{selectedType.label}</span>
      </div>
    )}

    {/* Campaign name */}
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
        Campaign Name
      </p>
      <p className="text-[15px] font-semibold text-slate-800">
        {form.name || (
          <span className="text-slate-400 italic font-normal">Untitled Campaign</span>
        )}
      </p>
    </div>

    {/* Business */}
    {form.businessName && (
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
          Business
        </p>
        <p className="text-[13px] text-slate-700">
          {form.businessName}
          {form.location && `, ${form.location}`}
        </p>
      </div>
    )}

    {/* Offer */}
    {form.offerDescription && (
      <div
        className="rounded-xl px-3 py-3"
        style={{
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.18)',
        }}
      >
        <p className="text-[10px] text-indigo-600/70 uppercase tracking-widest font-bold mb-1">
          Offer
        </p>
        <p className="text-[12px] text-slate-800/75 leading-relaxed">{form.offerDescription}</p>
      </div>
    )}

    {/* Audience */}
    {selectedSegment && (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
            Audience
          </p>
          <p className="text-[12px] text-slate-700">{selectedSegment.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-black text-indigo-600 leading-none">
            {selectedSegment.count}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">customers</p>
        </div>
      </div>
    )}

    {/* Divider */}
    <div className="h-px bg-slate-50" />

    <div className="flex items-center gap-2 text-slate-400">
      <MessageCircle size={13} />
      <span className="text-[11px]">3 messages will be sent</span>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ReactivationCampaigns: React.FC = () => {
  const { profile } = useSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CampaignForm>(() => {
    return {
      name: '',
      type: '',
      businessName: 'Dental Clinic',
      location: 'Patna',
      industry: 'Dental Clinic',
      offerDescription: '20% off teeth whitening this month',
      segment: '',
    };
  });

  useEffect(() => {
    if (profile?.business_name) {
      setForm(prev => ({ ...prev, businessName: profile.business_name || '' }));
    }
  }, [profile?.business_name]);

  // Dynamically map messages to use the current business name and location
  const generatedMessages = React.useMemo(() => {
    const isHinglish = form.offerDescription.toLowerCase().includes('mahine') || 
                      form.offerDescription.toLowerCase().includes('tooth') ||
                      form.offerDescription.toLowerCase().includes('daant') ||
                      form.offerDescription.toLowerCase().includes('cap') ||
                      form.offerDescription.toLowerCase().includes('crown') ||
                      form.offerDescription.toLowerCase().includes('rct') ||
                      form.offerDescription.toLowerCase().includes('gums') ||
                      form.offerDescription.toLowerCase().includes('cleaning') ||
                      form.offerDescription.toLowerCase().includes('bleeding');

    if (isHinglish) {
      if (form.offerDescription.toLowerCase().includes('cap') || form.offerDescription.toLowerCase().includes('crown')) {
        return [
          {
            id: 'msg1',
            label: 'WhatsApp Message (Hinglish)',
            day: 'Day 1 — Primary Nudge',
            cta: 'CAP',
            ctaColor: 'bg-rose-50 text-rose-700 border-rose-200',
            content: `Namaste {{Name}} ji! 🙏\n\nDr. Aryan baat kar rahe hain ${form.businessName} se.\n\nAapka root canal sitting ho gaya hai par daant me *Cap/Crown lagwana pending* hai.\n\n⚠️ *Awasyak Nudge:* Bina Cap ke RCT kiya hua daant brittle ho jata hai aur chabane se beech se toot sakta hai. Fir tooth extraction (daant nikalna) karna padega.\n\nहमारे पास standard crowns starting ₹3,000 & premium Zirconia cap starting ₹8,000 available hain.\n\nक्या हम इस हफ्ते cap trial के लिए schedule karein?\n\nReply 'CAP' for booking 📞`,
          },
          {
            id: 'msg2',
            label: 'Follow-Up (Hinglish)',
            day: 'Day 3 — Safety Check',
            cta: 'YES',
            ctaColor: 'bg-amber-50 text-amber-700 border-amber-200',
            content: `Hi {{Name}} ji,\n\nBina crown fitting ke side se khana chabana harmful ho sakta hai. \n\nKya hum kal ya parso Doctor ke sath cap trial session finalize karein?\n\nReply 'YES' to schedule direct ⚡`,
          }
        ];
      } else if (form.offerDescription.toLowerCase().includes('cleaning') || form.offerDescription.toLowerCase().includes('scaling') || form.offerDescription.toLowerCase().includes('bleeding')) {
        return [
          {
            id: 'msg1',
            label: 'WhatsApp Message (Hinglish)',
            day: 'Day 1 — Primary Checkup',
            cta: 'CLEAN',
            ctaColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            content: `Namaste {{Name}} ji! 🙏\n\nDr. Aryan baat kar rahe hain ${form.businessName} se.\n\nAapki teeth cleaning & scaling ko 6 mahine ho gaye hain. 🦷\n\nDaanto me pathri (tartar/calculus) jamne se gums weak ho jate hain, bleeding aur bad breath start ho sakti hai jo brush karne se clean nahi hoti.\n\n🎉 *Special Clinic Offer:* Complete Scaling & Deep Polishing just ₹1,000 me available hai.\n\nKya hum kal aane ke liye appointment book karein?\n\nReply 'CLEAN' to book directly 💬`,
          },
          {
            id: 'msg2',
            label: 'Follow-Up (Hinglish)',
            day: 'Day 3 — Booking Nudge',
            cta: 'YES',
            ctaColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            content: `Hi {{Name}} ji,\n\nKal ke slots empty hain. Gums infection se bachne ke liye regular cleaning jaruri hai.\n\nReply 'YES' to block your chair slot ⚡`,
          }
        ];
      }
    }

    return GENERATED_MESSAGES.map(msg => {
      let content = msg.content
        .replace(/Smile Dental Clinic/g, form.businessName)
        .replace(/Smile Dental Team/g, `${form.businessName} Team`)
        .replace(/98765 43210/g, '93041 23456');
      return {
        ...msg,
        content
      };
    });
  }, [form.businessName, form.offerDescription]);

  // Step 2 — message generation state
  const [generatingStep, setGeneratingStep] = useState(0);
  const [generatingDone, setGeneratingDone] = useState(false);

  // Step 3 — broadcast state
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set(MOCK_CUSTOMERS.map((c) => c.id))
  );
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [stats, setStats] = useState<BroadcastStats>({
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
  });
  const [showStats, setShowStats] = useState(false);

  const broadcastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedSegment = SEGMENTS.find((s) => s.id === form.segment);
  const selectedType = CAMPAIGN_TYPES.find((t) => t.id === form.type);
  const totalCustomers = selectedSegment?.count ?? 143;

  // ─── Step 1 → Step 2: trigger generation animation
  const handleGoToStep2 = () => {
    setStep(2);
    setGeneratingStep(0);
    setGeneratingDone(false);

    // Stagger each message generation
    setTimeout(() => setGeneratingStep(1), 200);
    setTimeout(() => setGeneratingStep(2), 4000);
    setTimeout(() => setGeneratingStep(3), 8000);
    setTimeout(() => setGeneratingDone(true), 10000);
  };

  // ─── Broadcast handler
  const handleBroadcast = useCallback(() => {
    setBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastDone(false);
    setShowStats(false);

    let progress = 0;
    broadcastIntervalRef.current = setInterval(() => {
      progress += Math.random() * 3 + 1;
      if (progress >= 100) {
        progress = 100;
        if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
        setBroadcastProgress(100);
        setBroadcasting(false);
        setBroadcastDone(true);

        // Initial stats
        const sent = selectedCustomers.size;
        setStats({ sent, delivered: 0, read: 0, replied: 0 });

        // Animate delivered
        setTimeout(() => {
          const delivered = Math.floor(sent * 0.965);
          setStats((s) => ({ ...s, delivered }));
          setShowStats(true);
        }, 600);

        // Animate read after delay
        setTimeout(() => {
          setStats((s) => ({ ...s, read: Math.floor(s.sent * 0.62) }));
        }, 3500);

        // Animate replied after longer delay
        setTimeout(() => {
          setStats((s) => ({ ...s, replied: Math.floor(s.sent * 0.084) }));
        }, 7000);
      } else {
        setBroadcastProgress(progress);
      }
    }, 80);
  }, [selectedCustomers.size]);

  useEffect(() => {
    return () => {
      if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
    };
  }, []);

  const toggleCustomer = (id: string) => {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCustomers.size === MOCK_CUSTOMERS.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(MOCK_CUSTOMERS.map((c) => c.id)));
    }
  };

  // ─── Slide direction
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 48 : -48,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as any },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -48 : 48,
      opacity: 0,
      transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as any },
    }),
  };

  const [slideDir, setSlideDir] = useState(1);

  const goNext = () => {
    setSlideDir(1);
    if (step === 1) handleGoToStep2();
    else setStep((s) => s + 1);
  };

  const goBack = () => {
    setSlideDir(-1);
    setStep((s) => s - 1);
  };

  const canAdvanceStep1 =
    form.name.trim() !== '' && form.type !== '' && form.segment !== '';

  // ─── Status chip color
  const statusColor: Record<string, string> = {
    Active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Lapsed: 'text-amber-700 bg-amber-50 border-amber-200',
    VIP: 'text-purple-700 bg-purple-50 border-purple-200',
    New: 'text-blue-700 bg-blue-50 border-blue-200',
  };

  // ─── Broadcast sending counter display
  const sendingCount = Math.floor((broadcastProgress / 100) * selectedCustomers.size);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* ── Caret blink style injection ── */}
      <style>{`
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <Zap size={14} className="text-indigo-600" />
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                AI Campaign Builder
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-snug">
              WhatsApp Reactivation Campaign
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Build → Generate → Broadcast in 3 steps
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div
          className="mt-5 px-5 py-4 rounded-2xl"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <StepIndicator currentStep={step} />
        </div>
      </div>

      {/* ── Step Content ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait" custom={slideDir}>
          {/* ═══ STEP 1: BUILD CAMPAIGN ══════════════════════════════ */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6"
            >
              {/* Left Panel — Form */}
              <div className="col-span-2 flex flex-col gap-4">
                {/* Campaign Name */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. June Reactivation — Dental Patients"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full text-[14px] text-slate-800 placeholder-slate-400 outline-none rounded-xl px-4 py-3 transition-all duration-150 bg-white border border-slate-200"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Campaign Type */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {CAMPAIGN_TYPES.map((ct) => {
                      const isSelected = form.type === ct.id;
                      const Icon = ct.icon;
                      return (
                        <motion.button
                          key={ct.id}
                          onClick={() => setForm((f) => ({ ...f, type: ct.id }))}
                          whileTap={{ scale: 0.97 }}
                          className={`relative flex flex-col gap-2 p-3.5 rounded-xl text-left transition-all duration-150 ${
                            isSelected
                              ? `bg-gradient-to-br ${ct.color}`
                              : 'border border-slate-200 hover:border-slate-200'
                          }`}
                          style={
                            !isSelected
                              ? { background: '#f8fafc' }
                              : undefined
                          }
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="type-selected"
                              className="absolute inset-0 rounded-xl pointer-events-none"
                              style={{ boxShadow: '0 0 0 1.5px rgba(99,102,241,0.5) inset' }}
                            />
                          )}
                          <span className="text-[18px] leading-none">{ct.emoji}</span>
                          <div>
                            <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                              {ct.label}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{ct.description}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Check size={10} className="text-slate-800" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Business Details */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3">
                    Business Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Business Name */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium mb-1 block">
                        Business Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Smile Dental Clinic"
                        value={form.businessName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, businessName: e.target.value }))
                        }
                        className="w-full text-[13px] text-slate-800 placeholder-slate-400 outline-none rounded-xl px-3.5 py-2.5 transition-all duration-150 bg-white border border-slate-200"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      />
                    </div>
                    {/* City */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium mb-1 block">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Patna, Mumbai"
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        className="w-full text-[13px] text-slate-800 placeholder-slate-400 outline-none rounded-xl px-3.5 py-2.5 transition-all duration-150 bg-white border border-slate-200"
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      />
                    </div>
                    {/* Industry */}
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-medium mb-1 block">
                        Industry
                      </label>
                      <select
                        value={form.industry}
                        onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                        className="w-full text-[13px] text-slate-800 outline-none rounded-xl px-3.5 py-2.5 transition-all duration-150 cursor-pointer bg-white border border-slate-200"
                      >
                        <option value="" disabled>
                          Select Industry
                        </option>
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Offer Description */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5">
                    Offer Description
                  </label>
                  
                  {/* Dentist Presets Row */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold self-center mr-1">CLINIC PRESETS:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          name: 'Scaling Nudge (Hinglish)',
                          segment: 'no-visit-6m',
                          type: 'reactivation',
                          offerDescription: 'Scaling & Polishing deal: 6 mahine checkup overdue. Prevent tartar & bleeding gums. Standard charge: ₹1,000. Clean teeth, fresh breath!'
                        }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-650 transition-all cursor-pointer"
                    >
                      🦷 Scaling & Gums (Hinglish)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          name: 'Urgent RCT Crown Pending Nudge',
                          segment: 'lapsed-rct',
                          type: 'reactivation',
                          offerDescription: 'Urgent Cap/Crown follow-up: Sitting completed but Cap/Crown is pending trial. Avoid tooth fracture. Metal-ceramic starts ₹3,000, premium Zirconia ₹8,000.'
                        }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-650 transition-all cursor-pointer"
                    >
                      👑 Cap/Crown Pending (Hinglish)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          name: 'Whitening cosmetic offer',
                          segment: 'whitening',
                          type: 'festival',
                          offerDescription: 'Teeth Whitening special package: get 20% off laser whitening. Original price ₹12,000, now only ₹9,600! Single sitting 60 min.'
                        }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-650 transition-all cursor-pointer"
                    >
                      ✨ Teeth Whitening Promo
                    </button>
                  </div>

                  <textarea
                    placeholder="e.g. 20% off teeth whitening this month, valid till 30th June"
                    value={form.offerDescription}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, offerDescription: e.target.value }))
                    }
                    rows={3}
                    className="w-full text-[13px] text-slate-800 placeholder-slate-400 outline-none rounded-xl px-4 py-3 resize-none transition-all duration-150 bg-white border border-slate-200"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  />
                </div>

                {/* Audience Segment */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3">
                    Target Audience Segment
                  </label>
                  <div className="flex flex-col gap-2">
                    {SEGMENTS.map((seg) => {
                      const isSelected = form.segment === seg.id;
                      return (
                        <motion.button
                          key={seg.id}
                          onClick={() => setForm((f) => ({ ...f, segment: seg.id }))}
                          whileTap={{ scale: 0.99 }}
                          className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-150"
                          style={{
                            background: isSelected
                              ? 'rgba(99,102,241,0.1)'
                              : 'rgba(255,255,255,0.025)',
                            border: isSelected
                              ? '1px solid rgba(99,102,241,0.35)'
                              : '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-150"
                              style={{
                                borderColor: isSelected
                                  ? '#6366f1'
                                  : 'rgba(255,255,255,0.18)',
                                background: isSelected ? '#6366f1' : 'transparent',
                              }}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p
                                className={`text-[13px] font-medium leading-none ${
                                  isSelected ? 'text-slate-800' : 'text-slate-800/65'
                                }`}
                              >
                                {seg.label}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{seg.description}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <span
                              className={`text-[15px] font-black ${
                                isSelected ? 'text-indigo-600' : 'text-slate-400'
                              }`}
                            >
                              {seg.count}
                            </span>
                            <p className="text-[9px] text-slate-400">customers</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Expected reach */}
                  <AnimatePresence>
                    {selectedSegment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                          style={{
                            background: 'rgba(16,185,129,0.07)',
                            border: '1px solid rgba(16,185,129,0.18)',
                          }}
                        >
                          <Users size={14} className="text-emerald-700 flex-shrink-0" />
                          <span className="text-[13px] text-emerald-300 font-medium">
                            <strong>{selectedSegment.count} customers</strong> will receive this
                            campaign
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Next button */}
                <motion.button
                  onClick={goNext}
                  disabled={!canAdvanceStep1}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-semibold text-[14px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canAdvanceStep1
                      ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                      : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    boxShadow: canAdvanceStep1
                      ? '0 8px 32px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2)'
                      : 'none',
                  }}
                >
                  <Sparkles size={16} />
                  Next: Generate Messages
                  <ChevronRight size={16} />
                </motion.button>
              </div>

              {/* Right Panel — Preview */}
              <div className="col-span-1">
                <CampaignPreviewCard
                  form={form}
                  selectedSegment={selectedSegment}
                  selectedType={selectedType}
                />
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: GENERATE MESSAGES ══════════════════════════ */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="pb-6"
            >
              {/* AI Generation Header */}
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex items-center gap-3 flex-1 px-5 py-4 rounded-2xl"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <motion.div
                    animate={!generatingDone ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      !generatingDone
                        ? { duration: 2, repeat: Infinity, ease: 'linear' }
                        : { duration: 0.3 }
                    }
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: generatingDone
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(99,102,241,0.2)',
                      border: generatingDone
                        ? '1px solid rgba(16,185,129,0.3)'
                        : '1px solid rgba(99,102,241,0.35)',
                    }}
                  >
                    {generatingDone ? (
                      <Check size={16} className="text-emerald-700" />
                    ) : (
                      <Sparkles size={16} className="text-indigo-600" />
                    )}
                  </motion.div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-800">
                      {generatingDone
                        ? '✅ All 3 messages generated!'
                        : 'AI is generating your campaign messages...'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {generatingDone
                        ? 'Review, edit, and approve before broadcast'
                        : `Crafting personalized WhatsApp messages for ${totalCustomers} customers`}
                    </p>
                  </div>
                </div>

                {/* Campaign tag */}
                <div
                  className="flex-shrink-0 px-4 py-3 rounded-2xl"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                    Campaign
                  </p>
                  <p className="text-[13px] font-semibold text-slate-800">
                    {form.name || 'My Campaign'}
                  </p>
                  {selectedType && (
                    <span className="text-[11px] text-indigo-600">{selectedType.emoji} {selectedType.label}</span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex flex-col gap-4 mb-6">
                {generatedMessages.map((msg, idx) => {
                  const shouldShow = generatingStep > idx;
                  return shouldShow ? (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      index={idx}
                      startDelay={300}
                    />
                  ) : (
                    <motion.div
                      key={`placeholder-${idx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl p-5"
                      style={{
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px dashed rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <Clock size={13} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-slate-400">
                            {generatedMessages[idx]?.label}
                          </p>
                          <p className="text-[10px] text-slate-800/15 mt-0.5">Generating...</p>
                        </div>
                        {/* Shimmer indicator */}
                        <div className="ml-auto flex gap-1">
                          {[0, 1, 2].map((dot) => (
                            <motion.div
                              key={dot}
                              animate={{ opacity: [0.2, 0.7, 0.2] }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: dot * 0.2,
                              }}
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Nav Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-[13px] transition-all duration-150"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  <ChevronLeft size={15} />
                  Back
                </button>

                <motion.button
                  onClick={goNext}
                  disabled={!generatingDone}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-[14px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: generatingDone
                      ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                      : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    boxShadow: generatingDone
                      ? '0 8px 32px rgba(99,102,241,0.3)'
                      : 'none',
                  }}
                >
                  <Check size={16} />
                  Approve & Continue to Broadcast
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: BROADCAST CONSOLE ══════════════════════════ */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-6"
            >
              {/* Left — Contact selection + settings */}
              <div className="col-span-2 flex flex-col gap-4">
                {/* Contact List */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {/* Table Header */}
                  <div
                    className="flex items-center justify-between px-5 py-3.5"
                    style={{ borderBottom: '1px solid #e2e8f0' }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleAll}
                        className="flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {selectedCustomers.size === MOCK_CUSTOMERS.length ? (
                          <CheckSquare size={15} className="text-indigo-600" />
                        ) : (
                          <Square size={15} className="text-slate-400" />
                        )}
                        {selectedCustomers.size === MOCK_CUSTOMERS.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                      <div className="h-3 w-px bg-slate-100" />
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-indigo-600" />
                        <span className="text-[12px] font-semibold text-slate-800">
                          {selectedCustomers.size}{' '}
                          <span className="text-slate-500 font-normal">
                            of {MOCK_CUSTOMERS.length} selected
                          </span>
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {selectedSegment?.label ?? 'All Customers'}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {MOCK_CUSTOMERS.map((customer) => {
                      const isSelected = selectedCustomers.has(customer.id);
                      return (
                        <motion.div
                          key={customer.id}
                          onClick={() => toggleCustomer(customer.id)}
                          whileTap={{ scale: 0.995 }}
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all duration-100 select-none"
                          style={{
                            background: isSelected
                              ? 'rgba(99,102,241,0.05)'
                              : 'transparent',
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150"
                            style={{
                              border: isSelected
                                ? '1.5px solid #6366f1'
                                : '1.5px solid rgba(255,255,255,0.2)',
                              background: isSelected ? '#6366f1' : 'transparent',
                            }}
                          >
                            {isSelected && <Check size={10} className="text-slate-800" />}
                          </div>

                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                            style={{
                              background: 'rgba(99,102,241,0.15)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              color: '#a5b4fc',
                            }}
                          >
                            {customer.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>

                          {/* Name + phone */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 leading-none">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              {customer.phone}
                            </p>
                          </div>

                          {/* City */}
                          <span className="text-[11px] text-slate-400 w-20 text-center">
                            {customer.city}
                          </span>

                          {/* Status */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border w-20 text-center ${statusColor[customer.status]}`}
                          >
                            {customer.status}
                          </span>

                          {/* Last visit */}
                          <span className="text-[11px] text-slate-400 w-28 text-right">
                            {customer.lastVisit}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Broadcast Settings */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-4">
                    Broadcast Settings
                  </p>

                  {/* Schedule */}
                  <div className="mb-4">
                    <label className="text-[11px] text-slate-400 font-medium mb-2 block">
                      Schedule
                    </label>
                    <div className="flex gap-2">
                      {(['now', 'later'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setScheduleType(type)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-150"
                          style={{
                            background:
                              scheduleType === type
                                ? 'rgba(99,102,241,0.15)'
                                : 'rgba(255,255,255,0.04)',
                            border:
                              scheduleType === type
                                ? '1px solid rgba(99,102,241,0.35)'
                                : '1px solid rgba(255,255,255,0.08)',
                            color:
                              scheduleType === type ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {type === 'now' ? (
                            <>
                              <Zap size={12} /> Send Now
                            </>
                          ) : (
                            <>
                              <Calendar size={12} /> Schedule for Later
                            </>
                          )}
                        </button>
                      ))}
                    </div>

                    {scheduleType === 'later' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <input
                          type="datetime-local"
                          className="text-[13px] text-slate-800 outline-none rounded-xl px-4 py-2.5 transition-all duration-150"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            colorScheme: 'dark',
                          }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Template preview */}
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium mb-2 block">
                      WhatsApp Template
                    </label>
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.15)',
                      }}
                    >
                      <MessageCircle size={15} className="text-emerald-700 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-emerald-300">
                          reactivation_v1_hi_IN
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          Hi {'{{'} Name {'}}'} 👋 We miss you at Smile Dental...
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 border border-emerald-200 flex-shrink-0">
                        APPROVED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Broadcast Button */}
                <div>
                  {!broadcastDone ? (
                    <motion.button
                      onClick={handleBroadcast}
                      disabled={broadcasting || selectedCustomers.size === 0}
                      whileTap={{ scale: 0.98 }}
                      className="relative w-full py-4 rounded-2xl font-bold text-[15px] overflow-hidden transition-all duration-200 disabled:opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                        boxShadow:
                          broadcasting || selectedCustomers.size === 0
                            ? 'none'
                            : '0 12px 40px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3)',
                        color: 'white',
                      }}
                    >
                      {/* Progress fill */}
                      {broadcasting && (
                        <motion.div
                          className="absolute inset-0 origin-left"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                            scaleX: broadcastProgress / 100,
                          }}
                        />
                      )}

                      <span className="relative z-10 flex items-center justify-center gap-2.5">
                        {broadcasting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <RefreshCw size={16} />
                            </motion.div>
                            Sending... {sendingCount}/{selectedCustomers.size}
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Broadcast to {selectedCustomers.size} Customers
                            <Zap size={14} className="text-indigo-600" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-3 py-4 rounded-2xl"
                      style={{
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.15)',
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={16} className="text-slate-800" />
                      </div>
                      <span className="text-[15px] font-bold text-emerald-300">
                        Broadcast Complete! {stats.sent} messages sent ✨
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Back button */}
                <button
                  onClick={goBack}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-[13px] transition-all duration-150"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <ChevronLeft size={14} />
                  Back to Messages
                </button>
              </div>

              {/* Right — Campaign preview + delivery stats */}
              <div className="col-span-1 flex flex-col gap-4">
                {/* Campaign summary */}
                <CampaignPreviewCard
                  form={form}
                  selectedSegment={selectedSegment}
                  selectedType={selectedType}
                />

                {/* Delivery Tracking */}
                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="rounded-2xl p-5"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={13} className="text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
                          Delivery Tracking
                        </span>
                        {/* Live indicator */}
                        <div className="ml-auto flex items-center gap-1.5">
                          <div className="relative w-1.5 h-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                          </div>
                          <span className="text-[9px] text-emerald-700 font-bold tracking-wider">
                            LIVE
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Sent */}
                        <StatCard
                          label="Sent"
                          value={stats.sent}
                          icon={Send}
                          color="blue"
                          delay={0}
                        />
                        {/* Delivered */}
                        <StatCard
                          label="Delivered"
                          value={stats.delivered}
                          icon={Check}
                          color="indigo"
                          delay={0.3}
                        />
                        {/* Read */}
                        <StatCard
                          label="Read"
                          value={stats.read}
                          icon={Eye}
                          color="emerald"
                          delay={0.6}
                        />
                        {/* Replied */}
                        <StatCard
                          label="Replied"
                          value={stats.replied}
                          icon={MessageSquare}
                          color="amber"
                          delay={0.9}
                        />
                      </div>

                      {/* Open rate bar */}
                      {stats.read > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                          className="mt-4"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Open Rate
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700">
                              {Math.round((stats.read / stats.sent) * 100)}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.06)' }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.round((stats.read / stats.sent) * 100)}%`,
                              }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: 1.6 }}
                              className="h-full rounded-full"
                              style={{
                                background:
                                  'linear-gradient(90deg, #10b981, #34d399)',
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Stat Card Sub-component ──────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'indigo' | 'emerald' | 'amber';
  delay: number;
}

const colorMap = {
  blue: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.18)',
    icon: 'text-blue-700',
    value: 'text-blue-300',
  },
  indigo: {
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.18)',
    icon: 'text-indigo-600',
    value: 'text-indigo-600',
  },
  emerald: {
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.18)',
    icon: 'text-emerald-700',
    value: 'text-emerald-300',
  },
  amber: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.18)',
    icon: 'text-amber-700',
    value: 'text-amber-300',
  },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, delay }) => {
  const c = colorMap[color];
  const [prevValue, setPrevValue] = useState(0);

  useEffect(() => {
    if (value > 0) {
      const timer = setTimeout(() => setPrevValue(value), 50);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl p-3.5 flex flex-col gap-1.5"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <Icon size={12} className={c.icon} />
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className={`text-[22px] font-black leading-none ${c.value}`}>
        {value > 0 ? (
          <CountUp start={0} end={value} duration={1.4} delay={delay + 0.1} />
        ) : (
          <span className="text-slate-800/15">—</span>
        )}
      </div>
    </motion.div>
  );
};

export default ReactivationCampaigns;

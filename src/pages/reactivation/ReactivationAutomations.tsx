import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Edit2,
  Pause,
  Play,
  Trash2,
  ChevronRight,
  ChevronDown,
  Clock,
  Calendar,
  MessageSquare,
  Star,
  Gift,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BrainCircuit,
  Send,
  BarChart3,
  X,
  ChevronLeft,
  Layers,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  IndianRupee,
  TrendingUp,
  Timer,
  Sparkles,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutomationStat {
  triggeredCount: number;
  lastRun: string;
  responseCount?: number;
  revenue?: number;
  reviewsCollected?: number;
  converted?: number;
  redeemed?: number;
  reBooked?: number;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  accentColor: string;
  trigger: string;
  conditions?: string[];
  action: string;
  frequency: string;
  status: 'active' | 'paused';
  stats: AutomationStat;
  category: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface WizardState {
  trigger: string;
  triggerDays: number;
  conditions: string[];
  action: string;
  campaign: string;
  frequency: string;
  name: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AUTOMATIONS: Automation[] = [
  {
    id: 'a1',
    name: "We Miss You Campaign",
    description: "Re-engage long-lost customers with a personalised outreach",
    icon: Clock,
    iconColor: 'text-amber-700',
    iconBg: 'bg-amber-500/15',
    accentColor: 'border-l-amber-500',
    trigger: 'Last visit > 180 days',
    action: "Send 'We miss you at [Clinic Name]' WhatsApp campaign",
    frequency: 'Once per customer',
    status: 'active',
    category: 'Re-engagement',
    stats: {
      triggeredCount: 143,
      lastRun: '2 hours ago',
      responseCount: 23,
      revenue: 54200,
    },
  },
  {
    id: 'a2',
    name: "Missed Appointment Follow-Up",
    description: "Recover no-shows before they slip away forever",
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    accentColor: 'border-l-rose-500',
    trigger: 'Appointment missed (no-show)',
    conditions: ['Not re-scheduled within 48 hours'],
    action: 'Send follow-up reminder + rescheduling link',
    frequency: 'Next day after missed appointment',
    status: 'active',
    category: 'Recovery',
    stats: {
      triggeredCount: 19,
      lastRun: '1 day ago',
      reBooked: 11,
      revenue: 28600,
    },
  },
  {
    id: 'a3',
    name: "Google Review Request",
    description: "Turn happy patients into public advocates automatically",
    icon: Star,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/15',
    accentColor: 'border-l-yellow-500',
    trigger: 'Treatment completed',
    conditions: ['No review submitted in 7 days'],
    action: 'Send review request message with Google link',
    frequency: '24 hours after treatment completion',
    status: 'active',
    category: 'Reputation',
    stats: {
      triggeredCount: 67,
      lastRun: '3 hours ago',
      reviewsCollected: 31,
    },
  },
  {
    id: 'a4',
    name: "Aligner Compliance Check",
    description: "Remind clear aligner patients to submit their bi-weekly compliance scan",
    icon: RefreshCw,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    accentColor: 'border-l-violet-500',
    trigger: 'Aligner tray change due in 2 days',
    action: 'Send reminder to capture teeth scan in app',
    frequency: 'Bi-weekly during treatment course',
    status: 'paused',
    category: 'Compliance',
    stats: {
      triggeredCount: 28,
      lastRun: '1 day ago',
      responseCount: 16,
      revenue: 32000,
    },
  },
  {
    id: 'a5',
    name: "Birthday Offer",
    description: "Delight customers on their special day with an exclusive deal",
    icon: Gift,
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    accentColor: 'border-l-pink-500',
    trigger: "Customer's birthday is in 3 days",
    action: 'Send birthday discount offer',
    frequency: 'Once per year per customer',
    status: 'active',
    category: 'Loyalty',
    stats: {
      triggeredCount: 12,
      lastRun: '6 hours ago',
      redeemed: 8,
    },
  },
];

const FLOW_STEPS = [
  { icon: Zap, label: 'TRIGGER', color: 'text-amber-700', bg: 'bg-amber-500/15', border: 'border-amber-200' },
  { icon: Filter, label: 'CONDITION CHECK', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  { icon: BrainCircuit, label: 'AI MESSAGE GENERATION', color: 'text-indigo-600', bg: 'bg-indigo-500/15', border: 'border-indigo-200' },
  { icon: Send, label: 'WHATSAPP SEND', color: 'text-emerald-700', bg: 'bg-emerald-500/15', border: 'border-emerald-200' },
  { icon: BarChart3, label: 'TRACK RESPONSE', color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
];

const TRIGGER_OPTIONS = [
  { value: 'last_visit', label: 'Last visit > X days', icon: Clock },
  { value: 'appointment_missed', label: 'Appointment missed', icon: AlertCircle },
  { value: 'treatment_completed', label: 'Treatment completed', icon: CheckCircle2 },
  { value: 'membership_expiring', label: 'Membership expiring', icon: RefreshCw },
  { value: 'birthday', label: 'Birthday approaching', icon: Gift },
  { value: 'new_customer', label: 'New customer (first visit)', icon: UserCheck },
  { value: 'custom_keyword', label: 'Custom keyword in chat', icon: MessageSquare },
];

const CONDITION_OPTIONS = [
  'Not re-scheduled within 48 hours',
  'No review submitted in 7 days',
  'Has not purchased in last 30 days',
  'Tagged as high-value customer',
  'Visited more than 3 times',
  'Opted in for promotions',
];

const ACTION_OPTIONS = [
  { value: 'send_campaign', label: 'Send WhatsApp campaign', icon: MessageSquare },
  { value: 'notify_team', label: 'Notify team via WhatsApp', icon: Send },
  { value: 'add_segment', label: 'Add to segment', icon: Layers },
  { value: 'change_status', label: 'Change customer status', icon: UserCheck },
];

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Once per customer' },
  { value: 'every_x', label: 'Every X days' },
  { value: 'every_occurrence', label: 'Every occurrence' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: 'active' | 'paused' }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
      status === 'active'
        ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-200'
        : 'bg-amber-500/15 text-amber-700 border border-amber-200'
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
      }`}
    />
    {status === 'active' ? 'Active' : 'Paused'}
  </span>
);

const TriggerPill: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-300 border border-amber-500/25 text-[11px] font-semibold">
    <Zap size={9} className="flex-shrink-0" />
    {text}
  </span>
);

const ActionPill: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 text-[11px] font-semibold">
    <ArrowRight size={9} className="flex-shrink-0" />
    {text}
  </span>
);

const ConditionPill: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-medium">
    <span className="text-[9px] font-bold text-violet-400">AND</span>
    {text}
  </span>
);

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

const ToggleSwitch: React.FC<{
  active: boolean;
  onChange: () => void;
}> = ({ active, onChange }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    className={`relative w-10 h-5 rounded-full transition-all duration-200 focus:outline-none ${
      active ? 'bg-emerald-500' : 'bg-slate-100'
    }`}
  >
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm ${
        active ? 'left-5' : 'left-0.5'
      }`}
    />
  </button>
);

// ─── Automation Card ──────────────────────────────────────────────────────────

interface AutomationCardProps {
  automation: Automation;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const AutomationCard: React.FC<AutomationCardProps> = ({
  automation,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
}) => {
  const Icon = automation.icon;
  const isActive = automation.status === 'active';

  return (
    <motion.div
      layout
      whileHover={{ x: 2 }}
      onClick={onSelect}
      className={`relative cursor-pointer rounded-xl border-l-[3px] border border-slate-200 transition-all duration-200 ${automation.accentColor} ${
        isSelected
          ? 'bg-white/[0.06] ring-1 ring-indigo-500/30'
          : 'bg-slate-50 hover:bg-slate-50'
      }`}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${automation.iconBg}`}>
            <Icon size={18} className={automation.iconColor} />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h3 className="text-[14px] font-semibold text-slate-800 leading-tight">{automation.name}</h3>
              <StatusPill status={automation.status} />
              <span className="text-[9px] font-bold tracking-widest text-slate-400 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
                {automation.category.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">{automation.description}</p>
          </div>

          {/* Toggle */}
          <ToggleSwitch active={isActive} onChange={onToggle} />
        </div>

        {/* IF / THEN */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest w-6 pt-0.5">IF</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <TriggerPill text={automation.trigger} />
              {automation.conditions?.map((c, i) => (
                <ConditionPill key={i} text={c} />
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest w-6 pt-0.5">THEN</span>
            <ActionPill text={automation.action} />
          </div>
          <div className="flex items-center gap-1.5 ml-8">
            <Clock size={10} className="text-slate-400" />
            <span className="text-[10px] text-slate-400">{automation.frequency}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Zap size={11} className="text-amber-700" />
              <span className="text-[11px] text-slate-500">
                Triggered <span className="text-slate-700 font-semibold">{automation.stats.triggeredCount}</span> times
              </span>
            </div>
            {automation.stats.revenue && (
              <div className="flex items-center gap-1.5">
                <IndianRupee size={11} className="text-emerald-700" />
                <span className="text-[11px] font-semibold text-emerald-700">
                  ₹{automation.stats.revenue.toLocaleString('en-IN')} revenue
                </span>
              </div>
            )}
            {automation.stats.reviewsCollected && (
              <div className="flex items-center gap-1.5">
                <Star size={11} className="text-yellow-400" />
                <span className="text-[11px] font-semibold text-yellow-400">
                  {automation.stats.reviewsCollected} reviews
                </span>
              </div>
            )}
            {automation.stats.reBooked && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-sky-400" />
                <span className="text-[11px] font-semibold text-sky-400">
                  {automation.stats.reBooked} re-booked
                </span>
              </div>
            )}
            {automation.stats.converted && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-400">
                  {automation.stats.converted} converted
                </span>
              </div>
            )}
            {automation.stats.redeemed && (
              <div className="flex items-center gap-1.5">
                <Gift size={11} className="text-pink-400" />
                <span className="text-[11px] font-semibold text-pink-400">
                  {automation.stats.redeemed} redeemed
                </span>
              </div>
            )}
            <span className="text-[10px] text-slate-400">Last run: {automation.stats.lastRun}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-white/[0.06] transition-all duration-150">
              <Edit2 size={12} />
              Edit
            </button>
            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-white/[0.06] transition-all duration-150"
            >
              {isActive ? <Pause size={12} /> : <Play size={12} />}
              {isActive ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all duration-150"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Flow Diagram ─────────────────────────────────────────────────────────────

const FlowDiagram: React.FC<{ selectedAutomation: Automation | null }> = ({ selectedAutomation }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="rounded-2xl border border-slate-200 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.02) 0%, rgba(255,255,255,1) 100%)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2.5">
        <BrainCircuit size={16} className="text-indigo-600" />
        <span className="text-[13px] font-semibold text-slate-700">Automation Flow</span>
        {selectedAutomation && (
          <span className="ml-2 text-[11px] text-slate-400">— {selectedAutomation.name}</span>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
          {FLOW_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: 'easeOut' }}
                  className="flex-shrink-0 flex flex-col items-center gap-2.5"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${step.bg} ${step.border}`}
                  >
                    <StepIcon size={20} className={step.color} />
                  </div>
                  <span className={`text-[9px] font-bold tracking-wider text-center leading-tight ${step.color} max-w-[72px]`}>
                    {step.label}
                  </span>
                </motion.div>

                {/* Animated dashed arrow connector */}
                {i < FLOW_STEPS.length - 1 && (
                  <div className="flex-shrink-0 flex items-center mx-1" style={{ marginBottom: '22px' }}>
                    <div className="relative w-12 h-[2px]">
                      {/* Static dashed line */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)',
                        }}
                      />
                      {/* Animated traveling dot */}
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400"
                        style={{ left: 0 }}
                        animate={{ left: ['0%', '100%'] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: i * 0.25,
                        }}
                      />
                    </div>
                    <ChevronRight size={12} className="text-slate-400 -ml-1" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Context description */}
        {selectedAutomation && (
          <motion.div
            key={selectedAutomation.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 text-center"
          >
            <div>
              <p className="text-[10px] text-slate-400 mb-1">When</p>
              <p className="text-[11px] font-medium text-amber-500 leading-tight">{selectedAutomation.trigger}</p>
            </div>
            <div className="hidden md:flex items-start justify-center pt-3">
              <ChevronRight size={12} className="text-slate-800/15" />
            </div>
            <div className="flex md:hidden items-center justify-center -my-1.5">
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">AI checks</p>
              <p className="text-[11px] font-medium text-indigo-600 leading-tight">
                {selectedAutomation.conditions?.[0] ?? 'No additional conditions'}
              </p>
            </div>
            <div className="hidden md:flex items-start justify-center pt-3">
              <ChevronRight size={12} className="text-slate-800/15" />
            </div>
            <div className="flex md:hidden items-center justify-center -my-1.5">
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Then sends</p>
              <p className="text-[11px] font-medium text-emerald-600 leading-tight">{selectedAutomation.action}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Create Automation Modal ───────────────────────────────────────────────────

const STEP_LABELS = ['Trigger', 'Conditions', 'Action', 'Frequency', 'Review'];

const CreateAutomationModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardState>({
    trigger: '',
    triggerDays: 90,
    conditions: [],
    action: '',
    campaign: '',
    frequency: 'once',
    name: '',
  });

  const handleNext = () => {
    if (step < 5) setStep((s) => (s + 1) as WizardStep);
  };
  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  const toggleCondition = (c: string) => {
    setForm((f) => ({
      ...f,
      conditions: f.conditions.includes(c)
        ? f.conditions.filter((x) => x !== c)
        : [...f.conditions, c],
    }));
  };

  const canProceed = () => {
    if (step === 1) return form.trigger !== '';
    if (step === 3) return form.action !== '';
    if (step === 4) return form.frequency !== '';
    if (step === 5) return form.name.trim() !== '';
    return true;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(4,6,12,0.75)', backdropFilter: 'blur(8px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-full max-w-xl rounded-2xl border border-slate-200 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0F1628 0%, #0A0F1C 100%)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                pointerEvents: 'auto',
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                    <Zap size={15} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-800">Create Automation</h2>
                    <p className="text-[11px] text-slate-400">Step {step} of 5 — {STEP_LABELS[step - 1]}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step progress */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  {STEP_LABELS.map((label, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                            i + 1 < step
                              ? 'bg-indigo-500 text-slate-800'
                              : i + 1 === step
                              ? 'bg-indigo-50 border border-indigo-500/50 text-indigo-600'
                              : 'bg-slate-50 border border-slate-200 text-slate-400'
                          }`}
                        >
                          {i + 1 < step ? <CheckCircle2 size={12} /> : i + 1}
                        </div>
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div
                          className={`flex-1 h-[1px] transition-all duration-300 ${
                            i + 1 < step ? 'bg-indigo-500' : 'bg-white/[0.07]'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex mt-1">
                  {STEP_LABELS.map((label, i) => (
                    <div key={i} className="flex-1 text-center first:text-left last:text-right">
                      <span className={`text-[9px] font-medium tracking-wide ${i + 1 === step ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div className="p-6 min-h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step 1: Trigger */}
                    {step === 1 && (
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 mb-1">Choose a trigger</p>
                        <p className="text-[11px] text-slate-500 mb-4">What event should start this automation?</p>
                        <div className="grid grid-cols-1 gap-2">
                          {TRIGGER_OPTIONS.map((t) => {
                            const TIcon = t.icon;
                            const selected = form.trigger === t.value;
                            return (
                              <button
                                key={t.value}
                                onClick={() => setForm((f) => ({ ...f, trigger: t.value }))}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                                  selected
                                    ? 'border-indigo-500/50 bg-indigo-50 text-slate-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <TIcon size={15} className={selected ? 'text-indigo-600' : 'text-current'} />
                                <span className="text-[12px] font-medium">{t.label}</span>
                                {selected && (
                                  <CheckCircle2 size={14} className="text-indigo-600 ml-auto" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {form.trigger === 'last_visit' && (
                          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[12px] font-medium text-slate-700">Days since last visit</span>
                              <span className="text-[14px] font-bold text-amber-700">{form.triggerDays} days</span>
                            </div>
                            <input
                              type="range"
                              min={30}
                              max={365}
                              step={10}
                              value={form.triggerDays}
                              onChange={(e) => setForm((f) => ({ ...f, triggerDays: +e.target.value }))}
                              className="w-full accent-indigo-500"
                            />
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-slate-400">30 days</span>
                              <span className="text-[10px] text-slate-400">365 days</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2: Conditions */}
                    {step === 2 && (
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 mb-1">Add conditions <span className="text-slate-400 font-normal">(optional)</span></p>
                        <p className="text-[11px] text-slate-500 mb-4">Refine who this automation applies to</p>
                        <div className="grid grid-cols-1 gap-2">
                          {CONDITION_OPTIONS.map((c) => {
                            const selected = form.conditions.includes(c);
                            return (
                              <button
                                key={c}
                                onClick={() => toggleCondition(c)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                                  selected
                                    ? 'border-violet-500/50 bg-violet-500/10 text-slate-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                    selected ? 'bg-violet-500 border-violet-500' : 'border-slate-200'
                                  }`}
                                >
                                  {selected && <CheckCircle2 size={10} className="text-slate-800" />}
                                </div>
                                <span className="text-[12px] font-medium">{c}</span>
                              </button>
                            );
                          })}
                        </div>
                        {form.conditions.length === 0 && (
                          <p className="text-center text-[11px] text-slate-400 mt-4">No conditions selected — automation runs for all matching triggers</p>
                        )}
                      </div>
                    )}

                    {/* Step 3: Action */}
                    {step === 3 && (
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 mb-1">Choose an action</p>
                        <p className="text-[11px] text-slate-500 mb-4">What should happen when the trigger fires?</p>
                        <div className="grid grid-cols-1 gap-2">
                          {ACTION_OPTIONS.map((a) => {
                            const AIcon = a.icon;
                            const selected = form.action === a.value;
                            return (
                              <button
                                key={a.value}
                                onClick={() => setForm((f) => ({ ...f, action: a.value }))}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                                  selected
                                    ? 'border-indigo-500/50 bg-indigo-50 text-slate-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <AIcon size={15} className={selected ? 'text-indigo-600' : 'text-current'} />
                                <span className="text-[12px] font-medium">{a.label}</span>
                                {selected && <CheckCircle2 size={14} className="text-indigo-600 ml-auto" />}
                              </button>
                            );
                          })}
                        </div>
                        {form.action === 'send_campaign' && (
                          <div className="mt-4">
                            <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Select Campaign</label>
                            <select
                              value={form.campaign}
                              onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[12px] text-slate-800 focus:outline-none focus:border-indigo-500/50"
                            >
                              <option value="">— Select a campaign —</option>
                              <option value="c1">We Miss You Campaign</option>
                              <option value="c2">Diwali Festival Offer</option>
                              <option value="c3">Monsoon Wellness Package</option>
                              <option value="c4">New Year Special Discount</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Frequency */}
                    {step === 4 && (
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 mb-1">Set frequency</p>
                        <p className="text-[11px] text-slate-500 mb-4">How often should this automation trigger per customer?</p>
                        <div className="grid grid-cols-1 gap-2">
                          {FREQUENCY_OPTIONS.map((f) => {
                            const selected = form.frequency === f.value;
                            return (
                              <button
                                key={f.value}
                                onClick={() => setForm((frm) => ({ ...frm, frequency: f.value }))}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                                  selected
                                    ? 'border-indigo-500/50 bg-indigo-50 text-slate-800'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                                  }`}
                                >
                                  {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-[12px] font-medium">{f.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {form.frequency === 'every_x' && (
                          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[12px] font-medium text-slate-700">Repeat every</span>
                              <span className="text-[14px] font-bold text-indigo-600">30 days</span>
                            </div>
                            <input
                              type="range"
                              min={7}
                              max={180}
                              step={7}
                              defaultValue={30}
                              className="w-full accent-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 5: Review & Activate */}
                    {step === 5 && (
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 mb-1">Name & activate</p>
                        <p className="text-[11px] text-slate-500 mb-4">Give your automation a name and review the summary</p>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Win-back 90-day lapsed patients"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 mb-4"
                        />
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest w-16 pt-0.5">TRIGGER</span>
                            <TriggerPill text={
                              TRIGGER_OPTIONS.find(t => t.value === form.trigger)?.label ?? form.trigger
                            } />
                          </div>
                          {form.conditions.length > 0 && (
                            <div className="flex items-start gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 tracking-widest w-16 pt-0.5">CONDITIONS</span>
                              <div className="flex flex-wrap gap-1.5">
                                {form.conditions.map((c, i) => <ConditionPill key={i} text={c} />)}
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest w-16 pt-0.5">ACTION</span>
                            <ActionPill text={
                              ACTION_OPTIONS.find(a => a.value === form.action)?.label ?? form.action
                            } />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest w-16">FREQUENCY</span>
                            <span className="text-[11px] text-slate-500">
                              {FREQUENCY_OPTIONS.find(f => f.value === form.frequency)?.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium text-slate-500 hover:text-slate-700 disabled:opacity-0 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button
                  onClick={step === 5 ? onClose : handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-indigo-500 hover:bg-indigo-600 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {step === 5 ? (
                    <>
                      <Zap size={14} />
                      Activate Automation
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Performance Summary ───────────────────────────────────────────────────────

const PERF_STATS = [
  {
    icon: Zap,
    iconColor: 'text-amber-700',
    iconBg: 'bg-amber-500/15',
    label: 'Total triggered',
    value: '249',
    sub: 'Last 30 days',
  },
  {
    icon: MessageSquare,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-500/15',
    label: 'Messages sent automatically',
    value: '1,247',
    sub: 'Zero manual work',
  },
  {
    icon: IndianRupee,
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-500/15',
    label: 'Revenue from automations',
    value: '₹1,12,400',
    sub: 'Directly attributed',
  },
  {
    icon: Timer,
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
    label: 'Time saved',
    value: '~47 hrs',
    sub: 'Staff hours recovered',
  },
];

const PerformanceSummary: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
    className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm"
  >
    <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2.5">
      <Sparkles size={15} className="text-indigo-600" />
      <span className="text-[13px] font-semibold text-slate-700">Performance Summary</span>
      <span className="ml-1 text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">Last 30 days</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
      {PERF_STATS.map((s, i) => {
        const SIcon = s.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.06 }}
            className="p-5 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
              <SIcon size={16} className={s.iconColor} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-800 leading-none">{s.value}</p>
              <p className="text-[12px] font-medium text-slate-600 mt-1 leading-snug">{s.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ReactivationAutomations: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>(AUTOMATIONS);
  const [selectedId, setSelectedId] = useState<string | null>('a1');
  const [modalOpen, setModalOpen] = useState(false);

  const toggleStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a
      )
    );
  };

  const deleteAutomation = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedAutomation = automations.find((a) => a.id === selectedId) ?? null;

  const activeCount = automations.filter((a) => a.status === 'active').length;
  const pausedCount = automations.filter((a) => a.status === 'paused').length;

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as any } },
  };

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Automations</h1>
            <div className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-600 tracking-widest">IF/THEN</span>
            </div>
          </div>
          <p className="text-[13px] text-slate-500">Set it once — AI runs campaigns automatically</p>

          {/* Stats bar */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeCount} Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
              <Pause size={9} />
              {pausedCount} Paused
            </span>
            <span className="text-slate-400 text-[12px]">•</span>
            <span className="text-[11px] text-slate-500">
              <span className="text-slate-700 font-semibold">1,247</span> messages sent automatically
            </span>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-[13px] font-semibold text-slate-800 transition-all duration-150 shadow-lg shadow-indigo-500/25"
        >
          <Plus size={15} />
          Create Automation
        </button>
      </motion.div>

      {/* ── Automations List ───────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        <AnimatePresence>
          {automations.map((automation) => (
            <motion.div key={automation.id} variants={cardVariants} layout exit={{ opacity: 0, x: -20 }}>
              <AutomationCard
                automation={automation}
                isSelected={selectedId === automation.id}
                onSelect={() => setSelectedId(automation.id === selectedId ? null : automation.id)}
                onToggle={() => toggleStatus(automation.id)}
                onDelete={() => deleteAutomation(automation.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {automations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl border border-dashed border-slate-200"
          >
            <Zap size={36} className="text-slate-800/15 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-slate-400">No automations yet</p>
            <p className="text-[12px] text-slate-400 mt-1">Create your first IF/THEN rule to get started</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-200 text-indigo-600 text-[12px] font-semibold hover:bg-indigo-500/25 transition-all"
            >
              <Plus size={14} />
              Create Automation
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Automation Flow Diagram ────────────────────────────────── */}
      <FlowDiagram selectedAutomation={selectedAutomation} />

      {/* ── Performance Summary ────────────────────────────────────── */}
      <PerformanceSummary />

      {/* ── Create Modal ───────────────────────────────────────────── */}
      <CreateAutomationModal open={modalOpen} onClose={() => { setModalOpen(false); }} />
    </div>
  );
};

export default ReactivationAutomations;

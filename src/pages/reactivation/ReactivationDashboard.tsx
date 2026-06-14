import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  UserX,
  Megaphone,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  Target,
  MessageSquare,
  CalendarCheck,
  IndianRupee,
  Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KPICard {
  id: string;
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  subLabel?: string;
  icon: React.ElementType;
  colorClass: string;
  glowClass: string;
  borderClass: string;
  bgGradient: string;
  isHero?: boolean;
}

interface AIRecommendation {
  id: string;
  customerCount: number;
  insight: string;
  suggestedCampaign: string;
  urgency: 'high' | 'medium' | 'low';
  emoji: string;
}

interface CampaignRow {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'Draft';
  sent: number | null;
  revenue: number | null;
  timeAgo: string;
  category: string;
}

interface RevenueDataPoint {
  day: string;
  revenue: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// ─── Dynamic Data Computed Inside Component ───

const campaignRows: CampaignRow[] = [];
const revenueData: RevenueDataPoint[] = [];

// ─── Animation Variants ───────────────────────────────────────────────────────

// KPI card variants — used with staggerContainer, delay via CSS stagger
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Helper: Returns transition props for section fade-up with a custom delay
const sectionAnim = (delay: number) => ({
  initial: { opacity: 0, y: 24 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as any },
});

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: CampaignRow['status'] }> = ({ status }) => {
  const config = {
    Active: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    Completed: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
    Draft: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'Active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
};

// ─── Custom Tooltip for Chart ─────────────────────────────────────────────────

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-[11px] text-slate-500 mb-1">{label}</p>
        <p className="text-base font-bold text-indigo-600">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReactivationDashboard() {
  const { organizationId } = useSession();
  const clinicId = organizationId || '';
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;

    async function fetchDashboardPatients() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('dental_patients')
          .select('*')
          .eq('clinic_id', clinicId);

        if (error) throw error;

        if (data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            lastVisit: d.last_visit,
            service: d.service,
            totalSpend: Number(d.total_spend || 0),
            status: d.status,
            notes: d.notes,
            avatarColor: d.avatar_color,
            problemTeeth: d.problem_teeth || [],
            xrays: d.xrays || [],
            allergies: d.allergies || [],
            medicalConditions: d.medical_conditions || [],
            toothNotes: d.tooth_notes || {},
            toothConditions: d.tooth_conditions || {},
            vitals: d.vitals || {},
            activeProgramId: d.active_program_id,
            programEnrollmentDate: d.program_enrollment_date,
            programCurrentStep: d.program_current_step,
            programStatus: d.program_status,
            estimates: d.estimates || []
          }));
          setPatients(mapped);
        }
      } catch (err) {
        console.error('Error fetching dashboard patients:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardPatients();
  }, [clinicId]);

  // Calculate completely dynamic metrics based on actual patients in Supabase!
  const totalPatients = patients.length;
  const dueForRecheckup = patients.filter(c => c.status === 'Inactive' || c.status === 'Follow Up Needed').length;
  const activeFlows = patients.filter(c => c.programStatus === 'Active').length;
  const appointmentsRebooked = patients.filter(c => c.status === 'Active' || c.programStatus === 'Completed').reduce((sum, c) => sum + (c.totalSpend || 0), 0);

  const eightMonthsAgo = new Date();
  eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
  const overdueCount = patients.filter(c => new Date(c.lastVisit) < eightMonthsAgo).length;
  const consultNoBookCount = patients.filter(c => c.status === 'New Lead' || c.status === 'Follow Up Needed').length;

  const kpiCards: KPICard[] = [
    {
      id: 'total_customers',
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      colorClass: 'text-indigo-600',
      glowClass: 'shadow-indigo-500/20',
      borderClass: 'border-slate-200/80',
      bgGradient: 'from-indigo-500/10 to-indigo-500/5',
    },
    {
      id: 'inactive',
      title: 'Due for Recheckup',
      value: dueForRecheckup,
      subLabel: 'Needs follow-up',
      icon: UserX,
      colorClass: 'text-amber-600',
      glowClass: 'shadow-amber-500/20',
      borderClass: 'border-slate-200/80',
      bgGradient: 'from-amber-500/10 to-amber-500/5',
    },
    {
      id: 'campaigns',
      title: 'Active Follow-up Plans',
      value: activeFlows,
      icon: Megaphone,
      colorClass: 'text-emerald-600',
      glowClass: 'shadow-emerald-500/20',
      borderClass: 'border-slate-200/80',
      bgGradient: 'from-emerald-500/10 to-emerald-500/5',
    },
    {
      id: 'revenue',
      title: 'Bookings Rebooked',
      value: appointmentsRebooked,
      prefix: '₹',
      subLabel: 'This Month',
      icon: IndianRupee,
      colorClass: 'text-emerald-700',
      glowClass: 'shadow-emerald-400/30',
      borderClass: 'border-emerald-200',
      bgGradient: 'from-emerald-500/15 to-teal-500/10',
      isHero: true,
    },
  ];

  const aiRecommendations: AIRecommendation[] = [
    {
      id: 'rec_1',
      customerCount: overdueCount,
      insight: "patients haven't visited in 8+ months",
      suggestedCampaign: 'Recheckup Reminder',
      urgency: 'high',
      emoji: '🦷',
    },
    {
      id: 'rec_2',
      customerCount: consultNoBookCount,
      insight: 'patients had treatment consults but never booked',
      suggestedCampaign: 'Treatment Follow-Up',
      urgency: 'medium',
      emoji: '✨',
    },
    {
      id: 'rec_3',
      customerCount: 1,
      insight: 'patient birthday or anniversary is coming up — good time for a courtesy reminder',
      suggestedCampaign: 'Birthday Reminder',
      urgency: 'low',
      emoji: '🪔',
    },
  ];

  const handleGenerateCampaign = (id: string) => {
    setGeneratingId(id);
    setTimeout(() => setGeneratingId(null), 1800);
  };

  return (
    <div
      className="min-h-screen text-slate-800"
      style={{ background: '#F8FAFC' }}
    >
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-8 space-y-8">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.18em]">
                Dental CRM
            </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dental Patient CRM
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Patient records, follow-ups, and consultation notes in one place
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 0 24px rgba(99,102,241,0.35)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            New Follow-up Plan
          </motion.button>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — KPI Cards
        ═══════════════════════════════════════════════════════ */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpiCards.map((card, idx) => (
            <motion.div
              key={card.id}
              variants={cardVariant}
              className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 transition-all duration-300 group
                ${card.isHero
                  ? 'lg:col-span-1 border-emerald-200 shadow-emerald-50'
                  : `border-slate-200/80 shadow-slate-100/50`
                }
              `}
              style={{
                background: card.isHero
                  ? 'linear-gradient(135deg, rgba(209,250,229,0.4) 0%, rgba(204,251,241,0.2) 100%)'
                  : '#FFFFFF',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Background texture */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.02), transparent 60%)' }}
              />

              {/* Hero glow blob */}
              {card.isHero && (
                <div
                  className="absolute -right-4 -top-4 w-28 h-28 rounded-full blur-2xl opacity-20"
                  style={{ background: '#10B981' }}
                />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.colorClass}`}
                    style={{
                      background: card.isHero
                        ? 'rgba(16,185,129,0.1)'
                        : card.id === 'total_customers'
                        ? 'rgba(99,102,241,0.08)'
                        : card.id === 'inactive'
                        ? 'rgba(245,158,11,0.08)'
                        : 'rgba(16,185,129,0.08)',
                    }}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>

                  {card.isHero && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2 py-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      +18%
                    </span>
                  )}
                </div>

                <p className="text-[12px] font-medium text-slate-500 mb-1 tracking-wide">
                  {card.title}
                </p>

                <div className={`font-bold tracking-tight leading-none ${card.isHero ? 'text-4xl' : 'text-3xl'} ${card.colorClass}`}
                  style={{}}
                >
                  {card.prefix && <span className="text-2xl mr-0.5">{card.prefix}</span>}
                  <CountUp
                    end={card.value}
                    duration={2.0}
                    separator=","
                    useEasing
                  />
                  {card.suffix && <span className="text-2xl ml-0.5">{card.suffix}</span>}
                </div>

                {card.subLabel && (
                  <p className={`text-[12px] mt-2 font-medium ${card.isHero ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {card.subLabel}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — AI Recommendations Panel
        ═══════════════════════════════════════════════════════ */}
        <motion.div
          {...sectionAnim(0.4)}
        >
          {/* Panel header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping opacity-75" />
              </div>
              <h2 className="text-base font-bold text-slate-800">🤖 AI Recheckup Recommendations</h2>
            </div>
            <span className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 font-semibold">
              3 new
            </span>
          </div>

          <div className="space-y-3">
            {aiRecommendations.map((rec, idx) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.5 + idx * 0.1, ease: [0.22, 1, 0.36, 1] as any }}
                className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 rounded-2xl border border-slate-200/80 p-5 transition-all duration-300 hover:border-indigo-300 hover:shadow-md group overflow-hidden bg-white shadow-sm"
                style={{}}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl transition-all duration-300 group-hover:w-1"
                  style={{
                    background:
                      rec.urgency === 'high'
                        ? 'linear-gradient(to bottom, #6366F1, #8B5CF6)'
                        : rec.urgency === 'medium'
                        ? 'linear-gradient(to bottom, #6366F1, #6366F1)'
                        : 'linear-gradient(to bottom, #6366F1, #4F46E5)',
                  }}
                />

                {/* Customer count / emoji blob */}
                <div className="flex-shrink-0 text-left sm:text-center w-full sm:w-20">
                  {rec.customerCount > 0 ? (
                    <div className="flex sm:flex-col items-baseline sm:items-center gap-1.5 sm:gap-0">
                      <div className="text-3xl font-black text-slate-900 leading-none">
                        {rec.customerCount}
                      </div>
                      <div className="text-[10px] text-slate-500 sm:mt-0.5 font-medium">{rec.customerCount === 1 ? 'patient' : 'patients'}</div>
                    </div>
                  ) : (
                    <div className="text-3xl sm:text-4xl">{rec.emoji}</div>
                  )}
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-12 bg-slate-100 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-snug">
                    {rec.customerCount > 0 && (
                      <span className="text-slate-900 font-semibold">{rec.customerCount} {rec.customerCount === 1 ? 'patient' : 'patients'}</span>
                    )}{' '}
                    {rec.insight.replace(/^patients?\s+/i, '')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Target className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="text-[12px] text-indigo-600 font-medium truncate">
                      {rec.suggestedCampaign}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleGenerateCampaign(rec.id)}
                  className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200"
                  style={{
                    background:
                      generatingId === rec.id
                        ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
                        : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {generatingId === rec.id ? (
                      <motion.span
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="generate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Plan
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — Follow-up Activity + Revenue Chart
        ═══════════════════════════════════════════════════════ */}
        <motion.div
          {...sectionAnim(0.7)}
          className="grid grid-cols-1 lg:grid-cols-5 gap-5"
        >
          {/* LEFT — Recent Campaigns */}
          <div
            className="lg:col-span-3 rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-sm"
            style={{}}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Follow-up Activity</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Last 30 days across clinic records</p>
              </div>
              <button className="text-[12px] text-indigo-400 font-medium flex items-center gap-1 hover:text-indigo-300 transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Campaign rows */}
            <div className="divide-y divide-slate-100">
              {campaignRows.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.07, duration: 0.4 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Campaign icon */}
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-4 h-4 text-indigo-400" />
                  </div>

                  {/* Name + time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{campaign.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span className="text-[11px] text-slate-500">{campaign.timeAgo}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <StatusBadge status={campaign.status} />

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[11px] text-slate-500">Sent</p>
                      <p className="text-sm font-bold text-slate-700">
                        {campaign.sent != null ? campaign.sent.toLocaleString('en-IN') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Revenue</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {campaign.revenue != null
                          ? `₹${campaign.revenue.toLocaleString('en-IN')}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <Eye className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — Revenue Sparkline */}
          <div
            className="lg:col-span-2 rounded-2xl border border-slate-200/80 p-5 bg-white shadow-sm"
            style={{}}
          >
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">Recovered Revenue</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Last 30 Days</p>
            </div>

            {/* Summary stat */}
            <div className="mb-5 flex items-end gap-3">
              <div>
                <div className="text-2xl font-black text-emerald-600" style={{}}>
                  ₹{appointmentsRebooked.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Total this month</div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-[12px] font-semibold mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +18%
              </div>
            </div>

            {/* Chart */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="60%" stopColor="#6366F1" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 9 }}
                    interval={9}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 9 }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-3 h-0.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-slate-500 font-medium">Daily reactivation revenue (₹)</span>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — Top Campaign Highlight
        ═══════════════════════════════════════════════════════ */}
        <motion.div
          {...sectionAnim(0.9)}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 p-6 bg-white shadow-sm"
          style={{}}
        >
          {/* Decorative gradient orb */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
                >
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.14em]">
                    Top Follow-up This Month
                  </p>
                  <h3 className="text-lg font-bold text-slate-800">Teeth Cleaning Recall</h3>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                View Full Report
              </motion.button>
            </div>

            {/* Funnel stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Patients Notified', value: 500, icon: MessageSquare, color: 'text-slate-800', iconColor: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Responded', value: 73, icon: CheckCircle2, color: 'text-slate-800', iconColor: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Bookings', value: 18, icon: CalendarCheck, color: 'text-slate-800', iconColor: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Recovered Revenue', value: 42000, prefix: '₹', icon: IndianRupee, color: 'text-emerald-700', iconColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + idx * 0.08, duration: 0.4 }}
                  className={`rounded-xl p-4 border border-slate-100 ${stat.bg}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                  <div className={`text-2xl font-black ${stat.color}`}>
                    {stat.prefix}
                    <CountUp end={stat.value} duration={2.2} separator="," delay={0.8} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Funnel visualization */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-3">
                Follow-up Funnel
              </p>

              {[
                { label: 'Sent', value: 500, total: 500, color: '#6366F1', colorLight: 'rgba(99,102,241,0.2)', pct: 100 },
                { label: 'Responded', value: 73, total: 500, color: '#F59E0B', colorLight: 'rgba(245,158,11,0.2)', pct: 14.6 },
                { label: 'Booked Appointment', value: 18, total: 500, color: '#10B981', colorLight: 'rgba(16,185,129,0.2)', pct: 3.6 },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="w-32 text-right flex-shrink-0">
                    <span className="text-[12px] font-semibold text-slate-700">{step.label}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${step.pct}%` }}
                        transition={{ delay: 1.1 + idx * 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] as any }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${step.color}, ${step.colorLight})` }}
                      />
                    </div>

                    {/* Count + pct */}
                    <div className="flex items-center gap-2 flex-shrink-0 w-28">
                      <span className="text-sm font-bold text-slate-800">{step.value.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-slate-500">({step.pct}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Conversion insight chip */}
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-semibold">14.6% response rate</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-250/20">
                <span className="text-[11px] text-indigo-700 font-semibold">₹2,333 avg. revenue per booking</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-400 font-semibold">3.6% conversion to appointment</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom padding */}
        <div className="h-6" />
      </div>
    </div>
  );
}

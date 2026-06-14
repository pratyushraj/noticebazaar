import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Building2,
  Users,
  Scissors,
  HelpCircle,
  Tag,
  MessageSquare,
  BookOpen,
  CalendarCheck,
  Stethoscope,
  Star,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles,
  Zap,
  Bot,
  Send,
  Clock,
  MapPin,
  IndianRupee,
  Flame,
  Circle,
  Activity,
  CalendarDays,
  Shield,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Wifi,
  ExternalLink,
  ToggleLeft,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Checkbox from '@radix-ui/react-checkbox';
import confetti from 'canvas-confetti';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  name: string;
  role: string;
  days: string[];
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface ClinicNotice {
  id: string;
  title: string;
  description: string;
  validUntil: string;
}

interface AIToggle {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  color: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  isTyping?: boolean;
}

interface RecentConversation {
  name: string;
  inquiry: string;
  lastSeen: string;
  temperature: 'hot' | 'warm' | 'cold';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const INITIAL_STAFF: StaffMember[] = [];

const INITIAL_SERVICES: Service[] = [];

const INITIAL_FAQS: FAQ[] = [];

const INITIAL_NOTICES: ClinicNotice[] = [];

const INITIAL_AI_TOGGLES: AIToggle[] = [];

const INTEGRATION_OPTIONS = [
  { id: 'gcal', name: 'Google Calendar', icon: CalendarDays, connected: false },
];

const HANDOFF_TRIGGERS = [
  { id: 'human_request', label: "Customer says 'speak to human' / 'real person'" },
  { id: 'emergency', label: 'Emergency keywords detected (pain, bleeding, accident)' },
  { id: 'complaint', label: 'Complaint or refund request' },
  { id: 'diagnosis', label: 'Medical diagnosis request' },
];

const NOTIFY_OPTIONS = ['SMS', 'Email'];

const RECENT_CONVERSATIONS: RecentConversation[] = [
  { name: 'Rahul Sharma', inquiry: 'Aligners', lastSeen: '3 days ago', temperature: 'hot' },
  { name: 'Priya Mehta', inquiry: 'Root Canal (booked)', lastSeen: '1 week ago', temperature: 'warm' },
  { name: 'Arun Singh', inquiry: 'Whitening', lastSeen: '2 weeks ago', temperature: 'cold' },
];

const DEMO_CONVERSATION: ChatMessage[] = [];

const SCENARIO_SCRIPTS: Record<string, ChatMessage[]> = {
  pricing: [
    { id: 'su1', role: 'user', text: 'What are your service charges?', timestamp: 'Now' },
    { id: 'sa1', role: 'ai', text: "Here's our pricing menu 💰\n\n🦷 Teeth Cleaning — ₹800 (45 min)\n✨ Teeth Whitening — ₹3,500 (60 min)\n🔩 Root Canal — ₹6,000 (90 min)\n💎 Dental Implant — ₹35,000 (120 min)\n\nAll treatments include a free pre-consultation!", timestamp: 'Now' },
    { id: 'su2', role: 'user', text: 'Is there any discount available?', timestamp: 'Now' },
    { id: 'sa2', role: 'ai', text: "Yes! We have current clinic notices right now 🎉\n\n🌟 **Whitening notice** — 20% off whitening (valid till June 30)\n🎁 **New Patient Welcome** — ₹200 off first scaling + free X-ray\n\nWant me to book you in?", timestamp: 'Now' },
  ],
  booking: [
    { id: 'bu1', role: 'user', text: 'I want to book an appointment for root canal', timestamp: 'Now' },
    { id: 'ba1', role: 'ai', text: "I'll help you book a Root Canal appointment right away! 🔍\n\nMay I know your name and preferred date?", timestamp: 'Now' },
    { id: 'bu2', role: 'user', text: 'Vikram Nair, tomorrow if possible', timestamp: 'Now' },
    { id: 'ba2', role: 'ai', text: "Perfect, Vikram! ✅ Checking availability...\n\n📅 Tomorrow — Dr. Priya Sharma is available at:\n• 10:30 AM\n• 2:00 PM\n• 4:30 PM\n\nWhich slot works best for you?", timestamp: 'Now' },
    { id: 'bu3', role: 'user', text: '2 PM please', timestamp: 'Now' },
    { id: 'ba3', role: 'ai', text: "🎉 Confirmed! Your appointment is booked:\n\n👤 Vikram Nair\n📅 Tomorrow at 2:00 PM\n👩‍⚕️ Dr. Priya Sharma\n🦷 Root Canal Treatment\n\nYou'll receive a reminder 2 hours before. See you tomorrow! 😊", timestamp: 'Now' },
  ],
  faq: [
    { id: 'fu1', role: 'user', text: 'Do you provide EMI options?', timestamp: 'Now' },
    { id: 'fa1', role: 'ai', text: "Yes, we notice 0% EMI on treatments above ₹5,000! 💳\n\nAvailable through:\n✅ Bajaj Finance (3-12 months)\n✅ HDFC PayLater (up to 6 months)\n✅ ZestMoney (3-9 months)\n\nNo processing fee. Approval in 2 minutes!", timestamp: 'Now' },
    { id: 'fu2', role: 'user', text: 'Do you accept Star Health insurance?', timestamp: 'Now' },
    { id: 'fa2', role: 'ai', text: "Yes, we accept Star Health insurance! ✅\n\nWe also accept:\n• Niva Bupa\n• ICICI Lombard\n• Care Health\n\nPlease bring your insurance card. Our billing team will handle the rest.", timestamp: 'Now' },
  ],
  lead: [
    { id: 'lu1', role: 'user', text: "I'm interested in clear aligners", timestamp: 'Now' },
    { id: 'la1', role: 'ai', text: "Great choice! Clear aligners are amazing 😍\n\nOur package includes:\n🔬 3D smile simulation\n📐 Custom aligners\n♾️ Lifetime retainers\n👨‍⚕️ Monthly check-ups\n\nStarting ₹45,000. May I capture your details for a free consultation call?", timestamp: 'Now' },
    { id: 'lu2', role: 'user', text: 'Sure', timestamp: 'Now' },
    { id: 'la2', role: 'ai', text: "Perfect! 📝 I've captured your details.\n\n✅ Patient saved: Clear Aligners\n📞 Our team will call you within 2 hours\n\nName saved. Notification sent to clinic. You're all set!", timestamp: 'Now' },
  ],
  handoff: [
    { id: 'hu1', role: 'user', text: 'I want to speak to a real person', timestamp: 'Now' },
    { id: 'ha1', role: 'ai', text: "Of course! Let me connect you with a team member right away 🔔\n\n⚡ Notifying staff...\n\nDr. Priya's team has been alerted. Someone will join this chat in under 3 minutes.\n\nIn the meantime, is there anything I can help with?", timestamp: 'Now' },
    { id: 'hu2', role: 'user', text: "I've been having severe tooth pain since yesterday", timestamp: 'Now' },
    { id: 'ha2', role: 'ai', text: "I'm so sorry to hear that 💙 This sounds urgent!\n\n🚨 **Emergency escalation triggered**\n\nI've sent an urgent alert to Dr. Priya. For immediate help:\n📞 Call us: +91 98765 43210\n📍 Walk-in available 10 AM – 8 PM\n\nPlease don't wait — we'll prioritize you!", timestamp: 'Now' },
  ],
  returning: [
    { id: 'ru1', role: 'user', text: 'Hi, I visited 3 months ago for scaling', timestamp: 'Now' },
    { id: 'ra1', role: 'ai', text: "Welcome back! 👋 Great to hear from you again!\n\nIt's been 3 months since your last cleaning — perfect time for a check-up!\n\n🦷 Would you like to schedule your next scaling session?\n⭐ As a returning patient, you get **₹100 off** on your next visit!", timestamp: 'Now' },
    { id: 'ru2', role: 'user', text: 'Yes that sounds good', timestamp: 'Now' },
    { id: 'ra2', role: 'ai', text: "Wonderful! Let me book your session 🎉\n\n📅 Available this week:\n• Wednesday — 11 AM, 3 PM, 5 PM\n• Saturday — 10 AM, 12 PM, 2 PM\n\nWhich works for you?", timestamp: 'Now' },
  ],
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all ${props.className || ''}`}
  />
);

const GlassTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none ${props.className || ''}`}
  />
);

const GlassSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select
    {...props}
    className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all appearance-none ${props.className || ''}`}
  >
    {children}
  </select>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReactivationReceptionist() {
  const { organizationId } = useSession();
  const clinicId = organizationId || '';

  // ── Business Profile State
  const [clinicName, setClinicName] = useState('Smile Dental Clinic');
  const [industry, setIndustry] = useState('Dental Clinic');
  const [address, setAddress] = useState('Shop 12, Andheri West, Mumbai, Maharashtra 400058');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [workingHours, setWorkingHours] = useState('Mon–Sat: 10:00 AM – 8:00 PM');
  const [timingsNote, setTimingsNote] = useState('Closed on Sundays & public holidays. Emergency contact: +91 99887 76655');

  // ── WhatsApp API Config State
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappBusinessPhone, setWhatsappBusinessPhone] = useState('');

  // ── Staff State
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffDays, setNewStaffDays] = useState<string[]>([]);

  // ── Services State
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ name: '', duration: '', price: '', description: '' });

  // ── FAQs State
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [expandedFaq, setExpandedFaq] = useState<string | undefined>(undefined);

  // ── Notices State
  const [notices, setNotices] = useState<ClinicNotice[]>([]);
  const [newNotice, setNewNotice] = useState({ title: '', description: '', validUntil: '' });

  // ── AI Toggles State
  const [aiToggles, setAiToggles] = useState<AIToggle[]>(INITIAL_AI_TOGGLES);

  // ── Integration State
  const [integrations, setIntegrations] = useState(INTEGRATION_OPTIONS);

  // ── Handoff State
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [enabledTriggers, setEnabledTriggers] = useState<string[]>(['human_request', 'emergency', 'complaint']);
  const [notifyVia, setNotifyVia] = useState('SMS');

  // ── Train AI State
  const [trainState, setTrainState] = useState<'idle' | 'loading' | 'success'>('idle');

  // ── Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(DEMO_CONVERSATION);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // ── Scroll chat to bottom on new message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ── Load and Seed Data from Supabase
  useEffect(() => {
    if (!clinicId) return;

    async function loadData() {
      try {
        // 1. Fetch clinic details
        const { data: clinic } = await supabase.from('dental_clinics').select('*').eq('id', clinicId).single();
        if (clinic) {
          setClinicName(clinic.name || '');
          setAddress(clinic.address || '');
          setPhone(clinic.phone || '');
          setWorkingHours(clinic.working_hours || '');
          setTimingsNote(clinic.timings_note || '');
          setWhatsappPhoneNumberId(clinic.whatsapp_phone_number_id || '');
          setWhatsappAccessToken(clinic.whatsapp_access_token || '');
          setWhatsappBusinessPhone(clinic.whatsapp_business_phone || '');
        }

        // 2. Fetch staff
        const { data: staffData } = await supabase.from('clinic_staff').select('*').eq('clinic_id', clinicId);
        if (staffData && staffData.length > 0) {
          setStaff(staffData.map((s: any) => ({ id: s.id, name: s.name, role: s.role, days: s.days || [] })));
        } else {
          setStaff([]);
        }

        // 3. Fetch services
        const { data: servicesData } = await supabase.from('clinic_services').select('*').eq('clinic_id', clinicId);
        if (servicesData && servicesData.length > 0) {
          setServices(servicesData.map((s: any) => ({ id: s.id, name: s.name, duration: s.duration, price: Number(s.price), description: s.description || '' })));
        } else {
          setServices([]);
        }

        // 4. Fetch FAQs
        const { data: faqsData } = await supabase.from('clinic_faqs').select('*').eq('clinic_id', clinicId);
        if (faqsData && faqsData.length > 0) {
          setFaqs(faqsData.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })));
        } else {
          setFaqs([]);
        }

        // 5. Fetch Notices
        const { data: noticesData } = await supabase.from('clinic_notices').select('*').eq('clinic_id', clinicId);
        if (noticesData && noticesData.length > 0) {
          setNotices(noticesData.map((n: any) => ({ id: n.id, title: n.title, description: n.description || '', validUntil: n.valid_until || '' })));
        } else {
          setNotices([]);
        }
      } catch (err) {
        console.error('Error loading clinic receptionist settings from Supabase:', err);
      }
    }

    loadData();
  }, [clinicId]);

  // ── Staff Handlers
  const addStaff = async () => {
    if (!newStaffName.trim() || !clinicId) return;
    try {
      const { data, error } = await supabase.from('clinic_staff').insert({
        clinic_id: clinicId,
        name: newStaffName,
        role: newStaffRole,
        days: newStaffDays,
      }).select().single();
      if (error) throw error;
      if (data) {
        setStaff(prev => [...prev, {
          id: data.id,
          name: data.name,
          role: data.role,
          days: data.days || [],
        }]);
      }
      setNewStaffName(''); setNewStaffRole(''); setNewStaffDays([]);
    } catch (err) {
      console.error('Error inserting staff:', err);
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const { error } = await supabase.from('clinic_staff').delete().eq('id', id);
      if (error) throw error;
      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  const toggleStaffDay = (day: string) => {
    setNewStaffDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // ── Service Handlers
  const addService = async () => {
    if (!newService.name.trim() || !clinicId) return;
    try {
      const { data, error } = await supabase.from('clinic_services').insert({
        clinic_id: clinicId,
        name: newService.name,
        duration: Number(newService.duration || 0),
        price: Number(newService.price || 0),
        description: newService.description,
      }).select().single();
      if (error) throw error;
      if (data) {
        setServices(prev => [...prev, {
          id: data.id,
          name: data.name,
          duration: data.duration,
          price: Number(data.price),
          description: data.description || '',
        }]);
      }
      setNewService({ name: '', duration: '', price: '', description: '' });
    } catch (err) {
      console.error('Error adding service:', err);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('clinic_services').delete().eq('id', id);
      if (error) throw error;
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  // ── FAQ Handlers
  const addFaq = async () => {
    if (!newFaq.question.trim() || !clinicId) return;
    try {
      const { data, error } = await supabase.from('clinic_faqs').insert({
        clinic_id: clinicId,
        question: newFaq.question,
        answer: newFaq.answer,
      }).select().single();
      if (error) throw error;
      if (data) {
        setFaqs(prev => [...prev, { id: data.id, question: data.question, answer: data.answer }]);
      }
      setNewFaq({ question: '', answer: '' });
    } catch (err) {
      console.error('Error adding FAQ:', err);
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      const { error } = await supabase.from('clinic_faqs').delete().eq('id', id);
      if (error) throw error;
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  // ── Clinic Notice Handlers
  const addNotice = async () => {
    if (!newNotice.title.trim() || !clinicId) return;
    try {
      const { data, error } = await supabase.from('clinic_notices').insert({
        clinic_id: clinicId,
        title: newNotice.title,
        description: newNotice.description,
        valid_until: newNotice.validUntil || null,
      }).select().single();
      if (error) throw error;
      if (data) {
        setNotices(prev => [...prev, { id: data.id, title: data.title, description: data.description || '', validUntil: data.valid_until || '' }]);
      }
      setNewNotice({ title: '', description: '', validUntil: '' });
    } catch (err) {
      console.error('Error adding notice:', err);
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      const { error } = await supabase.from('clinic_notices').delete().eq('id', id);
      if (error) throw error;
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notice:', err);
    }
  };

  const daysUntil = (dateStr: string) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // ── AI Toggle Handler
  const toggleAI = (id: string) => {
    setAiToggles(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  // ── Integration Handler
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  // ── Train AI Handler
  const handleTrainAI = async () => {
    setTrainState('loading');
    try {
      if (clinicId) {
        const { error } = await supabase
          .from('dental_clinics')
          .update({
            name: clinicName,
            address: address,
            phone: phone,
            working_hours: workingHours,
            timings_note: timingsNote,
            whatsapp_phone_number_id: whatsappPhoneNumberId,
            whatsapp_access_token: whatsappAccessToken,
            whatsapp_business_phone: whatsappBusinessPhone,
          })
          .eq('id', clinicId);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error training AI / saving clinic info:', err);
    }
    await new Promise(r => setTimeout(r, 2400));
    setTrainState('success');
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ffffff'],
    });
    setTimeout(() => setTrainState('idle'), 5000);
  };

  // ── Chat Scenario Handler
  const runScenario = useCallback((scenarioKey: string) => {
    if (activeScenario === scenarioKey) return;
    setActiveScenario(scenarioKey);
    const script = SCENARIO_SCRIPTS[scenarioKey];
    if (!script) return;

    setChatMessages([]);
    let delay = 0;

    script.forEach((msg, idx) => {
      const msgDelay = delay;
      delay += msg.role === 'user' ? 600 : 1800;

      setTimeout(() => {
        if (msg.role === 'ai') {
          // Show typing indicator first
          const typingId = `typing-${msg.id}`;
          setChatMessages(prev => [...prev, { id: typingId, role: 'ai', text: '', timestamp: 'Now', isTyping: true }]);
          setTypingMessageId(typingId);

          setTimeout(() => {
            setChatMessages(prev => prev.filter(m => m.id !== typingId).concat({ ...msg }));
            setTypingMessageId(null);
          }, 1200);
        } else {
          setChatMessages(prev => [...prev, msg]);
        }
      }, msgDelay);
    });
  }, [activeScenario]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-indigo-600/4 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-violet-600/3 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[300px] bg-emerald-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Top header bar */}
      <div className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-none">Front Desk Setup</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Dental Front Desk Module</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-200">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-700">System Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200">
            <Activity className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-600">Smile Dental Clinic</span>
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="relative z-10 flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-65px)]">

        {/* ══════════════════════════════════════════════════════
            LEFT PANEL — Knowledge Base Setup
        ══════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/2 flex flex-col h-auto lg:h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-white scrollbar-hide">
          <div className="p-6 pb-2">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800">Train Front Desk Assistant</h2>
              </div>
              <p className="text-sm text-slate-500">Teach the assistant your clinic basics</p>
            </motion.div>
          </div>

          {/* ── 5-Tab System ── */}
          <div className="px-6 pb-2 flex-shrink-0">
            <Tabs defaultValue="business">
              <TabsList className="w-full grid grid-cols-5 bg-slate-100 border border-slate-200 rounded-xl p-1 gap-0.5 h-auto">
                {[
                  { value: 'business', icon: Building2, label: 'Business' },
                  { value: 'staff', icon: Users, label: 'Staff' },
                  { value: 'services', icon: Scissors, label: 'Services' },
                  { value: 'faqs', icon: HelpCircle, label: 'FAQs' },
                  { value: 'notices', icon: Tag, label: 'Clinic Notices' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold text-slate-500 data-[state=active]:text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200 transition-all"
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Tab 1: Business Profile ── */}
              <TabsContent value="business" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <SectionLabel>Clinic / Business Name</SectionLabel>
                    <GlassInput value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. Smile Dental Clinic" />
                  </div>
                  <div>
                    <SectionLabel>Industry / Type</SectionLabel>
                    <GlassSelect value={industry} onChange={e => setIndustry(e.target.value)}>
                  {['Dental Clinic'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </GlassSelect>
                  </div>
                </div>
                <div>
                  <SectionLabel>Address</SectionLabel>
                  <GlassTextarea rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full clinic address..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <SectionLabel>Phone Number</SectionLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <GlassInput className="pl-9" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 ..." />
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Working Hours</SectionLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <GlassInput className="pl-9" value={workingHours} onChange={e => setWorkingHours(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <SectionLabel>Timings Note (Holidays, Exceptions)</SectionLabel>
                  <GlassTextarea rows={2} value={timingsNote} onChange={e => setTimingsNote(e.target.value)} placeholder="e.g. Closed on 2nd Saturday..." />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/40 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    💬 WhatsApp Business API Configuration
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <SectionLabel>WhatsApp Phone Number ID</SectionLabel>
                      <GlassInput 
                        value={whatsappPhoneNumberId} 
                        onChange={e => setWhatsappPhoneNumberId(e.target.value)} 
                        placeholder="e.g. 1179722595225188" 
                      />
                    </div>
                    <div>
                      <SectionLabel>WhatsApp Business Phone (From)</SectionLabel>
                      <GlassInput 
                        value={whatsappBusinessPhone} 
                        onChange={e => setWhatsappBusinessPhone(e.target.value)} 
                        placeholder="e.g. +91 75448 60350" 
                      />
                    </div>
                  </div>
                  <div>
                    <SectionLabel>WhatsApp Permanent Access Token</SectionLabel>
                    <GlassInput 
                      type="password"
                      value={whatsappAccessToken} 
                      onChange={e => setWhatsappAccessToken(e.target.value)} 
                      placeholder="EAAG..." 
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 2: Staff ── */}
              <TabsContent value="staff" className="mt-4 space-y-4">
                {/* Add Staff Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Staff Member</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <SectionLabel>Name</SectionLabel>
                      <GlassInput value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Dr. Aarav Kumar" />
                    </div>
                    <div>
                      <SectionLabel>Role / Specialization</SectionLabel>
                      <GlassInput value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} placeholder="Orthodontist" />
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Available Days</SectionLabel>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleStaffDay(day)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${newStaffDays.includes(day) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={addStaff} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100/80 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Staff Member
                  </button>
                </div>

                {/* Staff Cards */}
                <div className="space-y-2">
                  {staff.map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.role} • {member.days.join(', ') || 'All days'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteStaff(member.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* ── Tab 3: Services & Pricing ── */}
              <TabsContent value="services" className="mt-4 space-y-4">
                {/* Add Service Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Service</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <SectionLabel>Service Name</SectionLabel>
                      <GlassInput value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Composite Bonding" />
                    </div>
                    <div>
                      <SectionLabel>Duration (min)</SectionLabel>
                      <GlassInput type="number" value={newService.duration} onChange={e => setNewService(p => ({ ...p, duration: e.target.value }))} placeholder="60" />
                    </div>
                    <div>
                      <SectionLabel>Price (₹)</SectionLabel>
                      <GlassInput type="number" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} placeholder="2500" />
                    </div>
                    <div>
                      <SectionLabel>Description</SectionLabel>
                      <GlassInput value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} placeholder="Brief note" />
                    </div>
                  </div>
                  <button onClick={addService} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100/80 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </button>
                </div>

                {/* Services Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200/85 bg-slate-100/50">
                        <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Service</th>
                        <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Duration</th>
                        <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Price</th>
                        <th className="px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((svc, i) => (
                        <motion.tr
                          key={svc.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 group"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{svc.name}</p>
                            <p className="text-[11px] text-slate-400">{svc.description}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{svc.duration} min</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-emerald-600">₹{svc.price.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-2 py-3">
                            <button
                               onClick={() => deleteService(svc.id)}
                               className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* ── Tab 4: FAQs ── */}
              <TabsContent value="faqs" className="mt-4 space-y-4">
                {/* Add FAQ Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add FAQ</p>
                  <div>
                    <SectionLabel>Question</SectionLabel>
                    <GlassInput value={newFaq.question} onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))} placeholder="e.g. Do you notice home visits?" />
                  </div>
                  <div>
                    <SectionLabel>Answer</SectionLabel>
                    <GlassTextarea rows={3} value={newFaq.answer} onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))} placeholder="Detailed answer..." />
                  </div>
                  <button onClick={addFaq} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100/80 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add FAQ
                  </button>
                </div>

                <div className="space-y-2">
                  {faqs.map((faq, i) => {
                    const isOpen = expandedFaq === faq.id;
                    return (
                      <motion.div key={faq.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedFaq(isOpen ? undefined : faq.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left group hover:bg-slate-100/30 transition-all"
                          >
                            <span className="text-sm font-medium text-slate-800">{faq.question}</span>
                            <div className="flex items-center gap-2">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFaq(faq.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-all cursor-pointer inline-flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-3 text-sm text-slate-500 leading-relaxed">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ── Tab 5: Active Notices ── */}
              <TabsContent value="notices" className="mt-4 space-y-4">
                {/* Add Notice Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Notice</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <SectionLabel>Title</SectionLabel>
                      <GlassInput value={newNotice.title} onChange={e => setNewNotice(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Monsoon Special" />
                    </div>
                    <div>
                      <SectionLabel>Valid Until</SectionLabel>
                      <GlassInput type="date" value={newNotice.validUntil} onChange={e => setNewNotice(p => ({ ...p, validUntil: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Description</SectionLabel>
                    <GlassTextarea rows={2} value={newNotice.description} onChange={e => setNewNotice(p => ({ ...p, description: e.target.value }))} placeholder="Notice details..." />
                  </div>
                  <button onClick={addNotice} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100/80 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Notice
                  </button>
                </div>

                {/* Notices Cards */}
                <div className="space-y-3">
                  {notices.map((notice, i) => {
                    const days = daysUntil(notice.validUntil);
                    return (
                      <motion.div
                        key={notice.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative overflow-hidden group"
                      >
                        {/* Glow strip */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-800">{notice.title}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>
                            </div>
                            <p className="text-xs text-slate-500">{notice.description}</p>
                            <p className="text-[11px] text-amber-600 mt-1.5">
                              ⏳ {days > 0 ? `${days} days remaining` : 'Expired'} · Valid till {notice.validUntil}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteNotice(notice.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── AI Responsibility Toggles ── */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">AI Responsibilities</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aiToggles.map((toggle) => (
                <motion.div
                  key={toggle.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => toggleAI(toggle.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    toggle.enabled
                      ? toggle.color === 'red'
                        ? 'bg-red-50 border-red-200 shadow-sm'
                        : 'bg-indigo-50 border-indigo-250 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={toggle.enabled ? (toggle.color === 'red' ? 'text-red-500' : 'text-indigo-500') : 'text-slate-400'}>
                      {toggle.icon}
                    </span>
                    <span className={`text-xs font-medium ${toggle.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                      {toggle.label}
                    </span>
                  </div>
                  <div
                    className={`w-8 h-4 rounded-full transition-all relative flex-shrink-0 ${
                      toggle.enabled
                        ? toggle.color === 'red' ? 'bg-red-500' : 'bg-indigo-500'
                        : 'bg-slate-200'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${toggle.enabled ? 'left-4.5 translate-x-0.5' : 'left-0.5'}`} style={{ left: toggle.enabled ? '18px' : '2px' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Booking Integration ── */}
          <div className="px-6 py-2 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">Optional Calendar Sync</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              The CRM stays as the source of truth. Use Google Calendar only if the doctor wants reminders on a personal calendar.
            </p>
            <div className="space-y-2">
              {integrations.map((intg) => (
                <div key={intg.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-250 flex items-center justify-center">
                      <intg.icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{intg.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${intg.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-[11px] ${intg.connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {intg.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleIntegration(intg.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      intg.connected
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-600'
                        : 'bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100/50'
                    }`}
                  >
                    {intg.connected ? 'Disconnect' : 'Connect Google Calendar'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Human Handoff Triggers ── */}
          <div className="px-6 pb-4">
            <Collapsible.Root open={handoffOpen} onOpenChange={setHandoffOpen}>
              <Collapsible.Trigger className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-100/50 transition-all group">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-slate-800">Human Handoff Triggers</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-700">
                    {enabledTriggers.length} active
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${handoffOpen ? 'rotate-180' : ''}`} />
              </Collapsible.Trigger>
              <Collapsible.Content className="mt-2 space-y-2">
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3">
                  {HANDOFF_TRIGGERS.map(trigger => (
                    <div key={trigger.id} className="flex items-center gap-3">
                      <button
                        onClick={() => setEnabledTriggers(prev => prev.includes(trigger.id) ? prev.filter(t => t !== trigger.id) : [...prev, trigger.id])}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${enabledTriggers.includes(trigger.id) ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-slate-200'}`}
                      >
                        {enabledTriggers.includes(trigger.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className="text-xs text-slate-700">{trigger.label}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200">
                    <SectionLabel>Notify Team Via</SectionLabel>
                    <div className="flex gap-2">
                      {NOTIFY_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setNotifyVia(opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${notifyVia === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </div>

          {/* ── Train AI CTA ── */}
          <div className="px-6 pb-8 mt-auto">
            <motion.button
              onClick={trainState === 'idle' ? handleTrainAI : undefined}
              whileHover={trainState === 'idle' ? { scale: 1.01 } : {}}
              whileTap={trainState === 'idle' ? { scale: 0.98 } : {}}
              disabled={trainState === 'loading'}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all relative overflow-hidden ${
                trainState === 'success'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                  : trainState === 'loading'
                  ? 'bg-gradient-to-r from-indigo-600/70 to-violet-600/70 text-white/70 cursor-wait'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
              }`}
            >
              {/* Animated shine */}
              {trainState === 'idle' && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              )}
              <AnimatePresence mode="wait">
                {trainState === 'loading' && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Training AI Receptionist...</span>
                  </motion.div>
                )}
                {trainState === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
                    <span>AI is Live ✨ Knowledge Base Updated!</span>
                  </motion.div>
                )}
                {trainState === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3">
                    <Brain className="w-5 h-5" />
                    <span>Train AI Receptionist</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANEL — Live Chat Preview
        ══════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/2 flex flex-col h-auto lg:h-full overflow-y-auto bg-slate-50 border-t lg:border-t-0 border-slate-200 scrollbar-hide">
          <div className="flex flex-col items-center py-6 px-6 h-full">

            {/* Panel header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[400px] mb-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    Live Chat Preview
                  </h2>
                  <p className="text-sm text-slate-500">Test how your AI responds</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700">LIVE</span>
                </div>
              </div>
            </motion.div>

            {/* ── Chat Phone Frame ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-[380px] flex-shrink-0"
            >
              {/* Phone shell */}
              <div className="rounded-[2rem] border-2 border-white/10 shadow-2xl shadow-black/60 overflow-hidden bg-[#111b21]">

                {/* Chat Header */}
                <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#202c33]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white leading-none">{clinicName || 'Smile Dental Clinic'}</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">AI Receptionist • Online</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-white/60" />
                    <ExternalLink className="w-4 h-4 text-white/60" />
                  </div>
                </div>

                {/* Chat area */}
                <div
                  ref={chatRef}
                  className="h-[380px] overflow-y-auto bg-[#0b141a] px-4 py-3 space-y-2 scrollbar-hide"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\' fill=\'%23ffffff04\'/%3E%3C/svg%3E")' }}
                >
                  {/* Date divider */}
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] text-white/30 bg-white/5 px-3 py-0.5 rounded-full">Today</span>
                  </div>

                  <AnimatePresence>
                    {chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed relative ${
                            msg.role === 'user'
                              ? 'bg-[#005c4b] text-white rounded-tr-sm'
                              : 'bg-[#202c33] text-white/90 rounded-tl-sm'
                          }`}
                        >
                          {msg.isTyping ? (
                            <div className="flex gap-1 py-1 px-1">
                              {[0, 1, 2].map(i => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                                  style={{ animationDelay: `${i * 0.15}s` }}
                                />
                              ))}
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-line">{msg.text}</p>
                              <p className="text-[9px] text-white/30 text-right mt-1">{msg.timestamp}</p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Chat input bar */}
                <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-white/30">
                    Type a reply...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-white ml-0.5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Scenario Buttons ── */}
            <div className="w-full max-w-[380px] mt-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Test Scenarios</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'pricing', label: 'Ask Pricing', icon: IndianRupee },
                  { key: 'booking', label: 'Book Appt.', icon: CalendarCheck },
                  { key: 'faq', label: 'Test FAQ', icon: HelpCircle },
                  { key: 'lead', label: 'Capture Patient', icon: UserCheck },
                  { key: 'handoff', label: 'Test Handoff', icon: Phone },
                  { key: 'returning', label: 'Returning Patient', icon: RefreshCw },
                ].map(({ key, label, icon: Icon }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => runScenario(key)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      activeScenario === key
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-500/10'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Recent Conversations ── */}
            <div className="w-full max-w-[380px] mt-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Conversations</p>
              <div className="space-y-2">
                {RECENT_CONVERSATIONS.map((conv, i) => {
                  const tempConfig = {
                    hot: { label: 'Hot 🔥', class: 'text-red-600 bg-red-50 border-red-200' },
                    warm: { label: 'Warm 🟡', class: 'text-amber-700 bg-amber-50 border-amber-200' },
                    cold: { label: 'Cold 🔵', class: 'text-blue-600 bg-blue-50 border-blue-200' },
                  }[conv.temperature];

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600">
                          {conv.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{conv.name}</p>
                          <p className="text-[11px] text-slate-500">Inquiry: {conv.inquiry} · {conv.lastSeen}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${tempConfig.class}`}>
                        {tempConfig.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Lead Qualification Mini-Panel ── */}
            <div className="w-full max-w-[380px] mt-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-800">Leads Captured Today</span>
                  </div>
                  <span className="text-xl font-black text-slate-800">5</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Hot', count: 2, emoji: '🔥', color: 'red' },
                    { label: 'Warm', count: 2, emoji: '🟡', color: 'amber' },
                    { label: 'Cold', count: 1, emoji: '🔵', color: 'blue' },
                  ].map(stat => (
                    <div
                      key={stat.label}
                      className={`text-center py-2.5 px-2 rounded-xl border ${
                        stat.color === 'red' ? 'bg-red-50 border-red-100' :
                        stat.color === 'amber' ? 'bg-amber-50 border-amber-100' :
                        'bg-blue-50 border-blue-100'
                      }`}
                    >
                      <span className="text-lg">{stat.emoji}</span>
                      <p className={`text-xl font-black mt-0.5 ${
                        stat.color === 'red' ? 'text-red-600' :
                        stat.color === 'amber' ? 'text-amber-700' :
                        'text-blue-600'
                      }`}>
                        {stat.count}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Conversion rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full w-[40%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600">40%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

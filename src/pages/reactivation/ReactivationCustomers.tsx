import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Upload,
  Filter,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit3,
  MessageSquare,
  Star,
  Trash2,
  Sparkles,
  Users,
  UserCheck,
  UserMinus,
  Crown,
  X,
  Send,
  RefreshCw,
  Phone,
  Calendar,
  Stethoscope,
  StickyNote,
  CheckSquare,
  Square,
  Zap,
  Mic,
  Volume2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomerStatus = 'Active' | 'Inactive' | 'New Lead' | 'Follow Up Needed';

interface CareStep {
  day: number;
  message: string;
  subLabel: string;
}

interface CareProgramTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: CareStep[];
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  lastVisit: string; // ISO date string
  service: string;
  totalSpend: number;
  status: CustomerStatus;
  notes: string;
  avatarColor: string;
  problemTeeth?: number[];
  xrays?: string[];
  beforeAfterPhotos?: string[];
  allergies?: string[];
  medicalConditions?: string[];
  toothNotes?: Record<number, string>;
  toothConditions?: Record<number, string>;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
  };
  activeProgramId?: string;
  programEnrollmentDate?: string;
  programCurrentStep?: number; // step index (1-based or 0-based, let's use 1-based)
  programStatus?: 'Active' | 'Paused' | 'Completed';
  estimates?: Array<{
    id: string;
    date: string;
    items: Array<{ tooth?: number; procedure: string; cost: number; isCosmetic: boolean }>;
    discount: number;
    tax: number;
    grandTotal: number;
    status: 'Draft' | 'Sent' | 'Approved';
  }>;
}

type SortField = 'lastVisit' | 'totalSpend' | null;
type SortDir = 'asc' | 'desc';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6',
  '#F97316', '#84CC16',
];

export const CARE_PROGRAMS: CareProgramTemplate[] = [
  {
    id: 'extraction',
    name: '7-Day Post-Extraction Care',
    category: 'Dental',
    description: 'Precautions, bleeding, and recovery tracking post-extraction.',
    steps: [
      { day: 1, message: 'Hi {name}, how is the bleeding and discomfort? Keep cotton pack pressed. Avoid spitting and hot liquids today.', subLabel: 'Immediate post-op checklist' },
      { day: 3, message: 'Hi {name}, is the swelling starting to decrease? You can start warm salt water rinses 4-5 times a day from today.', subLabel: 'Swelling & hygiene' },
      { day: 7, message: 'Hi {name}, healing should be completed. If you have non-dissolvable sutures, let us schedule a suture removal slot.', subLabel: 'Final healing check' }
    ]
  },
  {
    id: 'implant',
    name: '14-Day Dental Implant Osseointegration',
    category: 'Dental',
    description: 'Post-op guidance during critical healing weeks after implant placement.',
    steps: [
      { day: 1, message: 'Hi {name}, congrats on your new implant! Keep diet soft and cool. Do not rinse or spit aggressively today.', subLabel: 'Immediate implant care' },
      { day: 4, message: 'Hi {name}, minor discomfort is expected. Continue soft diet, maintain hygiene, and do not chew directly on the site.', subLabel: 'Osseointegration hygiene' },
      { day: 14, message: 'Hi {name}, let us schedule your implant healing check and suture removal visit. Reply to book a slot!', subLabel: 'Healing review' }
    ]
  },
  {
    id: 'aligners',
    name: '6-Month Clear Aligners Compliance Track',
    category: 'Dental',
    description: 'Tray compliance monitoring and scan reminders.',
    steps: [
      { day: 1, message: 'Hi {name}, tray 1 is in! Wear aligners 22 hours daily. Clean with cold water only. Let is get that smile! 🚀', subLabel: 'Compliance onboarding' },
      { day: 30, message: 'Hi {name}, time to change to tray 3. Any soreness or gaps? Text us if you need help.', subLabel: 'Tray check-in' },
      { day: 90, message: 'Hi {name}, 3 months done! Let us book a mid-course check-in scan to make sure trays match your 3D smile model.', subLabel: 'Mid-term scan review' },
      { day: 180, message: 'Hi {name}, you have reached final tray! Let us book your retainer impressions to secure your new smile permanently.', subLabel: 'Retainer phase start' }
    ]
  },
  {
    id: 'rct',
    name: 'Post-RCT sensitivity & Crown follow-up',
    category: 'Dental',
    description: 'Checks post root canal to confirm occlusion and schedule crown placement.',
    steps: [
      { day: 2, message: 'Hi {name}, how is the root-canal treated tooth? Mild sensitivity is normal. Let us know if bite feels too high.', subLabel: 'Bite & pain check' },
      { day: 10, message: 'Hi {name}, your RCT tooth is now ready for a permanent ceramic/zirconia crown to prevent fracture. Let us book a slot!', subLabel: 'Crown appointment' }
    ]
  }
];

export const MOCK_CUSTOMERS: Customer[] = [];

const SERVICES = [
  'All Services',
  'Teeth Cleaning',
  'Teeth Whitening',
  'Scaling & Polishing',
  'Root Canal',
  'Dental Implants',
  'Crown / Bridge',
  'Braces Consultation',
  'Orthodontic Review',
  'Pediatric Dental',
  'Oral Surgery',
  'Extraction',
  'Gum Treatment',
  'Smile Design',
  'Dental Checkup',
];

const STATUS_OPTIONS: CustomerStatus[] = ['Active', 'Inactive', 'New Lead', 'Follow Up Needed'];

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 days', value: '30' },
  { label: '30–90 days', value: '30-90' },
  { label: '90–180 days', value: '90-180' },
  { label: '6+ months', value: '180+' },
];

const FOLLOW_UP_RULES: Array<{
  match: (customer: Customer) => boolean;
  days: number;
  label: string;
}> = [
  {
    match: (customer) => /root canal|rct/i.test(customer.service) || (customer.toothNotes && Object.values(customer.toothNotes).some((note) => /rct/i.test(note))),
    days: 7,
    label: 'RCT review',
  },
  {
    match: (customer) => /implant/i.test(customer.service),
    days: 14,
    label: 'Implant review',
  },
  {
    match: (customer) => /crown|bridge/i.test(customer.service),
    days: 14,
    label: 'Crown trial',
  },
  {
    match: (customer) => /extraction|surgery/i.test(customer.service),
    days: 7,
    label: 'Healing check',
  },
  {
    match: (customer) => /cleaning|scaling|polish|checkup|whitening/i.test(customer.service),
    days: 90,
    label: 'Recall visit',
  },
  {
    match: (customer) => /braces|aligner/i.test(customer.service),
    days: 30,
    label: 'Progress review',
  },
];

function addDays(dateStr: string, days: number): string {
  const base = new Date(dateStr);
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function getNextVisitDate(customer: Customer): string | null {
  if (customer.programStatus === 'Active' && customer.programEnrollmentDate) {
    const step = Math.max(1, Number(customer.programCurrentStep || 1));
    const baseRule = FOLLOW_UP_RULES.find((rule) => rule.match(customer));
    const stepDays = baseRule ? baseRule.days : 30;
    return addDays(customer.programEnrollmentDate, stepDays * step);
  }

  const rule = FOLLOW_UP_RULES.find((entry) => entry.match(customer));
  if (rule) return addDays(customer.lastVisit, rule.days);

  if (customer.status === 'Follow Up Needed') return addDays(customer.lastVisit, 7);
  return null;
}

function getFollowUpLabel(customer: Customer): string {
  const rule = FOLLOW_UP_RULES.find((entry) => entry.match(customer));
  if (rule) return rule.label;
  if (customer.programStatus === 'Active') return 'Care program';
  if (customer.status === 'Follow Up Needed') return 'Follow-up';
  return 'Review';
}

function getAppointmentWindow(dateIso: string): 'today' | 'tomorrow' | 'upcoming' {
  const now = new Date();
  const target = new Date(dateIso);
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffDays = Math.round((startOfTarget - startOfNow) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return 'upcoming';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(isoDate: string): string {
  const now = new Date('2026-06-06');
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? 's' : ''} ago`;
}

function formatSpend(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function isInDateRange(isoDate: string, range: string): boolean {
  if (range === 'all') return true;
  const now = new Date('2026-06-06');
  const then = new Date(isoDate);
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (range === '30') return days <= 30;
  if (range === '30-90') return days > 30 && days <= 90;
  if (range === '90-180') return days > 90 && days <= 180;
  if (range === '180+') return days > 180;
  return true;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CustomerStatus,
  { bg: string; text: string; dot: string; border: string; icon?: React.ReactNode }
> = {
  Active: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  Inactive: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  'New Lead': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-500/25',
  },
  'Follow Up Needed': {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-500',
    border: 'border-red-500/25',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: CustomerStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon ?? <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
      {status}
    </span>
  );
};

const Avatar: React.FC<{ name: string; color: string; size?: 'sm' | 'md' }> = ({
  name,
  color,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
    >
      {getInitials(name)}
    </div>
  );
};

// ─── Stat Chip ────────────────────────────────────────────────────────────────

const StatChip: React.FC<{
  label: string;
  value: number | string;
  dot?: string;
  icon?: React.ReactNode;
}> = ({ label, value, dot, icon }) => (
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
    {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span className="text-slate-500 text-[12px] font-medium">{label}</span>
    <span className="text-slate-800 text-[13px] font-bold">{value}</span>
  </div>
);

// ─── Sort Icon ────────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ field: SortField; active: SortField; dir: SortDir }> = ({
  field,
  active,
  dir,
}) => {
  if (active !== field)
    return (
      <span className="flex flex-col gap-[1px] opacity-25">
        <ChevronUp size={10} />
        <ChevronDown size={10} />
      </span>
    );
  return dir === 'asc' ? (
    <ChevronUp size={12} className="text-indigo-400" />
  ) : (
    <ChevronDown size={12} className="text-indigo-400" />
  );
};

// ─── Customer Modal ───────────────────────────────────────────────────────────

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
  onSave: (c: Customer) => void;
}

const EMPTY_CUSTOMER: Customer = {
  id: '',
  name: '',
  phone: '',
  lastVisit: new Date().toISOString().split('T')[0],
  service: '',
  totalSpend: 0,
  status: 'Active',
  notes: '',
  avatarColor: AVATAR_COLORS[0],
  problemTeeth: [],
  xrays: [],
  beforeAfterPhotos: [],
  allergies: [],
  medicalConditions: [],
  toothNotes: {},
  toothConditions: {},
  vitals: { bp: '', pulse: '', temp: '' },
};

const getInitialForm = (customer?: Customer): Customer => {
  if (!customer) return { ...EMPTY_CUSTOMER };
  return {
    ...customer,
    problemTeeth: customer.problemTeeth || [],
    xrays: customer.xrays || [],
    beforeAfterPhotos: customer.beforeAfterPhotos || [],
    allergies: customer.allergies || [],
    medicalConditions: customer.medicalConditions || [],
    toothNotes: customer.toothNotes || {},
    toothConditions: customer.toothConditions || {},
    vitals: customer.vitals || { bp: '', pulse: '', temp: '' },
  };
};

const getToothName = (num: number): string => {
  const code = num % 10;
  const quadrant = Math.floor(num / 10);
  const quadNames = ["", "Upper Right", "Upper Left", "Lower Left", "Lower Right"];
  const toothNames = [
    "",
    "Central Incisor",
    "Lateral Incisor",
    "Canine",
    "First Premolar",
    "Second Premolar",
    "First Molar",
    "Second Molar",
    "Third Molar (Wisdom)"
  ];
  return `${quadNames[quadrant]} ${toothNames[code]} (Tooth ${num})`;
};

interface Procedure {
  name: string;
  category: 'Therapeutic' | 'Cosmetic';
  defaultCost: number;
  gstRate: number; // 0 or 18
}

const PROCEDURES_CATALOG: Procedure[] = [
  { name: 'Root Canal Treatment (RCT)', category: 'Therapeutic', defaultCost: 3500, gstRate: 0 },
  { name: 'Composite Filling / Restoration', category: 'Therapeutic', defaultCost: 1500, gstRate: 0 },
  { name: 'Dental Implant Placement', category: 'Therapeutic', defaultCost: 25000, gstRate: 0 },
  { name: 'PFM Crown / Cap', category: 'Therapeutic', defaultCost: 4000, gstRate: 0 },
  { name: 'Zirconia Premium Crown', category: 'Therapeutic', defaultCost: 8000, gstRate: 0 },
  { name: 'Scaling & Deep Polishing', category: 'Therapeutic', defaultCost: 1200, gstRate: 0 },
  { name: 'Laser Teeth Whitening', category: 'Cosmetic', defaultCost: 12000, gstRate: 18 },
  { name: 'Clear Aligners (Standard)', category: 'Cosmetic', defaultCost: 45000, gstRate: 18 },
  { name: 'Clear Aligners (Premium)', category: 'Cosmetic', defaultCost: 85000, gstRate: 18 }
];

const CustomerModal: React.FC<CustomerModalProps> = ({ open, onClose, customer, onSave }) => {
  const { profile } = useSession();
  const isEdit = !!customer?.id;
  const [form, setForm] = useState<Customer>(() => getInitialForm(customer));
  const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'estimates'>('general');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // AI Scribe states
  const [scribeTranscript, setScribeTranscript] = useState('');
  const [scribeStatus, setScribeStatus] = useState<'idle' | 'listening' | 'analyzing' | 'done'>('idle');
  const recognitionRef = React.useRef<any>(null);
  const [showAdvancedClinical, setShowAdvancedClinical] = useState(false);

  // RVG slider state
  const [xraySliderPos, setXraySliderPos] = useState(50);
  const [teethPhotoSliderPos, setTeethPhotoSliderPos] = useState(50);

  // Estimate builder states
  const [estimateItems, setEstimateItems] = useState<Array<{ tooth?: number; procedure: string; cost: number; isCosmetic: boolean }>>([]);
  const [estimateDiscount, setEstimateDiscount] = useState(0);
  const [estimateStatus, setEstimateStatus] = useState<'Draft' | 'Sent' | 'Approved'>('Draft');
  
  // Selected builder item
  const [builderTooth, setBuilderTooth] = useState<string>('');
  const [builderProcedureIdx, setBuilderProcedureIdx] = useState<string>('0');
  const [builderCost, setBuilderCost] = useState<number>(3500);
  const [copiedEstimate, setCopiedEstimate] = useState(false);
  const [showEstimateBuilder, setShowEstimateBuilder] = useState(false);

  React.useEffect(() => {
    setForm(getInitialForm(customer));
    setActiveTab('general');
    setScribeTranscript('');
    setScribeStatus('idle');
    setShowAdvancedClinical(false);
    setCopiedEstimate(false);
    setShowEstimateBuilder(false);
    
    if (customer?.estimates && customer.estimates.length > 0) {
      const activeEst = customer.estimates[0];
      setEstimateItems(activeEst.items || []);
      setEstimateDiscount(activeEst.discount || 0);
      setEstimateStatus(activeEst.status || 'Draft');
    } else {
      setEstimateItems([]);
      setEstimateDiscount(0);
      setEstimateStatus('Draft');
    }
  }, [customer, open]);

  const calculatedSubtotal = useMemo(() => {
    return estimateItems.reduce((sum, item) => sum + item.cost, 0);
  }, [estimateItems]);

  const calculatedDiscountAmount = useMemo(() => {
    return Math.round((calculatedSubtotal * estimateDiscount) / 100);
  }, [calculatedSubtotal, estimateDiscount]);

  const calculatedGST = useMemo(() => {
    return estimateItems.reduce((taxSum, item) => {
      if (!item.isCosmetic) return taxSum;
      const discountedItemCost = item.cost - (item.cost * estimateDiscount) / 100;
      return taxSum + Math.round(discountedItemCost * 0.18);
    }, 0);
  }, [estimateItems, estimateDiscount]);

  const calculatedGrandTotal = useMemo(() => {
    return calculatedSubtotal - calculatedDiscountAmount + calculatedGST;
  }, [calculatedSubtotal, calculatedDiscountAmount, calculatedGST]);

  const startScribeSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or use the mock presets.");
      return;
    }
    setScribeStatus('listening');
    setScribeTranscript('Listening to your consultation... Speak now.');
    
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN'; // Indian accent focus
    
    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setScribeTranscript(resultText);
      setScribeStatus('done');
    };
    
    rec.onerror = (err: any) => {
      console.error(err);
      setScribeStatus('done');
      setScribeTranscript('Speech recognition error. Please select a mock preset or type manual notes.');
    };
    
    rec.onend = () => {
      setScribeStatus((prev) => prev === 'listening' ? 'done' : prev);
    };
    
    recognitionRef.current = rec;
    rec.start();
  };

  const stopScribeSpeech = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setScribeStatus('done');
  };

  const parseScribeTranscript = (text: string) => {
    if (!text.trim()) return;
    setScribeStatus('analyzing');
    
    setTimeout(() => {
      const lower = text.toLowerCase();
      // Match FDI numbers (11 to 48)
      const toothMatches = lower.match(/\b(11|12|13|14|15|16|17|18|21|22|23|24|25|26|27|28|31|32|33|34|35|36|37|38|41|42|43|44|45|46|47|48)\b/g);
      
      const newProblemTeeth = [...(form.problemTeeth || [])];
      const newConditions = { ...form.toothConditions };
      const newNotes = { ...form.toothNotes };
      
      let taggedCount = 0;
      
      if (toothMatches) {
        toothMatches.forEach((toothStr) => {
          const t = parseInt(toothStr, 10);
          if (!newProblemTeeth.includes(t)) {
            newProblemTeeth.push(t);
          }
          
          // Determine pathology/treatment
          let condition = 'Decayed / Cavity';
          let noteText = 'Diagnosed via AI Scribe';
          
          if (lower.includes('root canal') || lower.includes('rct') || lower.includes('root-canal')) {
            condition = 'Root Canal Needed';
            noteText = 'Root canal therapy required';
          } else if (lower.includes('implant')) {
            condition = 'Dental Implant';
            noteText = 'Implant replacement planned';
          } else if (lower.includes('crown') || lower.includes('bridge')) {
            condition = 'Crown / Bridge';
            noteText = 'Restoration crown required';
          } else if (lower.includes('missing') || lower.includes('extract')) {
            condition = 'Missing Tooth';
            noteText = 'Missing tooth area';
          } else if (lower.includes('healthy') || lower.includes('clean')) {
            condition = 'Healthy / Treated';
            noteText = 'Checked & clean';
          }
          
          newConditions[t] = condition;
          newNotes[t] = noteText;
          taggedCount++;
        });
      }
      
      handleChange('problemTeeth', newProblemTeeth.sort((a, b) => a - b));
      handleChange('toothConditions', newConditions);
      handleChange('toothNotes', newNotes);
      setScribeStatus('done');
      
      if (taggedCount > 0) {
        alert(`AI Scribe analyzed consultation: successfully tagged ${taggedCount} teeth in the chart.`);
      } else {
        alert("AI Scribe did not detect any FDI tooth numbers (11-48) in the voice note. Please try a preset!");
      }
    }, 1200);
  };

  const handleChange = (field: keyof Customer, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToothToggle = (toothNum: number) => {
    const activeTeeth = form.problemTeeth || [];
    if (activeTeeth.includes(toothNum)) {
      handleChange('problemTeeth', activeTeeth.filter((t) => t !== toothNum));
    } else {
      handleChange('problemTeeth', [...activeTeeth, toothNum].sort((a, b) => a - b));
    }
  };

  const handleXrayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('xrays', [...(form.xrays || []), reader.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveXray = (idxToRemove: number) => {
    handleChange('xrays', (form.xrays || []).filter((_, idx) => idx !== idxToRemove));
  };

  const handleTeethPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('beforeAfterPhotos', [...(form.beforeAfterPhotos || []), reader.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveTeethPhoto = (idxToRemove: number) => {
    handleChange('beforeAfterPhotos', (form.beforeAfterPhotos || []).filter((_, idx) => idx !== idxToRemove));
  };

  const handleSave = () => {
    // Generate/update estimate object if items exist
    const estimateObj = {
      id: customer?.estimates?.[0]?.id || `est_${Date.now()}`,
      date: customer?.estimates?.[0]?.date || new Date().toISOString().split('T')[0],
      items: estimateItems,
      discount: estimateDiscount,
      tax: calculatedGST,
      grandTotal: calculatedGrandTotal,
      status: estimateStatus
    };

    const newCustomer: Customer = {
      ...form,
      id: form.id || String(Date.now()),
      avatarColor: form.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      problemTeeth: form.problemTeeth || [],
      xrays: form.xrays || [],
      allergies: form.allergies || [],
      medicalConditions: form.medicalConditions || [],
      toothNotes: form.toothNotes || {},
      toothConditions: form.toothConditions || {},
      vitals: form.vitals || { bp: '', pulse: '', temp: '' },
      estimates: estimateItems.length > 0 ? [estimateObj] : (form.estimates || []),
    };
    onSave(newCustomer);
    onClose();
  };

  const inputBase =
    'w-full px-3 py-2.5 rounded-lg text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/50';
  const inputStyle = {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
  };
  const inputFocusStyle = 'focus:border-indigo-500/40';

  // FDI World Dental Federation notation quadrants
  const quad1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const quad2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const quad4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const quad3 = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="max-w-2xl border-0 p-0 overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          aria-describedby={undefined}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Header */}
                <div
                  className="px-4 sm:px-6 pt-5 pb-3"
                  style={{ borderBottom: '1px solid #E2E8F0' }}
                >
                  <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 text-left">
                    <div className="text-left">
                      <DialogTitle className="text-slate-800 text-[16px] font-semibold tracking-tight">
                        {isEdit ? 'Patient Record' : 'Add Patient'}
                      </DialogTitle>
                      <p className="text-slate-500 text-[12px] mt-0.5">
                        {isEdit
                          ? 'Update intake and consultation notes'
                          : 'Enter patient details before treatment'}
                      </p>
                    </div>

                    {/* Tab Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-0.5 overflow-x-auto scrollbar-none flex-nowrap shrink-0 self-start sm:self-auto w-full sm:w-auto sm:mr-6">
                      <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 shrink-0 ${
                          activeTab === 'general'
                            ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Before Treatment
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('medical')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1 shrink-0 ${
                          activeTab === 'medical'
                            ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Stethoscope size={10} />
                        After Consultation
                      </button>
                      {isEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveTab('estimates')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1 shrink-0 ${
                              activeTab === 'estimates'
                                ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <StickyNote size={10} />
                            Billing & Estimates
                          </button>
                        </>
                      )}
                    </div>
                  </DialogHeader>
                </div>

                {/* Body - General Tab */}
                {activeTab === 'general' && (
                  <div className="px-4 sm:px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Name + Phone row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={inputStyle}
                          placeholder="e.g. Rahul Sharma"
                          value={form.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Phone <span className="text-red-400">*</span>
                        </label>
                        <input
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={inputStyle}
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Last Visit + Service */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Visit Date
                        </label>
                        <input
                          type="date"
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={{ ...inputStyle, colorScheme: 'light' }}
                          value={form.lastVisit}
                          onChange={(e) => handleChange('lastVisit', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Planned Treatment / Reason
                        </label>
                        <input
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={inputStyle}
                          placeholder="e.g. Tooth pain, cleaning, RCT consultation"
                          value={form.service}
                          onChange={(e) => handleChange('service', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Spend + Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Advance / Paid (₹)
                        </label>
                        <input
                          type="number"
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={inputStyle}
                          placeholder="e.g. 12500"
                          value={form.totalSpend || ''}
                          onChange={(e) => handleChange('totalSpend', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                          Visit Stage
                        </label>
                        <select
                          className={`${inputBase} ${inputFocusStyle} cursor-pointer`}
                          style={inputStyle}
                          value={form.status}
                          onChange={(e) => handleChange('status', e.target.value as CustomerStatus)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} style={{ background: '#0D1220' }}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">
                        Complaint / Notes
                      </label>
                      <textarea
                        className={`${inputBase} ${inputFocusStyle} resize-none`}
                        style={inputStyle}
                        rows={3}
                        placeholder="Any complaint, pain, or front-desk note..."
                        value={form.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Body - Medical tab */}
                {activeTab === 'medical' && (
                  <div className="px-4 sm:px-6 py-5 space-y-5 max-h-[72vh] sm:max-h-[60vh] overflow-y-auto">
                    {/* AI Dental Scribe (Voice to Chart) */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                            <Mic size={12} className="text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">AI Dental Scribe</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Use after consultation to capture treatment, next visit, and prescription quickly</p>
                          </div>
                        </div>

                        {scribeStatus === 'listening' ? (
                          <button
                            type="button"
                            onClick={stopScribeSpeech}
                            className="w-full sm:w-auto px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5 animate-pulse"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Stop Recording
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startScribeSpeech}
                            disabled={scribeStatus === 'analyzing'}
                            className="w-full sm:w-auto px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-bold text-indigo-600 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Mic size={11} />
                            Start AI Scribe
                          </button>
                        )}
                      </div>

                      {/* Transcript Window */}
                      {(scribeTranscript || scribeStatus === 'listening') && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                          <p className="text-[11.5px] font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {scribeTranscript}
                          </p>

                          {scribeStatus === 'done' && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => parseScribeTranscript(scribeTranscript)}
                                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[11px] font-bold transition-all shadow-md shadow-indigo-500/20"
                              >
                                Analyze & Tag Chart
                              </button>
                            </div>
                          )}

                          {scribeStatus === 'analyzing' && (
                            <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-medium font-mono">
                              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Analyzing EMR symptoms & extracting teeth...
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mock consult presets */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">Voice Dictation Presets</span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Tooth 14 Filling', text: 'Tooth 14 deep cavity, filling done today, prescribe medicines, review after one week.' },
                            { label: 'Tooth 15 RCT', text: 'Tooth 15 RCT completed, advise soft food and pain medicine, next appointment after 7 days.' },
                            { label: 'Tooth 46 Implant', text: 'Tooth 46 implant discussed, schedule next visit, share estimate and pre-op instructions.' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setScribeTranscript(preset.text);
                                setScribeStatus('done');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 rounded text-[10.5px] text-slate-600 hover:text-slate-900 transition-all text-left"
                            >
                              🎤 {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Medical Alerts (if any are active) */}
                    {((form.allergies && form.allergies.length > 0) || (form.medicalConditions && form.medicalConditions.length > 0)) && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0 mt-0.5 animate-pulse">
                          <Stethoscope size={16} />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-[12px] font-bold text-rose-400 uppercase tracking-wider">Medical Alerts</h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {form.allergies && form.allergies.length > 0 && (
                              <span className="block"><strong>⚠️ ALLERGIES:</strong> {form.allergies.join(', ')}</span>
                            )}
                            {form.medicalConditions && form.medicalConditions.length > 0 && (
                              <span className="block mt-0.5"><strong>⚠️ CONDITIONS:</strong> {form.medicalConditions.join(', ')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Advanced Clinical Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Advanced Clinical Details</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 sm:hidden">Collapsed on phones to keep the consultation flow fast.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAdvancedClinical((prev) => !prev)}
                          className="sm:hidden text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg"
                        >
                          {showAdvancedClinical ? 'Hide' : 'Show'}
                        </button>
                      </div>

                      <div className={`${showAdvancedClinical ? 'block' : 'hidden'} sm:block space-y-4`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Allergies Checklist */}
                          <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-4 space-y-3">
                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Allergies</h4>
                            <div className="grid grid-cols-1 gap-2.5">
                              {['Penicillin', 'Latex', 'Local Anesthetics', 'Sulfa'].map((allergy) => {
                                const hasAllergy = (form.allergies || []).includes(allergy);
                                return (
                                  <label key={allergy} className="flex items-center gap-2.5 cursor-pointer select-none text-[12px] text-slate-600 hover:text-slate-800 transition-colors">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = form.allergies || [];
                                        const next = current.includes(allergy)
                                          ? current.filter((a) => a !== allergy)
                                          : [...current, allergy];
                                        handleChange('allergies', next);
                                      }}
                                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                        hasAllergy
                                          ? 'bg-rose-50 border-rose-300 text-rose-600'
                                          : 'bg-white border-slate-200 text-transparent hover:bg-slate-50'
                                      }`}
                                    >
                                      {hasAllergy && <span className="text-[9px] leading-none">✓</span>}
                                    </button>
                                    <span className="truncate">{allergy}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Medical Conditions Checklist */}
                          <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-4 space-y-3">
                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Medical Conditions</h4>
                            <div className="grid grid-cols-1 gap-2.5">
                              {['Hypertension', 'Diabetes', 'Bleeding Disorders', 'Cardiac Pacemaker', 'Asthma'].map((cond) => {
                                const hasCond = (form.medicalConditions || []).includes(cond);
                                return (
                                  <label key={cond} className="flex items-center gap-2.5 cursor-pointer select-none text-[12px] text-slate-600 hover:text-slate-800 transition-colors">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = form.medicalConditions || [];
                                        const next = current.includes(cond)
                                          ? current.filter((c) => c !== cond)
                                          : [...current, cond];
                                        handleChange('medicalConditions', next);
                                      }}
                                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                        hasCond
                                          ? 'bg-rose-50 border-rose-300 text-rose-600'
                                          : 'bg-white border-slate-200 text-transparent hover:bg-slate-50'
                                      }`}
                                    >
                                      {hasCond && <span className="text-[9px] leading-none">✓</span>}
                                    </button>
                                    <span className="truncate">{cond}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-4 space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Vitals</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Blood Pressure</label>
                              <input
                                className="w-full px-2.5 py-2 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 bg-white border border-slate-200 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. 120/80 mmHg"
                                value={form.vitals?.bp || ''}
                                onChange={(e) => {
                                  handleChange('vitals', { ...form.vitals, bp: e.target.value });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Pulse / Heart Rate</label>
                              <input
                                className="w-full px-2.5 py-2 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 bg-white border border-slate-200 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. 72 bpm"
                                value={form.vitals?.pulse || ''}
                                onChange={(e) => {
                                  handleChange('vitals', { ...form.vitals, pulse: e.target.value });
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Body Temp (°F)</label>
                              <input
                                className="w-full px-2.5 py-2 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 bg-white border border-slate-200 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. 98.6 °F"
                                value={form.vitals?.temp || ''}
                                onChange={(e) => {
                                  handleChange('vitals', { ...form.vitals, temp: e.target.value });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tooth Chart Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Interactive Dental Chart</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Click teeth to toggle decay, crowns, or extraction problem areas (FDI numbering)</p>
                        </div>
                        {form.problemTeeth && form.problemTeeth.length > 0 && (
                          <button
                            onClick={() => handleChange('problemTeeth', [])}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                          >
                            <RotateCcw size={10} /> Clear All
                          </button>
                        )}
                      </div>

                      {/* Tooth Chart Layout Grid */}
                      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
                        <div className="min-w-0 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 justify-center items-center relative">
                          {/* Midline guides */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 pointer-events-none" />
                          <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200 pointer-events-none" />

                        {/* UPPER ARCH */}
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center w-full">
                          {/* Upper Right Quadrant (UR: 18 -> 11) */}
                          <div className="flex items-center gap-[1px] sm:gap-1.5 justify-end flex-1">
                            {quad1.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-[18px] h-[18px] sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p className="text-[11px] font-medium text-white">{getToothName(num)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>

                          {/* midline divider */}
                          <div className="w-[1px] h-8 bg-indigo-500/20" />

                          {/* Upper Left Quadrant (UL: 21 -> 28) */}
                          <div className="flex items-center gap-[1px] sm:gap-1.5 justify-start flex-1">
                            {quad2.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-[18px] h-[18px] sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p className="text-[11px] font-medium text-white">{getToothName(num)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>

                        {/* LOWER ARCH */}
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center w-full">
                          {/* Lower Right Quadrant (LR: 48 -> 41) */}
                          <div className="flex items-center gap-[1px] sm:gap-1.5 justify-end flex-1">
                            {quad4.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-[18px] h-[18px] sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p className="text-[11px] font-medium text-white">{getToothName(num)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>

                          {/* midline divider */}
                          <div className="w-[1px] h-8 bg-indigo-500/20" />

                          {/* Lower Left Quadrant (LL: 31 -> 38) */}
                          <div className="flex items-center gap-[1px] sm:gap-1.5 justify-start flex-1">
                            {quad3.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-[18px] h-[18px] sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p className="text-[11px] font-medium text-white">{getToothName(num)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                      {/* Selected teeth details */}
                      {form.problemTeeth && form.problemTeeth.length > 0 ? (
                        <div className="space-y-3 bg-rose-50/[0.3] border border-rose-100 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold uppercase tracking-widest text-rose-400">Tooth-Specific Chart Details</span>
                            <span className="text-[9.5px] text-slate-450 font-medium">({form.problemTeeth.length} flagged teeth)</span>
                          </div>
                          
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {form.problemTeeth.map((t) => {
                              const condition = form.toothConditions?.[t] || 'Decayed / Cavity';
                              const note = form.toothNotes?.[t] || '';
                              
                              return (
                                <div key={t} className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[12px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                                        🦷 Tooth {t}
                                      </span>
                                      <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={getToothName(t)}>
                                        {getToothName(t).split(' (Tooth ')[0]}
                                      </span>
                                    </div>
                                    
                                    {/* Condition Select */}
                                    <select
                                      value={condition}
                                      onChange={(e) => {
                                        const conditions = { ...form.toothConditions, [t]: e.target.value };
                                        handleChange('toothConditions', conditions);
                                      }}
                                      className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 px-2 py-1 rounded-md outline-none cursor-pointer"
                                    >
                                      <option value="Decayed / Cavity">Decayed / Cavity</option>
                                      <option value="Root Canal Needed">Root Canal Needed</option>
                                      <option value="Crown / Bridge">Crown / Bridge</option>
                                      <option value="Missing Tooth">Missing Tooth</option>
                                      <option value="Dental Implant">Dental Implant</option>
                                      <option value="Healthy / Treated">Healthy / Treated</option>
                                    </select>
                                  </div>
                                  
                                  {/* Note text input */}
                                  <input
                                    type="text"
                                    placeholder="Enter pathology or treatment notes..."
                                    value={note}
                                    onChange={(e) => {
                                      const notes = { ...form.toothNotes, [t]: e.target.value };
                                      handleChange('toothNotes', notes);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg text-[11.5px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/40 bg-white border border-slate-200 focus:border-indigo-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-3.5 text-center text-slate-400 text-[11px]">
                          No teeth selected. Click teeth in the chart above to mark problems.
                        </div>
                      )}
                    </div>

                    {/* X-Ray Section */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Patient X-Rays / Radiographs</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Attach medical panoramic scans or individual tooth radiographs to this record</p>
                      </div>

                      {/* Uploader dropzone */}
                      <label className="border border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/[0.04] rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 group">
                        <Upload size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-[12px] font-semibold text-slate-650 group-hover:text-slate-800 transition-colors">Upload X-Ray Image</span>
                        <span className="text-[10px] text-slate-400">Supports PNG, JPG (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleXrayUpload}
                          className="hidden"
                        />
                      </label>

                      {/* X-Ray preview gallery */}
                      {form.xrays && form.xrays.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {form.xrays.map((xray, idx) => (
                            <div key={idx} className="relative aspect-[16/11] rounded-xl overflow-hidden border border-slate-200 bg-neutral-900 group">
                              <img src={xray} alt="Patient X-Ray Scan" className="w-full h-full object-cover" />
                              {/* Hover overlay with zoom and delete options */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-150">
                                <button
                                  type="button"
                                  onClick={() => setLightboxImg(xray)}
                                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveXray(idx)}
                                  className="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl py-4 text-center text-slate-400 text-[11px]">
                          No radiographs attached. Use the uploader above to add scans.
                        </div>
                      )}

                      {/* RVG Compare Slider sandbox */}
                      {form.xrays && form.xrays.length >= 2 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={11} className="text-indigo-400" />
                              RVG Compare Sandbox (Before vs After)
                            </span>
                            <span className="text-[10px] text-slate-500">Drag slider to review treatment margins</span>
                          </div>
                          
                          {/* Interactive Slider Container */}
                          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-200 bg-neutral-900 select-none">
                            {/* Before Image (underneath) */}
                            <img src={form.xrays[0]} alt="Before treatment RVG" className="absolute inset-0 w-full h-full object-cover" />
                            
                            {/* After Image (overlay) */}
                            <div 
                              className="absolute inset-y-0 left-0 overflow-hidden" 
                              style={{ width: `${xraySliderPos}%` }}
                            >
                              <img 
                                src={form.xrays[1]} 
                                alt="After treatment RVG" 
                                className="absolute inset-y-0 left-0 w-full h-full object-cover"
                                style={{ width: '100%', maxWidth: 'none' }} 
                              />
                            </div>
                            
                            {/* Slider Handle */}
                            <div 
                              className="absolute inset-y-0 w-1 bg-indigo-500 cursor-ew-resize flex items-center justify-center"
                              style={{ left: `${xraySliderPos}%` }}
                            >
                              <div className="w-6 h-6 rounded-full bg-indigo-500 border border-white/25 flex items-center justify-center text-white text-[10px] shadow-lg">
                                ↔
                              </div>
                            </div>
                            
                            {/* Invisible range inputs overlay */}
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={xraySliderPos}
                              onChange={(e) => setXraySliderPos(Number(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                            />
                            
                            {/* Labels */}
                            <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] font-bold text-rose-300">
                              Pre-Op / Before
                            </span>
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] font-bold text-emerald-300">
                              Post-Op / After
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Before & After Photos Section */}
                    <div className="space-y-3 pt-2">
                      <div>
                        <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Before & After Teeth Photos (Optional)</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Attach clinical photographs showing teeth condition before and after treatment</p>
                      </div>

                      {/* Uploader dropzone */}
                      <label className="border border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/[0.04] rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 group">
                        <Upload size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-[12px] font-semibold text-slate-650 group-hover:text-slate-800 transition-colors">Upload Teeth Photo</span>
                        <span className="text-[10px] text-slate-400">Supports PNG, JPG (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleTeethPhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Photo preview gallery */}
                      {form.beforeAfterPhotos && form.beforeAfterPhotos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {form.beforeAfterPhotos.map((photo, idx) => (
                            <div key={idx} className="relative aspect-[16/11] rounded-xl overflow-hidden border border-slate-200 bg-neutral-900 group">
                              <img src={photo} alt="Teeth Photo" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-150">
                                <button
                                  type="button"
                                  onClick={() => setLightboxImg(photo)}
                                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeethPhoto(idx)}
                                  className="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl py-4 text-center text-slate-400 text-[11px]">
                          No teeth photos attached. Use the uploader above to add photographs.
                        </div>
                      )}

                      {/* Slider Compare sandbox for Teeth Photos */}
                      {form.beforeAfterPhotos && form.beforeAfterPhotos.length >= 2 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={11} className="text-indigo-400" />
                              Before vs After Teeth Comparison
                            </span>
                            <span className="text-[10px] text-slate-500">Drag slider to see cosmetic treatment transformation</span>
                          </div>
                          
                          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-200 bg-neutral-900 select-none">
                            {/* Before Image */}
                            <img src={form.beforeAfterPhotos[0]} alt="Before treatment" className="absolute inset-0 w-full h-full object-cover" />
                            
                            {/* After Image */}
                            <div 
                              className="absolute inset-y-0 left-0 overflow-hidden" 
                              style={{ width: `${teethPhotoSliderPos}%` }}
                            >
                              <img 
                                src={form.beforeAfterPhotos[1]} 
                                alt="After treatment" 
                                className="absolute inset-y-0 left-0 w-full h-full object-cover"
                                style={{ width: '100%', maxWidth: 'none' }} 
                              />
                            </div>
                            
                            {/* Slider Handle */}
                            <div 
                              className="absolute inset-y-0 w-1 bg-indigo-500 cursor-ew-resize flex items-center justify-center"
                              style={{ left: `${teethPhotoSliderPos}%` }}
                            >
                              <div className="w-6 h-6 rounded-full bg-indigo-500 border border-white/25 flex items-center justify-center text-white text-[10px] shadow-lg">
                                ↔
                              </div>
                            </div>
                            
                            {/* Invisible range inputs overlay */}
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={teethPhotoSliderPos}
                              onChange={(e) => setTeethPhotoSliderPos(Number(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                            />
                            
                            {/* Labels */}
                            <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] font-bold text-rose-300">
                              Before / Pre-Op
                            </span>
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] font-bold text-emerald-300">
                              After / Post-Op
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Body - Post Consultation tab */}
                {activeTab === 'estimates' && (
                  <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {!showEstimateBuilder ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-3">
                          <StickyNote size={18} />
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-1">Treatment Summary & Billing</h4>
                        <p className="text-[11px] text-slate-500 text-center max-w-sm mb-4">
                          Log completed procedures, teeth/areas, professional concessions, and preview patient records.
                        </p>
                        {estimateItems.length > 0 && (
                          <div className="mb-4 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            Active: {estimateItems.length} item{estimateItems.length > 1 ? 's' : ''} logged · Final: ₹{calculatedGrandTotal.toLocaleString('en-IN')}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowEstimateBuilder(true)}
                          className="px-5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/20"
                          style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                          }}
                        >
                          Show Summary
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Treatment Summary Builder</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowEstimateBuilder(false)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold uppercase tracking-wider transition-colors"
                          >
                            Hide Summary
                          </button>
                        </div>

                        {/* Add Item Builder */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center">
                          <Plus size={12} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Treatment Done</h4>
                          <p className="text-[10px] text-slate-505 mt-0.5">Add the procedure completed after consultation</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        {/* Tooth selector */}
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Tooth / Area</label>
                          <select
                            value={builderTooth}
                            onChange={(e) => setBuilderTooth(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[12px] text-slate-700 outline-none cursor-pointer"
                          >
                            <option value="">General / No Tooth</option>
                            {(form.problemTeeth || []).map((t) => (
                              <option key={t} value={t}>Tooth {t} ({getToothName(t).split(' (Tooth ')[0]})</option>
                            ))}
                          </select>
                        </div>

                        {/* Procedure selector */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Procedure Done</label>
                          <select
                            value={builderProcedureIdx}
                            onChange={(e) => {
                              const idx = e.target.value;
                              setBuilderProcedureIdx(idx);
                              setBuilderCost(PROCEDURES_CATALOG[Number(idx)].defaultCost);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[12px] text-slate-700 outline-none cursor-pointer"
                          >
                            {PROCEDURES_CATALOG.map((p, idx) => (
                              <option key={idx} value={idx}>
                                {p.name} ({p.category === 'Cosmetic' ? '18% GST' : '0% GST'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cost */}
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Amount (₹)</label>
                          <input
                            type="number"
                            value={builderCost}
                            onChange={(e) => setBuilderCost(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-[12px] text-slate-800 outline-none transition-all focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const proc = PROCEDURES_CATALOG[Number(builderProcedureIdx)];
                            setEstimateItems((prev) => [
                              ...prev,
                              {
                                tooth: builderTooth ? Number(builderTooth) : undefined,
                                procedure: proc.name,
                                cost: builderCost,
                                isCosmetic: proc.category === 'Cosmetic'
                              }
                            ]);
                            setBuilderTooth('');
                          }}
                          className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-500/20"
                        >
                          <Plus size={11} /> Add to Estimate
                        </button>
                      </div>
                    </div>

                    {/* Estimate Items Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Current Treatment Summary</span>
                        <select
                          value={estimateStatus}
                          onChange={(e) => setEstimateStatus(e.target.value as any)}
                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md outline-none cursor-pointer"
                        >
                          <option value="Draft" style={{ background: '#fff', color: '#334155' }}>Draft</option>
                          <option value="Sent" style={{ background: '#fff', color: '#334155' }}>Shared</option>
                          <option value="Approved" style={{ background: '#fff', color: '#334155' }}>Approved</option>
                        </select>
                      </div>

                      {estimateItems.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {estimateItems.map((item, idx) => (
                            <div key={idx} className="px-4 py-3 flex items-center justify-between text-[12px] hover:bg-slate-50 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  {item.tooth && (
                                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 rounded">
                                      T{item.tooth}
                                    </span>
                                  )}
                                  <span className="text-slate-800 font-medium">{item.procedure}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>{item.isCosmetic ? 'Cosmetic Dental (18% GST)' : 'Therapeutic Care (0% GST)'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-slate-800 font-bold font-mono">₹{item.cost.toLocaleString('en-IN')}</span>
                                <button
                                  type="button"
                                  onClick={() => setEstimateItems((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-[11px] text-slate-400 border-b border-slate-200">
                          No treatment items added. Add procedures above to build the summary.
                        </div>
                      )}

                      {/* Calculations summary panel */}
                      <div className="bg-slate-50 p-4.5 space-y-2.5">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-mono">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Discount row */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 gap-4">
                          <span className="flex items-center gap-1.5 shrink-0">
                            Discount / Concession
                          </span>
                          <div className="flex items-center gap-2 justify-end w-full max-w-[180px]">
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={estimateDiscount}
                              onChange={(e) => setEstimateDiscount(Number(e.target.value))}
                              className="w-full accent-indigo-500"
                            />
                            <span className="font-mono text-slate-800 text-[11.5px] font-bold shrink-0">{estimateDiscount}%</span>
                          </div>
                        </div>

                        {calculatedDiscountAmount > 0 && (
                          <div className="flex justify-between text-[11px] text-rose-600">
                            <span>Discount Value</span>
                            <span className="font-mono">-₹{calculatedDiscountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>GST <span className="text-[9px] text-slate-400">(Cosmetic only)</span></span>
                          <span className="font-mono">₹{calculatedGST.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="h-px bg-slate-200 my-1.5" />

                        <div className="flex justify-between text-[13px] font-bold text-slate-800">
                          <span className="uppercase tracking-wider">Final Amount</span>
                          <span className="font-mono text-indigo-600">₹{calculatedGrandTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Estimate Proposal Generator */}
                    {estimateItems.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={11} className="text-indigo-400" />
                              WhatsApp Treatment Summary (Simulated)
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Copy message format to share treatment details after consultation</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const clinicName = profile?.business_name || 'Dental Clinic';
                              const summary = estimateItems.map((item) => `• ${item.procedure}${item.tooth ? ` (Tooth ${item.tooth})` : ''}: ₹${item.cost.toLocaleString('en-IN')}`).join('\n');
                              const text = `*${clinicName} - Treatment Summary*\n\nHi ${form.name},\n\nHere is your treatment summary:\n\n${summary}\n\n*Subtotal:* ₹${calculatedSubtotal.toLocaleString('en-IN')}\n*Discount (${estimateDiscount}%):* -₹${calculatedDiscountAmount.toLocaleString('en-IN')}\n*GST (Cosmetic):* ₹${calculatedGST.toLocaleString('en-IN')}\n*Final Amount:* ₹${calculatedGrandTotal.toLocaleString('en-IN')}\n\nPlease let us know your preferred next date.`;
                              navigator.clipboard.writeText(text);
                              setCopiedEstimate(true);
                              setTimeout(() => setCopiedEstimate(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[10.5px] font-bold text-indigo-600 flex items-center gap-1 transition-all"
                          >
                            {copiedEstimate ? 'Copied! ✓' : 'Copy Message'}
                          </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-[12px] font-mono leading-relaxed text-slate-700">
                          <span className="text-[10px] text-indigo-500 font-bold block">MESSAGE PREVIEW:</span>
                          <div className="whitespace-pre-wrap select-all bg-slate-50 p-2.5 rounded border border-slate-100">
                            <strong>{profile?.business_name || 'Dental Clinic'} - Treatment Summary</strong><br/><br/>
                            Hi {form.name},<br/><br/>
                            Here is your treatment summary:<br/>
                            {estimateItems.map((item, idx) => (
                              <span key={idx}>• {item.procedure}{item.tooth ? ` (Tooth ${item.tooth})` : ''}: ₹{item.cost.toLocaleString('en-IN')}<br/></span>
                            ))}
                            <br/>
                            <strong>Subtotal:</strong> ₹{calculatedSubtotal.toLocaleString('en-IN')}<br/>
                            <strong>Discount ({estimateDiscount}%):</strong> -₹{calculatedDiscountAmount.toLocaleString('en-IN')}<br/>
                            <strong>GST (Cosmetic):</strong> ₹{calculatedGST.toLocaleString('en-IN')}<br/>
                            <strong>Final Amount:</strong> ₹{calculatedGrandTotal.toLocaleString('en-IN')}<br/><br/>
                            Please let us know your preferred next date.
                          </div>
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                )}



                {/* Footer */}
                <div
                  className="px-6 py-4 flex items-center justify-end gap-3"
                  style={{ borderTop: '1px solid #E2E8F0' }}
                >
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-[13px] text-slate-500 hover:text-slate-700 rounded-lg transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.name || !form.phone}
                    className="px-5 py-2 text-[13px] font-semibold text-white rounded-lg transition-all duration-150 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
                  >
                    {isEdit ? 'Save Changes' : 'Add Patient'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      {lightboxImg && (
        <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
          <DialogContent
            className="max-w-4xl p-1 border-0 overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
          >
            <div className="relative w-full h-[70vh] flex items-center justify-center p-4">
              <img src={lightboxImg} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Patient X-Ray Radiograph scan Zoom" />
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-black/85 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;

const ReactivationCustomers: React.FC = () => {
  const { organizationId } = useSession();
  const clinicId = organizationId || '';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!clinicId) return;

    async function fetchPatients() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('dental_patients')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
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
            beforeAfterPhotos: d.before_after_photos || [],
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
          setCustomers(mapped);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, [clinicId]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [dateRange, setDateRange] = useState('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dismissedAppointmentIds, setDismissedAppointmentIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'Active').length;
    const inactive = customers.filter((c) => c.status === 'Inactive').length;
    return { total, active, inactive };
  }, [customers]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const inSevenDays = todayStart + 7 * 24 * 60 * 60 * 1000;

    return customers
      .map((customer) => {
        const nextVisitDate = getNextVisitDate(customer);
        if (!nextVisitDate) return null;

        const visitTime = new Date(nextVisitDate).getTime();
        const appointmentWindow = getAppointmentWindow(nextVisitDate);
        const isDueSoon = visitTime >= todayStart && visitTime <= inSevenDays;
        const isOverdue = visitTime < todayStart;

        if (!isDueSoon && !isOverdue) return null;
        if (dismissedAppointmentIds.has(customer.id)) return null;

        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          service: customer.service,
          nextVisitDate,
          appointmentWindow,
          dueLabel: getFollowUpLabel(customer),
          overdue: isOverdue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => new Date(a.nextVisitDate).getTime() - new Date(b.nextVisitDate).getTime())
      .slice(0, 4);
  }, [customers, dismissedAppointmentIds]);

  // ─── Filtering + Sorting ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    if (statusFilter !== 'All') {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (serviceFilter !== 'All Services') {
      list = list.filter((c) => c.service === serviceFilter);
    }

    if (dateRange !== 'all') {
      list = list.filter((c) => isInDateRange(c.lastVisit, dateRange));
    }

    if (sortField) {
      list.sort((a, b) => {
        let av: number, bv: number;
        if (sortField === 'lastVisit') {
          av = new Date(a.lastVisit).getTime();
          bv = new Date(b.lastVisit).getTime();
        } else {
          av = a.totalSpend;
          bv = b.totalSpend;
        }
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }

    return list;
  }, [customers, search, statusFilter, serviceFilter, dateRange, sortField, sortDir]);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleSelectAll = () => {
    if (pageRows.every((r) => selectedIds.has(r.id))) {
      const newSet = new Set(selectedIds);
      pageRows.forEach((r) => newSet.delete(r.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      pageRows.forEach((r) => newSet.add(r.id));
      setSelectedIds(newSet);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setModalOpen(true);
  };

  const handleCallPatient = (phone: string) => {
    if (!phone) return;
    window.open(`tel:${phone.replace(/[^\d+]/g, '')}`, '_self');
  };

  const handleWhatsAppPatient = (phone: string, name: string) => {
    if (!phone) return;
    const digits = phone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(`Hello ${name}, this is a reminder from the clinic for your upcoming appointment.`);
    window.open(`https://wa.me/${digits}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleMarkSeen = (id: string) => {
    setDismissedAppointmentIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleSave = useCallback(async (c: Customer) => {
    if (!clinicId) return;

    const dbRow = {
      clinic_id: clinicId,
      name: c.name,
      phone: c.phone,
      last_visit: c.lastVisit,
      service: c.service,
      total_spend: c.totalSpend,
      status: c.status,
      notes: c.notes,
      avatar_color: c.avatarColor,
      problem_teeth: c.problemTeeth || [],
      xrays: c.xrays || [],
      before_after_photos: c.beforeAfterPhotos || [],
      allergies: c.allergies || [],
      medical_conditions: c.medicalConditions || [],
      tooth_notes: c.toothNotes || {},
      tooth_conditions: c.toothConditions || {},
      vitals: c.vitals || {},
      active_program_id: c.activeProgramId || null,
      program_enrollment_date: c.programEnrollmentDate || null,
      program_current_step: c.programCurrentStep || null,
      program_status: c.programStatus || null,
      estimates: c.estimates || []
    };

    try {
      const isNew = !c.id || c.id.startsWith('sim-') || c.id === '';
      
      if (isNew) {
        // Insert patient into Supabase
        const { data, error } = await supabase
          .from('dental_patients')
          .insert([dbRow])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const mapped: Customer = {
            id: data.id,
            name: data.name,
            phone: data.phone,
            lastVisit: data.last_visit,
            service: data.service,
            totalSpend: Number(data.total_spend || 0),
            status: data.status,
            notes: data.notes,
            avatarColor: data.avatar_color,
            problemTeeth: data.problem_teeth || [],
            xrays: data.xrays || [],
            beforeAfterPhotos: data.before_after_photos || [],
            allergies: data.allergies || [],
            medicalConditions: data.medical_conditions || [],
            toothNotes: data.tooth_notes || {},
            toothConditions: data.tooth_conditions || {},
            vitals: data.vitals || {},
            activeProgramId: data.active_program_id,
            programEnrollmentDate: data.program_enrollment_date,
            programCurrentStep: data.program_current_step,
            programStatus: data.program_status,
            estimates: data.estimates || []
          };
          setCustomers((prev) => [mapped, ...prev]);
        }
      } else {
        // Update patient in Supabase
        const { data, error } = await supabase
          .from('dental_patients')
          .update(dbRow)
          .eq('id', c.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const mapped: Customer = {
            id: data.id,
            name: data.name,
            phone: data.phone,
            lastVisit: data.last_visit,
            service: data.service,
            totalSpend: Number(data.total_spend || 0),
            status: data.status,
            notes: data.notes,
            avatarColor: data.avatar_color,
            problemTeeth: data.problem_teeth || [],
            xrays: data.xrays || [],
            beforeAfterPhotos: data.before_after_photos || [],
            allergies: data.allergies || [],
            medicalConditions: data.medical_conditions || [],
            toothNotes: data.tooth_notes || {},
            toothConditions: data.tooth_conditions || {},
            vitals: data.vitals || {},
            activeProgramId: data.active_program_id,
            programEnrollmentDate: data.program_enrollment_date,
            programCurrentStep: data.program_current_step,
            programStatus: data.program_status,
            estimates: data.estimates || []
          };
          setCustomers((prev) => prev.map((x) => x.id === mapped.id ? mapped : x));
        }
      }
    } catch (err) {
      console.error('Error saving patient to database:', err);
    }
  }, [clinicId]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dental_patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    } catch (err) {
      console.error('Error deleting patient from database:', err);
    }
  };



  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setServiceFilter('All Services');
    setDateRange('all');
    setSortField(null);
    setSortDir('desc');
    setPage(1);
  };

  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));
  const somePageSelected = pageRows.some((r) => selectedIds.has(r.id));

  // ─── Dropdown select styling ──────────────────────────────────────────────
  const selectTriggerClass =
    'h-9 text-[12px] text-slate-600 bg-white border-slate-200 hover:bg-slate-50 focus:ring-indigo-500/30 rounded-lg transition-all duration-150 min-w-[130px]';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-5 min-h-full pb-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-800 tracking-tight">
                Patient Database
              </h1>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-300 tracking-wide shrink-0"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                {stats.total.toLocaleString('en-IN')} patients
              </span>
            </div>
            <p className="text-slate-500 text-[12px] sm:text-[13px] mt-1">
              Manage and track your patient relationships
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-start">
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              <Plus size={15} />
              Add Patient
            </button>
          </div>
        </motion.div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: 'easeOut' }}
          className="grid grid-cols-3 lg:flex lg:items-center gap-2 sm:gap-2.5 w-full"
        >
          <StatChip
            label="Total"
            value={stats.total.toLocaleString('en-IN')}
            icon={<Users size={13} className="text-slate-400" />}
          />
          <StatChip
            label="Active"
            value={stats.active.toLocaleString('en-IN')}
            dot="bg-emerald-500"
          />
          <StatChip
            label="Inactive"
            value={stats.inactive.toLocaleString('en-IN')}
            dot="bg-amber-500"
          />
        </motion.div>

        {/* ── Today’s Appointments ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.09, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Doctor Queue</p>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">Today&apos;s Appointments</h2>
            </div>
            <div className="text-[11px] text-slate-500">
              Based on patient follow-up and treatment history
            </div>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No appointments due today or in the next 7 days.
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {upcomingAppointments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[12px] text-slate-500 truncate">{item.phone}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.overdue
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : item.appointmentWindow === 'today'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {item.overdue ? 'Overdue' : item.appointmentWindow}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[12px]">
                    <span className="text-slate-500">{item.service}</span>
                    <span className="font-semibold text-slate-700">
                      {formatDate(item.nextVisitDate)}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    {item.dueLabel}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCallPatient(item.phone)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Phone size={12} />
                      Call
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppPatient(item.phone, item.name)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageSquare size={12} />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkSeen(item.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    >
                      <UserCheck size={12} />
                      Mark Seen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
          className="flex items-center gap-2.5 flex-wrap"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '12px 16px',
          }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/40"
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              className="text-slate-700"
            >
              <SelectItem value="All">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Service filter */}
          <Select
            value={serviceFilter}
            onValueChange={(v) => { setServiceFilter(v); setPage(1); }}
          >
            <SelectTrigger className={`${selectTriggerClass} min-w-[150px]`}>
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              className="text-slate-700 max-h-[260px] overflow-y-auto"
            >
              {SERVICES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <Select
            value={dateRange}
            onValueChange={(v) => { setDateRange(v); setPage(1); }}
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              className="text-slate-700"
            >
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-slate-400 hover:text-slate-600 transition-colors duration-150"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </motion.div>

        {/* ── Mobile Cards ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.14, ease: 'easeOut' }}
          className="md:hidden rounded-2xl overflow-hidden flex-1"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div className="p-3 space-y-3">
            {pageRows.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-[13px]">
                No patients match your filters.
              </div>
            ) : (
              pageRows.map((customer) => {
                const isSelected = selectedIds.has(customer.id);
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleOpenEdit(customer)}
                    className="w-full text-left rounded-2xl border p-4 transition-all duration-150 active:scale-[0.99]"
                    style={{
                      background: isSelected ? 'rgba(99,102,241,0.05)' : '#FFFFFF',
                      borderColor: isSelected ? 'rgba(99,102,241,0.25)' : '#E2E8F0',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar name={customer.name} color={customer.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[14px] font-semibold text-slate-800 truncate">
                              {customer.name}
                            </span>
                            {((customer.allergies && customer.allergies.length > 0) || (customer.medicalConditions && customer.medicalConditions.length > 0)) && (
                              <span
                                className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                                title="Clinical alert"
                              />
                            )}
                          </div>
                          <div className="mt-1 text-[12px] text-slate-500 font-mono">
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={customer.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Last visit</div>
                        <div className="text-slate-700 font-medium mt-0.5">{formatDate(customer.lastVisit)}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{timeAgo(customer.lastVisit)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">Paid so far</div>
                        <div className="text-emerald-500 font-semibold mt-0.5">{formatSpend(customer.totalSpend)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Treatment</div>
                      <div className="text-[13px] text-slate-700 mt-1">{customer.service}</div>
                      {customer.problemTeeth && customer.problemTeeth.length > 0 && (
                        <div className="mt-1 text-[11px] text-rose-400 font-semibold">
                          Teeth: {customer.problemTeeth.join(', ')}
                        </div>
                      )}
                    </div>

                    {customer.notes ? (
                      <p className="mt-3 text-[12px] text-slate-500 leading-relaxed line-clamp-2">
                        {customer.notes}
                      </p>
                    ) : (
                      <p className="mt-3 text-[12px] text-slate-300 italic">No notes</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.14, ease: 'easeOut' }}
          className="hidden md:block rounded-2xl overflow-hidden flex-1"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  {/* Checkbox */}
                  <th className="pl-5 pr-2 py-3.5 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {allPageSelected ? (
                        <CheckSquare size={15} className="text-indigo-500" />
                      ) : somePageSelected ? (
                        <CheckSquare size={15} className="text-slate-400" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </th>

                  {[
                    { label: 'Patient', w: 'min-w-[160px]', sortKey: null },
                    { label: 'Phone', w: 'min-w-[140px]', sortKey: null },
                    { label: 'Last Visit', w: 'min-w-[160px]', sortKey: 'lastVisit' as SortField },
                    { label: 'Service', w: 'min-w-[160px]', sortKey: null },
                    { label: 'Total Spend', w: 'min-w-[120px]', sortKey: 'totalSpend' as SortField },
                    { label: 'Status', w: 'min-w-[150px]', sortKey: null },
                    { label: 'Notes', w: 'min-w-[180px]', sortKey: null },
                    { label: '', w: 'w-12', sortKey: null },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`px-3 py-3.5 text-left ${col.w}`}
                    >
                      <button
                        className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase ${
                          col.sortKey ? 'cursor-pointer hover:text-slate-600' : 'cursor-default'
                        } text-slate-400 transition-colors duration-150`}
                        onClick={() => col.sortKey && handleSort(col.sortKey)}
                        disabled={!col.sortKey}
                      >
                        {col.label}
                        {col.sortKey && (
                          <SortIcon field={col.sortKey} active={sortField} dir={sortDir} />
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400 text-[13px]">
                        No customers match your filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((customer, i) => {
                      const isSelected = selectedIds.has(customer.id);
                      return (
                        <motion.tr
                          key={customer.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18, delay: i * 0.03, ease: 'easeOut' }}
                          onClick={() => handleOpenEdit(customer)}
                          className="group cursor-pointer transition-all duration-100"
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isSelected
                              ? 'rgba(99,102,241,0.05)'
                              : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected)
                              (e.currentTarget as HTMLTableRowElement).style.background =
                                '#F8FAFC';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = isSelected
                              ? 'rgba(99,102,241,0.07)'
                              : '';
                          }}
                        >
                          {/* Checkbox */}
                          <td className="pl-5 pr-2 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSelectRow(customer.id)}
                              className="text-slate-300 hover:text-slate-500 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare size={15} className="text-indigo-500" />
                              ) : (
                                <Square size={15} />
                              )}
                            </button>
                          </td>

                          {/* Name + Avatar */}
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={customer.name} color={customer.avatarColor} />
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-semibold text-slate-800 leading-tight">
                                    {customer.name}
                                  </span>
                                  {((customer.allergies && customer.allergies.length > 0) || (customer.medicalConditions && customer.medicalConditions.length > 0)) && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="Clinical Alert: Review medical history before treatment" />
                                  )}
                                </div>
                                {((customer.allergies && customer.allergies.length > 0) || (customer.medicalConditions && customer.medicalConditions.length > 0)) && (
                                  <div className="flex flex-wrap gap-1 mt-0.5 max-w-[200px]">
                                    {(() => {
                                      const allAlerts = [...(customer.allergies || []), ...(customer.medicalConditions || [])];
                                      const maxVisible = 1;
                                      const visible = allAlerts.slice(0, maxVisible);
                                      const extra = allAlerts.length - maxVisible;
                                      return (
                                        <>
                                          {visible.map((alert) => (
                                            <span key={alert} className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded text-[8.5px] font-extrabold uppercase tracking-widest text-rose-600">
                                              {alert}
                                            </span>
                                          ))}
                                          {extra > 0 && (
                                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8.5px] font-bold text-slate-500">
                                              +{extra}
                                            </span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] text-slate-500 font-mono tracking-wide">
                              {customer.phone}
                            </span>
                          </td>

                          {/* Last Visit */}
                          <td className="px-3 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12px] text-slate-700 font-medium">
                                {formatDate(customer.lastVisit)}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {timeAgo(customer.lastVisit)}
                              </span>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="px-3 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12px] text-slate-600">{customer.service}</span>
                              {customer.problemTeeth && customer.problemTeeth.length > 0 && (
                                <span className="text-[10px] text-rose-400 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
                                  🦷 Teeth: {customer.problemTeeth.join(', ')}
                                </span>
                              )}
                              {customer.xrays && customer.xrays.length > 0 && (
                                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider mt-0.5">
                                  📸 X-Ray Attached
                                </span>
                              )}
                              {customer.beforeAfterPhotos && customer.beforeAfterPhotos.length > 0 && (
                                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                                  🖼️ {customer.beforeAfterPhotos.length} Teeth Photo{customer.beforeAfterPhotos.length > 1 ? 's' : ''}
                                </span>
                              )}
                              {customer.vitals && (customer.vitals.bp || customer.vitals.pulse || customer.vitals.temp) && (
                                <span className="text-[9.5px] text-indigo-400 font-medium tracking-wide flex items-center gap-1 mt-0.5" title="Latest clinical vitals (BP, Heart Rate, Temperature)">
                                  🩺 {[
                                    customer.vitals.bp && `BP ${customer.vitals.bp}`,
                                    customer.vitals.pulse && `HR ${customer.vitals.pulse}`,
                                    customer.vitals.temp && `${customer.vitals.temp}`
                                  ].filter(Boolean).join(' | ')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Total Spend */}
                          <td className="px-3 py-3.5">
                            <span className="text-[13px] font-semibold text-emerald-400">
                              {formatSpend(customer.totalSpend)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3.5">
                            <StatusBadge status={customer.status} />
                          </td>

                          {/* Notes */}
                          <td className="px-3 py-3.5 max-w-[180px]">
                            {customer.notes ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-[12px] text-slate-500 truncate block max-w-[160px] cursor-default">
                                    {customer.notes}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-[240px] text-[12px] leading-relaxed"
                                  style={{
                                    background: '#1E293B',
                                    border: '1px solid #334155',
                                    color: '#F1F5F9',
                                  }}
                                >
                                  {customer.notes}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-[12px] text-slate-300 italic">No notes</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="px-3 py-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                  <MoreHorizontal size={15} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 text-[12px]"
                                style={{
                                  background: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  color: '#1E293B',
                                }}
                              >
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(customer)}
                                  className="gap-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Eye size={13} className="text-slate-400" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(customer)}
                                  className="gap-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <Edit3 size={13} className="text-slate-400" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                >
                                  <MessageSquare size={13} className="text-slate-400" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-200" />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(customer.id)}
                                  className="gap-2.5 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10"
                                >
                                  <Trash2 size={13} className="text-red-400" />
                                  <span className="text-red-400">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ── Pagination ───────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderTop: '1px solid #E2E8F0' }}
          >
            <span className="text-[12px] text-slate-400">
              Showing{' '}
              <span className="text-slate-600 font-medium">
                {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–
                {Math.min(page * ROWS_PER_PAGE, filtered.length)}
              </span>{' '}
              of{' '}
              <span className="text-slate-600 font-medium">{filtered.length}</span> results
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="text-slate-300 text-[12px] px-1">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-medium transition-all duration-150 ${
                        page === p
                          ? 'text-white'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                      }`}
                      style={
                        page === p
                          ? {
                              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            }
                          : {}
                      }
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bulk Action Bar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
              style={{
                background: 'rgba(13,18,32,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)',
              }}
            >
              <div className="flex items-center gap-2 pr-3" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  {selectedIds.size}
                </div>
                <span className="text-[13px] text-white/70 font-medium whitespace-nowrap">
                  {selectedIds.size === 1 ? '1 selected' : `${selectedIds.size} selected`}
                </span>
              </div>

              <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                <Send size={13} />
                Send Campaign
              </button>

              <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-150"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <RefreshCw size={13} />
                Change Status
              </button>

              <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                onClick={async () => {
                  try {
                    const idsArray = Array.from(selectedIds);
                    const { error } = await supabase
                      .from('dental_patients')
                      .delete()
                      .in('id', idsArray);

                    if (error) throw error;

                    setCustomers((prev) => prev.filter((c) => !selectedIds.has(c.id)));
                    setSelectedIds(new Set());
                  } catch (err) {
                    console.error('Error performing bulk delete:', err);
                  }
                }}>
                <Trash2 size={13} />
                Delete
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150 ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editingCustomer}
        onSave={handleSave}
      />
    </TooltipProvider>
  );
};

export default ReactivationCustomers;

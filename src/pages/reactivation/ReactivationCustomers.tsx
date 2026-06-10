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

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomerStatus = 'Active' | 'Inactive' | 'New Lead' | 'High Value' | 'Follow Up Needed';

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

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    lastVisit: '2025-04-12',
    service: 'Teeth Cleaning',
    totalSpend: 8400,
    status: 'Active',
    notes: 'Prefers morning appointments. Very punctual.',
    avatarColor: AVATAR_COLORS[0],
    problemTeeth: [14, 15],
    xrays: ['/assets/yourdentist/dental_xray.png'],
    allergies: ['Penicillin'],
    medicalConditions: ['Hypertension'],
    vitals: { bp: '135/85', pulse: '76', temp: '98.4' },
    toothConditions: { 14: 'Decayed / Cavity', 15: 'Root Canal Needed' },
    toothNotes: { 14: 'Deep distal cavity', 15: 'Hot/cold sensitivity' },
    activeProgramId: 'extraction',
    programEnrollmentDate: '2025-04-12',
    programCurrentStep: 2,
    programStatus: 'Active'
  },
  {
    id: '2',
    name: 'Priya Mehta',
    phone: '+91 87654 32109',
    lastVisit: '2025-01-03',
    service: 'Teeth Whitening',
    totalSpend: 15500,
    status: 'Inactive',
    notes: 'Missed last 2 follow-up calls. Try evening slot.',
    avatarColor: AVATAR_COLORS[1],
    problemTeeth: [26, 27],
    xrays: [],
    allergies: ['Latex'],
    medicalConditions: ['Asthma'],
    vitals: { bp: '120/80', pulse: '72', temp: '98.6' },
    toothConditions: { 26: 'Crown / Bridge', 27: 'Decayed / Cavity' },
    toothNotes: { 27: 'Incipient decay on occlusal surface' },
    activeProgramId: 'aligners',
    programEnrollmentDate: '2025-01-03',
    programCurrentStep: 1,
    programStatus: 'Paused'
  },
  {
    id: '3',
    name: 'Arjun Kapoor',
    phone: '+91 76543 21098',
    lastVisit: '2024-11-15',
    service: 'Root Canal',
    totalSpend: 34000,
    status: 'High Value',
    notes: 'CEO of Kapoor Textiles. Refer him for dental implants.',
    avatarColor: AVATAR_COLORS[2],
    problemTeeth: [36, 46],
    xrays: ['/assets/yourdentist/dental_xray.png'],
    allergies: [],
    medicalConditions: ['Diabetes'],
    vitals: { bp: '128/82', pulse: '80', temp: '99.1' },
    toothConditions: { 36: 'Missing Tooth', 46: 'Dental Implant' },
    toothNotes: { 36: 'Extracted in 2023', 46: 'Abutment check needed' },
    activeProgramId: 'implant',
    programEnrollmentDate: '2024-11-15',
    programCurrentStep: 3,
    programStatus: 'Completed'
  },
  {
    id: '4',
    name: 'Sneha Patel',
    phone: '+91 91234 56789',
    lastVisit: '2025-05-20',
    service: 'Hair Smoothing',
    totalSpend: 6200,
    status: 'Active',
    notes: 'Comes every 3 months for smoothing treatment.',
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: '5',
    name: 'Vikram Singh',
    phone: '+91 80012 34567',
    lastVisit: '2024-08-30',
    service: 'Gym Membership',
    totalSpend: 18000,
    status: 'Follow Up Needed',
    notes: 'Annual membership expired. Good conversion probability.',
    avatarColor: AVATAR_COLORS[4],
  },
  {
    id: '6',
    name: 'Ananya Iyer',
    phone: '+91 99887 76655',
    lastVisit: '2025-03-08',
    service: 'Dental Implants',
    totalSpend: 72000,
    status: 'High Value',
    notes: 'Referral from Dr. Reddy. Second implant planned for Q3.',
    avatarColor: AVATAR_COLORS[5],
    problemTeeth: [11, 21, 22],
    xrays: [],
  },
  {
    id: '7',
    name: 'Rohan Desai',
    phone: '+91 70099 11223',
    lastVisit: '2025-02-14',
    service: 'Facial Treatment',
    totalSpend: 4800,
    status: 'Inactive',
    notes: 'Valentine special package availed. Not responded since.',
    avatarColor: AVATAR_COLORS[6],
  },
  {
    id: '8',
    name: 'Kavya Nair',
    phone: '+91 88990 22334',
    lastVisit: '2025-05-30',
    service: 'Braces Consultation',
    totalSpend: 2000,
    status: 'New Lead',
    notes: 'First consultation done. Quote sent for full treatment.',
    avatarColor: AVATAR_COLORS[7],
    problemTeeth: [41, 42],
    xrays: [],
  },
  {
    id: '9',
    name: 'Aditya Joshi',
    phone: '+91 77665 54433',
    lastVisit: '2025-04-25',
    service: 'Personal Training',
    totalSpend: 24000,
    status: 'Active',
    notes: 'Preparing for marathon. 3 sessions per week.',
    avatarColor: AVATAR_COLORS[8],
  },
  {
    id: '10',
    name: 'Meera Rajput',
    phone: '+91 99001 87654',
    lastVisit: '2024-12-20',
    service: 'Hair Colour & Cut',
    totalSpend: 3500,
    status: 'Follow Up Needed',
    notes: 'Christmas package client. Discount offered not taken.',
    avatarColor: AVATAR_COLORS[9],
  },
  {
    id: '11',
    name: 'Saurabh Gupta',
    phone: '+91 98112 33445',
    lastVisit: '2025-01-18',
    service: 'Root Canal',
    totalSpend: 28500,
    status: 'Inactive',
    notes: 'Second root canal deferred due to travel schedule.',
    avatarColor: AVATAR_COLORS[0],
    problemTeeth: [34, 35],
    xrays: [],
  },
  {
    id: '12',
    name: 'Divya Krishnan',
    phone: '+91 87223 44556',
    lastVisit: '2025-05-10',
    service: 'Zumba Classes',
    totalSpend: 9600,
    status: 'Active',
    notes: 'Group class leader. Brings 2–3 friends each month.',
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: '13',
    name: 'Harsh Agarwal',
    phone: '+91 76334 55667',
    lastVisit: '2025-06-01',
    service: 'Teeth Cleaning',
    totalSpend: 4200,
    status: 'New Lead',
    notes: 'Referred by Rahul Sharma. First visit completed.',
    avatarColor: AVATAR_COLORS[2],
    problemTeeth: [16, 17],
    xrays: [],
  },
  {
    id: '14',
    name: 'Ritu Verma',
    phone: '+91 65445 66778',
    lastVisit: '2024-07-15',
    service: 'Body Massage',
    totalSpend: 11200,
    status: 'Follow Up Needed',
    notes: 'Lapsed 11 months. High win-back probability.',
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: '15',
    name: 'Nikhil Bose',
    phone: '+91 54556 77889',
    lastVisit: '2025-04-05',
    service: 'Orthodontic Review',
    totalSpend: 45000,
    status: 'High Value',
    notes: 'Long-term braces patient. Retainer phase starting.',
    avatarColor: AVATAR_COLORS[4],
    problemTeeth: [12, 22],
    xrays: ['/assets/yourdentist/dental_xray.png'],
  },
  {
    id: '16',
    name: 'Pooja Saxena',
    phone: '+91 43667 88990',
    lastVisit: '2025-05-22',
    service: 'Keratin Treatment',
    totalSpend: 7800,
    status: 'Active',
    notes: 'Loyal client since 2022. Refer for nail services.',
    avatarColor: AVATAR_COLORS[5],
  },
  {
    id: '17',
    name: 'Gaurav Tiwari',
    phone: '+91 32778 99001',
    lastVisit: '2025-03-30',
    service: 'Yoga Sessions',
    totalSpend: 14400,
    status: 'Active',
    notes: 'Corporate wellness package. Attends 5x/week.',
    avatarColor: AVATAR_COLORS[6],
  },
  {
    id: '18',
    name: 'Laleh Mirza',
    phone: '+91 21889 00112',
    lastVisit: '2024-10-05',
    service: 'Teeth Whitening',
    totalSpend: 13000,
    status: 'Inactive',
    notes: 'Relocated to Bengaluru. Check if back in city.',
    avatarColor: AVATAR_COLORS[7],
  },
  {
    id: '19',
    name: 'Deepak Malhotra',
    phone: '+91 10990 11223',
    lastVisit: '2025-06-04',
    service: 'Dental Implants',
    totalSpend: 95000,
    status: 'High Value',
    notes: 'Premium patient. Full mouth restoration underway.',
    avatarColor: AVATAR_COLORS[8],
    problemTeeth: [36, 37, 46, 47],
    xrays: ['/assets/yourdentist/dental_xray.png'],
  },
  {
    id: '20',
    name: 'Swati Bhatt',
    phone: '+91 99101 22334',
    lastVisit: '2025-05-15',
    service: 'Hair Spa',
    totalSpend: 5400,
    status: 'New Lead',
    notes: 'Discovered via Instagram promo. Keen on monthly plan.',
    avatarColor: AVATAR_COLORS[9],
  },
];

const SERVICES = [
  'All Services',
  'Teeth Cleaning',
  'Teeth Whitening',
  'Root Canal',
  'Dental Implants',
  'Braces Consultation',
  'Orthodontic Review',
  'Hair Treatment',
  'Hair Colour & Cut',
  'Hair Smoothing',
  'Keratin Treatment',
  'Hair Spa',
  'Facial Treatment',
  'Body Massage',
  'Gym Membership',
  'Personal Training',
  'Yoga Sessions',
  'Zumba Classes',
];

const STATUS_OPTIONS: CustomerStatus[] = ['Active', 'Inactive', 'New Lead', 'High Value', 'Follow Up Needed'];

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 30 days', value: '30' },
  { label: '30–90 days', value: '30-90' },
  { label: '90–180 days', value: '90-180' },
  { label: '6+ months', value: '180+' },
];

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
  'High Value': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    dot: 'bg-purple-500',
    border: 'border-purple-500/25',
    icon: <Sparkles size={10} className="text-purple-400" />,
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
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm">
    {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span className="text-white/40 text-[12px] font-medium">{label}</span>
    <span className="text-white text-[13px] font-bold">{value}</span>
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

const DEMO_PRE_OP_RVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250" style="background:%23151b2d;"><text x="20" y="30" fill="%23ef4444" font-family="monospace" font-size="12" font-weight="bold">PRE-OP RVG: CAVITY DIAGNOSIS</text><path d="M 170,120 Q 200,60 230,120 Q 240,180 200,230 Q 160,180 170,120 Z" fill="%232c3858" stroke="%23556897" stroke-width="3"/><path d="M 185,90 Q 200,75 215,90 Q 210,120 200,130 Q 190,120 185,90 Z" fill="%230d1324" opacity="0.8"/><text x="180" y="115" fill="%23ef4444" font-family="sans-serif" font-size="10" font-weight="bold">DECAY</text><circle cx="200" cy="95" r="8" fill="%23ef4444" opacity="0.3"/><line x1="20" y1="210" x2="380" y2="210" stroke="%23475569" stroke-width="4" stroke-dasharray="8 4"/><text x="20" y="230" fill="%2364748b" font-family="sans-serif" font-size="10">Bone Level: Normal | Subgingival decay detected on Tooth 15</text></svg>`;

const DEMO_POST_OP_RVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250" style="background:%23151b2d;"><text x="20" y="30" fill="%2310b981" font-family="monospace" font-size="12" font-weight="bold">POST-OP RVG: COMPLETED ROOT CANAL</text><path d="M 170,120 Q 200,60 230,120 Q 240,180 200,230 Q 160,180 170,120 Z" fill="%232c3858" stroke="%23556897" stroke-width="3"/><path d="M 198,80 L 198,180" stroke="%23ffffff" stroke-width="4" stroke-linecap="round" filter="drop-shadow(0 0 4px %23ffffff)"/><path d="M 202,80 L 202,180" stroke="%23ffffff" stroke-width="4" stroke-linecap="round" filter="drop-shadow(0 0 4px %23ffffff)"/><path d="M 185,90 Q 200,75 215,90 Q 210,120 200,130 Q 190,120 185,90 Z" fill="%2394a3b8" opacity="0.8"/><text x="180" y="115" fill="%2310b981" font-family="sans-serif" font-size="10" font-weight="bold">OBTURATED</text><line x1="20" y1="210" x2="380" y2="210" stroke="%23475569" stroke-width="4" stroke-dasharray="8 4"/><text x="20" y="230" fill="%2364748b" font-family="sans-serif" font-size="10">Obturation: Complete (Gutta-Percha hermetic seal) | Tooth 15</text></svg>`;

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
  const isEdit = !!customer?.id;
  const [form, setForm] = useState<Customer>(() => getInitialForm(customer));
  const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'estimates' | 'programs'>('general');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // AI Scribe states
  const [scribeTranscript, setScribeTranscript] = useState('');
  const [scribeStatus, setScribeStatus] = useState<'idle' | 'listening' | 'analyzing' | 'done'>('idle');
  const recognitionRef = React.useRef<any>(null);

  // RVG slider state
  const [xraySliderPos, setXraySliderPos] = useState(50);

  // Estimate builder states
  const [estimateItems, setEstimateItems] = useState<Array<{ tooth?: number; procedure: string; cost: number; isCosmetic: boolean }>>([]);
  const [estimateDiscount, setEstimateDiscount] = useState(0);
  const [estimateStatus, setEstimateStatus] = useState<'Draft' | 'Sent' | 'Approved'>('Draft');
  
  // Selected builder item
  const [builderTooth, setBuilderTooth] = useState<string>('');
  const [builderProcedureIdx, setBuilderProcedureIdx] = useState<string>('0');
  const [builderCost, setBuilderCost] = useState<number>(3500);
  const [copiedEstimate, setCopiedEstimate] = useState(false);

  React.useEffect(() => {
    setForm(getInitialForm(customer));
    setActiveTab('general');
    setScribeTranscript('');
    setScribeStatus('idle');
    setCopiedEstimate(false);
    
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
    'w-full px-3 py-2.5 rounded-lg text-[13px] text-white placeholder:text-white/25 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/50';
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
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
          style={{ background: '#0D1220', border: '1px solid rgba(255,255,255,0.1)' }}
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
                  className="px-6 pt-5 pb-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <div>
                      <DialogTitle className="text-white text-[16px] font-semibold tracking-tight">
                        {isEdit ? 'Patient Profile' : 'Add New Patient'}
                      </DialogTitle>
                      <p className="text-white/40 text-[12px] mt-0.5">
                        {isEdit
                          ? 'Review medical records, X-rays, and contact info'
                          : 'Create a new client record in database'}
                      </p>
                    </div>

                    {/* Tab Selector */}
                    <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/[0.08] mr-6 gap-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                          activeTab === 'general'
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        General Info
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('medical')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1 ${
                          activeTab === 'medical'
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        <Stethoscope size={10} />
                        Medical
                      </button>
                      {isEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveTab('estimates')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1 ${
                              activeTab === 'estimates'
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                          >
                            <StickyNote size={10} />
                            Billing & Estimates
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('programs')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1 ${
                              activeTab === 'programs'
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                          >
                            <Zap size={10} />
                            Programs
                          </button>
                        </>
                      )}
                    </div>
                  </DialogHeader>
                </div>

                {/* Body - General Tab */}
                {activeTab === 'general' && (
                  <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Name + Phone row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
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
                        <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
                          Last Visit Date
                        </label>
                        <input
                          type="date"
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={{ ...inputStyle, colorScheme: 'dark' }}
                          value={form.lastVisit}
                          onChange={(e) => handleChange('lastVisit', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
                          Service Used
                        </label>
                        <input
                          className={`${inputBase} ${inputFocusStyle}`}
                          style={inputStyle}
                          placeholder="e.g. Teeth Cleaning"
                          value={form.service}
                          onChange={(e) => handleChange('service', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Spend + Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
                          Total Spend (₹)
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
                        <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
                          Status
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
                      <label className="block text-[11px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">
                        Notes
                      </label>
                      <textarea
                        className={`${inputBase} ${inputFocusStyle} resize-none`}
                        style={inputStyle}
                        rows={3}
                        placeholder="Any notes about this customer..."
                        value={form.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Body - Medical tab */}
                {activeTab === 'medical' && (
                  <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* AI Dental Scribe (Voice to Chart) */}
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4.5 space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center">
                            <Mic size={12} className="text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">AI Dental Scribe</h4>
                            <p className="text-[10px] text-white/40 mt-0.5">Dictate consultation notes to automatically populate EMR conditions & tag teeth</p>
                          </div>
                        </div>

                        {scribeStatus === 'listening' ? (
                          <button
                            type="button"
                            onClick={stopScribeSpeech}
                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 rounded text-[11px] font-bold text-white flex items-center gap-1.5 animate-pulse"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Stop Recording
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startScribeSpeech}
                            disabled={scribeStatus === 'analyzing'}
                            className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 transition-all"
                          >
                            <Mic size={11} />
                            Start AI Scribe
                          </button>
                        )}
                      </div>

                      {/* Transcript Window */}
                      {(scribeTranscript || scribeStatus === 'listening') && (
                        <div className="bg-black/45 border border-white/[0.05] rounded-lg p-3 space-y-3">
                          <p className="text-[11.5px] font-mono text-white/80 leading-relaxed whitespace-pre-wrap">
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
                        <span className="text-[9.5px] text-white/30 uppercase font-bold tracking-wider">Voice Dictation Presets (Standard Indian Clinic Examples)</span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Tooth 14 Cavity', text: 'Patient presents with severe food lodgement in upper right. Deep distal cavity found on tooth 14 requiring composite restoration.' },
                            { label: 'Tooth 15 RCT', text: 'Acute pain and tenderness on percussion. Tooth 15 has deep decay with pulpal involvement. Root canal treatment needed.' },
                            { label: 'Tooth 46 Implant', text: 'Old missing tooth in lower right quadrant. Pre-implant bone width looks good. Dental implant replacement planned for tooth 46.' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setScribeTranscript(preset.text);
                                setScribeStatus('done');
                              }}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded text-[10.5px] text-white/60 hover:text-white/95 transition-all text-left"
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
                          <h5 className="text-[12px] font-bold text-rose-400 uppercase tracking-wider">Clinical Alerts / Contraindications</h5>
                          <p className="text-[11px] text-white/70 leading-relaxed">
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

                    {/* Allergies & Conditions Checklists */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Allergies Checklist */}
                      <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Allergies</h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {['Penicillin', 'Latex', 'Local Anesthetics', 'Sulfa'].map((allergy) => {
                            const hasAllergy = (form.allergies || []).includes(allergy);
                            return (
                              <label key={allergy} className="flex items-center gap-2.5 cursor-pointer select-none text-[12px] text-white/75 hover:text-white transition-colors">
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
                                      ? 'bg-rose-500/25 border-rose-500/50 text-rose-400'
                                      : 'bg-white/[0.03] border-white/[0.1] text-transparent hover:bg-white/[0.07]'
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
                      <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Chronic Conditions</h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {['Hypertension', 'Diabetes', 'Bleeding Disorders', 'Cardiac Pacemaker', 'Asthma'].map((cond) => {
                            const hasCond = (form.medicalConditions || []).includes(cond);
                            return (
                              <label key={cond} className="flex items-center gap-2.5 cursor-pointer select-none text-[12px] text-white/75 hover:text-white transition-colors">
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
                                      ? 'bg-rose-500/25 border-rose-500/50 text-rose-400'
                                      : 'bg-white/[0.03] border-white/[0.1] text-transparent hover:bg-white/[0.07]'
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

                    {/* Vitals Logger */}
                    <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 space-y-3">
                      <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Patient Vitals</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">Blood Pressure</label>
                          <input
                            className="w-full px-2.5 py-2 rounded-lg text-[12px] text-white outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/50"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            placeholder="e.g. 120/80 mmHg"
                            value={form.vitals?.bp || ''}
                            onChange={(e) => {
                              handleChange('vitals', { ...form.vitals, bp: e.target.value });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">Pulse / Heart Rate</label>
                          <input
                            className="w-full px-2.5 py-2 rounded-lg text-[12px] text-white outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/50"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            placeholder="e.g. 72 bpm"
                            value={form.vitals?.pulse || ''}
                            onChange={(e) => {
                              handleChange('vitals', { ...form.vitals, pulse: e.target.value });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">Body Temp (°F)</label>
                          <input
                            className="w-full px-2.5 py-2 rounded-lg text-[12px] text-white outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/50"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            placeholder="e.g. 98.6 °F"
                            value={form.vitals?.temp || ''}
                            onChange={(e) => {
                              handleChange('vitals', { ...form.vitals, temp: e.target.value });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tooth Chart Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Interactive Dental Chart</h4>
                          <p className="text-[10px] text-white/40 mt-0.5">Click teeth to toggle decay, crowns, or extraction problem areas (FDI numbering)</p>
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
                      <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3 justify-center items-center relative">
                        {/* Midline guides */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/[0.04] pointer-events-none" />
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.04] pointer-events-none" />

                        {/* UPPER ARCH */}
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center w-full">
                          {/* Upper Right Quadrant (UR: 18 -> 11) */}
                          <div className="flex items-center gap-1 sm:gap-1.5 justify-end flex-1">
                            {quad1.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 shadow-md shadow-rose-500/10'
                                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] text-white/50'
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
                          <div className="flex items-center gap-1 sm:gap-1.5 justify-start flex-1">
                            {quad2.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 shadow-md shadow-rose-500/10'
                                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] text-white/50'
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
                          <div className="flex items-center gap-1 sm:gap-1.5 justify-end flex-1">
                            {quad4.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 shadow-md shadow-rose-500/10'
                                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] text-white/50'
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
                          <div className="flex items-center gap-1 sm:gap-1.5 justify-start flex-1">
                            {quad3.map((num) => {
                              const isProblem = (form.problemTeeth || []).includes(num);
                              return (
                                <Tooltip key={num}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleToothToggle(num)}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-150 select-none ${
                                        isProblem
                                          ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 shadow-md shadow-rose-500/10'
                                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] text-white/50'
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

                      {/* Selected teeth details */}
                      {form.problemTeeth && form.problemTeeth.length > 0 ? (
                        <div className="space-y-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold uppercase tracking-widest text-rose-400">Tooth-Specific Chart Details</span>
                            <span className="text-[9.5px] text-white/30 font-medium">({form.problemTeeth.length} flagged teeth)</span>
                          </div>
                          
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {form.problemTeeth.map((t) => {
                              const condition = form.toothConditions?.[t] || 'Decayed / Cavity';
                              const note = form.toothNotes?.[t] || '';
                              
                              return (
                                <div key={t} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 space-y-2.5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[12px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                                        🦷 Tooth {t}
                                      </span>
                                      <span className="text-[11px] text-white/50 truncate max-w-[200px]" title={getToothName(t)}>
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
                                      className="text-[11px] font-medium text-white/80 bg-[#121828] border border-white/[0.08] hover:border-white/15 px-2 py-1 rounded-md outline-none cursor-pointer"
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
                                    className="w-full px-2.5 py-1.5 rounded-lg text-[11.5px] text-white placeholder:text-white/20 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/40"
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/[0.01] border border-dashed border-white/[0.06] rounded-xl py-3.5 text-center text-white/20 text-[11px]">
                          No teeth selected. Click teeth in the chart above to mark problems.
                        </div>
                      )}
                    </div>

                    {/* X-Ray Section */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Patient X-Rays / Radiographs</h4>
                        <p className="text-[10px] text-white/40 mt-0.5">Attach medical panoramic scans or individual tooth radiographs to this record</p>
                      </div>

                      {/* Uploader dropzone */}
                      <label className="border border-dashed border-white/[0.12] hover:border-indigo-500/30 bg-white/[0.02] hover:bg-indigo-500/[0.01] rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 group">
                        <Upload size={18} className="text-white/40 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[12px] font-semibold text-white/60 group-hover:text-white/80 transition-colors">Upload X-Ray Image</span>
                        <span className="text-[10px] text-white/25">Supports PNG, JPG (Max 5MB)</span>
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
                            <div key={idx} className="relative aspect-[16/11] rounded-xl overflow-hidden border border-white/[0.08] bg-neutral-900 group">
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
                        <div className="bg-white/[0.01] border border-dashed border-white/[0.06] rounded-xl py-4 text-center text-white/20 text-[11px]">
                          No radiographs attached. Use the uploader above to add scans.
                        </div>
                      )}

                      {/* RVG Compare Slider sandbox */}
                      {form.xrays && form.xrays.length >= 2 && (
                        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={11} className="text-indigo-400" />
                              RVG Compare Sandbox (Before vs After)
                            </span>
                            <span className="text-[10px] text-white/40">Drag slider to review treatment margins</span>
                          </div>
                          
                          {/* Interactive Slider Container */}
                          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/[0.08] bg-neutral-900 select-none">
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

                      {/* Load Demo X-Rays option if patient has none or 1 */}
                      {(!form.xrays || form.xrays.length < 2) && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleChange('xrays', [DEMO_PRE_OP_RVG, DEMO_POST_OP_RVG]);
                            }}
                            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded text-[10px] font-bold text-indigo-300 flex items-center gap-1 transition-all"
                          >
                            <Sparkles size={10} /> Load Pre/Post-Op Demo Scans
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Body - Estimates & Billing tab */}
                {activeTab === 'estimates' && (
                  <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Add Item Builder */}
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center">
                          <Plus size={12} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">Add Treatment Item</h4>
                          <p className="text-[10px] text-white/40 mt-0.5">Select tooth & procedure with GST categorization</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        {/* Tooth selector */}
                        <div>
                          <label className="block text-[10px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">Select Tooth</label>
                          <select
                            value={builderTooth}
                            onChange={(e) => setBuilderTooth(e.target.value)}
                            className="w-full bg-[#121828] border border-white/[0.08] rounded-lg px-2.5 py-2 text-[12px] text-white outline-none cursor-pointer"
                          >
                            <option value="">General (No Tooth)</option>
                            {(form.problemTeeth || []).map((t) => (
                              <option key={t} value={t}>Tooth {t} ({getToothName(t).split(' (Tooth ')[0]})</option>
                            ))}
                          </select>
                        </div>

                        {/* Procedure selector */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">Select Procedure</label>
                          <select
                            value={builderProcedureIdx}
                            onChange={(e) => {
                              const idx = e.target.value;
                              setBuilderProcedureIdx(idx);
                              setBuilderCost(PROCEDURES_CATALOG[Number(idx)].defaultCost);
                            }}
                            className="w-full bg-[#121828] border border-white/[0.08] rounded-lg px-2.5 py-2 text-[12px] text-white outline-none cursor-pointer"
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
                          <label className="block text-[10px] text-white/40 font-medium mb-1.5 uppercase tracking-wider">Cost (₹)</label>
                          <input
                            type="number"
                            value={builderCost}
                            onChange={(e) => setBuilderCost(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] text-white outline-none transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
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
                    <div className="bg-white/[0.01] border border-white/[0.07] rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.07] flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Current Estimate Details</span>
                        <select
                          value={estimateStatus}
                          onChange={(e) => setEstimateStatus(e.target.value as any)}
                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-md outline-none cursor-pointer"
                        >
                          <option value="Draft" style={{ background: '#121828', color: '#fff' }}>Draft</option>
                          <option value="Sent" style={{ background: '#121828', color: '#fff' }}>Sent to Patient</option>
                          <option value="Approved" style={{ background: '#121828', color: '#fff' }}>Approved</option>
                        </select>
                      </div>

                      {estimateItems.length > 0 ? (
                        <div className="divide-y divide-white/[0.05]">
                          {estimateItems.map((item, idx) => (
                            <div key={idx} className="px-4 py-3 flex items-center justify-between text-[12px] hover:bg-white/[0.01] transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  {item.tooth && (
                                    <span className="text-[9px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/20 px-1 rounded">
                                      T{item.tooth}
                                    </span>
                                  )}
                                  <span className="text-white font-medium">{item.procedure}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                                  <span>{item.isCosmetic ? 'Cosmetic Dental (18% GST)' : 'Therapeutic Care (Exempt / 0% GST)'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-white font-bold font-mono">₹{item.cost.toLocaleString('en-IN')}</span>
                                <button
                                  type="button"
                                  onClick={() => setEstimateItems((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-white/30 hover:text-rose-400 transition-colors p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-[11px] text-white/25 border-b border-white/[0.07]">
                          No estimate items added. Add procedures above to build the billing proposal.
                        </div>
                      )}

                      {/* Calculations summary panel */}
                      <div className="bg-white/[0.02] p-4.5 space-y-2.5">
                        <div className="flex justify-between text-[11px] text-white/50">
                          <span>Subtotal</span>
                          <span className="font-mono">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Discount row */}
                        <div className="flex items-center justify-between text-[11px] text-white/50 gap-4">
                          <span className="flex items-center gap-1.5 shrink-0">
                            Discretionary Discount
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
                            <span className="font-mono text-white text-[11.5px] font-bold shrink-0">{estimateDiscount}%</span>
                          </div>
                        </div>

                        {calculatedDiscountAmount > 0 && (
                          <div className="flex justify-between text-[11px] text-rose-400">
                            <span>Discount Value</span>
                            <span className="font-mono">-₹{calculatedDiscountAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-[11px] text-white/50">
                          <span>CGST (9%) + SGST (9%) <span className="text-[9px] text-white/20">(Cosmetic only)</span></span>
                          <span className="font-mono">₹{calculatedGST.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="h-px bg-white/[0.08] my-1.5" />

                        <div className="flex justify-between text-[13px] font-bold text-white">
                          <span className="uppercase tracking-wider">Estimated Total</span>
                          <span className="font-mono text-indigo-400">₹{calculatedGrandTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Estimate Proposal Generator */}
                    {estimateItems.length > 0 && (
                      <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[11.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={11} className="text-indigo-400" />
                              WhatsApp Estimate Proposal (Simulated)
                            </h4>
                            <p className="text-[10px] text-white/40 mt-0.5">Copy message format to send to patient next to the chair</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const summary = estimateItems.map((item) => `• ${item.procedure}${item.tooth ? ` (Tooth ${item.tooth})` : ''}: ₹${item.cost.toLocaleString('en-IN')}`).join('\n');
                              const text = `*Shree Ram Dental Care - Treatment Proposal*\n\nHi ${form.name},\n\nHere is your customized treatment cost estimate:\n\n${summary}\n\n*Subtotal:* ₹${calculatedSubtotal.toLocaleString('en-IN')}\n*Discount (${estimateDiscount}%):* -₹${calculatedDiscountAmount.toLocaleString('en-IN')}\n*GST (Cosmetic):* ₹${calculatedGST.toLocaleString('en-IN')}\n*Estimated Grand Total:* ₹${calculatedGrandTotal.toLocaleString('en-IN')}\n\nOur patient manager will schedule your operatories slots. Let us know if we can proceed!`;
                              navigator.clipboard.writeText(text);
                              setCopiedEstimate(true);
                              setTimeout(() => setCopiedEstimate(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded text-[10.5px] font-bold text-indigo-300 flex items-center gap-1 transition-all"
                          >
                            {copiedEstimate ? 'Copied! ✓' : 'Copy Message'}
                          </button>
                        </div>

                        <div className="bg-black/30 border border-white/[0.05] rounded-xl p-3 text-[12px] font-mono leading-relaxed text-white/70">
                          <span className="text-[10px] text-indigo-400 font-bold block">MESSAGE PREVIEW:</span>
                          <div className="whitespace-pre-wrap select-all bg-black/20 p-2.5 rounded border border-white/[0.03]">
                            <strong>Shree Ram Dental Care - Treatment Proposal</strong><br/><br/>
                            Hi {form.name},<br/><br/>
                            Here is your customized treatment cost estimate:<br/>
                            {estimateItems.map((item, idx) => (
                              <span key={idx}>• {item.procedure}{item.tooth ? ` (Tooth ${item.tooth})` : ''}: ₹{item.cost.toLocaleString('en-IN')}<br/></span>
                            ))}
                            <br/>
                            <strong>Subtotal:</strong> ₹{calculatedSubtotal.toLocaleString('en-IN')}<br/>
                            <strong>Discount ({estimateDiscount}%):</strong> -₹{calculatedDiscountAmount.toLocaleString('en-IN')}<br/>
                            <strong>GST (Cosmetic):</strong> ₹{calculatedGST.toLocaleString('en-IN')}<br/>
                            <strong>Estimated Grand Total:</strong> ₹{calculatedGrandTotal.toLocaleString('en-IN')}<br/><br/>
                            Our patient manager will schedule your operatories slots. Let us know if we can proceed!
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Body - Care Programs Tab */}
                {activeTab === 'programs' && (
                  <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
                    {form.activeProgramId ? (() => {
                      const program = CARE_PROGRAMS.find((p) => p.id === form.activeProgramId);
                      if (!program) return null;
                      const enrollmentDate = form.programEnrollmentDate || new Date().toISOString().split('T')[0];
                      const currentStep = form.programCurrentStep || 1;
                      const status = form.programStatus || 'Active';

                      return (
                        <div className="space-y-6">
                          {/* Active Program Card */}
                          <div
                            className="rounded-2xl border border-indigo-500/20 p-5 relative overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)',
                              boxShadow: '0 0 30px rgba(99,102,241,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-300 uppercase tracking-widest">
                                  Active Care Program
                                </span>
                                <h3 className="text-base font-bold text-white mt-1.5">{program.name}</h3>
                                <p className="text-white/40 text-[12px] mt-0.5">{program.description}</p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                {/* Status selector */}
                                <select
                                  value={status}
                                  onChange={(e) => {
                                    handleChange('programStatus', e.target.value);
                                  }}
                                  className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#121828] border border-white/[0.08] hover:border-white/15 px-2.5 py-1 rounded-lg outline-none cursor-pointer"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Paused">Paused</option>
                                  <option value="Completed">Completed</option>
                                </select>
                                <span className="text-[10px] text-white/30">Enrolled: {formatDate(enrollmentDate)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Steps Timeline */}
                          <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">WhatsApp Follow-Up Timeline</h4>
                            <div className="relative pl-6 space-y-5 border-l border-white/[0.07] ml-3">
                              {program.steps.map((step, idx) => {
                                const stepNum = idx + 1;
                                const isSent = stepNum < currentStep;
                                const isCurrent = stepNum === currentStep;
                                const isPending = stepNum > currentStep;
                                const formattedMsg = step.message.replace('{name}', form.name);

                                return (
                                  <div key={idx} className="relative group">
                                    {/* Timeline bullet indicator */}
                                    <div
                                      className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all duration-200 ${
                                        isSent
                                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                          : isCurrent
                                          ? 'bg-indigo-500 border-indigo-500/60 text-white shadow-md shadow-indigo-500/30 scale-110'
                                          : 'bg-white/[0.03] border-white/[0.08] text-white/20'
                                      }`}
                                    >
                                      {isSent ? '✓' : stepNum}
                                    </div>

                                    {/* Step card */}
                                    <div
                                      className={`rounded-xl border p-4 transition-all ${
                                        isCurrent
                                          ? 'bg-white/[0.04] border-indigo-500/30'
                                          : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-indigo-400' : 'text-white/40'}`}>
                                            Day {step.day}
                                          </span>
                                          <span className="text-white/20">•</span>
                                          <span className="text-[11px] text-white/60 font-medium">{step.subLabel}</span>
                                        </div>

                                        <span
                                          className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                            isSent
                                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                              : isCurrent
                                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 animate-pulse'
                                              : 'bg-white/[0.03] text-white/25 border border-white/[0.05]'
                                          }`}
                                        >
                                          {isSent ? 'Sent' : isCurrent ? 'Next Up' : 'Scheduled'}
                                        </span>
                                      </div>

                                      <p className="text-[12px] text-white/75 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/[0.03] font-mono whitespace-pre-wrap select-all">
                                        {formattedMsg}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Actions panel */}
                          <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                            <button
                              type="button"
                              onClick={() => {
                                handleChange('activeProgramId', undefined);
                                handleChange('programEnrollmentDate', undefined);
                                handleChange('programCurrentStep', undefined);
                                handleChange('programStatus', undefined);
                              }}
                              className="text-[11px] font-bold text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/[0.06] border border-rose-500/15 px-3 py-2 rounded-lg transition-all"
                            >
                              Disenroll Patient
                            </button>

                            {currentStep <= program.steps.length && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleChange('programCurrentStep', currentStep + 1);
                                  if (currentStep === program.steps.length) {
                                    handleChange('programStatus', 'Completed');
                                  }
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-lg text-[12px] font-semibold transition-all shadow-md shadow-indigo-500/20"
                              >
                                <Send size={12} />
                                Simulate WhatsApp Nudge
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })() : (
                      /* Disenrolled / No Active Program State */
                      <div className="py-8 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-dashed border-white/[0.1] flex items-center justify-center mx-auto text-white/30">
                          <Zap size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">No Active Care Program</h4>
                          <p className="text-[12px] text-white/40 mt-1 max-w-sm mx-auto">
                            Enroll patient in an automated check-up flow to track symptoms and request feedback post-op.
                          </p>
                        </div>

                        {/* Select program list */}
                        <div className="max-w-xs mx-auto pt-4 space-y-3">
                          <select
                            id="programSelect"
                            className="w-full bg-[#121828] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white outline-none cursor-pointer"
                            defaultValue=""
                            onChange={(e) => {
                              const progId = e.target.value;
                              if (!progId) return;
                              handleChange('activeProgramId', progId);
                              handleChange('programEnrollmentDate', new Date().toISOString().split('T')[0]);
                              handleChange('programCurrentStep', 1);
                              handleChange('programStatus', 'Active');
                            }}
                          >
                            <option value="" disabled>-- Choose Care Program --</option>
                            {CARE_PROGRAMS.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div
                  className="px-6 py-4 flex items-center justify-end gap-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-[13px] text-white/50 hover:text-white/80 rounded-lg transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.name || !form.phone}
                    className="px-5 py-2 text-[13px] font-semibold text-white rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                    }}
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
            style={{ background: '#090D16', border: '1px solid rgba(255,255,255,0.1)' }}
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
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [dateRange, setDateRange] = useState('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: 847,
    active: 390,
    inactive: 312,
    highValue: 45,
  }), []);

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

  const handleSave = useCallback((c: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = c;
        return updated;
      }
      return [c, ...prev];
    });
  }, []);

  const handleDelete = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    const newSet = new Set(selectedIds);
    newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleMarkHighValue = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'High Value' as CustomerStatus } : c))
    );
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
    'h-9 text-[12px] text-white/70 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] focus:ring-indigo-500/30 rounded-lg transition-all duration-150 min-w-[130px]';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-5 min-h-full pb-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-white tracking-tight">
                Customer Database
              </h1>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold text-indigo-300 tracking-wide"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                847 customers
              </span>
            </div>
            <p className="text-white/40 text-[13px] mt-1">
              Manage and track your customer relationships
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white/60 transition-all duration-150 hover:text-white/80 hover:bg-white/[0.05]"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Upload size={14} />
              Import CSV
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              <Plus size={15} />
              Add Customer
            </button>
          </div>
        </motion.div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: 'easeOut' }}
          className="flex items-center gap-2.5 flex-wrap"
        >
          <StatChip
            label="Total"
            value={stats.total.toLocaleString('en-IN')}
            icon={<Users size={13} className="text-white/40" />}
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
          <StatChip
            label="High Value"
            value={stats.highValue.toLocaleString('en-IN')}
            icon={<Sparkles size={12} className="text-purple-400" />}
          />
        </motion.div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
          className="flex items-center gap-2.5 flex-wrap"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '12px 16px',
          }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] text-white placeholder:text-white/25 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/40"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
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
              style={{ background: '#0D1220', border: '1px solid rgba(255,255,255,0.1)' }}
              className="text-white"
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
              style={{ background: '#0D1220', border: '1px solid rgba(255,255,255,0.1)' }}
              className="text-white max-h-[260px] overflow-y-auto"
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
              style={{ background: '#0D1220', border: '1px solid rgba(255,255,255,0.1)' }}
              className="text-white"
            >
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-white/40 hover:text-white/70 transition-colors duration-150"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </motion.div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.14, ease: 'easeOut' }}
          className="rounded-2xl overflow-hidden flex-1"
          style={{
            background: '#0A0F1C',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Checkbox */}
                  <th className="pl-5 pr-2 py-3.5 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {allPageSelected ? (
                        <CheckSquare size={15} className="text-indigo-400" />
                      ) : somePageSelected ? (
                        <CheckSquare size={15} className="text-white/40" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </th>

                  {[
                    { label: 'Customer', w: 'min-w-[160px]', sortKey: null },
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
                          col.sortKey ? 'cursor-pointer hover:text-white/70' : 'cursor-default'
                        } text-white/35 transition-colors duration-150`}
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
                      <td colSpan={9} className="py-16 text-center text-white/30 text-[13px]">
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
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isSelected
                              ? 'rgba(99,102,241,0.07)'
                              : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected)
                              (e.currentTarget as HTMLTableRowElement).style.background =
                                'rgba(255,255,255,0.025)';
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
                              className="text-white/30 hover:text-white/60 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare size={15} className="text-indigo-400" />
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
                                  <span className="text-[13px] font-semibold text-white leading-tight">
                                    {customer.name}
                                  </span>
                                  {((customer.allergies && customer.allergies.length > 0) || (customer.medicalConditions && customer.medicalConditions.length > 0)) && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="Clinical Alert: Review medical history before treatment" />
                                  )}
                                </div>
                                {((customer.allergies && customer.allergies.length > 0) || (customer.medicalConditions && customer.medicalConditions.length > 0)) && (
                                  <div className="flex flex-wrap gap-1 mt-0.5 max-w-[200px]">
                                    {[...(customer.allergies || []), ...(customer.medicalConditions || [])].map((alert) => (
                                      <span key={alert} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8.5px] font-extrabold uppercase tracking-widest text-rose-400">
                                        {alert}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-3 py-3.5">
                            <span className="text-[12px] text-white/50 font-mono tracking-wide">
                              {customer.phone}
                            </span>
                          </td>

                          {/* Last Visit */}
                          <td className="px-3 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12px] text-white/80 font-medium">
                                {formatDate(customer.lastVisit)}
                              </span>
                              <span className="text-[11px] text-white/35">
                                {timeAgo(customer.lastVisit)}
                              </span>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="px-3 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12px] text-white/60">{customer.service}</span>
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
                                  <span className="text-[12px] text-white/40 truncate block max-w-[160px] cursor-default">
                                    {customer.notes}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-[240px] text-[12px] leading-relaxed"
                                  style={{
                                    background: '#1a2035',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.8)',
                                  }}
                                >
                                  {customer.notes}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-[12px] text-white/20 italic">No notes</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="px-3 py-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all duration-150 opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal size={15} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 text-[12px]"
                                style={{
                                  background: '#0D1220',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.8)',
                                }}
                              >
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(customer)}
                                  className="gap-2.5 cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                                >
                                  <Eye size={13} className="text-white/40" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(customer)}
                                  className="gap-2.5 cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                                >
                                  <Edit3 size={13} className="text-white/40" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2.5 cursor-pointer hover:bg-white/[0.06] focus:bg-white/[0.06]"
                                >
                                  <MessageSquare size={13} className="text-white/40" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/[0.06]" />
                                <DropdownMenuItem
                                  onClick={() => handleMarkHighValue(customer.id)}
                                  className="gap-2.5 cursor-pointer hover:bg-purple-500/10 focus:bg-purple-500/10"
                                >
                                  <Sparkles size={13} className="text-purple-400" />
                                  <span className="text-purple-400">Mark High Value</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/[0.06]" />
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
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[12px] text-white/35">
              Showing{' '}
              <span className="text-white/60 font-medium">
                {Math.min((page - 1) * ROWS_PER_PAGE + 1, filtered.length)}–
                {Math.min(page * ROWS_PER_PAGE, filtered.length)}
              </span>{' '}
              of{' '}
              <span className="text-white/60 font-medium">{filtered.length}</span> results
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
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
                    <span key={`dots-${i}`} className="text-white/30 text-[12px] px-1">
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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
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
                onClick={() => {
                  setCustomers((prev) => prev.filter((c) => !selectedIds.has(c.id)));
                  setSelectedIds(new Set());
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

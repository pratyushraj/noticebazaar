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
}

type SortField = 'lastVisit' | 'totalSpend' | null;
type SortDir = 'asc' | 'desc';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6',
  '#F97316', '#84CC16',
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
};

const CustomerModal: React.FC<CustomerModalProps> = ({ open, onClose, customer, onSave }) => {
  const isEdit = !!customer?.id;
  const [form, setForm] = useState<Customer>(customer ?? EMPTY_CUSTOMER);

  React.useEffect(() => {
    setForm(customer ?? EMPTY_CUSTOMER);
  }, [customer, open]);

  const handleChange = (field: keyof Customer, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const newCustomer: Customer = {
      ...form,
      id: form.id || String(Date.now()),
      avatarColor: form.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg border-0 p-0 overflow-hidden"
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
                className="px-6 py-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <DialogHeader>
                  <DialogTitle className="text-white text-[16px] font-semibold tracking-tight">
                    {isEdit ? 'Edit Customer' : 'Add New Customer'}
                  </DialogTitle>
                  <p className="text-white/40 text-[12px] mt-0.5">
                    {isEdit
                      ? 'Update customer details and status'
                      : 'Fill in the details to add a new customer'}
                  </p>
                </DialogHeader>
              </div>

              {/* Body */}
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

              {/* Footer */}
              <DialogFooter
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
                  {isEdit ? 'Save Changes' : 'Add Customer'}
                </button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
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
                              <span className="text-[13px] font-semibold text-white leading-tight">
                                {customer.name}
                              </span>
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
                            <span className="text-[12px] text-white/60">{customer.service}</span>
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

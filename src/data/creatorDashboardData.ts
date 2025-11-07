import { LucideIcon, DollarSign, Briefcase, FileText, ShieldCheck, Clock, AlertTriangle, MessageSquare, CalendarDays, IndianRupee, CheckCircle, XCircle, Bot } from 'lucide-react';

// --- Types for Mock Data ---
export interface CreatorKpi {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
}

export interface BrandDeal {
  name: string;
  status: 'Drafting' | 'Payment Pending' | 'Completed';
}

export interface ContractReview {
  id: string;
  title: string;
  status: 'risky' | 'missing_rights';
}

export interface TakedownAlert {
  id: string;
  description: string;
  action: string;
}

export interface ComplianceDeadline {
  date: string;
  task: string;
  urgency: 'High' | 'Medium' | 'Low';
}

export interface AIAction {
  description: string;
  linkText: string;
  linkHref: string;
  icon: LucideIcon;
}

// --- Mock Data ---
export const MOCK_CREATOR_KPI_CARDS: CreatorKpi[] = [
  {
    title: 'Total Income',
    value: '₹2,85,700',
    description: 'This Month',
    icon: IndianRupee,
    color: 'text-green-500',
  },
  {
    title: 'Active Brand Deals',
    value: '2',
    description: 'In Progress',
    icon: Briefcase,
    color: 'text-blue-500',
  },
  {
    title: 'Pending Legal Tasks',
    value: '4',
    description: 'Requires Action',
    icon: AlertTriangle,
    color: 'text-orange-500',
  },
  {
    title: 'Protection Score',
    value: '72%',
    description: 'Legal Health',
    icon: ShieldCheck,
    color: 'text-purple-500',
  },
];

export const MOCK_CREATOR_QUICK_ACTIONS: QuickAction[] = [
  { label: 'Send Payment Reminder', icon: DollarSign, onClick: () => console.log('Send Payment Reminder') },
  { label: 'Upload Contract', icon: FileText, onClick: () => console.log('Upload Contract') },
  { label: 'AI Scan Contract', icon: Bot, onClick: () => console.log('AI Scan Contract') },
  { label: 'Send Takedown Notice', icon: ShieldCheck, onClick: () => console.log('Send Takedown Notice'), variant: 'destructive' },
];

export const MOCK_PENDING_BRAND_PAYMENTS = {
  amount: '₹1,25,000',
  status: 'Overdue',
  details: '3 invoices - 68 days',
};

export const MOCK_ACTIVE_BRAND_DEALS: BrandDeal[] = [
  { name: 'Nykaa Campaign', status: 'Drafting' },
  { name: 'Boat Collab', status: 'Payment Pending' },
];

export const MOCK_PREVIOUS_BRANDS = ['MamaEarth', 'Myntra', 'Unacademy'];
export const MOCK_TOTAL_INCOME_TRACKED = '₹2,85,700';

export const MOCK_CONTRACTS_REQUIRING_REVIEW: ContractReview[] = [
  { id: '1', title: 'MamaEarth Deal - 2 clauses risky', status: 'risky' },
  { id: '2', title: 'XYZ Agency - missing usage rights details', status: 'missing_rights' },
];

export const MOCK_TAKEDOWN_ALERTS: TakedownAlert[] = [
  { id: '1', description: '2 Videos Reposted on TikTok', action: 'Immediate action required to prevent revenue loss.' },
];

export const MOCK_PROTECTION_COMPLIANCE = {
  healthScore: 72,
  categories: [
    { name: 'Contracts', status: 'green' },
    { name: 'Copyright', status: 'green' },
    { name: 'Taxes', status: 'yellow' },
  ],
};

export const MOCK_TAX_COMPLIANCE_STATUS = {
  amount: '₹2,85,700',
  deals: '5 Deals',
  nextDue: 'GST Q4',
};

export const MOCK_IMPORTANT_DEADLINES: ComplianceDeadline[] = [
  { date: 'Nov 20', task: 'GSTR-3B Filing', urgency: 'High' },
  { date: 'Dec 31', task: 'Annual ITR Filing', urgency: 'Medium' },
  { date: 'Jan 15', task: 'Q3 TDS Payment', urgency: 'Low' },
];

export const MOCK_AI_ACTION_CENTER: AIAction[] = [
  { description: '2 contracts missing usage rights summary — fix now', linkText: 'Review Contracts', linkHref: '#', icon: FileText },
  { description: 'Your GST payment is due in 5 days', linkText: 'File Taxes', linkHref: '#', icon: IndianRupee },
  { description: '1 pending invoice > 30 days overdue', linkText: 'Send Reminder', linkHref: '#', icon: Clock },
  { description: 'New message from your legal advisor', linkText: 'View Messages', linkHref: '#', icon: MessageSquare },
];
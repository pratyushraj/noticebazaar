import { LucideIcon, DollarSign, Briefcase, FileText, ShieldCheck, Clock, AlertTriangle, MessageSquare, CalendarDays, IndianRupee, CheckCircle, XCircle, Bot, Users, Gavel, Zap, UserCheck, Calculator, Bell, Phone } from 'lucide-react';

export type CreatorPlanName = 'Creator Lite' | 'Creator Pro' | 'Creator Max';

export interface CreatorPlanFeature {
  name: string;
  lite: string | boolean;
  pro: string | boolean;
  max: string | boolean;
}

export interface CreatorPlanDetail {
  name: CreatorPlanName;
  tagline: string;
  price: string;
  link: string;
  isPopular: boolean;
  description: string;
  included: string[];
  notIncluded: string[];
  examples: { title: string; description: string }[];
  featuresList: { icon: LucideIcon; text: string }[]; // Simplified list for homepage
}

export const CREATOR_PLAN_COMPARISON_FEATURES: { category: string; features: CreatorPlanFeature[] }[] = [
  { category: 'Contract Management', features: [
    { name: 'AI Contract Scan (per month)', lite: '3', pro: 'Unlimited', max: 'Unlimited' },
    { name: 'Lawyer Contract Review', lite: false, pro: true, max: true },
    { name: 'Lawyer Contract Drafting', lite: false, pro: true, max: 'Unlimited' },
    { name: 'UGC Contract Negotiation', lite: false, pro: false, max: true },
  ]},
  { category: 'Payment & Recovery', features: [
    { name: 'Payment Dispute Guidance', lite: true, pro: true, max: true },
    { name: 'Legal Notice (24hr delivery)', lite: false, pro: true, max: 'Unlimited' },
    { name: 'Debt Recovery Support', lite: false, pro: true, max: 'Priority' },
  ]},
  { category: 'Content & IP Protection', features: [
    { name: 'Copyright Monitoring (basic)', lite: true, pro: true, max: 'Advanced' },
    { name: 'Takedown Notice Support', lite: false, pro: true, max: 'Priority' },
    { name: 'Defamation Support', lite: false, pro: true, max: true },
    { name: 'WhatsApp Evidence Vault', lite: true, pro: true, max: true },
  ]},
  { category: 'Advisory & Support', features: [
    { name: 'Dedicated Legal Manager', lite: false, pro: false, max: true },
    { name: 'Monthly Legal Review Call', lite: false, pro: false, max: true },
    { name: 'Phone Consultations', lite: false, pro: false, max: true },
    { name: 'AI Assistant (Lexi)', lite: true, pro: true, max: true },
  ]},
];

export const CREATOR_PLAN_DETAILS: Record<CreatorPlanName, CreatorPlanDetail> = {
  'Creator Lite': {
    name: 'Creator Lite',
    tagline: 'Essential legal protection for emerging creators and freelancers.',
    price: '₹999/mo',
    link: '/login?plan=creator-lite',
    isPopular: false,
    description: 'The Creator Lite plan offers foundational legal tools to protect your content and income, perfect for those starting their creator journey.',
    included: [
      '3 AI contract scans per month.',
      'Guidance on payment disputes.',
      'Basic copyright monitoring.',
      'WhatsApp evidence vault access.',
    ],
    notIncluded: [
      'Lawyer contract review or drafting.',
      'Formal legal notices.',
      'Dedicated legal manager.',
      'Phone consultations.',
    ],
    examples: [
      { title: 'Contract Scan', description: 'A new influencer uses AI to quickly check a brand collaboration contract for red flags.' },
      { title: 'Payment Guidance', description: 'A freelancer gets advice on how to follow up on a delayed payment from a client.' },
    ],
    featuresList: [
      { icon: FileText, text: '3 AI contract scans/month' },
      { icon: IndianRupee, text: 'Payment dispute guidance' },
      { icon: ShieldCheck, text: 'Basic copyright monitoring' },
      { icon: MessageSquare, text: 'WhatsApp evidence vault' },
    ],
  },
  'Creator Pro': {
    name: 'Creator Pro',
    tagline: 'Comprehensive legal and payment recovery support for growing creators.',
    price: '₹2,999/mo',
    link: '/login?plan=creator-pro',
    isPopular: true,
    description: 'The Creator Pro plan provides robust legal backing, including lawyer-reviewed contracts and formal payment recovery, for creators scaling their business.',
    included: [
      'Unlimited AI contract scans.',
      'Lawyer contract review and drafting.',
      '24-hour legal notice delivery for disputes.',
      'Defamation support.',
      'Full payment recovery support.',
    ],
    notIncluded: [
      'Dedicated legal manager.',
      'UGC contract negotiation.',
      'Monthly review calls.',
    ],
    examples: [
      { title: 'Brand Deal Negotiation', description: 'A creator gets a lawyer to draft a comprehensive brand collaboration agreement, protecting their rights and ensuring fair payment terms.' },
      { title: 'Takedown Notice', description: 'A formal legal notice is sent within 24 hours to remove unauthorized use of content on another platform.' },
    ],
    featuresList: [
      { icon: FileText, text: 'Unlimited contract review' },
      { icon: Gavel, text: 'Lawyer drafting & negotiation' },
      { icon: Clock, text: '24 hrs legal notice delivery' },
      { icon: ShieldCheck, text: 'Defamation support' },
      { icon: IndianRupee, text: 'Full payment recovery' },
    ],
  },
  'Creator Max': {
    name: 'Creator Max',
    tagline: 'Premium, proactive legal and business management for top-tier influencers.',
    price: '₹9,999/mo',
    link: '/login?plan=creator-max',
    isPopular: false,
    description: 'The Creator Max plan offers a dedicated legal manager and advanced tools for comprehensive protection and strategic growth, ideal for established influencers.',
    included: [
      'Dedicated legal manager.',
      'Monthly legal review calls.',
      'Advanced copyright suite with proactive monitoring.',
      'Priority escalation support for all legal matters.',
      'UGC contract negotiation.',
      'Unlimited phone consultations.',
    ],
    notIncluded: [
      'Litigation costs (court fees, external counsel fees) are not included.',
    ],
    examples: [
      { title: 'Advanced IP Protection', description: 'A dedicated legal manager oversees a complex copyright infringement case, coordinating takedown notices and potential legal action.' },
      { title: 'Strategic Planning', description: 'Monthly calls with a legal expert to review upcoming brand deals, tax implications, and content strategy.' },
    ],
    featuresList: [
      { icon: Users, text: 'Dedicated legal manager' },
      { icon: CalendarDays, text: 'Monthly strategy review' },
      { icon: ShieldCheck, text: 'Advanced copyright suite' },
      { icon: MessageSquare, text: 'Priority escalation support' },
      { icon: Phone, text: 'Unlimited phone consultations' },
    ],
  },
};
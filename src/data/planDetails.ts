import React from 'react';

export type PlanName = 'Essential' | 'Business Growth' | 'Strategic Partner';

export interface PlanFeature {
  name: string;
  essential: string | boolean;
  growth: string | boolean;
  strategic: string | boolean;
}

export interface PlanDetail {
  name: PlanName;
  tagline: string;
  price: string;
  link: string;
  isPopular: boolean;
  description: string;
  included: string[];
  notIncluded: string[];
  examples: { title: string; description: string }[];
}

export const PLAN_COMPARISON_FEATURES: { category: string; features: PlanFeature[] }[] = [
  { category: 'Advisory Team', features: [
    { name: 'Dedicated Legal Advisor', essential: true, growth: true, strategic: true },
    { name: 'Dedicated CA/Tax Advisor', essential: false, growth: true, strategic: true },
  ]},
  { category: 'Platform & Access', features: [
    { name: 'Secure Client Portal Access', essential: true, growth: true, strategic: true },
    { name: 'AI Assistant (Lexi)', essential: true, growth: true, strategic: true },
  ]},
  { category: 'Legal Services', features: [
    { name: 'Monthly Legal Consultation (Hours)', essential: '2.5 hrs', growth: '10 hrs', strategic: '25 hrs' },
    { name: 'Contract Drafting (per month)', essential: '1', growth: '3', strategic: 'Unlimited' },
    { name: 'Payment Recovery Support', essential: false, growth: true, strategic: 'Priority' },
  ]},
  { category: 'Compliance & Finance', features: [
    { name: 'Monthly GST Filing', essential: 'Standard', growth: 'Standard', strategic: 'Complex' },
    { name: 'Quarterly TDS Filing', essential: true, growth: true, strategic: true },
    { name: 'Annual Compliance Audit', essential: false, growth: 'Coordination', strategic: 'Full Audit' },
    { name: 'Payroll Management (Employees)', essential: false, growth: 'Up to 10', strategic: 'Up to 50' },
    { name: 'Quarterly Risk Assessment', essential: false, growth: false, strategic: true },
  ]},
];

export const PLAN_DETAILS: Record<PlanName, PlanDetail> = {
  'Essential': {
    name: 'Essential',
    tagline: 'The foundational legal and compliance package for micro-businesses and solopreneurs.',
    price: '₹2,999/mo',
    link: '/login?plan=essential',
    isPopular: false,
    description: 'The Essential plan provides core legal and tax compliance services, ensuring you meet mandatory requirements without the complexity of hourly billing.',
    included: [
      '2.5 hours of monthly legal consultation.',
      '1 contract draft or review per month.',
      'Standard monthly GST and quarterly TDS filing.',
      'Access to the secure client portal and AI Assistant.',
    ],
    notIncluded: [
      'Dedicated CA/Tax Advisor (only legal advisor support).',
      'Payment recovery support (requires Growth plan).',
      'Payroll management.',
      'Annual compliance audit.',
    ],
    examples: [
      { title: 'Freelancer Contract Review', description: 'A freelance developer uses their monthly contract draft allowance to secure a new client agreement.' },
      { title: 'Basic GST Filing', description: 'A small trading business ensures timely and accurate monthly GST returns.' },
    ],
  },
  'Business Growth': {
    name: 'Business Growth',
    tagline: 'Comprehensive legal and financial support designed for scaling SMEs and startups.',
    price: '₹9,999/mo',
    link: '/login?plan=growth',
    isPopular: true,
    description: 'The Business Growth plan integrates both legal and CA advisory, offering robust support for compliance, contracts, and cash flow management.',
    included: [
      'Dedicated Legal Advisor AND Dedicated CA/Tax Advisor.',
      '10 hours of combined monthly advisory time.',
      'Up to 3 contract drafts/reviews per month.',
      'Full payment recovery support (legal notices and follow-ups).',
      'Payroll management for up to 10 employees.',
      'Coordination of annual compliance audits.',
    ],
    notIncluded: [
      'Unlimited contract drafting (limited to 3 per month).',
      'Full annual audit execution (coordination only).',
      'Quarterly risk assessment.',
    ],
    examples: [
      { title: 'Payment Recovery', description: 'A startup uses the recovery support to send a formal legal notice to a client with a 60-day overdue invoice.' },
      { title: 'Hiring Compliance', description: 'The CA team manages payroll and ensures all TDS and PF compliance for 8 employees.' },
    ],
  },
  'Strategic Partner': {
    name: 'Strategic Partner',
    tagline: 'The ultimate enterprise solution offering priority support and unlimited legal resources.',
    price: '₹49,999/mo',
    link: '/login?plan=strategic',
    isPopular: false,
    description: 'The Strategic Partner plan provides the highest level of proactive legal and financial strategy, suitable for large SMEs and enterprises with complex regulatory needs.',
    included: [
      'Dedicated Legal and CA Advisors with 25 hours of priority advisory time.',
      'Unlimited contract drafting and review (subject to fair use).',
      'Priority payment recovery support and litigation strategy.',
      'Full annual compliance audit execution.',
      'Quarterly risk assessment and strategic planning sessions.',
      'Payroll management for up to 50 employees.',
    ],
    notIncluded: [
      'Litigation costs (court fees, external counsel fees) are not included.',
      'Physical presence outside major metropolitan areas (may incur travel costs).',
    ],
    examples: [
      { title: 'M&A Due Diligence', description: 'The legal team conducts preliminary due diligence for a potential acquisition, utilizing the 25 hours of advisory time.' },
      { title: 'Complex Tax Strategy', description: 'The CA team develops a complex tax optimization strategy and handles all related filings.' },
    ],
  },
};

export const PLAN_FAQS = [
  {
    question: 'What happens if I exceed my monthly consultation hours?',
    answer: 'If you are on the Essential or Growth plan and require additional advisory time, your dedicated advisor will notify you. You can either upgrade your plan immediately or purchase additional hours at a pre-agreed discounted rate. We ensure you are never surprised by extra charges.',
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'All subscriptions are billed monthly or annually and are non-refundable. You may cancel your subscription at any time through your client portal settings. Cancellation will prevent future billing, but you will retain full access to the service until the end of the current paid billing period. Please refer to the full Refund Policy for exceptions.',
  },
  {
    question: 'How does the billing cycle work?',
    answer: 'Billing is processed automatically via Razorpay on a recurring monthly or annual basis, starting from your sign-up date. You will receive an invoice 7 days before the charge is processed. You can update your payment method anytime in the "My Subscription" section of the client portal.',
  },
  {
    question: 'What is "Fair Use" for unlimited services?',
    answer: 'For the Strategic Partner plan, "Unlimited" services (like contract drafting) are subject to a fair use policy. This ensures that the volume of requests remains reasonable and does not compromise the quality or turnaround time for other clients. Your advisor will discuss any concerns regarding excessive usage directly with you.',
  },
];
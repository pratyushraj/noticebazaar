/**
 * Contextual Tips Database
 * All tips that can appear throughout the application
 */

import {
  Lightbulb,
  DollarSign,
  Shield,
  Upload,
  Info,
  TrendingUp,
  CheckCircle,
  Clock,
  Calendar,
  MessageCircle,
  Star,
  FileText,
} from 'lucide-react';
import { Tip } from '@/components/contextual-tips/TipCard';

export interface UserState {
  hasUploadedContract: boolean;
  totalDeals: number;
  earnings: number;
  protectionScore: number;
  daysActive: number;
  hasOverduePayment: boolean;
  hasExpiringContract: boolean;
  messagesSent: number;
  checkedPayments: boolean;
  viewedDeals: boolean;
}

export const getAllTips = (userState: UserState): Tip[] => {
  return [
    // Dashboard tips
    {
      id: 'dashboard-welcome',
      trigger: 'view',
      view: 'dashboard',
      condition: () => userState.daysActive <= 2,
      priority: 'high',
      icon: Lightbulb,
      color: 'from-purple-500 to-pink-500',
      title: 'Welcome Back!',
      message: 'Tap the blue + button to upload your first contract and get AI protection!',
      action: {
        label: 'Upload Now',
        type: 'navigate',
        target: '/contract-upload',
      },
      position: 'top',
      persistent: false,
    },
    {
      id: 'earnings-zero',
      trigger: 'view',
      view: 'dashboard',
      condition: () => userState.earnings === 0 && userState.totalDeals === 0,
      priority: 'medium',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      title: 'Start Earning!',
      message: 'Add your first brand deal to start tracking earnings. We\'ll help you get paid on time.',
      action: {
        label: 'Add Deal',
        type: 'navigate',
        target: '/creator-contracts',
      },
      position: 'top',
      persistent: false,
    },
    {
      id: 'protection-low',
      trigger: 'view',
      view: 'dashboard',
      condition: () => userState.protectionScore < 50,
      priority: 'high',
      icon: Shield,
      color: 'from-red-500 to-orange-500',
      title: 'Low Protection Score',
      message: 'Upload your contracts for AI review to increase your protection score and catch unfair terms.',
      action: {
        label: 'Get Protected',
        type: 'navigate',
        target: '/creator-content-protection',
      },
      position: 'center',
      persistent: true,
    },

    // Upload tips
    {
      id: 'upload-first-time',
      trigger: 'view',
      view: 'upload',
      condition: () => !userState.hasUploadedContract,
      priority: 'high',
      icon: Upload,
      color: 'from-blue-500 to-cyan-500',
      title: 'First Contract Upload',
      message: 'Our AI will analyze your contract in 30 seconds and warn you about any unfair terms, missing clauses, or risks.',
      details: ['Checks payment terms', 'Verifies IP rights', 'Spots red flags', 'Suggests improvements'],
      action: {
        label: 'Got It',
        type: 'dismiss',
      },
      position: 'top',
      persistent: false,
    },
    {
      id: 'upload-file-format',
      trigger: 'hover',
      view: 'upload',
      element: 'upload-zone',
      priority: 'low',
      icon: Info,
      color: 'from-purple-500 to-indigo-500',
      title: 'Supported Formats',
      message: 'We accept PDF and DOCX files up to 10MB. Make sure text is readable (not scanned images).',
      position: 'bottom',
      persistent: false,
    },

    // Deals tips
    {
      id: 'deals-empty',
      trigger: 'view',
      view: 'deals',
      condition: () => userState.totalDeals === 0,
      priority: 'medium',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      title: 'Track Your Brand Deals',
      message: 'Add your brand partnerships here. Track progress, deadlines, and payments all in one place.',
      action: {
        label: 'Add First Deal',
        type: 'action',
        callback: 'createDeal',
      },
      position: 'center',
      persistent: false,
    },
    {
      id: 'deal-progress-tip',
      trigger: 'hover',
      view: 'deals',
      element: 'deal-card',
      priority: 'low',
      icon: CheckCircle,
      color: 'from-green-500 to-teal-500',
      title: 'Track Progress',
      message: 'Tap any deal to see detailed progress, update status, and mark deliverables as complete.',
      position: 'bottom',
      persistent: false,
    },

    // Payments tips
    {
      id: 'payments-first-view',
      trigger: 'view',
      view: 'payments',
      condition: () => !userState.checkedPayments,
      priority: 'medium',
      icon: DollarSign,
      color: 'from-blue-500 to-purple-500',
      title: 'Never Miss a Payment',
      message: 'Set up payment reminders and we\'ll notify you before any payment is due. Track every rupee!',
      action: {
        label: 'Set Reminders',
        type: 'action',
        callback: 'setupReminders',
      },
      position: 'top',
      persistent: false,
    },
    {
      id: 'payment-late-tip',
      trigger: 'condition',
      view: 'payments',
      condition: () => userState.hasOverduePayment,
      priority: 'high',
      icon: Clock,
      color: 'from-red-500 to-orange-500',
      title: 'Payment Overdue',
      message: 'You have a payment that\'s overdue. Message the brand now or contact our legal team for help.',
      action: {
        label: 'Take Action',
        type: 'navigate',
        target: '/messages',
      },
      position: 'top',
      persistent: true,
    },

    // Protection tips
    {
      id: 'protection-score-explained',
      trigger: 'hover',
      view: 'protection',
      element: 'protection-score',
      priority: 'low',
      icon: Info,
      color: 'from-purple-500 to-indigo-500',
      title: 'Protection Score',
      message: 'Your score reflects how safe your contracts are. 85+ is excellent. Upload contracts to improve it!',
      position: 'bottom',
      persistent: false,
    },
    {
      id: 'contract-expiring',
      trigger: 'condition',
      view: 'protection',
      condition: () => userState.hasExpiringContract,
      priority: 'high',
      icon: Calendar,
      color: 'from-yellow-500 to-orange-500',
      title: 'Contract Expiring Soon',
      message: 'Your contract expires in 6 days. Review and renew it to avoid losing the deal.',
      action: {
        label: 'Review Now',
        type: 'action',
        callback: 'reviewContract',
      },
      position: 'top',
      persistent: true,
    },

    // Messages tips
    {
      id: 'messages-advisor-available',
      trigger: 'view',
      view: 'messages',
      condition: () => userState.messagesSent === 0,
      priority: 'medium',
      icon: MessageCircle,
      color: 'from-green-500 to-teal-500',
      title: 'Expert Advisors Ready',
      message: 'Our chartered accountants and legal experts are here to help. Ask anything about contracts, taxes, or deals!',
      action: {
        label: 'Start Chat',
        type: 'action',
        callback: 'startChat',
      },
      position: 'top',
      persistent: false,
    },

    // Achievement tips
    {
      id: 'milestone-first-deal',
      trigger: 'event',
      event: 'deal_created',
      priority: 'high',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      title: 'First Deal Added! 🎉',
      message: 'Great start! Keep adding deals to track your entire creator business in one place.',
      position: 'center',
      persistent: false,
      celebration: true,
    },
    {
      id: 'milestone-protection-100',
      trigger: 'event',
      event: 'protection_100',
      priority: 'high',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      title: 'Perfect Protection! 🛡️',
      message: 'Amazing! All your contracts are safe. You\'re fully protected from unfair terms.',
      position: 'center',
      persistent: false,
      celebration: true,
    },
  ];
};


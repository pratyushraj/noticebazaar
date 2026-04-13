"use client";

import { useState, useMemo, useEffect } from 'react';
import { Download, Search, CreditCard, ArrowDownRight } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { BrandDeal } from '@/types';
import { toast } from 'sonner';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { FilteredNoMatchesEmptyState, NoPaymentsEmptyState, SearchNoResultsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { useNavigate } from 'react-router-dom';
import { PaymentRequestFlow } from '@/components/payments/PaymentRequestFlow';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { exportPaymentsReport } from '@/lib/utils/exportPaymentsReport';
import { PaymentCard } from '@/components/payments/PaymentCard';

import { extractTaxInfo, getTaxDisplayMessage, calculateFinalAmount } from '@/lib/utils/taxExtraction';
import { calculatePaymentRiskLevel } from '@/lib/utils/paymentRisk';
import { formatIndianCurrency } from '@/lib/utils/currency';
import { spacing, typography, separators, iconSizes, gradients, buttons, glass, shadows, radius, motion as motionTokens, animations } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

const CreatorPaymentsAndRecovery = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Fetch real brand deals data
  const { data: brandDeals = [], isLoading: isLoadingDeals, error: dealsError } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Debug: Log deals data (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('Payments Page - Brand Deals:', {
        count: brandDeals.length,
        deals: brandDeals.map(d => ({
          id: d.id,
          brand: d.brand_name,
          amount: d.deal_amount,
          status: d.status,
          payment_received_date: d.payment_received_date,
          payment_expected_date: d.payment_expected_date,
        })),
        isLoading: isLoadingDeals,
        error: dealsError,
      });
    }
  }, [brandDeals, isLoadingDeals, dealsError]);

  // Fetch expenses data
  const { data: expenses = [] } = useExpenses({
    creatorId: profile?.id || '',
    enabled: !!profile?.id,
  });

  // Calculate stats from real brand deals data
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate this month's earnings
    const thisMonthEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const date = new Date(deal.payment_received_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Calculate last month's earnings for growth
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const date = new Date(deal.payment_received_date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Calculate total received (all time)
    const totalReceived = brandDeals
      .filter(deal => deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Calculate pending payments
    const pending = brandDeals
      .filter(deal => deal.status === 'Payment Pending' && !deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Get next payout (earliest pending payment)
    const nextPayoutDeal = brandDeals
      .filter(deal => deal.status === 'Payment Pending' && deal.payment_expected_date)
      .sort((a, b) => {
        const dateA = new Date(a.payment_expected_date!).getTime();
        const dateB = new Date(b.payment_expected_date!).getTime();
        return dateA - dateB;
      })[0];

    // Calculate growth percentage
    const growthPercentage = lastMonthEarnings > 0
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
      : thisMonthEarnings > 0 ? 100 : 0;

    // Calculate total expenses (from expenses table)
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Calculate net income (total received - total expenses)
    const netIncome = totalReceived - totalExpenses;

    return {
      totalReceived,
      pending,
      thisMonth: thisMonthEarnings,
      nextPayout: nextPayoutDeal?.deal_amount || 0,
      payoutDate: nextPayoutDeal?.payment_expected_date
        ? new Date(nextPayoutDeal.payment_expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'TBD',
      growthPercentage,
      totalExpenses,
      netIncome
    };
  }, [brandDeals, expenses]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'received', label: 'Paid' }
  ];

  // Helper function to extract or generate invoice number
  // Format: INV-{year}-{short-contract-id}-{random4}
  // replaced-by-ultra-polish: replaced any with BrandDeal type
  const getOrGenerateInvoiceNumber = (deal: BrandDeal): string => {
    // If invoice number already exists in database, use it
    // Note: invoice_number may not exist on BrandDeal type, so we check safely
    const invoiceNumber = (deal as any).invoice_number;
    if (invoiceNumber) {
      return invoiceNumber;
    }

    // Try to extract invoice number from contract text
    const contractText = deal.deliverables || '';
    const invoicePatterns = [
      /invoice\s*(?:number|#|no\.?|id)?\s*:?\s*([A-Z0-9\-]+)/i,
      /inv\s*(?:number|#|no\.?|id)?\s*:?\s*([A-Z0-9\-]+)/i,
      /invoice\s+([A-Z0-9\-]+)/i,
      /(?:invoice|inv)[\s:]+([A-Z0-9]{6,})/i,
    ];

    for (const pattern of invoicePatterns) {
      const match = contractText.match(pattern);
      if (match && match[1]) {
        const extractedInvoice = match[1].trim().toUpperCase();
        // Validate format (should contain alphanumeric and hyphens)
        if (/^[A-Z0-9\-]+$/.test(extractedInvoice) && extractedInvoice.length >= 4) {
          return extractedInvoice;
        }
      }
    }

    // If no invoice found, generate one: INV-{year}-{short-id}-{random4}
    const year = new Date().getFullYear();
    const shortId = deal.id.substring(0, 8).toUpperCase();
    const random4 = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const generatedInvoice = `INV-${year}-${shortId}-${random4}`;

    return generatedInvoice;
  };

  // Helper function to extract payment method from contract/deal data
  // Looks for payment method in contract text, deliverables, or deal metadata
  // replaced-by-ultra-polish: replaced any with BrandDeal type
  const extractPaymentMethod = (deal: BrandDeal): string | null => {
    // Check if payment method is explicitly stored in deal data
    // This would be populated during contract analysis
    // Note: payment_method may not exist on BrandDeal type, so we check safely
    const paymentMethod = (deal as any).payment_method;
    if (paymentMethod) {
      return paymentMethod;
    }

    // Check contract file URL or deliverables for payment method keywords
    const contractText = deal.deliverables || '';
    const lowerText = contractText.toLowerCase();

    // Keywords that indicate payment methods
    const paymentMethodPatterns = [
      { pattern: /bank\s+transfer|wire\s+transfer|banking/i, method: 'Bank Transfer' },
      { pattern: /upi|unified\s+payments\s+interface/i, method: 'UPI' },
      { pattern: /razorpay|razor\s+pay/i, method: 'Razorpay' },
      { pattern: /paypal/i, method: 'PayPal' },
      { pattern: /stripe/i, method: 'Stripe' },
      { pattern: /paytm/i, method: 'Paytm' },
      { pattern: /google\s+pay|gpay/i, method: 'Google Pay' },
      { pattern: /phonepe/i, method: 'PhonePe' },
      { pattern: /cash/i, method: 'Cash' },
      { pattern: /cheque|check/i, method: 'Cheque' },
      { pattern: /neft/i, method: 'NEFT' },
      { pattern: /rtgs/i, method: 'RTGS' },
      { pattern: /imps/i, method: 'IMPS' },
    ];

    // Search for payment method keywords in contract text
    for (const { pattern, method } of paymentMethodPatterns) {
      if (pattern.test(lowerText)) {
        return method;
      }
    }

    // If no payment method found, return null
    // This will display "Not Provided" in the UI
    return null;
  };

  // Transform brand deals to transactions
  const allTransactions = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Show all deals that have payment information (received or expected)
    // Include deals with: payment_received_date, payment_expected_date, or Payment Pending status
    return brandDeals
      .filter(deal =>
        deal.payment_received_date ||
        deal.payment_expected_date ||
        deal.status === 'Payment Pending' ||
        deal.status?.toLowerCase().includes('payment')
      )
      .map(deal => {
        // Extract or generate invoice number
        const invoiceNumber = getOrGenerateInvoiceNumber(deal);
        // Use actual deal amount from database (not estimated)
        const amount = Number(deal.deal_amount) || 0;

        // Extract tax information from contract text
        const contractText = deal.deliverables || '';
        const taxInfo = extractTaxInfo(contractText);
        const taxDisplay = getTaxDisplayMessage(taxInfo);

        // Calculate final amount after GST and TDS (if applicable)
        const finalAmountCalc = calculateFinalAmount(
          amount,
          taxInfo.gstRate,
          taxInfo.gstIncluded,
          taxInfo.tdsRate
        );

        const paymentReceivedDate = deal.payment_received_date ? new Date(deal.payment_received_date) : null;

        // Calculate payment expected date:
        // 1. Use payment_expected_date if set
        // 2. Otherwise, calculate from due_date + payment terms (if available)
        // 3. Default to due_date if no payment terms
        let paymentExpectedDate: Date | null = null;
        if (deal.payment_expected_date) {
          paymentExpectedDate = new Date(deal.payment_expected_date);
        } else if (deal.due_date) {
          // If no payment_expected_date, use due_date as fallback
          // In a real scenario, this would be calculated from contract terms (e.g., 45 days after posting)
          paymentExpectedDate = new Date(deal.due_date);
        }

        // Determine status
        let paymentStatus: 'received' | 'pending' | 'due_today' | 'overdue' = 'pending';
        let daysInfo = '';
        let riskLevel: 'low' | 'moderate' | 'overdue' = 'low';

        if (paymentReceivedDate) {
          paymentStatus = 'received';
          daysInfo = 'Paid';
        } else if (paymentExpectedDate) {
          const diffTime = paymentExpectedDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            paymentStatus = 'overdue';
            daysInfo = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
            riskLevel = 'overdue';
          } else if (diffDays === 0) {
            paymentStatus = 'due_today';
            daysInfo = 'Due today';
            riskLevel = 'moderate';
          } else {
            paymentStatus = 'pending';
            daysInfo = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;

            // Use new priority-based risk calculation
            // Contract risk score would need to be extracted from deal if available
            // For now, we'll use timing-based calculation
            const contractRiskScore = 0; // Could be extracted from deal.contract_analysis if available
            riskLevel = calculatePaymentRiskLevel(
              paymentExpectedDate,
              contractRiskScore,
              now
            );
          }
        }

        // Format expected date
        const expectedDateStr = paymentExpectedDate
          ? paymentExpectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'TBD';

        // Determine category label
        const category = deal.platform
          ? `${deal.platform} Campaign`
          : 'Brand Partnership';

        return {
          id: deal.id,
          title: deal.brand_name ? `${deal.brand_name} Campaign` : 'Campaign',
          dealName: deal.brand_name || 'Unknown Brand',
          brand: deal.brand_name,
          amount,
          tax: null, // Keep for backward compatibility
          hasTaxInfo: taxInfo.taxClarity !== 'missing', // Flag to check if tax info is available
          type: paymentReceivedDate ? 'received' : 'pending',
          status: paymentReceivedDate ? 'completed' : paymentStatus,
          paymentStatus, // New: specific payment status
          date: paymentReceivedDate
            ? paymentReceivedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : expectedDateStr,
          expectedDate: expectedDateStr,
          daysInfo,
          riskLevel: ((): 'low' | 'moderate' | 'overdue' => {
            // Payment timing risk takes priority over contract risk
            // If already overdue, keep it overdue
            if (riskLevel === 'overdue') {
              return 'overdue';
            }
            // Contract risk can only elevate to moderate, never to overdue
            const taxRiskScore = taxInfo.riskScore;
            if (taxRiskScore >= 15 && riskLevel === 'low') {
              return 'moderate'; // Contract risk elevates low to moderate
            }
            return riskLevel; // Use payment timing risk level
          })(),
          method: extractPaymentMethod(deal), // Extract from contract or null if not found
          invoice: invoiceNumber,
          platform: deal.platform || 'Multiple',
          category,
          taxInfo: taxDisplay, // Include tax display message
          finalAmount: finalAmountCalc.finalAmount, // Final amount after tax calculations
        };
      });
  }, [brandDeals]);

  // Transform expenses to transaction-like format for display
  const expenseTransactions = useMemo(() => {
    return expenses.map(expense => ({
      id: expense.id,
      title: expense.description || expense.category,
      brand: expense.vendor_name || 'N/A',
      platform: expense.category,
      amount: expense.amount,
      type: 'expense' as const,
      paymentStatus: 'received' as const,
      expectedDate: expense.expense_date,
      daysInfo: undefined,
      riskLevel: undefined,
      method: expense.payment_method || undefined,
      invoice: expense.receipt_file_url ? 'Receipt available' : 'No receipt',
      tax: undefined,
      taxInfo: undefined,
      finalAmount: expense.amount,
      expense: expense, // Include full expense object for ExpenseCard
    }));
  }, [expenses]);

  const filteredTransactions = useMemo(() => {
    // Combine all transactions and expenses
    const allItems = [...allTransactions, ...expenseTransactions];

    let filtered = activeFilter === 'all'
      ? allItems.filter(t => t.type !== 'expense') // Exclude expenses from main view
      : allItems.filter(t => t.type === activeFilter);

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.invoice && t.invoice.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.expectedDate ? new Date(a.expectedDate).getTime() : 0;
      const dateB = b.expectedDate ? new Date(b.expectedDate).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [allTransactions, expenseTransactions, activeFilter, searchQuery]);

  const totalPending = useMemo(() =>
    allTransactions
      .filter(t => t.type === 'pending' || t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0),
    [allTransactions]
  );

  return (
    <ContextualTipsProvider currentView="payments">
      <div className={`min-h-full ${gradients.page} text-foreground ${spacing.page} pb-24 safe-area-fix`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={cn(typography.h1, "mb-1")}>Payments</h1>
            <p className={cn(typography.bodySmall, "text-foreground/60")}>Track pending payments and completed payouts</p>
          </div>
          <motion.button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              toast.info('Export report functionality coming soon!');
            }}
            whileTap={animations.microTap}
            whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
            className={cn(
              glass.apple,
              "w-11 h-11 rounded-2xl flex items-center justify-center",
              shadows.lg
            )}
            aria-label="Export report"
          >
            <Download className={cn(iconSizes.md, "text-info")} />
          </motion.button>
        </div>

        {/* Stats Overview - Refactored for Mobile */}
        <div className="mb-6 grid grid-cols-1 gap-3">
          {/* Primary Card: Pending Amount (Highlighted) */}
          <div className={cn(glass.apple, "rounded-[28px] p-5", shadows.depth)}>
            <div className="text-sm text-foreground/60 mb-1">Pending Amount</div>
            <div className="text-3xl font-black font-outfit text-yellow-400 mb-1">{formatIndianCurrency(totalPending)}</div>
            <div className="text-xs text-foreground/50">Across active signed deals</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Paid This Month */}
            <div className={cn(glass.apple, "rounded-2xl p-4")}>
              <div className="text-xs text-foreground/60 mb-1">Paid This Month</div>
              <div className="text-xl font-bold text-green-400">{formatIndianCurrency(stats.thisMonth)}</div>
            </div>

            {/* Total Earnings */}
            <div className={cn(glass.apple, "rounded-2xl p-4")}>
              <div className="text-xs text-foreground/60 mb-1">Total Earnings</div>
              <div className="text-lg font-semibold text-foreground/90">{formatIndianCurrency(stats.totalReceived)}</div>
            </div>
          </div>
        </div>

        {/* Section Separator */}
        <div className={separators.section} />

        {/* Quick Actions - Mobile Optimized (2 Primary Actions) */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Primary: Request Payment */}
          <motion.button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              setShowPaymentRequest(true);
            }}
            whileTap={animations.microTap}
            className={cn(glass.apple, "rounded-2xl p-4 hover:bg-white/10 transition-all")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <ArrowDownRight className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">Request Payment</div>
                <div className="text-xs text-foreground/60">Send reminder</div>
              </div>
            </div>
          </motion.button>

          {/* Secondary: Export Report */}
          <motion.button
            onClick={async () => {
              triggerHaptic(HapticPatterns.medium);
              try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                await exportPaymentsReport({
                  brandDeals,
                  expenses,
                  stats: {
                    totalReceived: stats.totalReceived,
                    pending: stats.pending,
                    thisMonth: stats.thisMonth,
                    totalExpenses: stats.totalExpenses,
                    netIncome: stats.netIncome,
                  },
                  period: {
                    startDate: startOfMonth.toISOString().split('T')[0],
                    endDate: endOfMonth.toISOString().split('T')[0],
                  },
                });
              } catch (error) {
                // Error is handled by the export function
              }
            }}
            whileTap={animations.microTap}
            className={cn(glass.apple, "rounded-2xl p-4 hover:bg-white/10 transition-all")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Download className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">Export Report</div>
                <div className="text-xs text-foreground/60">Download PDF</div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Add Expense - Hidden on mobile, accessible via menu or secondary action */}
        <div className="mb-6 md:hidden">
          <motion.button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              setShowAddExpense(true);
            }}
            whileTap={animations.microTap}
            className={cn("w-full ", glass.apple, "rounded-2xl p-4 hover:bg-white/10 transition-all text-left")}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 flex-shrink-0 text-foreground/60" />
              <div>
                <div className="text-sm font-medium text-foreground/80">Add Expense</div>
                <div className="text-xs text-foreground/50">Track all your business expenses</div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Section Separator */}
        <div className={separators.section} />

        {/* Search Bar - Full Width */}
        <div className="mb-6">
          <motion.div
            initial={motionTokens.slide.up.initial}
            animate={motionTokens.slide.up.animate}
            transition={motionTokens.slide.up.transition}
            className={cn(
              "relative flex items-center w-full",
              glass.apple,
              "rounded-2xl",
              "px-4 py-3.5",
              shadows.lg
            )}
          >
            <Search className={cn(iconSizes.sm, "text-info mr-3 flex-shrink-0")} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className={cn(
                "bg-transparent text-foreground placeholder:text-foreground/50 outline-none w-full",
                typography.bodySmall,
                "flex-1"
              )}
            />
          </motion.div>
        </div>

        {/* Filter Tabs - Simplified: All | Pending | Paid */}
        <div className="mb-6">
          <div
            role="tablist"
            aria-label="Transaction filters"
            className={cn(
              "flex gap-2 overflow-x-auto pb-2",
              "px-1 -mx-1",
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <motion.button
                  key={filter.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={filter.label}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setActiveFilter(filter.id);
                  }}
                  whileTap={animations.microTap}
                  whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0",
                    isActive
                      ? cn(glass.appleStrong, "text-foreground shadow-xl")
                      : cn(glass.apple, "text-foreground/60 hover:text-foreground/80 hover:bg-white/10")
                  )}
                >
                  {filter.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Section Separator */}
        <div className={separators.section} />

        {/* Loading State - Skeleton list */}
        {isLoadingDeals && (
          <div className="space-y-3" data-section="transactions">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn(glass.apple, "rounded-2xl p-4 animate-pulse")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-white/10" />
                    <div className="h-3 w-16 rounded bg-white/5" />
                  </div>
                  <div className="h-5 w-16 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transactions List */}
        {!isLoadingDeals && filteredTransactions.length > 0 && (
          <div className="space-y-3" data-section="transactions">
            {filteredTransactions.map(transaction => {
              // If it's an expense, use ExpenseCard
              if (transaction.type === 'expense' && (transaction as any).expense) {
                return (
                  <ExpenseCard
                    key={transaction.id}
                    expense={(transaction as any).expense}
                  />
                );
              }
              // Otherwise use PaymentCard
              return (
                <PaymentCard
                  key={transaction.id}
                  id={transaction.id}
                  title={transaction.title}
                  dealName={transaction.brand}
                  platform={transaction.platform}
                  amount={transaction.amount}
                  type={transaction.type as 'received' | 'pending' | 'expense'}
                  paymentStatus={transaction.paymentStatus}
                  expectedDate={transaction.expectedDate}
                  daysInfo={transaction.daysInfo}
                  riskLevel={transaction.riskLevel}
                  method={transaction.method}
                  invoice={transaction.invoice}
                  tax={transaction.tax}
                  taxInfo={transaction.taxInfo}
                  finalAmount={transaction.finalAmount}
                  onClick={() => navigate(`/payment/${transaction.id}`)}
                />
              );
            })}
          </div>
        )}

        {/* Empty State - Always show when no transactions */}
        {filteredTransactions.length === 0 && !isLoadingDeals && (
          <div className="py-12">
            {allTransactions.length === 0 ? (
              <NoPaymentsEmptyState
                onAddDeal={() => navigate('/contract-upload')}
              />
            ) : searchQuery ? (
              <SearchNoResultsEmptyState
                searchTerm={searchQuery}
                onClearFilters={() => setSearchQuery('')}
              />
            ) : activeFilter === 'pending' ? (
              <div className="space-y-3 text-center max-w-sm mx-auto">
                <p className="text-base font-semibold text-foreground">No pending transactions</p>
                <p className="text-sm text-foreground/60">You&apos;re all caught up on payments!</p>
                <button type="button"
                  type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setActiveFilter('all');
                  }}
                  className="text-sm font-medium text-info hover:text-info underline"
                >
                  View all transactions
                </button>
              </div>
            ) : activeFilter === 'received' ? (
              <div className="space-y-3 text-center max-w-sm mx-auto">
                <p className="text-base font-semibold text-foreground">No paid transactions yet</p>
                <p className="text-sm text-foreground/60">Completed payments will show here.</p>
                <button type="button"
                  type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setActiveFilter('all');
                  }}
                  className="text-sm font-medium text-info hover:text-info underline"
                >
                  View all transactions
                </button>
              </div>
            ) : (
              <FilteredNoMatchesEmptyState
                onClearFilters={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                filterCount={activeFilter !== 'all' ? 1 : 0}
              />
            )}
          </div>
        )}

        {/* Add Expense Dialog */}
        <AddExpenseDialog
          open={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            // Switch to expense filter and scroll to expenses section
            setActiveFilter('expense');
            triggerHaptic(HapticPatterns.light);
            // Scroll to expenses section
            setTimeout(() => {
              const expensesSection = document.querySelector('[data-section="transactions"]');
              if (expensesSection) {
                expensesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }}
        />

        {/* Payment Request Flow */}
        {showPaymentRequest && (
          <PaymentRequestFlow
            onClose={() => setShowPaymentRequest(false)}
          />
        )}
      </div>
    </ContextualTipsProvider>
  );
};

export default CreatorPaymentsAndRecovery;

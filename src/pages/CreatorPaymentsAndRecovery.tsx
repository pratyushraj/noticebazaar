"use client";

import { useState, useMemo, useEffect } from 'react';
import { Download, Filter, Search, CreditCard, ArrowDownRight } from 'lucide-react';
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
import { SummaryCard } from '@/components/payments/SummaryCard';
import { ActionTile } from '@/components/payments/ActionTile';
import { extractTaxInfo, getTaxDisplayMessage, calculateFinalAmount } from '@/lib/utils/taxExtraction';
import { spacing, typography, separators, iconSizes, scroll, sectionHeader, gradients, buttons, glass, shadows, radius, vision, motion as motionTokens, animations } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CreatorPaymentsAndRecovery = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState('all');
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
    { id: 'received', label: 'Received' },
    { id: 'pending', label: 'Pending' },
    { id: 'expense', label: 'Expenses' }
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
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        
        if (paymentReceivedDate) {
          paymentStatus = 'received';
          daysInfo = 'Paid';
        } else if (paymentExpectedDate) {
          const diffTime = paymentExpectedDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            paymentStatus = 'overdue';
            daysInfo = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
            riskLevel = diffDays < -7 ? 'high' : 'medium';
          } else if (diffDays === 0) {
            paymentStatus = 'due_today';
            daysInfo = 'Due today';
            riskLevel = 'medium';
          } else {
            paymentStatus = 'pending';
            daysInfo = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
            
            // Improved risk calculation based on payment terms and contract issues
            // High risk factors (based on contract analysis):
            // - Payment delay > 45 days (very long payment terms)
            // - Payment only after brand review/approval (no guaranteed payment)
            // - No penalty for delayed payment
            // - No TDS/GST clarity
            // - Brand can terminate without payment
            // - Long exclusivity periods (60+ days total)
            // - Unlimited paid ads usage
            const paymentDelayDays = paymentExpectedDate && deal.due_date 
              ? Math.ceil((paymentExpectedDate.getTime() - new Date(deal.due_date).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            
            // High risk if:
            // - Payment delay > 45 days (very long terms)
            // - Less than 7 days remaining (urgent)
            // - Payment delay > 30 days AND less than 14 days remaining (risky combination)
            if (paymentDelayDays > 45) {
              // Very long payment terms = High Risk (e.g., 45 days after posting)
              riskLevel = 'high';
            } else if (diffDays <= 7) {
              // Less than a week remaining = High Risk
              riskLevel = 'high';
            } else if (paymentDelayDays > 30 || diffDays <= 14) {
              // Medium-long payment terms OR less than 2 weeks = Medium Risk
              riskLevel = 'medium';
            } else {
              // Standard payment terms with good buffer = Low Risk
              riskLevel = 'low';
            }
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
          riskLevel: ((): 'low' | 'medium' | 'high' => {
            // Combine payment risk with tax risk
            const taxRiskScore = taxInfo.riskScore;
            if (taxRiskScore >= 25) {
              return 'high'; // Tax risk is very high
            } else if (taxRiskScore >= 15 || (riskLevel === 'high' && taxRiskScore > 0)) {
              return 'high'; // High tax risk or high payment risk with any tax risk
            } else if (taxRiskScore > 0 || riskLevel === 'medium') {
              return 'medium'; // Medium risk from either source
            }
            return riskLevel; // Use original payment risk
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
      ? allItems
      : activeFilter === 'expense'
      ? expenseTransactions
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
    <div className={`min-h-full ${gradients.page} text-white ${spacing.page} pb-24 safe-area-fix`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={typography.h1 + " mb-1"}>Payments</h1>
          <p className={typography.body + " font-medium"}>Track your income & expenses</p>
        </div>
        <motion.button 
          onClick={() => {
            triggerHaptic(HapticPatterns.light);
            toast.info('Export report functionality coming soon!');
          }}
          whileTap={animations.microTap}
          whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
          className={cn(
            buttons.icon,
            glass.apple,
            radius.md,
            spacing.cardPadding.tertiary,
            shadows.lg
          )}
          aria-label="Export report"
        >
          <Download className={iconSizes.md} />
        </motion.button>
      </div>

      {/* Stats Overview - Premium Summary Card */}
        <div className="mb-6">
        <SummaryCard
          thisMonth={stats.thisMonth}
          growthPercentage={stats.growthPercentage}
          pending={totalPending}
          nextPayout={stats.nextPayout}
          payoutDate={stats.payoutDate}
        />
        </div>

      {/* Section Separator */}
      <div className={separators.section} />

      {/* Quick Actions - Glass Tiles */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ActionTile
          icon={ArrowDownRight}
          label="Request Payment"
          onClick={() => {
            triggerHaptic(HapticPatterns.light);
            setShowPaymentRequest(true);
          }}
          iconBgColor="bg-green-500/20"
          iconColor="text-green-400"
        />
        
        <ActionTile
          icon={CreditCard}
          label="Add Expense"
          onClick={() => {
            triggerHaptic(HapticPatterns.light);
            setShowAddExpense(true);
          }}
          iconBgColor="bg-blue-500/20"
          iconColor="text-blue-400"
        />
        
        <ActionTile
          icon={Download}
          label="Export Report"
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
          iconBgColor="bg-purple-500/20"
          iconColor="text-purple-400"
        />
      </div>

      {/* Section Separator */}
      <div className={separators.section} />

      {/* Search Bar - Frosted Capsule */}
      <div className="mb-4">
        <motion.div 
          initial={motionTokens.slide.up.initial}
          animate={motionTokens.slide.up.animate}
          transition={motionTokens.slide.up.transition}
          className={cn(
            "relative flex items-center",
            glass.apple,
            radius.full,
            spacing.cardPadding.secondary,
            shadows.lg
          )}
        >
          {/* Spotlight */}
          <div className={cn(vision.spotlight.base, "opacity-20")} />
          
          <Search className={cn(iconSizes.sm, "text-purple-300 mr-3 flex-shrink-0")} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..." 
            className={cn(
              "bg-transparent text-white placeholder:text-white/50 outline-none w-full",
              typography.bodySmall,
              "flex-1"
            )}
          />
          <motion.button 
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              toast.info('Filter options coming soon');
            }}
            whileTap={animations.microTap}
            className={cn("ml-2", buttons.icon, "flex-shrink-0")}
            aria-label="Filter transactions"
          >
            <Filter className={cn(iconSizes.sm, "text-purple-300")} />
          </motion.button>
        </motion.div>
      </div>

      {/* Filter Tabs - Pill Buttons */}
        <div className="mb-6">
        <div className={cn(
          "flex gap-2 overflow-x-auto pb-2",
          "px-1 -mx-1", // Add padding to prevent clipping of ring/shadow
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}>
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                setActiveFilter(filter.id);
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                spacing.cardPadding.secondary,
                radius.full,
                typography.bodySmall,
                "font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0",
                activeFilter === filter.id
                  ? 'bg-white/15 text-white border-2 border-white/20 shadow-lg shadow-white/10'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/8'
              )}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
          </div>

      {/* Section Separator */}
      <div className={separators.section} />

      {/* Transactions List */}
      {filteredTransactions.length > 0 && (
        <div className={spacing.card} data-section="transactions">
          <div className={sectionHeader.base}>
            <h2 className={sectionHeader.title}>
              {activeFilter === 'expense' ? 'Expenses' : 'Recent Transactions'}
            </h2>
            <motion.button 
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                // Navigate to full transactions view
              }}
              whileTap={animations.microTap}
              className={cn(sectionHeader.action, "font-medium")}
            >
              View All
            </motion.button>
          </div>

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
      
      {/* Loading State */}
      {isLoadingDeals && (
        <div className="py-12 text-center">
          <div className="text-white/60">Loading payments...</div>
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

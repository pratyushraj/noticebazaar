import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EnhancedPaymentCard from '@/components/payments/EnhancedPaymentCard';
import FinancialOverviewHeader from '@/components/payments/FinancialOverviewHeader';
import PaymentQuickFilters from '@/components/payments/PaymentQuickFilters';
import { typography } from '@/lib/design-system';
import { BrandDeal } from '@/types';
import { computePaymentStatus, computeDaysUntilDue, PaymentStatus } from '@/lib/constants/paymentStatus';

interface PaymentsTabProps {
    brandDeals: BrandDeal[];
}

const PaymentsTab = ({ brandDeals }: PaymentsTabProps) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeFilter, setActiveFilter] = React.useState<PaymentStatus | 'all' | null>(null);

    const paymentsWithStatus = useMemo(() => {
      return brandDeals.map(deal => ({
        deal,
        status: computePaymentStatus(deal.payment_received_date, deal.payment_expected_date),
        daysUntilDue: computeDaysUntilDue(deal.payment_expected_date),
      }));
    }, [brandDeals]);

    const filteredPayments = useMemo(() => {
      return paymentsWithStatus.filter(({ deal, status, daysUntilDue }) => {
        const matchesSearch = (deal.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = !activeFilter || activeFilter === 'all' || status === activeFilter;
        return matchesSearch && matchesFilter;
      });
    }, [paymentsWithStatus, searchQuery, activeFilter]);

    return (
        <div className="space-y-6">
            <h2 className={typography.h2}>Payments</h2>

            <FinancialOverviewHeader allDeals={brandDeals} />

            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                    />
                </div>

                <PaymentQuickFilters
                    allDeals={brandDeals}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredPayments.map(({ deal, status, daysUntilDue }) => (
                        <EnhancedPaymentCard
                            key={deal.id}
                            deal={deal}
                            status={status}
                            daysLeft={daysUntilDue !== null && daysUntilDue > 0 ? daysUntilDue : undefined}
                            daysOverdue={daysUntilDue !== null && daysUntilDue < 0 ? -daysUntilDue : undefined}
                            onSendReminder={() => { }}
                            onMarkPaid={() => { }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-white/40">No payments found.</p>
                </div>
            )}
        </div>
    );
};

export default PaymentsTab;

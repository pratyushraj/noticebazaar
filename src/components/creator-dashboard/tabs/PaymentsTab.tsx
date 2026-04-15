import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EnhancedPaymentCard from '@/components/payments/EnhancedPaymentCard';
import FinancialOverviewHeader from '@/components/payments/FinancialOverviewHeader';
import PaymentQuickFilters from '@/components/payments/PaymentQuickFilters';
import { typography } from '@/lib/design-system';
import { BrandDeal } from '@/types';

interface PaymentsTabProps {
    brandDeals: BrandDeal[];
}

const PaymentsTab = ({ brandDeals }: PaymentsTabProps) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

    const getPaymentStatus = (deal: BrandDeal): 'overdue' | 'pending' | 'upcoming' | 'paid' => {
        const rawStatus = (deal.status || '').toLowerCase();
        if (deal.payment_received_date || rawStatus.includes('completed') || rawStatus === 'paid') return 'paid';

        const now = new Date();
        const dueDate = deal.payment_expected_date ? new Date(deal.payment_expected_date) : null;

        if (dueDate && dueDate < now) return 'overdue';
        if (dueDate && (dueDate.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000)) return 'upcoming';
        return 'pending';
    };

    const filteredPayments = brandDeals.filter(deal => {
        const matchesSearch = (deal.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const status = getPaymentStatus(deal);
        const matchesFilter = !activeFilter || activeFilter === 'all' || status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <h2 className={typography.h2}>Payments</h2>

            <FinancialOverviewHeader allDeals={brandDeals} />

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search payments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                        />
                    </div>
                </div>

                <PaymentQuickFilters
                    allDeals={brandDeals}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredPayments.map((deal) => {
                        const status = getPaymentStatus(deal);
                        const now = new Date();
                        const dueDate = deal.payment_expected_date ? new Date(deal.payment_expected_date) : null;
                        const daysOverdue = dueDate && dueDate < now ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
                        const daysLeft = dueDate && dueDate > now ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

                        return (
                            <EnhancedPaymentCard
                                key={deal.id}
                                deal={deal}
                                status={status}
                                daysOverdue={daysOverdue}
                                daysLeft={daysLeft}
                                onSendReminder={() => { }}
                                onMarkPaid={() => { }}
                            />
                        );
                    })}
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

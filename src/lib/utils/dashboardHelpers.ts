// Simple relative time formatter (replaces date-fns to avoid new dependency)
const formatDistanceToNow = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'just now';
};

// Transform brand deals data into dashboard stats
export const calculateDashboardStats = (brandDeals: any[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const activeDeals = brandDeals.filter(deal => {
        const statusLower = String(deal.status || '').toLowerCase();
        const exec = String(deal?.deal_execution_status || '').toLowerCase();
        return (
            exec === 'signed' ||
            exec === 'completed' ||
            statusLower.includes('signed') ||
            statusLower.includes('active') ||
            statusLower.includes('content') ||
            statusLower.includes('approved')
        ) && deal.status !== 'Completed';
    });

    const completedDeals = brandDeals.filter(deal => deal.status === 'Completed');

    const totalEarnings = brandDeals
        .filter(deal => deal.payment_received_date)
        .reduce((sum, deal) => sum + (Number(deal.deal_amount) || 0), 0);

    const pendingPayments = brandDeals
        .filter(deal => !deal.payment_received_date && deal.deal_amount)
        .reduce((sum, deal) => sum + (Number(deal.deal_amount) || 0), 0);

    return {
        totalEarnings,
        activeDeals: activeDeals.length,
        pendingPayments,
        completedDeals: completedDeals.length,
    };
};

// Calculate month-over-month trends
export const calculateTrends = (brandDeals: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthEarnings = brandDeals
        .filter(deal => {
            if (!deal.payment_received_date) return false;
            const date = new Date(deal.payment_received_date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, deal) => sum + (Number(deal.deal_amount) || 0), 0);

    const lastMonthEarnings = brandDeals
        .filter(deal => {
            if (!deal.payment_received_date) return false;
            const date = new Date(deal.payment_received_date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        })
        .reduce((sum, deal) => sum + (Number(deal.deal_amount) || 0), 0);

    const earningsTrend = lastMonthEarnings > 0
        ? Math.round(((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
        : 0;

    const currentMonthDeals = brandDeals.filter(deal => {
        const date = new Date(deal.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const lastMonthDeals = brandDeals.filter(deal => {
        const date = new Date(deal.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    const dealsTrend = lastMonthDeals > 0
        ? Math.round(((currentMonthDeals - lastMonthDeals) / lastMonthDeals) * 100)
        : 0;

    return {
        earnings: earningsTrend,
        deals: dealsTrend,
    };
};

// Generate revenue chart data (last 6 months)
export const generateRevenueChartData = (brandDeals: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
        const targetMonth = now.getMonth() - i;
        const targetYear = now.getFullYear();
        const adjustedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;
        const adjustedYear = targetMonth < 0 ? targetYear - 1 : targetYear;

        const monthEarnings = brandDeals
            .filter(deal => {
                if (!deal.payment_received_date) return false;
                const date = new Date(deal.payment_received_date);
                return date.getMonth() === adjustedMonth && date.getFullYear() === adjustedYear;
            })
            .reduce((sum, deal) => sum + (Number(deal.deal_amount) || 0), 0);

        data.push({
            month: months[adjustedMonth],
            amount: monthEarnings,
        });
    }

    return data;
};

// Extract urgent actions from deals
export const extractUrgentActions = (brandDeals: any[], navigate: (path: string) => void) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const urgentActions: any[] = [];

    brandDeals.forEach(deal => {
        // Payment overdue
        if (deal.payment_expected_date && !deal.payment_received_date) {
            const dueDate = new Date(deal.payment_expected_date);
            if (dueDate < now) {
                const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                urgentActions.push({
                    id: `payment-${deal.id}`,
                    type: 'payment_overdue',
                    brand_name: deal.brand_name || 'Brand',
                    amount: Number(deal.deal_amount) || 0,
                    daysOverdue,
                    onClick: () => navigate(`/creator-contracts/${deal.id}`),
                });
            }
        }

        // Deliverable overdue
        if (deal.due_date && deal.status !== 'Completed') {
            const dueDate = new Date(deal.due_date);
            if (dueDate < now) {
                const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                urgentActions.push({
                    id: `deliverable-${deal.id}`,
                    type: 'deliverable_overdue',
                    brand_name: deal.brand_name || 'Brand',
                    daysOverdue,
                    onClick: () => navigate(`/creator-contracts/${deal.id}`),
                });
            }
        }

        // Signature needed (contract ready but not signed by creator)
        const statusLower = String(deal.status || '').toLowerCase();
        if (statusLower.includes('contract_ready') || statusLower.includes('agreement_prepared')) {
            const creatorSignature = deal.signatures?.find((s: any) => s.signer_type === 'creator');
            if (!creatorSignature?.signed) {
                urgentActions.push({
                    id: `signature-${deal.id}`,
                    type: 'signature_needed',
                    brand_name: deal.brand_name || 'Brand',
                    onClick: () => navigate(`/creator-contracts/${deal.id}`),
                });
            }
        }
    });

    // Sort by priority: payment overdue > deliverable overdue > signature needed
    const priority: Record<string, number> = { payment_overdue: 3, deliverable_overdue: 2, signature_needed: 1, response_needed: 0 };
    return urgentActions.sort((a, b) => (priority[b.type] || 0) - (priority[a.type] || 0));
};

// Generate recent activity from deals
export const generateRecentActivity = (brandDeals: any[]) => {
    const activities: any[] = [];

    brandDeals.forEach(deal => {
        // Deal created
        activities.push({
            id: `created-${deal.id}`,
            type: 'deal_created',
            title: `Deal with ${deal.brand_name || 'Brand'}`,
            description: 'New collaboration created',
            timestamp: deal.created_at,
            relativeTime: formatDistanceToNow(new Date(deal.created_at)),
        });

        // Payment received
        if (deal.payment_received_date) {
            activities.push({
                id: `payment-${deal.id}`,
                type: 'payment_received',
                title: `Payment from ${deal.brand_name || 'Brand'}`,
                description: 'Payment received successfully',
                amount: Number(deal.deal_amount) || 0,
                timestamp: deal.payment_received_date,
                relativeTime: formatDistanceToNow(new Date(deal.payment_received_date)),
            });
        }

        // Contract signed
        const creatorSignature = deal.signatures?.find((s: any) => s.signer_type === 'creator' && s.signed);
        if (creatorSignature) {
            activities.push({
                id: `signed-${deal.id}`,
                type: 'contract_signed',
                title: `Contract signed with ${deal.brand_name || 'Brand'}`,
                description: 'Agreement executed',
                timestamp: creatorSignature.signed_at,
                relativeTime: formatDistanceToNow(new Date(creatorSignature.signed_at)),
            });
        }

        // Deliverable completed
        if (deal.status === 'Completed') {
            activities.push({
                id: `completed-${deal.id}`,
                type: 'deliverable_completed',
                title: `Completed ${deal.brand_name || 'Brand'} campaign`,
                description: 'All deliverables submitted',
                timestamp: deal.updated_at,
                relativeTime: formatDistanceToNow(new Date(deal.updated_at)),
            });
        }
    });

    // Sort by timestamp (most recent first)
    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
};

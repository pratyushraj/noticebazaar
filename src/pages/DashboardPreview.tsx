import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
    DashboardStats,
    UrgentActionsWidget,
    QuickActionsWidget,
    getDefaultQuickActions,
    RevenueChartWidget,
    RecentActivityWidget,
} from '@/components/creator-dashboard';

// Sample data for preview
const sampleStats = {
    totalEarnings: 245000,
    activeDeals: 8,
    pendingPayments: 85000,
    completedDeals: 12,
};

const sampleTrends = {
    earnings: 23,
    deals: 15,
};

const sampleRevenueData = [
    { month: 'Sep', amount: 35000 },
    { month: 'Oct', amount: 42000 },
    { month: 'Nov', amount: 38000 },
    { month: 'Dec', amount: 55000 },
    { month: 'Jan', amount: 48000 },
    { month: 'Feb', amount: 27000 },
];

const sampleUrgentActions = [
    {
        id: '1',
        type: 'payment_overdue' as const,
        brand_name: 'Nike India',
        amount: 45000,
        daysOverdue: 5,
        onClick: () => toast.info('Would navigate to Nike deal'),
    },
    {
        id: '2',
        type: 'deliverable_overdue' as const,
        brand_name: 'Myntra',
        daysOverdue: 2,
        onClick: () => toast.info('Would navigate to Myntra deal'),
    },
    {
        id: '3',
        type: 'signature_needed' as const,
        brand_name: 'Boat Lifestyle',
        onClick: () => toast.info('Would navigate to Boat contract'),
    },
];

const sampleActivities = [
    {
        id: '1',
        type: 'payment_received' as const,
        title: 'Payment from Puma',
        description: 'Payment received successfully',
        amount: 35000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        relativeTime: '2 hours ago',
    },
    {
        id: '2',
        type: 'contract_signed' as const,
        title: 'Contract signed with Adidas',
        description: 'Agreement executed',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        relativeTime: '5 hours ago',
    },
    {
        id: '3',
        type: 'deal_created' as const,
        title: 'Deal with Zara',
        description: 'New collaboration created',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTime: '1 day ago',
    },
    {
        id: '4',
        type: 'deliverable_completed' as const,
        title: 'Completed H&M campaign',
        description: 'All deliverables submitted',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTime: '2 days ago',
    },
    {
        id: '5',
        type: 'payment_received' as const,
        title: 'Payment from Lenskart',
        description: 'Payment received successfully',
        amount: 28000,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        relativeTime: '3 days ago',
    },
];

export default function DashboardPreview() {
    const navigate = useNavigate();
    const [showCode, setShowCode] = useState(false);

    const quickActions = getDefaultQuickActions(
        {
            onCreateDeal: () => toast.success('Create Deal clicked'),
            onShareCollabLink: () => toast.success('Collab link copied!'),
            onViewContracts: () => toast.info('Navigate to Contracts'),
            onViewAnalytics: () => toast.info('Navigate to Analytics'),
            onViewMessages: () => toast.info('Navigate to Messages'),
            onViewCalendar: () => toast.info('Navigate to Calendar'),
        },
        {
            messages: 3,
            contracts: 2,
        }
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 className="text-xl font-bold text-white">Dashboard Components Preview</h1>
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                        {showCode ? 'Hide' : 'Show'} Code
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Info Banner */}
                <div className="bg-blue-500/20 border-2 border-blue-400/30 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">✨ Premium Dashboard Components</h2>
                    <p className="text-white/80 mb-4">
                        These are the new components that will enhance your Creator Dashboard. All data shown is sample data for demonstration purposes.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Animated</span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Responsive</span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Interactive</span>
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Real-time Ready</span>
                    </div>
                </div>

                {/* Component Sections */}
                <section>
                    <h3 className="text-lg font-bold text-white mb-4">1. Dashboard Stats (with trends)</h3>
                    <DashboardStats stats={sampleStats} trends={sampleTrends} />
                </section>

                <section>
                    <h3 className="text-lg font-bold text-white mb-4">2. Urgent Actions Widget</h3>
                    <UrgentActionsWidget actions={sampleUrgentActions} />
                </section>

                <section>
                    <h3 className="text-lg font-bold text-white mb-4">3. Quick Actions Widget</h3>
                    <QuickActionsWidget actions={quickActions} />
                </section>

                <section>
                    <h3 className="text-lg font-bold text-white mb-4">4. Revenue Chart & Recent Activity</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueChartWidget
                            data={sampleRevenueData}
                            totalRevenue={sampleStats.totalEarnings}
                            trend={{
                                value: sampleTrends.earnings,
                                isPositive: sampleTrends.earnings > 0,
                            }}
                        />
                        <RecentActivityWidget activities={sampleActivities} />
                    </div>
                </section>

                {/* Code Example */}
                {showCode && (
                    <section className="bg-black/40 border-2 border-white/10 rounded-2xl p-6 overflow-auto">
                        <h3 className="text-lg font-bold text-white mb-4">Integration Code Example</h3>
                        <pre className="text-sm text-green-300 overflow-x-auto">
                            <code>{`import {
  DashboardStats,
  UrgentActionsWidget,
  QuickActionsWidget,
  getDefaultQuickActions,
  RevenueChartWidget,
  RecentActivityWidget,
} from '@/components/creator-dashboard';

import {
  calculateDashboardStats,
  calculateTrends,
  generateRevenueChartData,
  extractUrgentActions,
  generateRecentActivity,
} from '@/lib/utils/dashboardHelpers';

// In your component:
const stats = calculateDashboardStats(brandDeals);
const trends = calculateTrends(brandDeals);
const revenueData = generateRevenueChartData(brandDeals);
const urgentActions = extractUrgentActions(brandDeals, navigate);
const recentActivity = generateRecentActivity(brandDeals);

// Render:
<DashboardStats stats={stats} trends={trends} />
<UrgentActionsWidget actions={urgentActions} />
<QuickActionsWidget actions={quickActions} />
<RevenueChartWidget data={revenueData} totalRevenue={stats.totalEarnings} trend={...} />
<RecentActivityWidget activities={recentActivity} />`}</code>
                        </pre>
                    </section>
                )}

                {/* Feature List */}
                <section className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/30 rounded-2xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">🎯 Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-bold text-green-300 mb-2">Visual Excellence</h4>
                            <ul className="text-white/80 text-sm space-y-1">
                                <li>✓ Glassmorphism effects</li>
                                <li>✓ Gradient backgrounds</li>
                                <li>✓ Smooth animations</li>
                                <li>✓ Color-coded metrics</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-green-300 mb-2">User Experience</h4>
                            <ul className="text-white/80 text-sm space-y-1">
                                <li>✓ Urgent items highlighted</li>
                                <li>✓ One-tap quick actions</li>
                                <li>✓ Real-time data updates</li>
                                <li>✓ Smart notifications</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-green-300 mb-2">Performance</h4>
                            <ul className="text-white/80 text-sm space-y-1">
                                <li>✓ Memoized calculations</li>
                                <li>✓ Optimized re-renders</li>
                                <li>✓ Skeleton loaders</li>
                                <li>✓ Staggered animations</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-green-300 mb-2">Accessibility</h4>
                            <ul className="text-white/80 text-sm space-y-1">
                                <li>✓ ARIA labels</li>
                                <li>✓ Keyboard navigation</li>
                                <li>✓ Screen reader friendly</li>
                                <li>✓ High contrast</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <div className="text-center py-8">
                    <p className="text-white/60 mb-4">Ready to integrate these components into your dashboard?</p>
                    <button
                        onClick={() => navigate('/creator-dashboard')}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                    >
                        Go to Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
}

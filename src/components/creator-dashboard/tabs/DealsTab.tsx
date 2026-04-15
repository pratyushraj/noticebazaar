import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProjectDealCard from '@/components/creator-contracts/ProjectDealCard';
import { getDealStageFromStatus } from '@/lib/hooks/useBrandDeals';
import { ios, typography, glass } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';

interface DealsTabProps {
    activeSubTab: 'active' | 'pending' | 'completed';
    setActiveSubTab: (tab: 'active' | 'pending' | 'completed') => void;
    activeDeals: BrandDeal[];
    completedDeals: BrandDeal[];
    pendingOffers: BrandDeal[];
    onDealSelect: (deal: BrandDeal) => void;
}

const DealsTab = ({
    activeSubTab,
    setActiveSubTab,
    activeDeals,
    completedDeals,
    pendingOffers,
    onDealSelect,
}: DealsTabProps) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    const currentList = activeSubTab === 'active'
        ? activeDeals
        : activeSubTab === 'pending'
            ? pendingOffers
            : completedDeals;

    const filteredList = currentList.filter(item =>
        (item.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className={typography.h2}>Collaborations</h2>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    New Deal
                </Button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                {(['active', 'pending', 'completed'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium rounded-xl transition-all",
                            activeSubTab === tab
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'pending' && pendingOffers.length > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {pendingOffers.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                    placeholder="Search by brand name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                />
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredList.map((item) => (
                        <ProjectDealCard
                            key={item.id}
                            deal={item}
                            stage={getDealStageFromStatus(item.status, item.progress_percentage)}
                            onView={() => onDealSelect(item)}
                            onEdit={() => { }}
                            onManageDeliverables={() => { }}
                            onUploadContent={() => { }}
                            onContactBrand={() => { }}
                            onViewContract={() => { }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {filteredList.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-white/40">No collaborations found in this section.</p>
                </div>
            )}
        </div>
    );
};

export default DealsTab;

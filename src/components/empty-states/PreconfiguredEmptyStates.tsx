"use client";

import React from 'react';
import { MessageSquare, FileText, Search, Filter, X, Upload, Briefcase, Wallet, Sparkles, Scale, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from './EmptyState';

/**
 * Pre-configured empty states for common scenarios
 * - Consistent messaging
 * - iOS 17 design
 * - Reusable across the app
 */

// No Messages Empty State
interface NoMessagesEmptyStateProps {
  onStartChat?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

// Helper component for action buttons
const EmptyActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -2, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="flex items-center justify-center gap-2 h-12 md:h-14 rounded-xl bg-white/10 border-2 border-white/20 backdrop-blur-xl text-white/90 text-[12px] md:text-[14px] font-medium transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:border-white/30 hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] relative group"
  >
    <div className="text-white/80 scale-90 md:scale-100">{icon}</div>
    <span className="leading-tight">{label}</span>
    <svg className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </motion.button>
);

export const NoMessagesEmptyState: React.FC<NoMessagesEmptyStateProps> = ({
  onStartChat,
}) => {
  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-2 max-w-lg mx-auto w-full relative">
      {/* Gradient glow behind empty card */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-purple-600/20 rounded-2xl blur-xl -z-10 animate-pulse" />
      
      {/* Empty Icon with pulsing animation */}
      <motion.div 
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center mb-3 md:mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] relative z-10"
      >
        <MessageSquare className="w-6 h-6 md:w-10 md:h-10 text-white/70" />
      </motion.div>

      {/* Title */}
      <h2 className="text-[18px] md:text-[22px] font-semibold text-white mb-1.5 md:mb-2 text-center relative z-10">
        No Messages Yet
      </h2>

      {/* Subtitle - More emotional */}
      <p className="text-center text-[12px] md:text-[15px] leading-snug md:leading-relaxed text-white/80 mb-4 md:mb-6 px-2 max-w-sm mx-auto relative z-10">
        Your legal advisor is ready when you are.
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 md:gap-3 w-full max-w-md relative z-10">
        <EmptyActionButton
          icon={<FileText className="w-4 h-4" />}
          label="Contract Review"
          onClick={() => onStartChat?.()}
        />
        <EmptyActionButton
          icon={<Wallet className="w-4 h-4" />}
          label="Payment Questions"
          onClick={() => onStartChat?.()}
        />
        <EmptyActionButton
          icon={<Scale className="w-4 h-4" />}
          label="Legal Advice"
          onClick={() => onStartChat?.()}
        />
        <EmptyActionButton
          icon={<BarChart3 className="w-4 h-4" />}
          label="Tax Compliance"
          onClick={() => onStartChat?.()}
        />
      </div>
    </div>
  );
};

// No Contracts Uploaded
interface NoContractsEmptyStateProps {
  onUpload: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const NoContractsEmptyState: React.FC<NoContractsEmptyStateProps> = ({
  onUpload,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-uploads"
      icon={FileText}
      title="No Contracts Uploaded"
      description="Upload your first contract to get AI-powered analysis and legal review in under 30 seconds."
      primaryAction={{
        label: "Upload Contract",
        onClick: onUpload,
        icon: Upload,
      }}
      variant={variant}
      illustration={
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4 md:mb-6">
          <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />
        </div>
      }
    />
  );
};

// Search No Results
interface SearchNoResultsEmptyStateProps {
  searchTerm?: string;
  onClearFilters?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const SearchNoResultsEmptyState: React.FC<SearchNoResultsEmptyStateProps> = ({
  searchTerm,
  onClearFilters,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-results"
      icon={Search}
      title={searchTerm ? `No results for "${searchTerm}"` : "No Results Found"}
      description="Try adjusting your search terms or filters to find what you're looking for."
      primaryAction={onClearFilters ? {
        label: "Clear Filters",
        onClick: onClearFilters,
        icon: X,
      } : undefined}
      variant={variant}
    />
  );
};

// Filtered View No Matches
interface FilteredNoMatchesEmptyStateProps {
  onClearFilters: () => void;
  filterCount?: number;
  variant?: 'default' | 'compact' | 'minimal';
}

export const FilteredNoMatchesEmptyState: React.FC<FilteredNoMatchesEmptyStateProps> = ({
  onClearFilters,
  filterCount,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-results"
      icon={Filter}
      title="No Matches Found"
      description={
        filterCount 
          ? `No items match your ${filterCount} active filter${filterCount > 1 ? 's' : ''}. Try adjusting your selection.`
          : "No items match your current filters. Try adjusting your selection."
      }
      primaryAction={{
        label: "Clear All Filters",
        onClick: onClearFilters,
        icon: X,
      }}
      variant={variant}
    />
  );
};

// No Deals Empty State
interface NoDealsEmptyStateProps {
  onAddDeal: () => void;
  onExploreBrands?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const NoDealsEmptyState: React.FC<NoDealsEmptyStateProps> = ({
  onAddDeal,
  onExploreBrands,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-data"
      icon={Briefcase}
      title="No Active Deals Yet"
      description="Deals appear here only after a contract is signed."
      primaryAction={{
        label: "Protect a New Deal",
        onClick: onAddDeal,
        icon: Briefcase,
      }}
      secondaryAction={onExploreBrands ? {
        label: "Explore Brands - Coming Soon",
        onClick: onExploreBrands,
      } : undefined}
      variant={variant}
    />
  );
};

// No Payments Empty State
interface NoPaymentsEmptyStateProps {
  onAddDeal?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const NoPaymentsEmptyState: React.FC<NoPaymentsEmptyStateProps> = ({
  onAddDeal,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-data"
      icon={Wallet}
      title="No Payments Yet"
      description="Once you add brand deals and receive payments, they'll appear here for tracking."
      primaryAction={onAddDeal ? {
        label: "Add Brand Deal",
        onClick: onAddDeal,
        icon: Briefcase,
      } : undefined}
      variant={variant}
    />
  );
};

// No Earnings Empty State
interface NoEarningsEmptyStateProps {
  onAddDeal?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const NoEarningsEmptyState: React.FC<NoEarningsEmptyStateProps> = ({
  onAddDeal,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-data"
      icon={Wallet}
      title="No Earnings Yet"
      description="Start adding brand deals to track your earnings and payment history."
      primaryAction={onAddDeal ? {
        label: "Add Your First Deal",
        onClick: onAddDeal,
        icon: Briefcase,
      } : undefined}
      variant={variant}
    />
  );
};


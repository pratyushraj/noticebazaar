"use client";

import React from 'react';
import { MessageSquare, FileText, Search, Filter, X, Upload, Briefcase, Wallet, Sparkles } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

/**
 * Pre-configured empty states for common scenarios
 * - Consistent messaging
 * - iOS 17 design
 * - Reusable across the app
 */

// No Messages Empty State
interface NoMessagesEmptyStateProps {
  onStartChat?: () => void;
  onUploadContract?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const NoMessagesEmptyState: React.FC<NoMessagesEmptyStateProps> = ({
  onStartChat,
  onUploadContract,
  variant = 'default',
}) => {
  return (
    <EmptyState
      type="no-messages"
      icon={MessageSquare}
      title="No Messages Yet"
      description="Start a conversation with your advisor to get help with contracts, payments, or legal questions."
      primaryAction={onStartChat ? {
        label: "Start Conversation",
        onClick: onStartChat,
        icon: MessageSquare,
      } : undefined}
      variant={variant}
    >
      {onUploadContract && (
        <div className="mt-4 space-y-2">
          <Button
            onClick={onUploadContract}
            variant="outline"
            size="sm"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/15"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload a Contract
          </Button>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: 'Contract Review', icon: '📄' },
              { label: 'Payment Questions', icon: '💰' },
              { label: 'Legal Advice', icon: '⚖️' },
              { label: 'Tax Compliance', icon: '📊' },
            ].map((topic) => (
              <button
                key={topic.label}
                onClick={() => onStartChat?.()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.08] border border-white/15 hover:bg-white/[0.12] transition-all text-left text-sm"
              >
                <span className="text-base">{topic.icon}</span>
                <span className="text-white/80 font-medium">{topic.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </EmptyState>
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-6">
          <Sparkles className="w-12 h-12 text-purple-400" />
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
      title="No Brand Deals Yet"
      description="Add your first brand deal to start tracking payments, contracts, and deliverables."
      primaryAction={{
        label: "Add Your First Deal",
        onClick: onAddDeal,
        icon: Briefcase,
      }}
      secondaryAction={onExploreBrands ? {
        label: "Explore Brands",
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


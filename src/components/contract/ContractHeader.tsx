/**
 * ContractHeader - Header component for contract flow
 * Extracted from ContractUploadFlow.tsx
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import type { DealType } from '@/hooks/contract/useContractState';

export interface ContractHeaderProps {
  dealType: DealType;
  title?: string;
  description?: string;
  showSparkles?: boolean;
}

export const ContractHeader: React.FC<ContractHeaderProps> = ({
  dealType,
  title,
  description,
  showSparkles = true,
}) => {
  const defaultTitle = dealType === 'barter'
    ? 'Barter Deal Analysis'
    : 'Contract Analysis';

  const defaultDescription = dealType === 'barter'
    ? 'Upload your barter agreement to identify potential issues and get AI-powered suggestions.'
    : 'Upload your contract to identify potential issues and get AI-powered suggestions.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="relative">
          <Shield className="w-10 h-10 text-purple-400" />
          {showSparkles && (
            <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          {title || defaultTitle}
        </h1>
      </div>
      <p className="text-gray-300 text-lg max-w-2xl mx-auto">
        {description || defaultDescription}
      </p>
    </motion.div>
  );
};

export default ContractHeader;

"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LegalAdvisorBadgeProps {
  reviewedBy?: string;
  reviewedAt?: string;
}

const LegalAdvisorBadge: React.FC<LegalAdvisorBadgeProps> = ({
  reviewedBy,
  reviewedAt,
}) => {
  if (!reviewedBy && !reviewedAt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5"
    >
      <Badge className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400 px-2 py-0.5 text-xs font-semibold">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Legal reviewed
      </Badge>
    </motion.div>
  );
};

export default LegalAdvisorBadge;


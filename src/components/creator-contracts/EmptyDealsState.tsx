"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyDealsStateProps {
  onAddDeal: () => void;
  onExploreBrands?: () => void;
}

const EmptyDealsState: React.FC<EmptyDealsStateProps> = ({
  onAddDeal,
  onExploreBrands,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"
      >
        <Briefcase className="w-12 h-12 text-muted-foreground" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        No Brand Deals Yet
      </h2>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        Add your first brand deal to start tracking payments, contracts, and deliverables
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onAddDeal}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Your First Deal
        </Button>
        
        {onExploreBrands && (
          <Button
            onClick={onExploreBrands}
            variant="outline"
            size="lg"
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Brand Directory
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyDealsState;


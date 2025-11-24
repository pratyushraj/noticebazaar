"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <Card className={cn(
      "bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
      className
    )}>
      <CardContent className="p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          {icon && (
            <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 mb-2">
              {icon}
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-white/60 max-w-md mx-auto">{description}</p>
            )}
          </div>
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLabel}
            </Button>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;


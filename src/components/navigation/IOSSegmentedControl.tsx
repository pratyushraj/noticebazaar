"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Segment {
  label: string;
  value: string;
}

interface IOSSegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const IOSSegmentedControl: React.FC<IOSSegmentedControlProps> = ({
  segments,
  value,
  onChange,
  className
}) => {
  const activeIndex = segments.findIndex(s => s.value === value);

  return (
    <div className={cn(
      "inline-flex p-1 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10",
      className
    )}>
      {segments.map((segment, index) => {
        const isActive = segment.value === value;
        
        return (
          <button
            key={segment.value}
            onClick={() => onChange(segment.value)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg z-10",
              isActive ? "text-white" : "text-white/60"
            )}
          >
            {segment.label}
            {isActive && (
              <motion.div
                layoutId="activeSegment"
                className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg border border-white/20"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default IOSSegmentedControl;


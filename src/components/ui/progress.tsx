"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <>
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {value !== undefined && value !== null && `${Math.round(value)}% complete`}
    </div>
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[#1F1B2E] border border-[#4A3A4F]",
        className
      )}
      aria-valuenow={value !== undefined && value !== null ? value : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
      {...props}
    >
    <motion.div
      className="h-full w-full flex-1 bg-gradient-to-r from-[#E879F9] via-[#F472B6] to-[#FB7185] relative overflow-hidden"
      initial={{ width: 0 }}
      animate={{ width: `${value || 0}%` }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  </ProgressPrimitive.Root>
  </>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };


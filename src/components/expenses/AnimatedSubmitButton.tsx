import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { animations } from '@/lib/design-system';

interface AnimatedSubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedSubmitButton: React.FC<AnimatedSubmitButtonProps> = ({
  isLoading,
  disabled,
  children,
  className,
}) => {
  return (
    <motion.button
      type="submit"
      disabled={disabled || isLoading}
      whileTap={animations.microTap}
      className={cn(
        "w-full sm:w-auto px-6 py-3 rounded-xl",
        "bg-purple-500 text-white font-semibold",
        "shadow-xl shadow-purple-900/30",
        "hover:bg-purple-600",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-all duration-200",
        "flex items-center justify-center gap-2",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Adding...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};


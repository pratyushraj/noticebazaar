import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'purple' | 'green' | 'default';
  children: ReactNode;
}

const glassVariants = {
  purple: 'bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-xl',
  green: 'bg-green-500/20 text-green-300 border border-green-500/40 backdrop-blur-xl',
  default: 'bg-white/10 text-white border border-white/20 backdrop-blur-xl',
};

export const GlassButton = ({
  variant = 'default',
  className,
  disabled,
  children,
  ...props
}: GlassButtonProps) => {
  return (
    <button
      className={cn(
        'px-4 py-2.5 rounded-xl font-semibold transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        glassVariants[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};


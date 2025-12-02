/**
 * Premium Skeleton Card Component
 * Reusable shimmer loader for cards using design system
 */

import { Skeleton } from '@/components/ui/skeleton';
import { BaseCard } from '@/components/ui/card-variants';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  showIcon?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showValue?: boolean;
  showProgress?: boolean;
  className?: string;
}

export const SkeletonCard = ({
  variant = 'tertiary',
  showIcon = false,
  showTitle = true,
  showSubtitle = false,
  showValue = false,
  showProgress = false,
  className,
}: SkeletonCardProps) => {
  return (
    <BaseCard variant={variant} className={cn("skeleton", className)}>
      {showIcon && (
        <div className="flex justify-center mb-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      )}
      {showTitle && <Skeleton className="h-4 w-24 mb-2" />}
      {showSubtitle && <Skeleton className="h-3 w-32 mb-2" />}
      {showValue && <Skeleton className="h-8 w-20 mb-2" />}
      {showProgress && (
        <div className="mt-2">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      )}
    </BaseCard>
  );
};


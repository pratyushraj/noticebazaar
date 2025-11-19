import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 h-12 w-12 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center">
          <Icon className="h-6 w-6 text-white/40" />
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-white mb-1 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-white/60 mb-4 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="rounded-[12px] bg-white/10 border-white/20 text-white hover:bg-white/15 active:scale-[0.97]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}


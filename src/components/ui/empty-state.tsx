import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg"
        >
          <Icon className="h-8 w-8 text-white/50" />
        </motion.div>
      )}
      <h3 className="text-h4 font-semibold text-white mb-2 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-body text-white/60 mb-6 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="rounded-lg bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30 active:scale-[0.97] transition-fast focus-ring px-4 py-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}


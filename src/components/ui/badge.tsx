import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150",
  {
    variants: {
      variant: {
        // Green — default (success/active/verified)
        default:
          "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20",
        // Subtle grey
        secondary:
          "bg-secondary text-muted-foreground border border-border",
        // Outlined
        outline:
          "bg-transparent text-foreground border border-border",
        // Red destructive
        destructive:
          "bg-red-500/15 text-red-500 border border-red-500/20",
        // Amber warning
        warning:
          "bg-amber-500/15 text-amber-500 border border-amber-500/20",
        // Success alias (same as default but explicit)
        success:
          "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20",
        // Blue info
        info:
          "bg-blue-500/15 text-blue-500 border border-blue-500/20",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-px text-[10px]",
        lg: "px-3 py-1 text-sm rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

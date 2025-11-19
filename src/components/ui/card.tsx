import * as React from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "default" | "metric" | "attention" | "partner" | "profile";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => {
    // Premium compact card styling matching AILegalRiskMeter
    const baseClasses = "rounded-[16px] backdrop-blur-xl border shadow-inner relative overflow-hidden transition-all";
    const interactiveClasses = interactive 
      ? "hover:border-opacity-60 active:scale-[0.98] transition-all duration-150 cursor-pointer" 
      : "";
    
    const variantClasses = {
      default: "bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border-white/5",
      metric: "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
      attention: "bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 border-red-500/20",
      partner: "bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 border-purple-500/20",
      profile: "bg-gradient-to-br from-slate-500/20 via-slate-500/10 to-transparent border-white/5",
    };

    return (
  <div
    ref={ref}
    className={cn(
          baseClasses,
          interactiveClasses,
          variantClasses[variant],
      className,
    )}
    {...props}
  />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xs font-semibold text-muted-foreground uppercase tracking-wide",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[13px] text-white/60 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2 p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-white/5", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

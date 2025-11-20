import * as React from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "primary" | "secondary" | "tertiary" | "default" | "metric" | "attention" | "partner" | "profile" | "pink" | "pink-gradient";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => {
    // Premium card system: 3 main types + legacy variants
    // Elevation system: card-elevation-2 (default), card-elevation-3 (hover)
    // Radius: rounded-2xl for all cards
    const baseClasses = "rounded-3xl backdrop-blur-[40px] border relative overflow-hidden transition-smooth";
    const interactiveClasses = interactive 
      ? "card-interactive hover:card-elevation-3 focus-ring" 
      : "";
    
    const variantClasses = {
      // 3 Main Premium Types
      primary: "bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30", // Bold gradient + high contrast
      secondary: "bg-gradient-to-br from-emerald-500/15 via-emerald-500/8 to-emerald-500/5 border-emerald-500/20", // Subtle gradient + soft border
      tertiary: "bg-transparent border-white/10", // Transparent background + border only
      // Legacy variants (for backwards compatibility)
      default: "bg-white/[0.05] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]", // Liquid glass default
      metric: "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
      attention: "bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 border-red-500/20",
      partner: "bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 border-purple-500/20",
      profile: "bg-gradient-to-br from-slate-500/20 via-slate-500/10 to-transparent border-white/5",
      // Pink theme variants
      pink: "bg-[#2A1F2E] border-[#4A3A4F] hover:bg-[#3D2A3F] hover:border-[#5A4A5F]", // Soft pink card
      "pink-gradient": "bg-gradient-to-br from-[#E879F9] via-[#F472B6] to-[#FB7185] border-[#FF6B9D]/30", // Pink gradient card
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
    className={cn("flex flex-col space-y-2 p-4 pb-3", className)}
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
      "text-h4 font-semibold leading-tight min-h-[1.5em]", // Using type scale
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
    className={cn("text-body text-white/70 leading-relaxed", className)} // Using type scale
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4 p-4", className)} {...props} /> // Compact padding: p-4 (16px)
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

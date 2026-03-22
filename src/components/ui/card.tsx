import * as React from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "default" | "primary" | "secondary" | "tertiary" | "pink" | "pink-gradient";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => {
    const baseClasses = "rounded-lg border backdrop-blur-sm transition-colors duration-200";
    const interactiveClasses = interactive 
      ? "cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
      : "";
    
    const variantClasses = {
      default: "bg-card text-card-foreground shadow-sm",
      primary: "bg-primary/10 border-primary/20 text-card-foreground",
      secondary: "bg-secondary/50 border-secondary/20 text-card-foreground",
      tertiary: "bg-transparent border-border",
      pink: "bg-[#2A1F2E] border-[#4A3A4F] hover:bg-[#3D2A3F] hover:border-[#5A4A5F]",
      "pink-gradient": "bg-gradient-to-br from-[#E879F9] via-[#F472B6] to-[#FB7185] border-[#FF6B9D]/30",
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
    className={cn("flex flex-col space-y-1.5 p-6", className)}
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
      "text-lg font-semibold leading-none tracking-tight",
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
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
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

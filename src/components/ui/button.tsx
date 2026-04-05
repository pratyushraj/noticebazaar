import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-tight ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        // GREEN — the ONE accent for primary CTAs only
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-[0.98]",
        // Subtle grey — secondary actions
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        // Outlined — bordered, transparent bg
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        // Ghost — no bg, text + hover bg
        ghost:
          "bg-transparent hover:bg-secondary text-foreground hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        // Red — destructive actions
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
        // Text link style
        link: "text-primary underline-offset-4 hover:underline bg-transparent hover:bg-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 py-1.5 rounded-md text-xs",
        lg: "h-12 px-6 py-3 rounded-xl text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

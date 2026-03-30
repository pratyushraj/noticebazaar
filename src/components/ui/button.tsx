import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-semibold ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",
        pink: "bg-gradient-to-r from-[#E879F9] via-[#F472B6] to-[#FB7185] text-white hover:from-[#F0A5FF] hover:via-[#FF8FAB] hover:to-[#FFB3C1] shadow-lg shadow-blue-500/20 rounded-lg",
        "pink-outline": "border border-[#F472B6] bg-transparent text-[#F472B6] hover:bg-[#F472B6]/10 rounded-lg",
        "pink-ghost": "text-[#F472B6] hover:bg-[#F472B6]/10 hover:text-[#FF8FAB] rounded-md",
      },
      size: {
        default: "h-11 px-5 py-2.5 min-h-[44px] min-w-[44px] text-base rounded-lg",
        sm: "h-9 px-3 text-sm rounded-md min-h-[44px] min-w-[44px]",
        lg: "h-12 px-8 text-lg rounded-lg min-h-[44px]",
        icon: "h-10 w-10 rounded-md min-h-[44px] min-w-[44px]",
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

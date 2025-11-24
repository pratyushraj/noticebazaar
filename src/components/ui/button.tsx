import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-[15px] font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97] active:opacity-80 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pink: "bg-gradient-to-r from-[#E879F9] via-[#F472B6] to-[#FB7185] text-white hover:from-[#F0A5FF] hover:via-[#FF8FAB] hover:to-[#FFB3C1] shadow-lg shadow-purple-500/30",
        "pink-outline": "border border-[#F472B6] bg-transparent text-[#F472B6] hover:bg-[#F472B6]/10",
        "pink-ghost": "text-[#F472B6] hover:bg-[#F472B6]/10 hover:text-[#FF8FAB]",
      },
      size: {
        default: "h-14 px-5 py-3 min-h-[56px] min-w-[56px] text-base font-bold",
        sm: "h-9 rounded-[10px] px-3 text-[13px] min-h-[44px] min-w-[44px]",
        lg: "h-16 rounded-[14px] px-10 text-lg font-bold min-h-[56px]",
        icon: "h-10 w-10 rounded-[12px] min-h-[44px] min-w-[44px]",
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

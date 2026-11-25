import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-sm active:bg-brand-teal/95",
        primary:
          "bg-brand-teal text-white hover:bg-[#2c676d] shadow-sm",
        secondary:
          "bg-brand-ocean text-brand-dark hover:bg-brand-ocean/85 shadow-xs",
        soft:
          "bg-brand-ice/60 text-brand-dark hover:bg-brand-ice border border-brand-ocean/30",
        mint:
          "bg-brand-mint text-[#174624] hover:bg-brand-mint/80 font-medium",
        destructive:
          "bg-brand-danger text-white hover:bg-brand-danger/90 shadow-xs",
        outline:
          "border border-border bg-card hover:bg-brand-cream hover:text-brand-dark text-foreground",
        ghost:
          "hover:bg-brand-ice/40 hover:text-brand-dark text-foreground",
        link:
          "text-brand-teal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-2xl px-6 text-base font-bold min-h-[48px]", // 48px touch target for worker
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

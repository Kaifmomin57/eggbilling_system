import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-teal text-white",
        secondary:
          "border-transparent bg-brand-ocean/20 text-brand-dark",
        mint:
          "border-transparent bg-brand-mint text-[#184d28] font-bold",
        ice:
          "border-transparent bg-brand-ice text-[#173e4a]",
        destructive:
          "border-transparent bg-brand-danger/15 text-brand-danger border border-brand-danger/30 font-medium",
        warning:
          "border-transparent bg-brand-warning/20 text-[#8a3e14] border border-brand-warning/40 font-medium",
        outline:
          "text-foreground border border-border",
        normal_green:
          "border-transparent  text-[#059669] font-bold",
        baaqi_red:
          "border-transparent  text-[#dc2626] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

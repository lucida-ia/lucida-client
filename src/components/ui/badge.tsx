import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption-1 font-semibold apple-transition focus:outline-none focus:apple-focus",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-apple-blue text-white hover:bg-apple-blue/90",
        secondary:
          "border-transparent bg-apple-gray-5 text-apple-gray hover:bg-apple-gray-4 dark:bg-apple-gray-5 dark:text-apple-gray-2",
        destructive:
          "border-transparent bg-apple-red text-white hover:bg-apple-red/90",
        success:
          "border-transparent bg-apple-green text-white hover:bg-apple-green/90",
        warning:
          "border-transparent bg-apple-orange text-white hover:bg-apple-orange/90",
        outline:
          "text-foreground border-apple-gray-4 hover:bg-apple-gray-6 dark:border-apple-gray-4 dark:hover:bg-apple-gray-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

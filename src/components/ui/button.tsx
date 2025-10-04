import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-apple text-callout font-medium apple-transition focus-visible:outline-none focus-visible:apple-focus disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Apple Filled Button - Primary actions
        default:
          "bg-apple-blue text-white hover:bg-apple-blue/90 apple-shadow-sm hover:apple-shadow active:apple-shadow-sm",
        // Apple Tinted Button - Secondary actions
        tinted:
          "bg-apple-blue/10 text-apple-blue hover:bg-apple-blue/20 dark:bg-apple-blue/20 dark:hover:bg-apple-blue/30",
        // Apple Gray Button - Neutral actions
        gray: "bg-apple-gray-5 text-apple-gray hover:bg-apple-gray-4 dark:bg-apple-gray-5 dark:text-apple-gray-2 dark:hover:bg-apple-gray-4",
        // Apple Plain Button - Text-only
        plain: "text-apple-blue hover:text-apple-blue/80 hover:bg-apple-blue/5",
        // Destructive actions
        destructive:
          "bg-apple-red text-white hover:bg-apple-red/90 apple-shadow-sm hover:apple-shadow active:apple-shadow-sm",
        // Success actions
        success:
          "bg-apple-green text-white hover:bg-apple-green/90 apple-shadow-sm hover:apple-shadow active:apple-shadow-sm",
        // Warning actions
        warning:
          "bg-apple-orange text-white hover:bg-apple-orange/90 apple-shadow-sm hover:apple-shadow active:apple-shadow-sm",
        // Outline variant
        outline:
          "border border-apple-gray-4 bg-background hover:bg-apple-gray-6 text-foreground dark:border-apple-gray-4 dark:hover:bg-apple-gray-5",
        // Ghost variant
        ghost:
          "hover:bg-apple-gray-6 text-foreground dark:hover:bg-apple-gray-5",
        // Link variant
        link: "text-apple-blue underline-offset-4 hover:underline hover:text-apple-blue/80",
      },
      size: {
        // Apple HIG minimum touch target: 44pt (32px for small, 44px for default, 50px for large)
        sm: "h-8 px-3 text-footnote min-w-[32px]",
        default: "h-11 px-4 py-2 min-w-[44px]",
        lg: "h-12 px-6 py-3 text-headline min-w-[50px]",
        icon: "h-11 w-11 min-w-[44px]",
        "icon-sm": "h-8 w-8 min-w-[32px]",
        "icon-lg": "h-12 w-12 min-w-[50px]",
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

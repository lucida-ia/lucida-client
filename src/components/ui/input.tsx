import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-apple border border-apple-gray-4 bg-input px-4 py-3 text-body apple-transition file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:apple-focus focus-visible:border-apple-blue hover:border-apple-gray-3 disabled:cursor-not-allowed disabled:opacity-50 dark:border-apple-gray-4 dark:bg-input dark:hover:border-apple-gray-3 selection:bg-apple-blue/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

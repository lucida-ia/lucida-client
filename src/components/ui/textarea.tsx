import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[88px] w-full rounded-apple border border-apple-gray-4 bg-input px-4 py-3 text-body apple-transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:apple-focus focus-visible:border-apple-blue hover:border-apple-gray-3 disabled:cursor-not-allowed disabled:opacity-50 dark:border-apple-gray-4 dark:bg-input dark:hover:border-apple-gray-3 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

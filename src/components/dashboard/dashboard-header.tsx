import { ReactNode } from "react";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-medium">
          {heading}
        </h1>
        {text && <p className="text-sm md:text-base text-muted-foreground">{text}</p>}
      </div>
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

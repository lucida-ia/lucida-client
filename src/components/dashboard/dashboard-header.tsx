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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="grid gap-1">
        <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-medium">
          {heading}
        </h1>
        {text && <p className="text-sm md:text-base text-muted-foreground">{text}</p>}
      </div>
      {children && (
        <div className="flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

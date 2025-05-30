import { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen w-full">
      <DashboardNav />

      <main className="flex w-full flex-col overflow-hidden">
        <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
      </main>
    </div>
  );
}

import { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardMobileHeader } from "@/components/dashboard/dashboard-mobile-header";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <DashboardNav />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <DashboardMobileHeader />
      </div>

      <main className="flex w-full flex-col overflow-hidden">
        <div className="flex-1 space-y-4 p-4 pt-20 lg:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

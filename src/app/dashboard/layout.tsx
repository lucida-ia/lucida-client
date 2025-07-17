import { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}

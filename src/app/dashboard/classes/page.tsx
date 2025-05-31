"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function ClassesPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Minhas Turmas" text="Gerencie suas turmas" />
    </DashboardShell>
  );
}

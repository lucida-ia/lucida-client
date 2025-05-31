"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function ListExamsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Minhas Provas"
        text="Gerencie suas provas e acompanhe o desempenho dos seus alunos."
      />
    </DashboardShell>
  );
}

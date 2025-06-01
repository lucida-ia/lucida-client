"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { CreateExamCTA } from "@/components/dashboard/create-exam-cta";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Bem-vindo de volta! Aqui está um resumo das suas provas."
      >
        <CreateExamCTA />
      </DashboardHeader>
      <div className="grid gap-4 md:gap-8">
        <OverviewStats />
        <RecentExams />
      </div>
    </DashboardShell>
  );
}

"use client";

import { useAuth } from "@/components/auth-provider";
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
        text="Welcome back! Here's an overview of your exams."
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

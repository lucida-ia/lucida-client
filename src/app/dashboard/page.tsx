"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { CreateExamCTA } from "@/components/dashboard/create-exam-cta";
import { useUser } from "@clerk/nextjs";
import React from "react";
import axios from "axios";

export default function DashboardPage() {
  const handleCheckUser = async () => {
    const response = await axios.get("/api/user");

    localStorage.setItem("user", JSON.stringify(response.data.user));
  };

  React.useEffect(() => {
    handleCheckUser();
  }, []);

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

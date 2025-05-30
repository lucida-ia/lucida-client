"use client";

import { useAuth } from '@/components/auth-provider';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { OverviewStats } from '@/components/dashboard/overview-stats';
import { RecentExams } from '@/components/dashboard/recent-exams';
import { CreateExamCTA } from '@/components/dashboard/create-exam-cta';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  
  // Redirect to login if user is not authenticated
  if (!isLoading && !user) {
    redirect("/login");
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Welcome back! Here's an overview of your exams.">
        <CreateExamCTA />
      </DashboardHeader>
      <div className="grid gap-4 md:gap-8">
        <OverviewStats />
        <RecentExams />
      </div>
    </DashboardShell>
  );
}
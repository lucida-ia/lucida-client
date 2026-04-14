"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  PlusCircle,
  ScanLine,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import { isTrialUserPastOneWeek } from "@/lib/utils";

interface DashboardQuickLinksProps {
  userData?: { user?: { createdAt?: string } };
}

export function DashboardQuickLinks({ userData }: DashboardQuickLinksProps) {
  const disableNewExam = userData?.user
    ? isTrialUserPastOneWeek(userData.user)
    : false;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/turmas" className="gap-2">
          <Users className="h-4 w-4 shrink-0" />
          Turmas
        </Link>
      </Button>
      {disableNewExam ? (
        <Button variant="outline" size="sm" disabled>
          <PlusCircle className="h-4 w-4 shrink-0" />
          Nova prova
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/exams/create" className="gap-2">
            <PlusCircle className="h-4 w-4 shrink-0" />
            Nova prova
          </Link>
        </Button>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/scan" className="gap-2">
          <ScanLine className="h-4 w-4 shrink-0" />
          Digitalizar
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/overview" className="gap-2">
          <LayoutGrid className="h-4 w-4 shrink-0" />
          Todas as provas
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/analytics" className="gap-2">
          <BarChart3 className="h-4 w-4 shrink-0" />
          Análises
        </Link>
      </Button>
    </div>
  );
}

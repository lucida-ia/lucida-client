"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ClassesResume } from "@/components/classes/classes-resume";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClassesPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Minhas Turmas" text="Gerencie suas turmas" />
        <Button onClick={() => router.push("/dashboard/classes/create")}>
          Criar Turma
        </Button>
      </div>

      <div className="grid gap-4 md:gap-8">
        <ClassesResume />
      </div>
    </DashboardShell>
  );
}

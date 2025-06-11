"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { CreateExamCTA } from "@/components/dashboard/create-exam-cta";
import { useUser } from "@clerk/nextjs";
import React from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [className, setClassName] = React.useState("");

  const { toast } = useToast();
  const router = useRouter();

  const handleCreateClass = async () => {
    const response = await axios.post("/api/class", {
      name: className,
    });

    if (response.status === 200) {
      toast({
        title: "Turma criada com sucesso",
      });
      router.push("/dashboard/classes");
    } else {
      toast({
        title: "Erro ao criar turma",
        description: response.data.message,
        variant: "default",
      });
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Criar Turma"
        text="Crie uma nova turma para suas provas"
      ></DashboardHeader>
      <div className="grid gap-4 md:gap-8">
        <div className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Nome da turma"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <Button onClick={handleCreateClass}>Criar Turma</Button>
        </div>
      </div>
    </DashboardShell>
  );
}

"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { CreateExamCTA } from "@/components/dashboard/create-exam-cta";
import { URLParamsHandler } from "@/components/dashboard/url-params-handler";
import React, { Suspense } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  user: any;
  classes: any[];
  exams: any[];
}

export default function DashboardPage() {
  const [userData, setUserData] = React.useState<UserData>({
    user: null,
    classes: [],
    exams: [],
  });
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user");

      if (response.data.status === "success") {
        const data = response.data.data;
        setUserData(data);

        // Keep localStorage updated for backward compatibility
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("classes", JSON.stringify(data.classes));
        localStorage.setItem("exams", JSON.stringify(data.exams));
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar dados do usuário",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar dados do usuário",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <URLParamsHandler />
      </Suspense>
      <DashboardHeader
        heading="Dashboard"
        text="Bem-vindo de volta! Aqui está um resumo das suas provas."
      >
        <CreateExamCTA />
      </DashboardHeader>
      <div className="w-full flex flex-col gap-4">
        <OverviewStats userData={userData} loading={loading} />
        <RecentExams onExamDeleted={fetchUserData} />
      </div>
    </>
  );
}

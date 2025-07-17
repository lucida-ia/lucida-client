"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { CreateExamCTA } from "@/components/dashboard/create-exam-cta";
import React from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const subscription = searchParams.get("subscription");
    const error = searchParams.get("error");

    if (subscription === "success") {
      toast({
        title: "Sucesso!",
        description:
          "Assinatura ativada com sucesso! Bem-vindo ao seu novo plano! 🎉",
      });
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        unauthorized: "Erro de autenticação. Por favor, faça login novamente.",
        missing_session: "Sessão de checkout inválida.",
        no_customer: "Erro ao processar o pagamento.",
        user_not_found: "Usuário não encontrado.",
        stripe_error: "Erro no processamento do pagamento.",
        processing_error: "Erro interno. Tente novamente.",
      };

      const message = errorMessages[error] || "Ocorreu um erro inesperado.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }

    // Clean up URL parameters after showing the message
    if (subscription || error) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, toast]);

  return (
    <>
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

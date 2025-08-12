"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { CreateExamCTA } from "@/components/dashboard/create-exam-cta";
import { URLParamsHandler } from "@/components/dashboard/url-params-handler";
import { TrialUpgradeDialog } from "@/components/dashboard/trial-upgrade-dialog";
import { useToast } from "@/hooks/use-toast";
import React, { Suspense, useCallback } from "react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";

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

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const asUser = getImpersonateUserId();
      const response = await axios.get("/api/user" + (asUser ? `?asUser=${encodeURIComponent(asUser)}` : ""));

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
  }, [toast]);

  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Check for selected plan from pricing page and trigger checkout
  React.useEffect(() => {
    const selectedPlan = localStorage.getItem("selectedPlan");

    if (selectedPlan && userData.user) {
      try {
        const planData = JSON.parse(selectedPlan);

        // Clear the stored plan to prevent multiple triggers
        localStorage.removeItem("selectedPlan");

        // Show a toast to inform user
        toast({
          title: "Redirecionando para o checkout...",
          description: `Processando assinatura do plano ${planData.planName}`,
        });

        // Trigger checkout
        handleCheckoutFromPricing(planData);
      } catch (error) {
        console.error("Error processing selected plan:", error);
        localStorage.removeItem("selectedPlan"); // Clean up invalid data
      }
    }
  }, [userData.user, toast]);

  // Function to handle checkout after authentication
  const handleCheckoutFromPricing = async (planData: any) => {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: planData.priceId,
          planId: planData.planId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || "Failed to create checkout session"
        );
      }

      const responseData = await response.json();

      if (responseData.url) {
        window.location.href = responseData.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao processar o pagamento",
      });
    }
  };

  // Check if user is on trial plan
  const isTrialUser = userData.user?.subscription?.plan === "trial";

  return (
    <>
      <Suspense fallback={null}>
        <URLParamsHandler />
      </Suspense>

      <TrialUpgradeDialog isTrialUser={isTrialUser} isLoading={loading} />

      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Dashboard"
          text="Bem-vindo de volta! Aqui está um resumo das suas provas."
        />
        <CreateExamCTA />
      </div>

      <div className="space-y-6 mt-4">
        <OverviewStats userData={userData} loading={loading} />
        <RecentExams onExamDeleted={fetchUserData} />
      </div>
    </>
  );
}

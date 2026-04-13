"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentExams } from "@/components/dashboard/recent-exams";
import { URLParamsHandler } from "@/components/dashboard/url-params-handler";
import { useToast } from "@/hooks/use-toast";
import React, { Suspense, useCallback, useMemo } from "react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { DashboardQuickLinks } from "@/components/dashboard/dashboard-quick-links";
import { DashboardPendingAlert } from "@/components/dashboard/dashboard-pending-alert";
import {
  DashboardTopActivity,
  type AnalyticsExamSummary,
} from "@/components/dashboard/dashboard-top-activity";

interface UserData {
  user: any;
  classes: any[];
  exams: any[];
  stats?: {
    totalExams: number;
    totalClasses: number;
    examsThisPeriod: number;
  };
}

export default function DashboardPage() {
  const [userData, setUserData] = React.useState<UserData>({
    user: null,
    classes: [],
    exams: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [pendingGrading, setPendingGrading] = React.useState(0);
  const [analyticsExams, setAnalyticsExams] = React.useState<
    { id: unknown; title: string; className: string; submissionCount: number }[]
  >([]);
  const [studentTotal, setStudentTotal] = React.useState<number | null>(null);
  const { toast } = useToast();

  const router = useRouter();

  const totalSubmissions = useMemo(
    () =>
      analyticsExams.reduce((acc, e) => acc + (e.submissionCount || 0), 0),
    [analyticsExams]
  );

  const topActivityExams: AnalyticsExamSummary[] = useMemo(() => {
    return [...analyticsExams]
      .filter((e) => (e.submissionCount || 0) > 0)
      .sort((a, b) => b.submissionCount - a.submissionCount)
      .slice(0, 5)
      .map((e) => ({
        id: String(e.id),
        title: e.title,
        className: e.className,
        submissionCount: e.submissionCount,
      }));
  }, [analyticsExams]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const asUser = getImpersonateUserId();
      const q = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
      const studentUrl = `/api/student?limit=1${
        asUser ? `&asUser=${encodeURIComponent(asUser)}` : ""
      }`;

      const [userRes, pendingRaw, analyticsRes, studentRes] =
        await Promise.all([
          axios.get("/api/user" + q),
          fetch("/api/exam/results/pending-count" + q),
          axios.get("/api/analytics/exams" + q),
          axios.get(studentUrl),
        ]);

      const pendingRes = pendingRaw.ok ? await pendingRaw.json() : {};

      if (userRes.data.status === "success") {
        const data = userRes.data.data as UserData;
        setUserData(data);

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

      if (pendingRes?.status === "success" && typeof pendingRes.count === "number") {
        setPendingGrading(pendingRes.count);
      } else {
        setPendingGrading(0);
      }

      if (
        analyticsRes.data?.status === "success" &&
        Array.isArray(analyticsRes.data.data)
      ) {
        setAnalyticsExams(analyticsRes.data.data);
      } else {
        setAnalyticsExams([]);
      }

      if (
        studentRes.data?.status === "success" &&
        studentRes.data.data?.pagination &&
        typeof studentRes.data.data.pagination.total === "number"
      ) {
        setStudentTotal(studentRes.data.data.pagination.total);
      } else {
        setStudentTotal(null);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar dados do usuário",
      });
      setPendingGrading(0);
      setAnalyticsExams([]);
      setStudentTotal(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Check for selected plan from pricing page and trigger checkout
  React.useEffect(() => {
    const selectedPlan = localStorage.getItem("selectedPlan");

    if (selectedPlan && userData.user) {
      try {
        const planData = JSON.parse(selectedPlan);

        localStorage.removeItem("selectedPlan");

        toast({
          title: "Redirecionando para o checkout...",
          description: `Processando assinatura do plano ${planData.planName}`,
        });

        handleCheckoutFromPricing(planData);
      } catch (error) {
        console.error("Error processing selected plan:", error);
        localStorage.removeItem("selectedPlan");
      }
    }

    if (!selectedPlan && userData.user?.subscription?.plan === "trial") {
      router.push("/dashboard/billing");
    }
  }, [userData.user, toast]);

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

  React.useEffect(() => {
    if (userData.user?.subscription?.plan === "trial") {
      router.push("/dashboard/billing");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <URLParamsHandler />
      </Suspense>

      <DashboardHeader
        heading="Dashboard"
        text="Bem-vindo de volta! Suas turmas organizam provas e alunos — abra uma turma para gerenciar tudo em um só lugar."
      />

      <div className="mt-4 space-y-6">
        <DashboardQuickLinks userData={userData} />
        <DashboardPendingAlert count={pendingGrading} />
        <OverviewStats
          userData={userData}
          loading={loading}
          totalSubmissions={totalSubmissions}
          pendingGrading={pendingGrading}
          studentTotal={studentTotal}
        />
        <DashboardTopActivity exams={topActivityExams} loading={loading} />
        <RecentExams onExamDeleted={fetchDashboardData} userData={userData} />
      </div>
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Trophy,
  AlertTriangle,
  Target,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import { ScoreDistributionChart } from "@/components/analytics/ScoreDistributionChart";
import { GradeBreakdownChart } from "@/components/analytics/GradeBreakdownChart";
import UpgradeOverlay from "@/components/analytics/UpgradeOverlay";
import { useSubscription } from "@/hooks/use-subscription";
import { PromoDialog } from "@/components/dashboard/promo-dialog";

interface AnalyticsData {
  exam: {
    title: string;
    questionCount: number;
    totalSubmissions: number;
  };
  analytics: {
    media: number;
    notaMinima: number;
    notaMaxima: number;
    totalSubmissions: number;
    scoreDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    gradeRanges: {
      excellent: number;
      good: number;
      satisfactory: number;
      needsImprovement: number;
      unsatisfactory: number;
    };
    recentSubmissions: Array<{
      email: string;
      score: number;
      percentage: number;
      submittedAt: string;
    }>;
  };
}

// Colors for the pie chart
const GRADE_COLORS = {
  excellent: "#22c55e", // green-500
  good: "#84cc16", // lime-500
  satisfactory: "#eab308", // yellow-500
  needsImprovement: "#f97316", // orange-500
  unsatisfactory: "#ef4444", // red-500
};

// no configs needed for Chart.js wrappers

function AnalyticsSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header skeleton */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Summary Insights skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats section */}
      <div>
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts section */}
      <div>
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent submissions section */}
      <div>
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ExamAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const examId = params?.examId as string;
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const isTrialUser = subscription?.plan === "trial";

  useEffect(() => {
    if (examId) {
      fetchAnalytics();
    }
  }, [examId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const asUser = getImpersonateUserId();
      const response = await axios.get(
        `/api/analytics/exam/${examId}` +
          (asUser ? `?asUser=${encodeURIComponent(asUser)}` : "")
      );

      if (response.data.status === "success") {
        setData(response.data.data);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            response.data.message || "Falha ao carregar dados de análise",
        });
        router.push("/dashboard/analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar dados de análise",
      });
      router.push("/dashboard/analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGradeLabel = (key: string) => {
    const labels = {
      excellent: "Excelente (90-100%)",
      good: "Bom (80-89%)",
      satisfactory: "Satisfatório (70-79%)",
      needsImprovement: "Precisa Melhorar (60-69%)",
      unsatisfactory: "Insatisfatório (0-59%)",
    };
    return labels[key as keyof typeof labels] || key;
  };

  if (loading) {
    return (
      <>
        <AnalyticsSkeleton />
      </>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-title-3 font-semibold mb-2">
            Dados não encontrados
          </h3>
          <p className="text-subhead text-secondary-label mb-6">
            Não foi possível carregar os dados de análise desta prova.
          </p>
          <Button onClick={() => router.push("/dashboard/analytics")} size="lg">
            Voltar para Analytics
          </Button>
        </div>
      </div>
    );
  }

  const { exam, analytics } = data;

  // Prepare data for pie chart
  const gradeRangeData = Object.entries(analytics.gradeRanges)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => ({
      name: getGradeLabel(key),
      value: count,
      percentage: ((count / analytics.totalSubmissions) * 100).toFixed(1),
      color: GRADE_COLORS[key as keyof typeof GRADE_COLORS],
    }));

  // Debug logging
  console.log("Score Distribution Data:", analytics.scoreDistribution);
  console.log("Grade Range Data:", gradeRangeData);

  return (
    <>
      <PromoDialog
        isTrialUser={!!isTrialUser}
        isLoading={subscriptionLoading}
      />
      <DashboardHeader
        heading={exam.title}
        text={`Análise detalhada dos resultados com ${
          analytics.totalSubmissions
        } ${analytics.totalSubmissions === 1 ? "submissão" : "submissões"}`}
      >
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </DashboardHeader>

      <div className="space-y-10 mt-8">
        {/* Summary Insights */}
        {/* <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
          <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-headline font-semibold text-label mb-2">
                    Resumo da Avaliação
                  </h3>
                  <p className="text-subhead text-secondary-label leading-relaxed">
                    {analytics.totalSubmissions === 0 ? (
                      "Esta avaliação ainda não recebeu submissões."
                    ) : analytics.media >= 70 ? (
                      <>
                        A turma teve um{" "}
                        <strong className="text-label">
                          desempenho satisfatório
                        </strong>{" "}
                        com média de{" "}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {analytics.media}%
                        </strong>
                        .
                        {analytics.notaMaxima === 100 &&
                          " Parabéns! Houve nota(s) perfeita(s)!"}
                      </>
                    ) : (
                      <>
                        A turma teve média de{" "}
                        <strong className="text-label">
                          {analytics.media}%
                        </strong>
                        , indicando{" "}
                        <strong className="text-orange-600 dark:text-orange-400">
                          oportunidades de melhoria
                        </strong>{" "}
                        no conteúdo.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </UpgradeOverlay> */}

        {/* Key Stats */}
        <div>
          <div className="mb-6">
            <h2 className="text-title-2 font-semibold tracking-tight text-label">
              Métricas Principais
            </h2>
            <p className="text-subhead text-secondary-label mt-1">
              Visão geral do desempenho da turma
            </p>
          </div>

          <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <p className="text-footnote font-medium text-secondary-label uppercase tracking-wide">
                          Média Geral
                        </p>
                      </div>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                        {analytics.media}%
                      </div>
                      <p className="text-caption-1 text-tertiary-label">
                        {analytics.totalSubmissions}{" "}
                        {analytics.totalSubmissions === 1
                          ? "submissão"
                          : "submissões"}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                      <Target className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-footnote font-medium text-secondary-label uppercase tracking-wide">
                          Nota Máxima
                        </p>
                      </div>
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400 tracking-tight">
                        {analytics.notaMaxima}%
                      </div>
                      <p className="text-caption-1 text-tertiary-label">
                        Melhor resultado
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-red-50/30 dark:from-gray-900 dark:to-red-950/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <p className="text-footnote font-medium text-secondary-label uppercase tracking-wide">
                          Nota Mínima
                        </p>
                      </div>
                      <div className="text-4xl font-bold text-red-600 dark:text-red-400 tracking-tight">
                        {analytics.notaMinima}%
                      </div>
                      <p className="text-caption-1 text-tertiary-label">
                        Menor resultado
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                      <TrendingDown className="h-7 w-7 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <p className="text-footnote font-medium text-secondary-label uppercase tracking-wide">
                          Submissões
                        </p>
                      </div>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                        {analytics.totalSubmissions}
                      </div>
                      <p className="text-caption-1 text-tertiary-label">
                        {exam.questionCount}{" "}
                        {exam.questionCount === 1 ? "questão" : "questões"}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                      <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </UpgradeOverlay>
        </div>

        {/* Charts */}
        <div>
          <div className="mb-6">
            <h2 className="text-title-2 font-semibold tracking-tight text-label">
              Análise de Distribuição
            </h2>
            <p className="text-subhead text-secondary-label mt-1">
              Visualização detalhada do desempenho dos alunos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
              <ScoreDistributionChart
                buckets={analytics.scoreDistribution.map((b) => ({
                  range: b.range,
                  count: b.count,
                }))}
              />
            </UpgradeOverlay>
            <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
              <GradeBreakdownChart
                gradeCounts={analytics.gradeRanges}
                total={analytics.totalSubmissions}
              />
            </UpgradeOverlay>
          </div>
        </div>

        {/* Recent Submissions */}
        <div>
          <div className="mb-6">
            <h2 className="text-title-2 font-semibold tracking-tight text-label">
              Submissões Recentes
            </h2>
            <p className="text-subhead text-secondary-label mt-1">
              Últimas {analytics.recentSubmissions.length} submissões realizadas
            </p>
          </div>

          <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                {analytics.recentSubmissions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-apple-gray-6 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="text-headline font-semibold text-label mb-2">
                      Nenhuma submissão encontrada
                    </h3>
                    <p className="text-subhead text-secondary-label">
                      As submissões aparecerão aqui quando os alunos responderem
                      a prova
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {analytics.recentSubmissions.map((submission, index) => {
                      const scorePercentage = submission.percentage;
                      const scoreColor =
                        scorePercentage >= 90
                          ? "bg-green-500 dark:bg-green-600"
                          : scorePercentage >= 70
                          ? "bg-blue-500 dark:bg-blue-600"
                          : scorePercentage >= 60
                          ? "bg-yellow-500 dark:bg-yellow-600"
                          : "bg-red-500 dark:bg-red-600";

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-5 hover:bg-secondary-system-background/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-callout font-semibold text-label truncate">
                                {submission.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3.5 w-3.5 text-tertiary-label" />
                                <p className="text-caption-1 text-tertiary-label">
                                  {formatDate(submission.submittedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${scoreColor}`}
                                />
                                <span className="text-headline font-bold text-label">
                                  {submission.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-caption-1 text-tertiary-label">
                                {submission.score}/{exam.questionCount} questões
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </UpgradeOverlay>
        </div>
      </div>
    </>
  );
}

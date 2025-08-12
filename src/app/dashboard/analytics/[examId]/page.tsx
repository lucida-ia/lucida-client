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
} from "lucide-react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import { ScoreDistributionChart } from "@/components/analytics/ScoreDistributionChart";
import { GradeBreakdownChart } from "@/components/analytics/GradeBreakdownChart";
import UpgradeOverlay from "@/components/analytics/UpgradeOverlay";
import { useSubscription } from "@/hooks/use-subscription";
import { TrialUpgradeDialog } from "@/components/dashboard/trial-upgrade-dialog";

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
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Recent submissions skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
      const response = await axios.get(`/api/analytics/exam/${examId}` + (asUser ? `?asUser=${encodeURIComponent(asUser)}` : ""));

      if (response.data.status === "success") {
        setData(response.data.data);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: response.data.message || "Falha ao carregar dados de análise",
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
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <AnalyticsSkeleton />
      </>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dados não encontrados</h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados de análise desta prova.
          </p>
          <Button onClick={() => router.push("/dashboard/analytics")}>
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
      <TrialUpgradeDialog isTrialUser={!!isTrialUser} isLoading={subscriptionLoading} />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <DashboardHeader
        heading={`Analytics: ${exam.title}`}
        text={`Análise detalhada dos resultados da prova com ${analytics.totalSubmissions} submissões`}
      />

      <div className="space-y-6 mt-6">
        {/* Key Stats */}
        <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics.media}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalSubmissions} submissões
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nota Máxima</p>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {analytics.notaMaxima}%
                  </div>
                  <p className="text-xs text-muted-foreground">Melhor resultado</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nota Mínima</p>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {analytics.notaMinima}%
                  </div>
                  <p className="text-xs text-muted-foreground">Menor resultado</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total de Submissões</p>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {analytics.totalSubmissions}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {exam.questionCount} questões
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </UpgradeOverlay>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
            <ScoreDistributionChart
              buckets={analytics.scoreDistribution.map((b) => ({ range: b.range, count: b.count }))}
            />
          </UpgradeOverlay>
          <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
            <GradeBreakdownChart
              gradeCounts={analytics.gradeRanges}
              total={analytics.totalSubmissions}
            />
          </UpgradeOverlay>
        </div>

        {/* Recent Submissions */}
        <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Submissões Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentSubmissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma submissão encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.recentSubmissions.map((submission, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{submission.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            submission.percentage >= 70
                              ? "default"
                              : submission.percentage >= 60
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {submission.percentage}%
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {submission.score}/{exam.questionCount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </UpgradeOverlay>
      </div>
    </>
  );
}
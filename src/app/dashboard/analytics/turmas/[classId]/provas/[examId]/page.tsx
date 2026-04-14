"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getImpersonateUserId } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import UpgradeOverlay from "@/components/analytics/UpgradeOverlay";
import { PromoDialog } from "@/components/dashboard/promo-dialog";
import { ScoreDistributionChart } from "@/components/analytics/ScoreDistributionChart";
import { GradeBreakdownChart } from "@/components/analytics/GradeBreakdownChart";
import {
  ClassSummaryCards,
  SummaryCardItem,
} from "@/components/analytics/ClassSummaryCards";
import { QuestionAccuracyChart } from "@/components/analytics/QuestionAccuracyChart";
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";
import {
  StudentRankingTable,
  RankingRow,
} from "@/components/analytics/StudentRankingTable";

type AnalyticsData = {
  exam: {
    id: string;
    title: string;
    questionCount: number;
    totalSubmissions: number;
    classId: string;
    className: string;
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
    perQuestion: Array<{
      questionIndex: number;
      subject: string;
      difficulty: string;
      correctCount: number;
      totalAnswered: number;
      accuracy: number;
    }>;
    byTopic: Array<{
      subject: string;
      questionCount: number;
      totalCorrect: number;
      totalAnswered: number;
      accuracy: number;
    }>;
    ranking: Array<{
      email: string;
      studentName: string | null;
      score: number;
      percentage: number;
      submittedAt: string;
    }>;
  };
};

export default function ExamAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.classId as string;
  const examId = params?.examId as string;
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const isTrialUser = subscription?.plan === "trial";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    const fetchData = async () => {
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
          router.push(`/dashboard/analytics/turmas/${classId}`);
        }
      } catch (error) {
        console.error("Error fetching exam analytics:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar dados de análise",
        });
        router.push(`/dashboard/analytics/turmas/${classId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, classId, router, toast]);

  if (loading) {
    return (
      <>
        <DashboardHeader heading="Carregando..." />
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-apple" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-apple" />
            <Skeleton className="h-80 rounded-apple" />
          </div>
          <Skeleton className="h-64 rounded-apple" />
        </div>
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
            Não foi possível carregar os dados desta prova.
          </p>
          <Button
            onClick={() =>
              router.push(`/dashboard/analytics/turmas/${classId}`)
            }
            size="lg"
          >
            Voltar para a turma
          </Button>
        </div>
      </div>
    );
  }

  const { exam, analytics } = data;
  const hasSubmissions = analytics.totalSubmissions > 0;

  const summaryItems: SummaryCardItem[] = [
    {
      label: "Média Geral",
      value: `${analytics.media}%`,
      caption: `${analytics.totalSubmissions} ${
        analytics.totalSubmissions === 1 ? "submissão" : "submissões"
      }`,
      icon: Target,
      color: "blue",
    },
    {
      label: "Nota Máxima",
      value: `${analytics.notaMaxima}%`,
      caption: "Melhor resultado",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Nota Mínima",
      value: `${analytics.notaMinima}%`,
      caption: "Menor resultado",
      icon: TrendingDown,
      color: "red",
    },
    {
      label: "Submissões",
      value: analytics.totalSubmissions,
      caption: `${exam.questionCount} ${
        exam.questionCount === 1 ? "questão" : "questões"
      }`,
      icon: Users,
      color: "purple",
    },
  ];

  const rankingRows: RankingRow[] = analytics.ranking.map((r) => ({
    email: r.email,
    studentName: r.studentName,
    primaryValue: r.percentage,
    primaryLabel: "%",
    secondary: `${r.score}/${exam.questionCount} acertos`,
    extra: new Date(r.submittedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  }));

  const hasTopics = analytics.byTopic.length > 0;
  const hasPerQuestion = analytics.perQuestion.some(
    (q) => q.totalAnswered > 0
  );

  return (
    <>
      <PromoDialog isTrialUser={!!isTrialUser} isLoading={subscriptionLoading} />
      <div className="flex items-center gap-1.5 text-footnote text-tertiary-label mb-2 flex-wrap">
        <Link
          href="/dashboard/analytics"
          className="hover:text-label transition-colors"
        >
          Análises
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/dashboard/analytics/turmas/${classId}`}
          className="hover:text-label transition-colors truncate max-w-[10rem]"
        >
          {exam.className}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-label font-medium truncate">{exam.title}</span>
      </div>
      <DashboardHeader
        heading={exam.title}
        text={`Análise detalhada com ${analytics.totalSubmissions} ${
          analytics.totalSubmissions === 1 ? "submissão" : "submissões"
        }`}
      >
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/analytics/turmas/${classId}`)
          }
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Turma
        </Button>
      </DashboardHeader>

      {!hasSubmissions ? (
        <div className="mt-10 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-title-3 font-semibold mb-2">
            Esta prova ainda não tem submissões
          </h3>
          <p className="text-subhead text-secondary-label mb-6">
            Assim que os alunos responderem, as análises aparecerão aqui.
          </p>
        </div>
      ) : (
        <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
          <div className="space-y-10 mt-8">
            <div>
              <div className="mb-6">
                <h2 className="text-title-2 font-semibold tracking-tight">
                  Métricas Principais
                </h2>
                <p className="text-subhead text-secondary-label mt-1">
                  Visão geral do desempenho da turma nesta prova
                </p>
              </div>
              <ClassSummaryCards items={summaryItems} />
            </div>

            <div>
              <div className="mb-6">
                <h2 className="text-title-2 font-semibold tracking-tight">
                  Distribuição de Notas
                </h2>
                <p className="text-subhead text-secondary-label mt-1">
                  Como as notas se distribuem pela turma
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScoreDistributionChart
                  buckets={analytics.scoreDistribution.map((b) => ({
                    range: b.range,
                    count: b.count,
                  }))}
                />
                <GradeBreakdownChart
                  gradeCounts={analytics.gradeRanges}
                  total={analytics.totalSubmissions}
                />
              </div>
            </div>

            {(hasPerQuestion || hasTopics) && (
              <div>
                <div className="mb-6">
                  <h2 className="text-title-2 font-semibold tracking-tight">
                    Análise por Questão e Tópico
                  </h2>
                  <p className="text-subhead text-secondary-label mt-1">
                    Identifique quais questões e matérias precisam de atenção
                  </p>
                </div>
                <div
                  className={`grid grid-cols-1 ${
                    hasTopics ? "lg:grid-cols-2" : ""
                  } gap-6`}
                >
                  {hasPerQuestion && (
                    <QuestionAccuracyChart
                      questions={analytics.perQuestion.map((q) => ({
                        questionIndex: q.questionIndex,
                        accuracy: q.accuracy,
                        subject: q.subject,
                        difficulty: q.difficulty,
                        totalAnswered: q.totalAnswered,
                      }))}
                    />
                  )}
                  {hasTopics && (
                    <TopicBreakdownChart
                      topics={analytics.byTopic.map((t) => ({
                        subject: t.subject,
                        accuracy: t.accuracy,
                        questionCount: t.questionCount,
                      }))}
                    />
                  )}
                </div>
              </div>
            )}

            <div>
              <StudentRankingTable
                rows={rankingRows}
                description="Clique em um aluno para ver a análise individual na prova"
                initialLimit={20}
                onRowClick={(row) =>
                  router.push(
                    `/dashboard/analytics/turmas/${classId}/provas/${examId}/alunos/${encodeURIComponent(
                      row.email
                    )}`
                  )
                }
              />
            </div>
          </div>
        </UpgradeOverlay>
      )}
    </>
  );
}

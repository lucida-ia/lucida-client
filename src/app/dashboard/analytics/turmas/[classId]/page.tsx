"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Target,
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
import {
  ClassSummaryCards,
  SummaryCardItem,
} from "@/components/analytics/ClassSummaryCards";
import { TrendLineChart } from "@/components/analytics/TrendLineChart";
import {
  StudentRankingTable,
  RankingRow,
} from "@/components/analytics/StudentRankingTable";

type ClassDetail = {
  class: {
    id: string;
    name: string;
    description: string;
    studentCount: number;
  };
  summary: {
    examCount: number;
    submissionCount: number;
    avgPercentage: number;
    minPercentage: number;
    maxPercentage: number;
    gradeRanges: Record<string, number>;
  };
  exams: Array<{
    id: string;
    title: string;
    createdAt: string;
    questionCount: number;
    submissionCount: number;
    avgPercentage: number;
  }>;
  trend: Array<{
    examId: string;
    title: string;
    createdAt: string;
    avgPercentage: number;
    submissionCount: number;
  }>;
  ranking: Array<{
    email: string;
    studentName: string | null;
    examsTaken: number;
    avgPercentage: number;
  }>;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function gradeColor(value: number) {
  if (value >= 90) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

export default function ClassAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.classId as string;
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const isTrialUser = subscription?.plan === "trial";
  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankingMode, setRankingMode] = useState<"top" | "bottom">("top");

  useEffect(() => {
    if (!classId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const asUser = getImpersonateUserId();
        const response = await axios.get(
          `/api/analytics/classes/${classId}` +
            (asUser ? `?asUser=${encodeURIComponent(asUser)}` : "")
        );
        if (response.data.status === "success") {
          setData(response.data.data);
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description:
              response.data.message || "Falha ao carregar dados da turma",
          });
          router.push("/dashboard/analytics");
        }
      } catch (error) {
        console.error("Error fetching class analytics:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar dados da turma",
        });
        router.push("/dashboard/analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId, router, toast]);

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
          <Skeleton className="h-80 rounded-apple" />
          <Skeleton className="h-64 rounded-apple" />
        </div>
      </>
    );
  }

  if (!data) return null;

  const { class: klass, summary, exams, trend, ranking } = data;

  const summaryItems: SummaryCardItem[] = [
    {
      label: "Média Geral",
      value: `${summary.avgPercentage}%`,
      caption: `${summary.submissionCount} submissões`,
      icon: Target,
      color: "blue",
    },
    {
      label: "Provas Aplicadas",
      value: summary.examCount,
      caption:
        summary.examCount === 1
          ? "com dados disponíveis"
          : "com dados disponíveis",
      icon: FileText,
      color: "purple",
    },
    {
      label: "Alunos Cadastrados",
      value: klass.studentCount,
      caption: `${ranking.length} responderam`,
      icon: Users,
      color: "green",
    },
    {
      label: "Variação",
      value: `${summary.minPercentage}-${summary.maxPercentage}%`,
      caption: "da menor à maior nota",
      icon: TrendingUp,
      color: "yellow",
    },
  ];

  const rankingSorted =
    rankingMode === "top"
      ? [...ranking].sort((a, b) => b.avgPercentage - a.avgPercentage)
      : [...ranking].sort((a, b) => a.avgPercentage - b.avgPercentage);

  const rankingRows: RankingRow[] = rankingSorted.slice(0, 20).map((r) => ({
    email: r.email,
    studentName: r.studentName,
    primaryValue: r.avgPercentage,
    primaryLabel: "%",
    secondary: `${r.examsTaken} ${
      r.examsTaken === 1 ? "prova" : "provas"
    }`,
  }));

  return (
    <>
      <PromoDialog isTrialUser={!!isTrialUser} isLoading={subscriptionLoading} />
      <div className="flex items-center gap-1.5 text-footnote text-tertiary-label mb-2">
        <Link
          href="/dashboard/analytics"
          className="hover:text-label transition-colors"
        >
          Análises
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-label font-medium truncate">{klass.name}</span>
      </div>
      <DashboardHeader
        heading={klass.name}
        text={
          klass.description ||
          `Visão analítica de ${summary.examCount} ${
            summary.examCount === 1 ? "prova" : "provas"
          } aplicadas nesta turma`
        }
      >
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/analytics")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Turmas
        </Button>
      </DashboardHeader>

      <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
        <div className="space-y-10 mt-8">
          <div>
            <div className="mb-6">
              <h2 className="text-title-2 font-semibold tracking-tight">
                Resumo da Turma
              </h2>
              <p className="text-subhead text-secondary-label mt-1">
                Indicadores agregados de todas as provas aplicadas
              </p>
            </div>
            <ClassSummaryCards items={summaryItems} />
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-title-2 font-semibold tracking-tight">
                Evolução Temporal
              </h2>
              <p className="text-subhead text-secondary-label mt-1">
                Média da turma em cada prova, em ordem cronológica
              </p>
            </div>
            <TrendLineChart
              title="Média por Prova"
              description="Um ponto por prova com submissões"
              points={trend.map((t) => ({
                label: t.title.length > 18 ? t.title.slice(0, 17) + "…" : t.title,
                value: t.avgPercentage,
                date: t.createdAt,
              }))}
            />
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-title-2 font-semibold tracking-tight">
                Provas da Turma
              </h2>
              <p className="text-subhead text-secondary-label mt-1">
                Clique em uma prova para ver o detalhamento completo
              </p>
            </div>
            {exams.length === 0 ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <p className="text-subhead text-secondary-label">
                    Nenhuma prova cadastrada nesta turma
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => {
                  const disabled = exam.submissionCount === 0;
                  return (
                    <Card
                      key={exam.id}
                      className={`group transition-all duration-200 ${
                        disabled
                          ? "opacity-60"
                          : "hover:shadow-md hover:border-border/60 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (disabled) return;
                        router.push(
                          `/dashboard/analytics/turmas/${classId}/provas/${exam.id}`
                        );
                      }}
                    >
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <h3 className="text-headline font-semibold leading-tight text-label line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {exam.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Calendar className="h-3 w-3 text-tertiary-label" />
                            <p className="text-caption-1 text-tertiary-label">
                              {formatDate(exam.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-footnote">
                            <span className="text-secondary-label">
                              Média
                            </span>
                            <span className="font-semibold text-label">
                              {disabled ? "—" : `${exam.avgPercentage}%`}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary-system-background overflow-hidden">
                            <div
                              className={`h-full ${gradeColor(
                                exam.avgPercentage
                              )} transition-all`}
                              style={{
                                width: disabled
                                  ? "0%"
                                  : `${exam.avgPercentage}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-caption-1 text-tertiary-label pt-1">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {exam.questionCount}{" "}
                              {exam.questionCount === 1
                                ? "questão"
                                : "questões"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {exam.submissionCount}
                            </span>
                          </div>
                        </div>

                        {disabled && (
                          <p className="text-caption-1 text-tertiary-label italic">
                            Sem submissões ainda
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-title-2 font-semibold tracking-tight">
                  Ranking de Alunos
                </h2>
                <p className="text-subhead text-secondary-label mt-1">
                  Desempenho médio de cada aluno em todas as provas da turma
                </p>
              </div>
              <div className="inline-flex rounded-apple bg-secondary-system-background p-1">
                <button
                  onClick={() => setRankingMode("top")}
                  className={`px-3 py-1.5 text-footnote font-medium rounded-[calc(var(--radius-apple)-2px)] transition-colors ${
                    rankingMode === "top"
                      ? "bg-background shadow-sm text-label"
                      : "text-secondary-label"
                  }`}
                >
                  Melhores
                </button>
                <button
                  onClick={() => setRankingMode("bottom")}
                  className={`px-3 py-1.5 text-footnote font-medium rounded-[calc(var(--radius-apple)-2px)] transition-colors ${
                    rankingMode === "bottom"
                      ? "bg-background shadow-sm text-label"
                      : "text-secondary-label"
                  }`}
                >
                  Atenção
                </button>
              </div>
            </div>
            <StudentRankingTable
              rows={rankingRows}
              title={
                rankingMode === "top" ? "Top alunos" : "Alunos que precisam de atenção"
              }
              description={
                rankingMode === "top"
                  ? "Ordenado pela média geral decrescente"
                  : "Ordenado pelas menores médias"
              }
              initialLimit={10}
            />
          </div>
        </div>
      </UpgradeOverlay>
    </>
  );
}

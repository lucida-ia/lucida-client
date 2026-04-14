"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { TopicBreakdownChart } from "@/components/analytics/TopicBreakdownChart";

type StudentAnalytics = {
  student: {
    email: string;
    name: string | null;
    code: string | null;
    matricula: string | null;
    totalExamsInClass: number;
    avgPercentageInClass: number;
  };
  exam: {
    id: string;
    title: string;
    questionCount: number;
    classId: string;
    className: string;
  };
  examResult: {
    score: number;
    percentage: number;
    submittedAt: string;
    needsGrading: boolean;
    answers: Array<{
      questionIndex: number;
      question: string;
      subject: string;
      difficulty: string;
      type: string;
      options: string[];
      correctAnswer: any;
      answer: any;
      score: number;
      maxValue: number;
      isCorrect: boolean;
      needsReview: boolean;
      feedback: string;
    }>;
  };
  byTopic: Array<{
    subject: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;
  history: Array<{
    examId: string;
    examTitle: string;
    percentage: number;
    score: number;
    submittedAt: string;
    isCurrent: boolean;
  }>;
};

function formatAnswer(answer: any, options: string[], type: string) {
  if (answer === null || answer === undefined || answer === "") return "—";
  if (type === "multipleChoice" && typeof answer === "number") {
    const letter = String.fromCharCode(65 + answer);
    const option = options[answer];
    return option ? `${letter}) ${option}` : letter;
  }
  if (type === "trueFalse") {
    return answer === true || answer === "true" || answer === 1
      ? "Verdadeiro"
      : "Falso";
  }
  return String(answer);
}

export default function StudentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.classId as string;
  const examId = params?.examId as string;
  const key = params?.key as string;
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const isTrialUser = subscription?.plan === "trial";
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlyErrors, setOnlyErrors] = useState(false);

  useEffect(() => {
    if (!examId || !key) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const asUser = getImpersonateUserId();
        const response = await axios.get(
          `/api/analytics/exam/${examId}/student/${key}` +
            (asUser ? `?asUser=${encodeURIComponent(asUser)}` : "")
        );
        if (response.data.status === "success") {
          setData(response.data.data);
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description:
              response.data.message || "Falha ao carregar dados do aluno",
          });
          router.push(
            `/dashboard/analytics/turmas/${classId}/provas/${examId}`
          );
        }
      } catch (error) {
        console.error("Error fetching student analytics:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar dados do aluno",
        });
        router.push(`/dashboard/analytics/turmas/${classId}/provas/${examId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, key, classId, router, toast]);

  const displayName = data?.student.name || data?.student.email || "";

  const visibleAnswers = useMemo(() => {
    if (!data) return [];
    if (!onlyErrors) return data.examResult.answers;
    return data.examResult.answers.filter((a) => !a.isCorrect);
  }, [data, onlyErrors]);

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
          <Skeleton className="h-72 rounded-apple" />
          <Skeleton className="h-96 rounded-apple" />
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
            Aluno não encontrado
          </h3>
          <Button
            onClick={() =>
              router.push(
                `/dashboard/analytics/turmas/${classId}/provas/${examId}`
              )
            }
            size="lg"
          >
            Voltar para a prova
          </Button>
        </div>
      </div>
    );
  }

  const { student, exam, examResult, byTopic, history } = data;
  const correctCount = examResult.answers.filter((a) => a.isCorrect).length;

  const summaryItems: SummaryCardItem[] = [
    {
      label: "Nota nesta prova",
      value: `${examResult.percentage}%`,
      caption: `${correctCount}/${exam.questionCount} acertos`,
      icon: Target,
      color:
        examResult.percentage >= 70
          ? "green"
          : examResult.percentage >= 60
          ? "yellow"
          : "red",
    },
    {
      label: "Média na turma",
      value: `${student.avgPercentageInClass}%`,
      caption: `${student.totalExamsInClass} ${
        student.totalExamsInClass === 1 ? "prova feita" : "provas feitas"
      }`,
      icon: Trophy,
      color: "blue",
    },
    {
      label: "Submetido em",
      value: new Date(examResult.submittedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      caption: new Date(examResult.submittedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: Calendar,
      color: "purple",
    },
    {
      label: "Identificação",
      value: student.code || student.matricula || "—",
      caption: student.code
        ? "código"
        : student.matricula
        ? "matrícula"
        : "sem cadastro",
      icon: Trophy,
      color: "yellow",
    },
  ];

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
        <Link
          href={`/dashboard/analytics/turmas/${classId}/provas/${examId}`}
          className="hover:text-label transition-colors truncate max-w-[10rem]"
        >
          {exam.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-label font-medium truncate">{displayName}</span>
      </div>
      <DashboardHeader
        heading={displayName}
        text={student.name ? student.email : `Análise individual em ${exam.title}`}
      >
        <Button
          variant="outline"
          onClick={() =>
            router.push(
              `/dashboard/analytics/turmas/${classId}/provas/${examId}`
            )
          }
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Prova
        </Button>
      </DashboardHeader>

      <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
        <div className="space-y-10 mt-8">
          <ClassSummaryCards items={summaryItems} />

          {history.length > 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-title-2 font-semibold tracking-tight">
                  Evolução do Aluno
                </h2>
                <p className="text-subhead text-secondary-label mt-1">
                  Desempenho em todas as provas desta turma
                </p>
              </div>
              <TrendLineChart
                title="Histórico de notas"
                description="A prova atual está destacada em laranja"
                points={history.map((h) => ({
                  label:
                    h.examTitle.length > 18
                      ? h.examTitle.slice(0, 17) + "…"
                      : h.examTitle,
                  value: h.percentage,
                  date: h.submittedAt,
                  highlight: h.isCurrent,
                }))}
              />
            </div>
          )}

          {byTopic.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-title-2 font-semibold tracking-tight">
                  Desempenho por Tópico
                </h2>
                <p className="text-subhead text-secondary-label mt-1">
                  Acertos do aluno agrupados pelo tópico de cada questão
                </p>
              </div>
              <TopicBreakdownChart
                topics={byTopic.map((t) => ({
                  subject: t.subject,
                  accuracy: t.accuracy,
                  total: t.total,
                }))}
              />
            </div>
          )}

          <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-title-2 font-semibold tracking-tight">
                  Questão a Questão
                </h2>
                <p className="text-subhead text-secondary-label mt-1">
                  Respostas do aluno comparadas com o gabarito
                </p>
              </div>
              <div className="inline-flex rounded-apple bg-secondary-system-background p-1">
                <button
                  onClick={() => setOnlyErrors(false)}
                  className={`px-3 py-1.5 text-footnote font-medium rounded-[calc(var(--radius-apple)-2px)] transition-colors ${
                    !onlyErrors
                      ? "bg-background shadow-sm text-label"
                      : "text-secondary-label"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setOnlyErrors(true)}
                  className={`px-3 py-1.5 text-footnote font-medium rounded-[calc(var(--radius-apple)-2px)] transition-colors ${
                    onlyErrors
                      ? "bg-background shadow-sm text-label"
                      : "text-secondary-label"
                  }`}
                >
                  Só erros
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {visibleAnswers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center text-center">
                    <Check className="h-8 w-8 text-green-500 mb-3" />
                    <p className="text-subhead text-secondary-label">
                      Nenhum erro nesta prova
                    </p>
                  </CardContent>
                </Card>
              ) : (
                visibleAnswers.map((a) => (
                  <Card
                    key={a.questionIndex}
                    className={`border-l-4 ${
                      a.isCorrect
                        ? "border-l-green-500"
                        : "border-l-red-500"
                    }`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            a.isCorrect
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {a.isCorrect ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-footnote font-semibold text-label">
                              Questão {a.questionIndex + 1}
                            </span>
                            {a.subject && (
                              <Badge variant="secondary" className="text-[10px]">
                                {a.subject}
                              </Badge>
                            )}
                            {a.difficulty && (
                              <Badge variant="outline" className="text-[10px]">
                                {a.difficulty}
                              </Badge>
                            )}
                            {a.needsReview && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-orange-400 text-orange-600 dark:text-orange-400"
                              >
                                revisão
                              </Badge>
                            )}
                          </div>
                          {a.question && (
                            <p className="text-footnote text-secondary-label line-clamp-2 mb-2">
                              {a.question}
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-footnote">
                            <div className="rounded-apple bg-secondary-system-background/60 px-3 py-2">
                              <p className="text-caption-1 text-tertiary-label uppercase tracking-wide mb-0.5">
                                Resposta do aluno
                              </p>
                              <p className="text-label font-medium break-words">
                                {formatAnswer(a.answer, a.options, a.type)}
                              </p>
                            </div>
                            <div className="rounded-apple bg-green-50 dark:bg-green-900/10 px-3 py-2">
                              <p className="text-caption-1 text-tertiary-label uppercase tracking-wide mb-0.5">
                                Gabarito
                              </p>
                              <p className="text-label font-medium break-words">
                                {formatAnswer(
                                  a.correctAnswer,
                                  a.options,
                                  a.type
                                )}
                              </p>
                            </div>
                          </div>
                          {a.feedback && (
                            <p className="text-caption-1 text-secondary-label mt-2 italic">
                              {a.feedback}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-caption-1 text-tertiary-label uppercase tracking-wide">
                            Pontos
                          </p>
                          <p className="text-callout font-bold text-label">
                            {a.score}/{a.maxValue}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </UpgradeOverlay>
    </>
  );
}

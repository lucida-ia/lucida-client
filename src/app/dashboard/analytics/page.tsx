"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, FileText, Calendar, AlertCircle } from "lucide-react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import UpgradeOverlay from "@/components/analytics/UpgradeOverlay";
import { useSubscription } from "@/hooks/use-subscription";
import { PromoDialog } from "@/components/dashboard/promo-dialog";

interface ExamData {
  id: string;
  title: string;
  className: string;
  classId: string;
  questionCount: number;
  submissionCount: number;
  createdAt: string;
  hasAnalytics: boolean;
}

function ExamCardSkeleton() {
  return (
    <Card className="group">
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const isTrialUser = subscription?.plan === "trial";

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const asUser = getImpersonateUserId();
      const response = await axios.get(
        "/api/analytics/exams" +
          (asUser ? `?asUser=${encodeURIComponent(asUser)}` : "")
      );

      if (response.data.status === "success") {
        setExams(response.data.data);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar provas para análise",
        });
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar provas para análise",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleViewAnalytics = (examId: string) => {
    router.push(`/dashboard/analytics/${examId}`);
  };

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="Analytics das Provas"
          text="Visualize dados detalhados e estatísticas das suas avaliações"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <ExamCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  const examsWithSubmissions = exams.filter((exam) => exam.hasAnalytics);
  const examsWithoutSubmissions = exams.filter((exam) => !exam.hasAnalytics);

  return (
    <>
      <PromoDialog
        isTrialUser={!!isTrialUser}
        isLoading={subscriptionLoading}
      />
      <DashboardHeader
        heading="Analytics das Provas"
        text="Visualize dados detalhados e estatísticas das suas avaliações"
      />

      <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
        {exams.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-title-3 font-semibold mb-2">
                Nenhuma prova encontrada
              </h3>
              <p className="text-subhead text-secondary-label text-center max-w-md mb-6">
                Você ainda não criou nenhuma prova. Crie sua primeira avaliação
                para ver as análises aqui.
              </p>
              <Button
                onClick={() => router.push("/dashboard/exams/create")}
                size="lg"
              >
                Criar Primeira Prova
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10 mt-8">
            {/* Exams with analytics */}
            {examsWithSubmissions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-2 font-semibold tracking-tight">
                      Provas com Dados Disponíveis
                    </h2>
                    <p className="text-subhead text-secondary-label mt-1">
                      {examsWithSubmissions.length}{" "}
                      {examsWithSubmissions.length === 1 ? "prova" : "provas"}{" "}
                      com submissões
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {examsWithSubmissions.map((exam) => (
                    <Card
                      key={exam.id}
                      className="group hover:shadow-md hover:border-border/60 transition-all duration-200 cursor-pointer"
                      onClick={() => handleViewAnalytics(exam.id)}
                    >
                      <CardContent className="p-0">
                        <div className="p-5 space-y-4">
                          {/* Title and class */}
                          <div className="space-y-1">
                            <h3 className="text-headline font-semibold leading-tight text-label group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                              {exam.title}
                            </h3>
                            <p className="text-footnote text-secondary-label line-clamp-1">
                              {exam.className}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-caption-1 text-tertiary-label">
                                  Questões
                                </p>
                                <p className="text-callout font-semibold text-label">
                                  {exam.questionCount}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-caption-1 text-tertiary-label">
                                  Respostas
                                </p>
                                <p className="text-callout font-semibold text-label">
                                  {exam.submissionCount}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-apple-gray-6 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-caption-1 text-tertiary-label">
                                  Criada em
                                </p>
                                <p className="text-footnote font-medium text-label">
                                  {formatDate(exam.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Exams without analytics */}
            {examsWithoutSubmissions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-title-2 font-semibold tracking-tight">
                      Provas sem Dados
                    </h2>
                    <p className="text-subhead text-secondary-label mt-1">
                      {examsWithoutSubmissions.length}{" "}
                      {examsWithoutSubmissions.length === 1
                        ? "prova"
                        : "provas"}{" "}
                      aguardando submissões
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {examsWithoutSubmissions.map((exam) => (
                    <Card key={exam.id} className="opacity-60">
                      <CardContent className="p-0">
                        <div className="p-5 space-y-4">
                          {/* Title and class */}
                          <div className="space-y-1">
                            <h3 className="text-headline font-semibold leading-tight text-label line-clamp-2">
                              {exam.title}
                            </h3>
                            <p className="text-footnote text-secondary-label line-clamp-1">
                              {exam.className}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-apple-gray-6 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-caption-1 text-tertiary-label">
                                  Questões
                                </p>
                                <p className="text-callout font-semibold text-label">
                                  {exam.questionCount}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-apple-gray-6 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-caption-1 text-tertiary-label">
                                  Criada em
                                </p>
                                <p className="text-footnote font-medium text-label">
                                  {formatDate(exam.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Info message */}
                          <div className="p-3 bg-secondary-system-background rounded-lg border border-border/50">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                              <p className="text-caption-1 text-secondary-label">
                                Esta prova ainda não possui respostas para gerar
                                análises
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </UpgradeOverlay>
    </>
  );
}

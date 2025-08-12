"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, FileText, Users, Calendar, AlertCircle } from "lucide-react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import UpgradeOverlay from "@/components/analytics/UpgradeOverlay";
import { useSubscription } from "@/hooks/use-subscription";
import { TrialUpgradeDialog } from "@/components/dashboard/trial-upgrade-dialog";

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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-10 w-full" />
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
      const response = await axios.get("/api/analytics/exams" + (asUser ? `?asUser=${encodeURIComponent(asUser)}` : ""));

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
      <TrialUpgradeDialog isTrialUser={!!isTrialUser} isLoading={subscriptionLoading} />
      <DashboardHeader
        heading="Analytics das Provas"
        text="Visualize dados detalhados e estatísticas das suas avaliações"
      />

      {exams.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma prova encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não criou nenhuma prova. Crie sua primeira avaliação para ver as análises aqui.
            </p>
            <Button onClick={() => router.push("/dashboard/exams/create")}>
              Criar Primeira Prova
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 mt-6">
          {/* Exams with analytics */}
          {examsWithSubmissions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Provas com Dados Disponíveis ({examsWithSubmissions.length})
              </h2>
              <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {examsWithSubmissions.map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-medium text-left leading-tight">
                            {exam.title}
                          </CardTitle>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {exam.submissionCount} respostas
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{exam.className}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Questões:
                            </span>
                            <span className="font-medium">{exam.questionCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Criada em:
                            </span>
                            <span className="font-medium">{formatDate(exam.createdAt)}</span>
                          </div>
                          <Button
                            className="w-full mt-4"
                            onClick={() => handleViewAnalytics(exam.id)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Ver Analytics
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </UpgradeOverlay>
            </div>
          )}

          {/* Exams without analytics */}
          {examsWithoutSubmissions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                Provas sem Dados ({examsWithoutSubmissions.length})
              </h2>
              <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {examsWithoutSubmissions.map((exam) => (
                    <Card key={exam.id} className="opacity-75">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-medium text-left leading-tight">
                            {exam.title}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2 shrink-0">
                            Sem respostas
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{exam.className}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Questões:
                            </span>
                            <span className="font-medium">{exam.questionCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Criada em:
                            </span>
                            <span className="font-medium">{formatDate(exam.createdAt)}</span>
                          </div>
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground text-center">
                              Esta prova ainda não possui respostas para gerar análises
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </UpgradeOverlay>
            </div>
          )}
        </div>
      )}
    </>
  );
}

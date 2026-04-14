"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  BarChart3,
  Calendar,
  FileText,
  Folder,
  Target,
  Users,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getImpersonateUserId } from "@/lib/utils";
import UpgradeOverlay from "@/components/analytics/UpgradeOverlay";
import { useSubscription } from "@/hooks/use-subscription";
import { PromoDialog } from "@/components/dashboard/promo-dialog";

interface ClassSummary {
  id: string;
  name: string;
  description: string;
  examCount: number;
  studentCount: number;
  submissionCount: number;
  avgPercentage: number;
  lastActivityAt: string | null;
}

function ClassCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function avgColor(value: number) {
  if (value >= 90) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 60) return "bg-yellow-500";
  if (value > 0) return "bg-red-500";
  return "bg-gray-300 dark:bg-gray-700";
}

function avgTextColor(value: number) {
  if (value >= 90) return "text-green-600 dark:text-green-400";
  if (value >= 70) return "text-blue-600 dark:text-blue-400";
  if (value >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (value > 0) return "text-red-600 dark:text-red-400";
  return "text-tertiary-label";
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const isTrialUser = subscription?.plan === "trial";
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const asUser = getImpersonateUserId();
        const response = await axios.get(
          "/api/analytics/classes" +
            (asUser ? `?asUser=${encodeURIComponent(asUser)}` : "")
        );
        if (response.data.status === "success") {
          setClasses(response.data.data);
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Falha ao carregar turmas",
          });
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar turmas",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [toast]);

  const classesWithData = classes.filter((c) => c.submissionCount > 0);
  const classesWithoutData = classes.filter((c) => c.submissionCount === 0);

  if (loading) {
    return (
      <>
        <DashboardHeader
          heading="Análises"
          text="Explore o desempenho das suas turmas e provas"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PromoDialog isTrialUser={!!isTrialUser} isLoading={subscriptionLoading} />
      <DashboardHeader
        heading="Análises"
        text="Explore o desempenho das suas turmas e provas"
      />

      <UpgradeOverlay isBlocked={!subscriptionLoading && !!isTrialUser}>
        {classes.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Folder className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-title-3 font-semibold mb-2">
                Nenhuma turma encontrada
              </h3>
              <p className="text-subhead text-secondary-label text-center max-w-md mb-6">
                Crie uma turma e aplique provas para começar a acompanhar o
                desempenho por aqui.
              </p>
              <Button
                onClick={() => router.push("/dashboard/turmas")}
                size="lg"
              >
                Gerenciar turmas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10 mt-8">
            {classesWithData.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-title-2 font-semibold tracking-tight">
                    Turmas com Dados
                  </h2>
                  <p className="text-subhead text-secondary-label mt-1">
                    {classesWithData.length}{" "}
                    {classesWithData.length === 1 ? "turma" : "turmas"} com
                    submissões registradas
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classesWithData.map((c) => (
                    <Card
                      key={c.id}
                      className="group hover:shadow-md hover:border-border/60 transition-all duration-200 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/analytics/turmas/${c.id}`)
                      }
                    >
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <h3 className="text-headline font-semibold leading-tight text-label group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {c.name}
                          </h3>
                          {c.description && (
                            <p className="text-footnote text-secondary-label line-clamp-1 mt-0.5">
                              {c.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-footnote">
                            <span className="text-secondary-label flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5" />
                              Média geral
                            </span>
                            <span
                              className={`font-bold ${avgTextColor(
                                c.avgPercentage
                              )}`}
                            >
                              {c.avgPercentage}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary-system-background overflow-hidden">
                            <div
                              className={`h-full ${avgColor(
                                c.avgPercentage
                              )} transition-all`}
                              style={{ width: `${c.avgPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 text-tertiary-label">
                              <FileText className="h-3 w-3" />
                              <span className="text-caption-2 uppercase tracking-wide">
                                Provas
                              </span>
                            </div>
                            <span className="text-callout font-semibold text-label">
                              {c.examCount}
                            </span>
                          </div>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 text-tertiary-label">
                              <BarChart3 className="h-3 w-3" />
                              <span className="text-caption-2 uppercase tracking-wide">
                                Respostas
                              </span>
                            </div>
                            <span className="text-callout font-semibold text-label">
                              {c.submissionCount}
                            </span>
                          </div>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 text-tertiary-label">
                              <Users className="h-3 w-3" />
                              <span className="text-caption-2 uppercase tracking-wide">
                                Alunos
                              </span>
                            </div>
                            <span className="text-callout font-semibold text-label">
                              {c.studentCount}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-caption-1 text-tertiary-label pt-1 border-t border-border/50">
                          <Calendar className="h-3 w-3" />
                          <span>Última atividade {formatDate(c.lastActivityAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {classesWithoutData.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-title-2 font-semibold tracking-tight">
                    Turmas sem Dados
                  </h2>
                  <p className="text-subhead text-secondary-label mt-1">
                    {classesWithoutData.length}{" "}
                    {classesWithoutData.length === 1 ? "turma" : "turmas"}{" "}
                    aguardando submissões
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classesWithoutData.map((c) => (
                    <Card key={c.id} className="opacity-70">
                      <CardContent className="p-5 space-y-3">
                        <div>
                          <h3 className="text-headline font-semibold leading-tight text-label line-clamp-1">
                            {c.name}
                          </h3>
                          {c.description && (
                            <p className="text-footnote text-secondary-label line-clamp-1 mt-0.5">
                              {c.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-caption-1 text-tertiary-label">
                          <span>
                            {c.examCount}{" "}
                            {c.examCount === 1 ? "prova" : "provas"}
                          </span>
                          <span>
                            {c.studentCount}{" "}
                            {c.studentCount === 1 ? "aluno" : "alunos"}
                          </span>
                        </div>
                        <p className="text-caption-1 text-tertiary-label italic">
                          Ainda sem submissões para gerar análise
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full"
                        >
                          <Link href={`/dashboard/turmas/${c.id}`}>
                            Abrir turma
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </UpgradeOverlay>
    </>
  );
}

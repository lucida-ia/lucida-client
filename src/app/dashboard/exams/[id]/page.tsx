"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { DBExam } from "@/types/exam";

export default function ExamPreviewPage() {
  const params = useParams();
  const [exam, setExam] = useState<DBExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await axios.get(`/api/exam/${params.id}`);
        setExam(response.data.exam);
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [params.id]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Carregando prova...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!exam) {
    return (
      <DashboardShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Prova não encontrada</h2>
            <p className="mt-2 text-muted-foreground">
              A prova que você está procurando não existe ou foi removida.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/exams">Voltar para Minhas Provas</Link>
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={exam.title}
        text={exam.description || "Visualize os detalhes da sua prova."}
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/exams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Prova</CardTitle>
            <CardDescription>
              Informações gerais sobre a prova e suas configurações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Total de Questões
                </dt>
                <dd className="mt-1">{exam.questions.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Criada em
                </dt>
                <dd className="mt-1">
                  {new Date(exam.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Última Atualização
                </dt>
                <dd className="mt-1">
                  {new Date(exam.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo da Prova</CardTitle>
            <CardDescription>
              Visualize as questões e suas respostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="exam" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="exam">Visualização da Prova</TabsTrigger>
                <TabsTrigger value="answers">Gabarito</TabsTrigger>
              </TabsList>
              <TabsContent value="exam" className="space-y-4 mt-4">
                <div className="rounded-md border p-4">
                  <div className="mt-6 space-y-6">
                    {exam.questions.map((question, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-medium">
                          {index + 1}. {question.question}
                        </h3>
                        {question.options && (
                          <div className="ml-6 space-y-1">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  className="h-4 w-4"
                                  disabled
                                />
                                <label>{option}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="answers" className="space-y-4 mt-4">
                <div className="rounded-md border p-4">
                  <h2 className="text-xl font-bold mb-4">
                    Gabarito: {exam.title}
                  </h2>
                  <div className="mt-6 space-y-4">
                    {exam.questions.map((question, index) => (
                      <div key={index} className="space-y-1">
                        <h3 className="font-medium">
                          {index + 1}. {question.question}
                        </h3>
                        <div className="ml-6">
                          <span className="text-sm font-medium">
                            Resposta:{" "}
                          </span>
                          <span>
                            {question.options
                              ? question.options[question.correctAnswer]
                              : question.correctAnswer
                              ? "Verdadeiro"
                              : "Falso"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
} 
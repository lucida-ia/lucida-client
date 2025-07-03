"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import React from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClassTable } from "@/components/classes/class-table";
import { Pencil, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Class = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  studants: Student[];
  results: Result[];
};

type Student = {
  _id: string;
  name: string;
  email: string;
};

type Result = {
  _id: string;
  examId: string;
  classId: string;
  email: string;
  score: number;
  examTitle: string;
  examQuestionCount: number;
  percentage: number;
  createdAt: Date;
};

function ClassesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg px-6 py-4 shadow-sm bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClassesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedExams, setSelectedExams] = React.useState<
    Record<string, string>
  >({});

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/class");
      setClasses(response.data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar turmas",
        description: "Não foi possível carregar as turmas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const response = await axios.delete("/api/class", {
        data: { id },
      });

      if (response.status === 200) {
        toast({
          title: "Turma deletada com sucesso",
        });
        fetchClasses();
      } else {
        toast({
          title: "Erro ao deletar turma",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar turma",
        description: "Ocorreu um erro ao deletar a turma. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Minhas Turmas"
          text="Gerencie suas turmas e acompanhe o desempenho dos alunos"
        />
        <Button onClick={() => router.push("/dashboard/classes/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Turma
        </Button>
      </div>

      <div className="grid gap-4 md:gap-8">
        {isLoading ? (
          <ClassesSkeleton />
        ) : classes?.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {classes.map((classItem) => (
              <AccordionItem
                key={classItem.id}
                value={classItem.id.toString()}
                className="border rounded-lg px-6 py-2 shadow-sm bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div>
                      <h3 className="font-medium text-lg">{classItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {classItem.results?.length || 0} resultado(s)
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-4">
                  <div className="flex items-center gap-2 justify-between w-full mb-4">
                    <Select
                      value={selectedExams[classItem.id] || "all"}
                      onValueChange={(value) =>
                        setSelectedExams((prev) => ({
                          ...prev,
                          [classItem.id]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-[200px] focus:ring-0">
                        <SelectValue placeholder="Selecione uma prova" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as provas</SelectItem>
                        {/* Get unique exam titles */}
                        {Array.from(
                          new Set(
                            classItem.results.map((result) => result.examTitle)
                          )
                        ).map((examTitle) => {
                          const result = classItem.results.find(
                            (r) => r.examTitle === examTitle
                          );
                          return (
                            <SelectItem
                              key={result?.examId || examTitle}
                              value={result?.examId || examTitle}
                            >
                              {examTitle}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="gap-2">
                        <Pencil className="h-4 w-4" />
                        <span>Editar Turma</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleDeleteClass(classItem.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                        <span>Deletar Turma</span>
                      </Button>
                    </div>
                  </div>

                  {classItem.results && classItem.results.length > 0 ? (
                    <ClassTable
                      results={
                        selectedExams[classItem.id] === "all" ||
                        !selectedExams[classItem.id]
                          ? classItem.results
                          : classItem.results.filter(
                              (result) =>
                                result.examId === selectedExams[classItem.id]
                            )
                      }
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Ainda não existem resultados de provas dessa turma
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma turma encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhuma turma. Comece criando sua primeira
                turma.
              </p>
              <Button onClick={() => router.push("/dashboard/classes/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Turma
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

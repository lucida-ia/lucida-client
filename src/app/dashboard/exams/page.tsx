"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import axios from "axios";
import { DBClass } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";
import { ExamTable } from "@/components/exam/exam-table";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Accordion } from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

function ExamsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg px-6 py-4 shadow-sm bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ListExamsPage() {
  const [classes, setClasses] = React.useState<DBClass[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/exam/all");
      setClasses(response.data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar provas",
        description: "Não foi possível carregar as provas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExams();
  }, []);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Minhas Provas"
          text="Gerencie suas provas e acompanhe o desempenho dos seus alunos."
        />
        <Button onClick={() => router.push("/dashboard/exams/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Prova
        </Button>
      </div>

      <div className="grid gap-4 md:gap-8">
        {isLoading ? (
          <ExamsSkeleton />
        ) : classes?.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {classes.map((content) => (
              <AccordionItem
                value={content.id}
                key={content.id}
                className="border rounded-lg px-6 py-2 shadow-sm bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div>
                      <h3 className="font-medium text-lg">{content.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {content.exams?.length || 0} prova(s)
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ExamTable exams={content.exams} fetchExams={fetchExams} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma prova encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhuma prova. Comece criando sua primeira
                prova.
              </p>
              <Button onClick={() => router.push("/dashboard/exams/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Prova
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

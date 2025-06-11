"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function ListExamsPage() {
  const [classes, setClasses] = React.useState<DBClass[]>([]);
  const { toast } = useToast();

  const fetchExams = async () => {
    const response = await axios.get("/api/exam/all");
    setClasses(response.data.data);
  };

  React.useEffect(() => {
    fetchExams();
  }, []);

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Minhas Provas"
        text="Gerencie suas provas e acompanhe o desempenho dos seus alunos."
      />

      <Card className="col-span-4">
        <CardHeader></CardHeader>
        <CardContent>
          <Accordion type="multiple">
            {classes?.map((content) => {
              return (
                <AccordionItem value={content.id} key={content.id}>
                  <AccordionTrigger>{content.name}</AccordionTrigger>
                  <AccordionContent>
                    <ExamTable exams={content.exams} fetchExams={fetchExams} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

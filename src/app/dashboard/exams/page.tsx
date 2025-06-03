"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDistanceToNow } from "date-fns";
import { TableCell } from "@/components/ui/table";
import { TableBody } from "@/components/ui/table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table } from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { Copy, Trash } from "lucide-react";
import { Edit } from "lucide-react";
import { FileText } from "lucide-react";
import React from "react";
import axios from "axios";
import { DBExam } from "@/types/exam";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { ExamShareButton } from "@/components/exam/exam-share-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function ListExamsPage() {
  const [exams, setExams] = React.useState<DBExam[]>([]);
  const { toast } = useToast();

  const fetchExams = async () => {
    const response = await axios.get("/api/exam/all");
    setExams(response.data.exams);
  };

  React.useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteExam = async (examId: string) => {
    const response = await axios.delete("/api/exam", {
      data: { examId },
    });

    if (response.status === 200) {
      toast({
        title: "Prova deletada com sucesso",
      });
    } else {
      toast({
        title: "Falha ao deletar prova",
        description: response.data.message,
      });
    }
    fetchExams();
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Minhas Provas"
        text="Gerencie suas provas e acompanhe o desempenho dos seus alunos."
      />

      <Card className="col-span-4">
        <CardHeader></CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título da Prova</TableHead>
                  <TableHead>Questões</TableHead>
                  <TableHead>Criada</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.questions.length}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(exam.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(exam.updatedAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" asChild>
                              <Link href={`/dashboard/exams/${exam._id}`}>
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">Visualizar</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar Prova</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar Prova</TooltipContent>
                        </Tooltip>

                        {/* <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Duplicar</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicar Prova</TooltipContent>
                        </Tooltip> */}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ExamShareButton examId={exam._id} />
                          </TooltipTrigger>
                          <TooltipContent>Compartilhar Prova</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteExam(exam._id)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir Prova</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-1 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold">Nenhuma prova criada ainda</h3>
                <p className="text-sm text-muted-foreground">
                  Crie sua primeira prova para começar.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

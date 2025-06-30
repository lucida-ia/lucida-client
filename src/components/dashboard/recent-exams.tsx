"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Trash, Copy, Link } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DBExam } from "@/types/exam";
import axios from "axios";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";
import { ExamShareButton } from "../exam/exam-share-button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function RecentExams() {
  const [exams, setExams] = React.useState<any[]>([]);
  const router = useRouter();

  const fetchExams = async () => {
    const response = await axios.get("/api/exam/recent");

    setExams(response.data.data);
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
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Provas Recentes</CardTitle>
        <CardDescription>
          Você criou {exams?.length} provas no total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exams?.length > 0 ? (
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
                  <TableCell>{exam?.questions.length}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(exam?.createdAt, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(exam?.updatedAt, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              router.push(`/dashboard/exams/${exam?._id}`)
                            }
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">Visualizar</span>
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
                          <ExamShareButton examId={exam?._id} />
                        </TooltipTrigger>
                        <TooltipContent>Compartilhar Prova</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteExam(exam?._id)}
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
  );
}

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
import { FileText, Download, Trash, Copy, Link, Loader2 } from "lucide-react";
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
import { Skeleton } from "../ui/skeleton";
import { exportExamToWord } from "@/lib/word-export";

interface RecentExamsProps {
  onExamDeleted?: () => void;
}

export function RecentExams({ onExamDeleted }: RecentExamsProps) {
  const [exams, setExams] = React.useState<DBExam[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [downloadingExamId, setDownloadingExamId] = React.useState<string | null>(null);
  const router = useRouter();

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/exam/recent");
      setExams(response.data.data);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteExam = async (examId: string) => {
    try {
      await axios.delete("/api/exam", {
        data: { examId },
      });
      setExams(exams.filter((exam) => exam._id !== examId));
      toast({
        title: "Prova deletada com sucesso",
      });
      onExamDeleted?.();
    } catch (error) {
      toast({
        title: "Erro ao deletar prova",
        description: "Não foi possível deletar a prova. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExam = async (exam: DBExam) => {
    try {
      setDownloadingExamId(exam._id);
      await exportExamToWord(exam, false);
      toast({
        title: "Documento Word exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Erro ao exportar documento",
        description: "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDownloadingExamId(null);
    }
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Provas Recentes</CardTitle>
        <CardDescription>
          {exams?.length > 0
            ? `Você criou ${exams?.length} prova${
                exams?.length > 1 ? "s" : ""
              } nos últimos 30 dias.`
            : "Nenhuma prova criada nos últimos 30 dias."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : exams?.length > 0 ? (
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownloadExam(exam)}
                            disabled={downloadingExamId === exam._id}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {downloadingExamId === exam._id ? "Baixando..." : "Baixar Prova"}
                        </TooltipContent>
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

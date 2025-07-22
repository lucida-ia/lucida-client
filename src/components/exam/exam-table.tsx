"use client";

import { DBClass, DBExam } from "@/types/exam";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { Button } from "../ui/button";
import { TooltipTrigger } from "../ui/tooltip";
import { TooltipContent } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";
import { Download, FileText, Trash, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { exportExamToWord } from "@/lib/word-export";
import { useState } from "react";
import { ExamSecurityConfigModal } from "./exam-security-config-modal";

export function ExamTable({
  exams,
  fetchExams,
}: {
  exams: DBExam[];
  fetchExams: () => void;
}) {
  const { toast } = useToast();
  const [exportingExamId, setExportingExamId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareExamId, setShareExamId] = useState<string | null>(null);

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

  const handleExportWord = async (exam: DBExam) => {
    try {
      setExportingExamId(exam._id);
      await exportExamToWord(exam, false);
      toast({
        title: "Documento Word exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Erro ao exportar documento",
        description:
          "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingExamId(null);
    }
  };

  const handleShareExam = (examId: string) => {
    setShareExamId(examId);
    setShareModalOpen(true);
  };

  return (
    <>
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
          {exams?.map((exam) => (
            <TableRow key={exam?._id}>
              <TableCell className="font-medium">{exam?.title}</TableCell>
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
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportWord(exam)}
                        disabled={exportingExamId === exam._id}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download Word</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {exportingExamId === exam._id
                        ? "Gerando Word..."
                        : "Download Word"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShareExam(exam._id)}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Compartilhar</span>
                      </Button>
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

      {shareExamId && (
        <ExamSecurityConfigModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          examId={shareExamId}
        />
      )}
    </>
  );
}

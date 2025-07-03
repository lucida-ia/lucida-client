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
import { exportExamToPDF } from "@/lib/pdf-export";
import { useState } from "react";

export function ExamTable({
  exams,
  fetchExams,
}: {
  exams: DBExam[];
  fetchExams: () => void;
}) {
  const { toast } = useToast();
  const [exportingExamId, setExportingExamId] = useState<string | null>(null);
  const [sharingExamId, setSharingExamId] = useState<string | null>(null);

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

  const handleExportPDF = async (exam: DBExam) => {
    try {
      setExportingExamId(exam._id);
      await exportExamToPDF(exam, false);
      toast({
        title: "PDF exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingExamId(null);
    }
  };

  const handleShareExam = async (examId: string) => {
    try {
      setSharingExamId(examId);
      const response = await axios.post("/api/exam/share", { examId });

      const shareUrl = `${window.location.origin}/exam/${response.data.id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Link da Prova Copiado!",
        description: "O link da prova foi copiado, agora só compartilhar.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar link de compartilhamento",
      });
    } finally {
      setSharingExamId(null);
    }
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
                        onClick={() => handleExportPDF(exam)}
                        disabled={exportingExamId === exam._id}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download PDF</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {exportingExamId === exam._id
                        ? "Gerando PDF..."
                        : "Download PDF"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShareExam(exam._id)}
                        disabled={sharingExamId === exam._id}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Compartilhar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sharingExamId === exam._id
                        ? "Compartilhando..."
                        : "Compartilhar Prova"}
                    </TooltipContent>
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
    </>
  );
}

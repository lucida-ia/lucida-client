"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, CheckCircle, Share2 } from "lucide-react";
import { DBExam } from "@/types/exam";
import { exportExamToWord } from "@/lib/word-export";
import { useToast } from "@/hooks/use-toast";
import { ExamSecurityConfigModal } from "./exam-security-config-modal";

interface ExamExportButtonProps {
  exam: DBExam;
}

export function ExamExportButton({ exam }: ExamExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async (includeAnswers: boolean) => {
    try {
      setIsExporting(true);
      await exportExamToWord(exam, includeAnswers);
      toast({
        title: "Documento Word exportado com sucesso!",
        description: includeAnswers
          ? "O gabarito foi salvo no seu dispositivo."
          : "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Erro ao exportar documento",
        description: "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport(false)}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar Prova
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport(true)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Exportar Gabarito
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExamSecurityConfigModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        examId={exam._id}
      />
    </>
  );
}

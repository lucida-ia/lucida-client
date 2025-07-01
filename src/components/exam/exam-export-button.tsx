"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, CheckCircle } from "lucide-react";
import { DBExam } from "@/types/exam";
import { exportExamToPDF } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";

interface ExamExportButtonProps {
  exam: DBExam;
}

export function ExamExportButton({ exam }: ExamExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (includeAnswers: boolean) => {
    try {
      setIsExporting(true);
      await exportExamToPDF(exam, includeAnswers);
      toast({
        title: "PDF exportado com sucesso!",
        description: includeAnswers
          ? "O gabarito foi salvo no seu dispositivo."
          : "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

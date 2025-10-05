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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, FileText, CheckCircle, Share2 } from "lucide-react";
import { DBExam } from "@/types/exam";
import { exportExamToWord, exportSimplifiedGabarito } from "@/lib/word-export";
import { useToast } from "@/hooks/use-toast";
import { ExamSecurityConfigContent } from "./exam-security-config-modal";

interface ExamExportButtonProps {
  exam: DBExam;
}

export function ExamExportButton({ exam }: ExamExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (exportType: "exam" | "gabarito") => {
    try {
      setIsExporting(true);

      // Close dropdown and yield frame to prevent UI from feeling frozen [[memory:7221770]]
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (exportType === "gabarito") {
        await exportSimplifiedGabarito(exam);
        toast({
          title: "Gabarito exportado com sucesso!",
          description: "O gabarito foi salvo no seu dispositivo.",
        });
      } else {
        await exportExamToWord(exam, false);
        toast({
          title: "Prova exportada com sucesso!",
          description: "A prova foi salva no seu dispositivo.",
        });
      }
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Erro ao exportar documento",
        description:
          "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
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
        <DropdownMenuItem onClick={() => handleExport("exam")}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar Prova
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("gabarito")}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Exportar Gabarito
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Link
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-6">
            <ExamSecurityConfigContent examId={exam._id} />
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

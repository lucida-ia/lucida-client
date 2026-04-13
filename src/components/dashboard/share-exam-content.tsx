"use client";

import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
} from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import type { ExamData } from "@/lib/fetch-unified-overview-data";
import type { ToastProps } from "@/hooks/use-toast";

interface ShareExamContentProps {
  exam: ExamData;
  toast: (props: ToastProps) => void;
}

export function ShareExamContent({ exam, toast }: ShareExamContentProps) {
  const [config, setConfig] = React.useState({
    allowConsultation: false,
    showScoreAtEnd: true,
    showCorrectAnswersAtEnd: false,
  });
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleConfigChange = (key: string, value: boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const encodeConfig = (cfg: typeof config): string => {
    const configString = JSON.stringify(cfg);
    return btoa(configString);
  };

  const shareOrCopyLink = async (
    shareUrl: string
  ): Promise<{ success: boolean; method: string }> => {
    if (
      navigator.share &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({
          title: exam.title,
          text: "Acesse esta prova:",
          url: shareUrl,
        });
        return { success: true, method: "share" };
      } catch (err) {
        console.warn("Web Share API failed:", err);
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, method: "clipboard" };
      } catch (err) {
        console.warn("Modern clipboard API failed:", err);
      }
    }

    try {
      const activeElement = document.activeElement as HTMLElement;

      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (activeElement && typeof activeElement.focus === "function") {
        activeElement.focus();
      }

      if (successful) {
        return { success: true, method: "execCommand" };
      }
    } catch (err) {
      console.error("Fallback clipboard failed:", err);
    }

    return { success: false, method: "none" };
  };

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);

      const response = await axios.post("/api/exam/share", {
        examId: exam._id,
      });
      const encodedConfig = encodeConfig(config);
      const shareUrl = `${window.location.origin}/exam/${response.data.id}?c=${encodedConfig}`;

      const result = await shareOrCopyLink(shareUrl);

      if (result.success) {
        if (result.method === "share") {
          toast({
            title: "Compartilhado!",
            description: "Use as opções do sistema para enviar o link.",
          });
        } else {
          toast({
            title: "Link copiado!",
            description: "O link foi copiado para a área de transferência.",
          });
        }
      } else {
        toast({
          title: "Link da Prova Gerado!",
          description: `Link: ${shareUrl}`,
          duration: 15000,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar link de compartilhamento",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-zinc-100">
          {exam.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Configure as opções de segurança antes de compartilhar esta prova.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Permitir consulta durante a prova
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Alunos podem acessar materiais de apoio durante a realização
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowConsultation}
              onChange={(e) =>
                handleConfigChange("allowConsultation", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Mostrar pontuação ao final</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Exibir a nota final para o aluno após completar a prova
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.showScoreAtEnd}
              onChange={(e) =>
                handleConfigChange("showScoreAtEnd", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Mostrar respostas corretas ao final
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Revelar as respostas corretas após a conclusão da prova
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCorrectAnswersAtEnd}
              onChange={(e) =>
                handleConfigChange("showCorrectAnswersAtEnd", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end pt-4 border-t">
        <DialogClose asChild>
          <Button variant="outline" disabled={isGenerating}>
            Cancelar
          </Button>
        </DialogClose>
        <Button
          onClick={handleGenerateLink}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Gerando Link...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Gerar Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

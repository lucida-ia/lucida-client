"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface ExamSecurityConfig {
  allowConsultation: boolean;
  showScoreAtEnd: boolean;
  showCorrectAnswersAtEnd: boolean;
}

interface ExamSecurityConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

export function ExamSecurityConfigModal({
  open,
  onOpenChange,
  examId,
}: ExamSecurityConfigModalProps) {
  const [config, setConfig] = useState<ExamSecurityConfig>({
    allowConsultation: false,
    showScoreAtEnd: true,
    showCorrectAnswersAtEnd: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfigChange = (
    key: keyof ExamSecurityConfig,
    value: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const encodeConfig = (config: ExamSecurityConfig): string => {
    const configString = JSON.stringify(config);
    return btoa(configString);
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/exam/share", { examId });

      // Encode the configuration as base64
      const encodedConfig = encodeConfig(config);
      const shareUrl = `${window.location.origin}/exam/${response.data.id}?c=${encodedConfig}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Link da Prova Copiado!",
        description:
          "O link da prova foi copiado com as configurações de segurança aplicadas.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar link de compartilhamento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Segurança</DialogTitle>
          <DialogDescription>
            Configure as opções de segurança para o compartilhamento da prova.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowConsultation"
              checked={config.allowConsultation}
              onCheckedChange={(checked) =>
                handleConfigChange("allowConsultation", checked as boolean)
              }
            />
            <Label
              htmlFor="allowConsultation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Permitir Consulta
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6 -mt-2">
            Permite que os alunos consultem materiais durante a prova
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showScoreAtEnd"
              checked={config.showScoreAtEnd}
              onCheckedChange={(checked) =>
                handleConfigChange("showScoreAtEnd", checked as boolean)
              }
            />
            <Label
              htmlFor="showScoreAtEnd"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mostrar Nota no Final
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6 -mt-2">
            Exibe a pontuação final após a conclusão da prova
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="showCorrectAnswersAtEnd"
              checked={config.showCorrectAnswersAtEnd}
              onCheckedChange={(checked) =>
                handleConfigChange(
                  "showCorrectAnswersAtEnd",
                  checked as boolean
                )
              }
            />
            <Label
              htmlFor="showCorrectAnswersAtEnd"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mostrar Respostas Corretas no Final
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6 -mt-2">
            Mostra as respostas corretas após a finalização da prova
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Gerando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

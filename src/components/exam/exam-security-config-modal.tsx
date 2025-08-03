"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check } from "lucide-react";
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
  const [examTitle, setExamTitle] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const { toast } = useToast();

  // Fetch exam data when modal opens
  useEffect(() => {
    if (open && examId) {
      const fetchExamData = async () => {
        try {
          const response = await axios.get(`/api/exam/${examId}`);
          if (response.data.status === "success") {
            setExamTitle(response.data.exam.title);
          }
        } catch (error) {
          console.error("Error fetching exam data:", error);
        }
      };
      fetchExamData();
    }
  }, [open, examId]);

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

  const shareOrCopyLink = async (shareUrl: string): Promise<{ success: boolean; method: string }> => {
    // Try Web Share API first (works great on Safari mobile)
    if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: examTitle,
          text: 'Acesse esta prova:',
          url: shareUrl,
        });
        return { success: true, method: 'share' };
      } catch (err) {
        // User cancelled share or API failed
        console.warn('Web Share API failed:', err);
      }
    }

    // Try clipboard API with immediate execution (preserves user gesture)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, method: 'clipboard' };
      } catch (err) {
        console.warn('Modern clipboard API failed:', err);
      }
    }

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return { success: true, method: 'execCommand' };
      }
    } catch (err) {
      console.error('Fallback clipboard failed:', err);
    }

    return { success: false, method: 'none' };
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      
      // Generate the share URL first
      const response = await axios.post("/api/exam/share", { examId });
      const encodedConfig = encodeConfig(config);
      const shareUrl = `${window.location.origin}/exam/${response.data.id}?c=${encodedConfig}`;

      // Try to share or copy immediately (preserves user gesture)
      const result = await shareOrCopyLink(shareUrl);

      if (result.success) {
        if (result.method === 'share') {
          toast({
            title: "Prova Compartilhada!",
            description: "O link da prova foi compartilhado com sucesso.",
          });
        } else {
          toast({
            title: "Link da Prova Copiado!",
            description: "O link da prova foi copiado com as configurações de segurança aplicadas.",
          });
        }
        onOpenChange(false);
      } else {
        // Show modal with selectable link if all methods fail
        setShareUrl(shareUrl);
        setShowUrlModal(true);
      }
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Share2 className="h-5 w-5 text-foreground" />
            Compartilhar Prova
          </DialogTitle>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-foreground">{examTitle}</h3>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Configure as opções de segurança antes de compartilhar esta prova.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Permitir consulta durante a prova */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-1">
              <Label
                htmlFor="allowConsultation"
                className="text-sm font-medium leading-none cursor-pointer text-foreground"
              >
                Permitir consulta durante a prova
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Alunos podem acessar materiais de apoio durante a realização
              </p>
            </div>
            <Switch
              id="allowConsultation"
              checked={config.allowConsultation}
              onCheckedChange={(checked) =>
                handleConfigChange("allowConsultation", checked)
              }
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
            />
          </div>

          {/* Mostrar pontuação ao final */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-1">
              <Label
                htmlFor="showScoreAtEnd"
                className="text-sm font-medium leading-none cursor-pointer text-foreground"
              >
                Mostrar pontuação ao final
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Exibir a nota final para o aluno após completar a prova
              </p>
            </div>
            <Switch
              id="showScoreAtEnd"
              checked={config.showScoreAtEnd}
              onCheckedChange={(checked) =>
                handleConfigChange("showScoreAtEnd", checked)
              }
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
            />
          </div>

          {/* Mostrar respostas corretas ao final */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-1">
              <Label
                htmlFor="showCorrectAnswersAtEnd"
                className="text-sm font-medium leading-none cursor-pointer text-foreground"
              >
                Mostrar respostas corretas ao final
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Revelar as respostas corretas após a conclusão da prova
              </p>
            </div>
            <Switch
              id="showCorrectAnswersAtEnd"
              checked={config.showCorrectAnswersAtEnd}
              onCheckedChange={(checked) =>
                handleConfigChange("showCorrectAnswersAtEnd", checked)
              }
              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Share2 className="h-4 w-4" />
            {isLoading ? "Gerando..." : "Gerar Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Fallback URL Modal */}
    <Dialog open={showUrlModal} onOpenChange={setShowUrlModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Link da Prova Gerado
          </DialogTitle>
          <DialogDescription>
            Copie o link abaixo para compartilhar a prova:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: "Copiado!",
                    description: "Link copiado para a área de transferência.",
                  });
                  setShowUrlModal(false);
                } catch {
                  // If clipboard still fails, just select the text
                  const input = document.querySelector('input[readonly]') as HTMLInputElement;
                  if (input) {
                    input.select();
                    input.setSelectionRange(0, 99999);
                  }
                }
              }}
              variant="outline"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Toque no campo acima para selecionar todo o link, depois use Ctrl+C (ou Cmd+C no Mac) para copiar.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => setShowUrlModal(false)} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

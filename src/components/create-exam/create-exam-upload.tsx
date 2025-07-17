"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { File, X, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadArea from "../ui/upload-area";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";

const TOTAL_TOKEN_LIMIT = 500000; // máximo total de tokens para todos os arquivos

// Plan limits - keep in sync with backend
const PLAN_LIMITS = {
  trial: 3,
  "semi-annual": 10,
  annual: 30,
  custom: -1, // unlimited
};

interface CreateExamUploadProps {
  uploadedFiles: File[];
  onFilesUploaded: (files: File[]) => void;
}

export function CreateExamUpload({
  uploadedFiles,
  onFilesUploaded,
}: Readonly<CreateExamUploadProps>) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const router = useRouter();

  React.useEffect(() => {
    setFiles(uploadedFiles);
  }, [uploadedFiles]);

  // Check if user has reached their exam limit
  const hasReachedExamLimit = React.useMemo(() => {
    if (!subscription?.usage) return false;

    const plan = subscription.plan || "trial";
    const limit =
      PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.trial;

    // Unlimited plan
    if (limit === -1) return false;

    return subscription.usage.examsThisPeriod >= limit;
  }, [subscription]);

  const getRemainingExams = React.useMemo(() => {
    if (!subscription?.usage) return 0;

    const plan = subscription.plan || "trial";
    const limit =
      PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.trial;

    // Unlimited plan
    if (limit === -1) return -1;

    return Math.max(0, limit - subscription.usage.examsThisPeriod);
  }, [subscription]);

  const handleUpgradeRedirect = () => {
    router.push("/dashboard/billing");
  };

  const validateAndAddFiles = useCallback(
    (newFiles: File[]) => {
      // Block file upload if user has reached exam limit
      if (hasReachedExamLimit) {
        toast({
          variant: "destructive",
          title: "Limite de Provas Atingido",
          description:
            "Você atingiu o limite de provas do seu plano. Faça upgrade para criar mais provas.",
        });
        return;
      }

      const validFileTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      const maxFileSize = 100 * 1024 * 1024; // 100MB - increased limit for larger files

      // Função utilitária simples para estimar tokens a partir do tamanho do arquivo
      // Assume-se ~4 bytes por token como aproximação
      const estimateTokens = (file: File) => Math.ceil(file.size / 4);

      const invalidFiles: string[] = [];
      const validFiles: File[] = [];

      // Calculate current tokens from existing files
      const currentTokens = files.reduce(
        (sum, file) => sum + estimateTokens(file),
        0
      );

      // Check trial user file limit FIRST
      const isTrialUser = subscription?.plan === "trial";
      if (isTrialUser && files.length >= 1) {
        toast({
          variant: "destructive",
          title: "Limite de arquivos para usuários Grátis",
          description:
            "Usuários Grátis podem enviar apenas 1 arquivo. Faça upgrade para enviar mais arquivos.",
        });
        return;
      }

      if (isTrialUser && files.length + newFiles.length > 1) {
        toast({
          variant: "destructive",
          title: "Limite de arquivos para usuários Grátis",
          description:
            "Usuários Grátis podem enviar apenas 1 arquivo. Faça upgrade para enviar mais arquivos.",
        });
        return;
      }

      newFiles.forEach((file) => {
        if (!validFileTypes.includes(file.type)) {
          invalidFiles.push(
            `${file.name} (tipo de arquivo inválido - aceita PDF, DOC, DOCX, TXT)`
          );
        } else if (file.size > maxFileSize) {
          invalidFiles.push(`${file.name} (excede o limite de 100MB)`);
        } else {
          validFiles.push(file);
        }
      });

      // Check if adding new files would exceed token limit
      const newTokens = validFiles.reduce(
        (sum, file) => sum + estimateTokens(file),
        0
      );
      if (currentTokens + newTokens > TOTAL_TOKEN_LIMIT) {
        toast({
          variant: "destructive",
          title: "Limite de tokens excedido",
          description: `Adicionando estes arquivos excederia o limite de ${TOTAL_TOKEN_LIMIT} tokens (atual: ${currentTokens}, novo: ${newTokens})`,
        });
        return;
      }

      if (invalidFiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Arquivos inválidos",
          description: `Não foi possível adicionar: ${invalidFiles.join(", ")}`,
        });
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        const totalTokens = currentTokens + newTokens;
        toast({
          title: "Arquivos adicionados",
          description: `${validFiles.length} arquivo(s) adicionado(s) (≈${totalTokens} tokens total)`,
        });
      }
    },
    [subscription, files, toast, hasReachedExamLimit]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles);
    },
    [validateAndAddFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        validateAndAddFiles(selectedFiles);
        // Clear the input value to allow re-uploading the same file
        e.target.value = "";
      }
    },
    [validateAndAddFiles]
  );

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleContinue = () => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo adicionado",
        description: "Por favor, envie pelo menos um arquivo para continuar.",
      });
      return;
    }

    // Double-check exam limit before continuing
    if (hasReachedExamLimit) {
      toast({
        variant: "destructive",
        title: "Limite de Provas Atingido",
        description:
          "Você atingiu o limite de provas do seu plano. Faça upgrade para criar mais provas.",
      });
      return;
    }

    onFilesUploaded(files);
  };

  // Show loading state while subscription is loading
  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  // Show exam limit reached message
  if (hasReachedExamLimit) {
    const currentPlan = subscription?.plan || "trial";
    const currentLimit =
      PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.trial;

    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 dark:border-red-800">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* Icon with background */}
              <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">
                  Limite de Provas Atingido
                </h3>
                <div className="space-y-2">
                  <p className="text-red-600 dark:text-red-300 font-medium">
                    Você já criou {currentLimit} prova
                    {currentLimit > 1 ? "s" : ""} este período
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Para continuar criando provas e ter acesso a todos os
                    recursos premium, faça upgrade do seu plano.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-center space-y-2">
                <Button
                  size="sm"
                  onClick={handleUpgradeRedirect}
                  className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 text-white dark:from-white dark:to-gray-200 dark:hover:from-gray-100 dark:hover:to-gray-300 dark:text-black font-medium"
                >
                  Fazer Upgrade Agora!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show exam limit warning for users close to limit */}
      {getRemainingExams !== -1 && getRemainingExams <= 2 && (
        <Alert className="bg-yellow-50 border-yellow-200 items-start dark:bg-yellow-950 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            <strong>Atenção:</strong> Você tem apenas {getRemainingExams}{" "}
            prova(s) restante(s) em seu plano atual. Considere fazer upgrade
            para criar mais provas.
          </AlertDescription>
        </Alert>
      )}

      <UploadArea
        isDragging={isDragging}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleFileInput={handleFileInput}
      />

      {files.length > 0 && (
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <h3 className="text-lg font-medium mb-2">
              Arquivos Enviados ({files.length})
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Total: ≈
              {files.reduce((sum, file) => sum + Math.ceil(file.size / 4), 0)}{" "}
              tokens de {TOTAL_TOKEN_LIMIT} permitidos
            </p>
            <ul className="space-y-2 md:space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border p-3 gap-3 sm:gap-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB • ≈
                        {Math.ceil(file.size / 4)} tokens
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="self-end sm:self-center flex-shrink-0 touch-manipulation"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remover arquivo</span>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {subscription?.plan === "trial" && (
        <Alert className="bg-orange-50 border-orange-200 items-start dark:bg-orange-950 dark:border-orange-800">
          <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            <strong>Sem plano ativo:</strong> Você pode enviar apenas 1 arquivo.
            Faça upgrade para enviar múltiplos arquivos e ter acesso completo à
            plataforma.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-50 border-blue-200 items-start dark:bg-blue-950 dark:border-blue-800">
        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          Seus arquivos serão usados apenas para gerar questões da prova e não
          serão compartilhados ou armazenados permanentemente.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          className="w-full sm:w-auto touch-manipulation"
        >
          <span className="hidden sm:inline">
            Continuar para Personalização
          </span>
          <span className="sm:hidden">Continuar</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

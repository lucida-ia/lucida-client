"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  File,
  X,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  HardDrive,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadArea from "../ui/upload-area";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";

const TOTAL_TOKEN_LIMIT = 500000; // máximo total de tokens para todo o material
const API_URL = 
"https://lucida-api-production.up.railway.app"
  // "http://localhost:8080";

// Plan limits - keep in sync with backend
const PLAN_LIMITS = {
  trial: 3,
  monthly: 10,
  "semi-annual": 10,
  annual: 10,
  custom: -1, // unlimited
  admin: -1, // unlimited
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
  const [fileTokens, setFileTokens] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const router = useRouter();

  React.useEffect(() => {
    setFiles(uploadedFiles);
  }, [uploadedFiles]);

  // Always fetch token counts for files that don't have them yet
  React.useEffect(() => {
    const missing = files.filter((f) => fileTokens[f.name] == null);
    if (missing.length === 0) return;
    (async () => {
      try {
        const formData = new FormData();
        missing.forEach((f) => formData.append("files", f));
        const res = await fetch(`${API_URL}/ai-ops/count-tokens`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: any = await res.json();
        const results: any[] = Array.isArray(data?.files) ? data.files : [];

        const normalize = (s: string) =>
          String(s)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const nameToTokens: Record<string, number> = {};
        for (const r of results) {
          if (r?.success) nameToTokens[normalize(r.fileName)] = Number(r.tokens);
        }

        const merged: Record<string, number> = {};
        missing.forEach((f) => {
          const key = normalize(f.name);
          if (nameToTokens[key] != null) merged[f.name] = nameToTokens[key];
        });

        // Fallback by order if name normalization still fails
        if (Object.keys(merged).length < missing.length) {
          const successTokens = results
            .filter((r) => r?.success)
            .map((r) => Number(r.tokens));
          let idx = 0;
          for (const f of missing) {
            if (merged[f.name] == null && idx < successTokens.length) {
              merged[f.name] = successTokens[idx++];
            } else if (merged[f.name] != null) {
              idx++;
            }
          }
        }

        if (Object.keys(merged).length > 0) {
          setFileTokens((prev) => ({ ...prev, ...merged }));
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Falha ao analisar conteúdo",
          description:
            "Não foi possível analisar o conteúdo no servidor. Exibindo estimativa pelo tamanho do arquivo.",
        });
      }
    })();
  }, [files, fileTokens, toast]);

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

  // Calculate upload progress metrics
  const uploadMetrics = React.useMemo(() => {
    const estimateTokens = (file: File) => Math.ceil(file.size / 4);
    const tokenFor = (file: File) => fileTokens[file.name] ?? estimateTokens(file);
    const totalTokensUsed = files.reduce(
      (sum, file) => sum + tokenFor(file),
      0
    );
    const usagePercentage = Math.round(
      (totalTokensUsed / TOTAL_TOKEN_LIMIT) * 100
    );
    const totalSizeMB =
      files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

    return {
      totalTokensUsed,
      usagePercentage: Math.min(usagePercentage, 100),
      totalSizeMB,
      remainingTokens: Math.max(0, TOTAL_TOKEN_LIMIT - totalTokensUsed),
    };
  }, [files, fileTokens]);

  // Get progress bar color based on usage
  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return "bg-green-500 dark:bg-green-600";
    if (percentage < 85) return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-red-500 dark:bg-red-600";
  };

  const validateAndAddFiles = useCallback(
    async (newFiles: File[]) => {
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

      // Função utilitária simples para estimar tokens a partir do tamanho do arquivo (fallback)
      // Assume-se ~4 bytes por token como aproximação
      const estimateTokens = (file: File) => Math.ceil(file.size / 4);

      const invalidFiles: string[] = [];
      const validFiles: File[] = [];

      // Calculate current tokens from existing files, preferindo valores do servidor
      const currentTokens = files.reduce(
        (sum, file) => sum + (fileTokens[file.name] ?? estimateTokens(file)),
        0
      );

      // Check trial user file limit FIRST
      const isTrialUser = subscription?.plan === "trial";
      if (isTrialUser && files.length >= 1) {
        toast({
          variant: "destructive",
          title: "Limite de material para usuários Grátis",
          description:
            "Usuários Grátis podem enviar apenas 1 material. Faça upgrade para enviar mais materiais.",
        });
        return;
      }

      if (isTrialUser && files.length + newFiles.length > 1) {
        toast({
          variant: "destructive",
          title: "Limite de material para usuários Grátis",
          description:
            "Usuários Grátis podem enviar apenas 1 material. Faça upgrade para enviar mais materiais.",
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

      // Preferir contagem de tokens do servidor para os novos arquivos
      let newTokens = 0;
      let newTokenMap: Record<string, number> = {};
      if (validFiles.length > 0) {
        try {
          const formData = new FormData();
          validFiles.forEach((f) => formData.append("files", f));
          const res = await fetch(`${API_URL}/ai-ops/count-tokens`, {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data: any = await res.json();
            const results: any[] = Array.isArray(data?.files) ? data.files : [];

            const normalize = (s: string) =>
              String(s)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            // First pass: map by normalized filename
            const nameToTokens: Record<string, number> = {};
            for (const r of results) {
              if (r?.success) {
                nameToTokens[normalize(r.fileName)] = Number(r.tokens);
              }
            }

            validFiles.forEach((f) => {
              const key = normalize(f.name);
              if (nameToTokens[key] != null) {
                newTokenMap[f.name] = nameToTokens[key];
              }
            });

            // Second pass: fill any remaining by index order of successes
            const successTokens = results
              .filter((r) => r?.success)
              .map((r) => Number(r.tokens));
            let idx = 0;
            for (const f of validFiles) {
              if (newTokenMap[f.name] == null && idx < successTokens.length) {
                newTokenMap[f.name] = successTokens[idx++];
              } else if (newTokenMap[f.name] != null) {
                idx++;
              }
            }

            newTokens = validFiles.reduce(
              (sum, f) => sum + (newTokenMap[f.name] ?? estimateTokens(f)),
              0
            );
          } else {
            newTokens = validFiles.reduce((sum, f) => sum + estimateTokens(f), 0);
          }
        } catch {
          newTokens = validFiles.reduce((sum, f) => sum + estimateTokens(f), 0);
        }
      }

      if (currentTokens + newTokens > TOTAL_TOKEN_LIMIT) {
        const newPercentage = Math.round(
          ((currentTokens + newTokens) / TOTAL_TOKEN_LIMIT) * 100
        );
        toast({
          variant: "destructive",
          title: "Limite de conteúdo excedido",
          description: `Adicionando este material excederia o limite de conteúdo (${newPercentage}% do limite)`,
        });
        return;
      }

      if (invalidFiles.length > 0) {
        toast({
          variant: "destructive",
          title: "Material inválido",
          description: `Não foi possível adicionar: ${invalidFiles.join(", ")}`,
        });
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        if (Object.keys(newTokenMap).length > 0) {
          setFileTokens((prev) => ({ ...prev, ...newTokenMap }));
        }
        toast({
          title: "Material adicionado",
          description: `${validFiles.length} arquivo(s) de material adicionado(s) com sucesso`,
        });
      }
    },
    [subscription, files, fileTokens, toast, hasReachedExamLimit]
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
        title: "Nenhum material adicionado",
        description:
          "Por favor, envie pelo menos um material de estudo para continuar.",
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium">
                  Material Enviado ({files.length})
                </h3>
                <p className="text-sm text-muted-foreground">
                  {uploadMetrics.totalSizeMB.toFixed(1)} MB •{" "}
                  {uploadMetrics.usagePercentage}% do limite usado
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-end text-sm">
                <span
                  className={`font-medium ${
                    uploadMetrics.usagePercentage < 60
                      ? "text-green-600 dark:text-green-400"
                      : uploadMetrics.usagePercentage < 85
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {uploadMetrics.usagePercentage}%
                </span>
              </div>
              <div className="relative">
                <div className="h-3 w-full bg-secondary rounded-full">
                  <div
                    className={`h-3 rounded-full transition-all ${getProgressColor(
                      uploadMetrics.usagePercentage
                    )}`}
                    style={{ width: `${uploadMetrics.usagePercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <ul className="space-y-2 md:space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border p-3 gap-3 sm:gap-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB •{" "}
                        {file.type.split("/")[1]?.toUpperCase() || "Arquivo"}
                        {" • ≈"}
                        {Math.round((fileTokens[file.name] ?? Math.ceil(file.size / 4)) * 0.75).toLocaleString()} palavras
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="self-end sm:self-center flex-shrink-0 touch-manipulation hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
            <strong>Sem plano ativo:</strong> Você pode enviar apenas 1
            material. Faça upgrade para enviar múltiplos materiais e ter acesso
            completo à plataforma.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-50 border-blue-200 items-start dark:bg-blue-950 dark:border-blue-800">
        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          Seu material será usado apenas para gerar questões da prova e não será
          compartilhado ou armazenado permanentemente.
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

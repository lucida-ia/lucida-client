"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  File,
  X,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  HardDrive,
  Youtube,
  Plus,
  Loader2,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadArea from "../ui/upload-area";
import { useSubscription } from "@/hooks/use-subscription";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOTAL_TOKEN_LIMIT = 500000;
// const API_URL = "https://lucida-api-production.up.railway.app";
const API_URL = "http://localhost:8080";

// YouTube URL validation function
const isValidYouTubeUrl = (url: string): boolean => {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
  return youtubeRegex.test(url);
};

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
  youtubeUrls?: string[];
  youtubeVideoData?: Record<string, { title?: string; videoId?: string }>;
  onFilesUploaded: (
    files: File[],
    youtubeUrls?: string[],
    youtubeVideoData?: Record<string, { title?: string; videoId?: string }>
  ) => void;
  shouldDisableActions?: boolean;
}

export function CreateExamUpload({
  uploadedFiles,
  youtubeUrls = [],
  youtubeVideoData = {},
  onFilesUploaded,
  shouldDisableActions = false,
}: Readonly<CreateExamUploadProps>) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileTokens, setFileTokens] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrlList, setYoutubeUrlList] = useState<string[]>(youtubeUrls);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [youtubeTokens, setYoutubeTokens] = useState<
    Record<
      string,
      {
        tokens: number;
        loading: boolean;
        error?: string;
        title?: string;
        videoId?: string;
      }
    >
  >(() => {
    const initialData: Record<
      string,
      {
        tokens: number;
        loading: boolean;
        error?: string;
        title?: string;
        videoId?: string;
      }
    > = {};
    Object.keys(youtubeVideoData).forEach((url) => {
      initialData[url] = {
        tokens: 0,
        loading: false,
        title: youtubeVideoData[url]?.title,
        videoId: youtubeVideoData[url]?.videoId,
      };
    });
    return initialData;
  });
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(
    "Processando arquivos..."
  );
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
          if (r?.success)
            nameToTokens[normalize(r.fileName)] = Number(r.tokens);
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

  const fetchYoutubeTranscript = useCallback(
    async (url: string) => {
      try {
        setYoutubeTokens((prev) => ({
          ...prev,
          [url]: { tokens: 0, loading: true },
        }));

        const response = await fetch(
          `${API_URL}/ai-ops/fetch-youtube-transcript`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setYoutubeTokens((prev) => ({
            ...prev,
            [url]: {
              tokens: data.tokens,
              loading: false,
              title: data.title,
              videoId: data.videoId,
            },
          }));
        } else {
          setYoutubeTokens((prev) => ({
            ...prev,
            [url]: {
              tokens: 0,
              loading: false,
              error: data.error,
              title: data.title,
              videoId: data.videoId,
            },
          }));
          toast({
            variant: "destructive",
            title: "Erro ao obter transcrição",
            description:
              data.error || "Não foi possível obter a transcrição do vídeo.",
          });
        }
      } catch (error) {
        setYoutubeTokens((prev) => ({
          ...prev,
          [url]: { tokens: 0, loading: false, error: "Erro de rede" },
        }));
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description:
            "Não foi possível conectar ao servidor para obter a transcrição.",
        });
      }
    },
    [toast]
  );

  // Fetch transcripts for existing YouTube URLs
  React.useEffect(() => {
    youtubeUrls.forEach((url) => {
      if (!youtubeTokens[url]) {
        fetchYoutubeTranscript(url);
      }
    });
  }, [youtubeUrls, youtubeTokens, fetchYoutubeTranscript]);

  // Calculate upload progress metrics
  const uploadMetrics = React.useMemo(() => {
    const estimateTokens = (file: File) => Math.ceil(file.size / 4);
    const tokenFor = (file: File) =>
      fileTokens[file.name] ?? estimateTokens(file);

    const fileTokensUsed = files.reduce((sum, file) => sum + tokenFor(file), 0);

    const youtubeTokensUsed = youtubeUrlList.reduce(
      (sum, url) => sum + (youtubeTokens[url]?.tokens || 0),
      0
    );

    const totalTokensUsed = fileTokensUsed + youtubeTokensUsed;
    const usagePercentage = Math.round(
      (totalTokensUsed / TOTAL_TOKEN_LIMIT) * 100
    );
    const totalSizeMB =
      files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

    return {
      totalTokensUsed,
      fileTokensUsed,
      youtubeTokensUsed,
      usagePercentage: Math.min(usagePercentage, 100),
      totalSizeMB,
      remainingTokens: Math.max(0, TOTAL_TOKEN_LIMIT - totalTokensUsed),
    };
  }, [files, fileTokens, youtubeUrlList, youtubeTokens]);

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

      // Show loading state for file processing
      setIsProcessingFiles(true);
      setProcessingMessage("Validando arquivos...");

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
        setIsProcessingFiles(false);
        toast({
          variant: "destructive",
          title: "Limite de material para usuários Grátis",
          description:
            "Usuários Grátis podem enviar apenas 1 material. Faça upgrade para enviar mais materiais.",
        });
        return;
      }

      if (isTrialUser && files.length + newFiles.length > 1) {
        setIsProcessingFiles(false);
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
          setProcessingMessage("Subindo arquivo...");
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
            newTokens = validFiles.reduce(
              (sum, f) => sum + estimateTokens(f),
              0
            );
          }
        } catch {
          newTokens = validFiles.reduce((sum, f) => sum + estimateTokens(f), 0);
        }
      }

      if (currentTokens + newTokens > TOTAL_TOKEN_LIMIT) {
        const newPercentage = Math.round(
          ((currentTokens + newTokens) / TOTAL_TOKEN_LIMIT) * 100
        );
        setIsProcessingFiles(false);
        toast({
          variant: "destructive",
          title: "Limite de conteúdo excedido",
          description: `Adicionando este material excederia o limite de conteúdo (${newPercentage}% do limite)`,
        });
        return;
      }

      if (invalidFiles.length > 0) {
        setIsProcessingFiles(false);
        toast({
          variant: "destructive",
          title: "Material inválido",
          description: `Não foi possível adicionar: ${invalidFiles.join(", ")}`,
        });
      }

      if (validFiles.length > 0) {
        setProcessingMessage("Finalizando...");
        setFiles((prev) => [...prev, ...validFiles]);
        if (Object.keys(newTokenMap).length > 0) {
          setFileTokens((prev) => ({ ...prev, ...newTokenMap }));
        }

        // Small delay to ensure state updates before hiding loading
        await new Promise((resolve) => setTimeout(resolve, 300));

        setIsProcessingFiles(false);
        toast({
          title: "Material adicionado",
          description: `${validFiles.length} arquivo(s) de material adicionado(s) com sucesso`,
        });
      } else {
        setIsProcessingFiles(false);
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

  const addYoutubeUrl = async () => {
    // Check if user is on trial plan
    if (subscription?.plan === "trial") {
      toast({
        variant: "destructive",
        title: "Recurso Pro",
        description:
          "As transcrições do YouTube estão disponíveis apenas para usuários Pro. Faça upgrade para desbloquear.",
      });
      return;
    }

    if (!newYoutubeUrl.trim()) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Por favor, insira uma URL do YouTube.",
      });
      return;
    }

    if (!isValidYouTubeUrl(newYoutubeUrl)) {
      toast({
        variant: "destructive",
        title: "URL inválida",
        description: "Por favor, insira uma URL válida do YouTube.",
      });
      return;
    }

    if (youtubeUrlList.includes(newYoutubeUrl)) {
      toast({
        variant: "destructive",
        title: "URL duplicada",
        description: "Esta URL do YouTube já foi adicionada.",
      });
      return;
    }

    const urlToAdd = newYoutubeUrl;
    setYoutubeUrlList((prev) => [...prev, urlToAdd]);
    setNewYoutubeUrl("");

    // Fetch transcript immediately after adding
    await fetchYoutubeTranscript(urlToAdd);
  };

  const removeYoutubeUrl = (indexToRemove: number) => {
    const urlToRemove = youtubeUrlList[indexToRemove];
    setYoutubeUrlList((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );

    // Clean up token data for removed URL
    if (urlToRemove) {
      setYoutubeTokens((prev) => {
        const newTokens = { ...prev };
        delete newTokens[urlToRemove];
        return newTokens;
      });
    }
  };

  const handleContinue = () => {
    if (files.length === 0 && youtubeUrlList.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum material adicionado",
        description:
          "Por favor, envie pelo menos um arquivo ou URL do YouTube para continuar.",
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

    // Extract video data for passing to parent
    const videoData: Record<string, { title?: string; videoId?: string }> = {};
    youtubeUrlList.forEach((url) => {
      if (youtubeTokens[url]?.title || youtubeTokens[url]?.videoId) {
        videoData[url] = {
          title: youtubeTokens[url].title,
          videoId: youtubeTokens[url].videoId,
        };
      }
    });

    onFilesUploaded(files, youtubeUrlList, videoData);
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
    <div className="space-y-8">
      {/* Loading Modal for File Processing */}
      <Dialog open={isProcessingFiles} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Processando Arquivos</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="relative">
              <div className="p-4 bg-primary/10 rounded-full mb-6">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold">Enviando Material</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {processingMessage}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-semibold tracking-tight">
              Adicionar Material de Estudo
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Envie arquivos PDF, DOC, DOCX ou TXT
            </p>
          </div>
        </div>

        <UploadArea
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleFileInput={handleFileInput}
          disabled={shouldDisableActions}
        />

        {!shouldDisableActions && subscription?.plan === "trial" && (
          <Alert className="bg-orange-50 border-orange-200 items-start dark:bg-orange-950/50 dark:border-orange-800 rounded-xl">
            <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <AlertDescription className="text-sm text-orange-700 dark:text-orange-400">
              <strong className="font-semibold">Plano Gratuito:</strong> Você
              pode enviar apenas 1 material. Faça upgrade para enviar múltiplos
              materiais e ter acesso completo à plataforma.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-muted-foreground font-medium">
            ou
          </span>
        </div>
      </div>

      {/* YouTube Section */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                <Youtube className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold tracking-tight">
                  Vídeos do YouTube
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Adicione URLs de vídeos para extrair transcrições
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                placeholder="Cole a URL do vídeo do YouTube aqui..."
                value={newYoutubeUrl}
                onChange={(e) => setNewYoutubeUrl(e.target.value)}
                disabled={shouldDisableActions}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addYoutubeUrl();
                  }
                }}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
              />
              <Button
                onClick={addYoutubeUrl}
                disabled={shouldDisableActions}
                size="icon"
                className="h-11 w-11 rounded-xl"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* YouTube URLs List */}
            {youtubeUrlList.length > 0 && (
              <ul className="space-y-2 md:space-y-3">
                {youtubeUrlList.map((url, index) => (
                  <li
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border p-3 gap-3 sm:gap-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {youtubeTokens[url]?.loading ? (
                        <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-spin" />
                      ) : youtubeTokens[url]?.error ? (
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      ) : (
                        <Youtube className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {youtubeTokens[url]?.loading
                            ? "Carregando..."
                            : youtubeTokens[url]?.title
                            ? youtubeTokens[url].title
                            : url}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {youtubeTokens[url]?.loading ? (
                            "Obtendo informações do vídeo..."
                          ) : youtubeTokens[url]?.error ? (
                            <span className="text-red-600 dark:text-red-400">
                              {youtubeTokens[url].error}
                            </span>
                          ) : youtubeTokens[url]?.tokens ? (
                            `≈${Math.round(
                              youtubeTokens[url].tokens * 0.75
                            ).toLocaleString()} palavras • ${youtubeTokens[
                              url
                            ].tokens.toLocaleString()} tokens`
                          ) : (
                            "Vídeo do YouTube"
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeYoutubeUrl(index)}
                      disabled={shouldDisableActions}
                      className="self-end sm:self-center flex-shrink-0 touch-manipulation hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remover URL</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Materials Summary */}
      {(files.length > 0 || youtubeUrlList.length > 0) && (
        <>
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Summary Header */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold tracking-tight">
                      Materiais Adicionados
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {files.length + youtubeUrlList.length} item
                      {files.length + youtubeUrlList.length !== 1
                        ? "ns"
                        : ""}{" "}
                      {files.length > 0 &&
                        `• ${uploadMetrics.totalSizeMB.toFixed(1)} MB`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Uso do limite de conteúdo
                    </span>
                    <span
                      className={`text-sm font-semibold ${
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
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(
                          uploadMetrics.usagePercentage
                        )}`}
                        style={{ width: `${uploadMetrics.usagePercentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploadMetrics.totalTokensUsed.toLocaleString()} de{" "}
                    {TOTAL_TOKEN_LIMIT.toLocaleString()} tokens utilizados
                  </p>
                </div>

                {/* Files List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Arquivos ({files.length})
                    </h4>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li
                          key={index}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-4 gap-3 sm:gap-0 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                              <File className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {(file.size / 1024 / 1024).toFixed(1)} MB • ≈
                                {Math.round(
                                  (fileTokens[file.name] ??
                                    Math.ceil(file.size / 4)) * 0.75
                                ).toLocaleString()}{" "}
                                palavras
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="self-end sm:self-center flex-shrink-0 h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover arquivo</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* YouTube Videos List */}
                {youtubeUrlList.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Vídeos do YouTube ({youtubeUrlList.length})
                    </h4>
                    <ul className="space-y-2">
                      {youtubeUrlList.map((url, index) => (
                        <li
                          key={index}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-4 gap-3 sm:gap-0 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg flex-shrink-0">
                              {youtubeTokens[url]?.loading ? (
                                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                              ) : youtubeTokens[url]?.error ? (
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                              ) : (
                                <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {youtubeTokens[url]?.loading
                                  ? "Carregando..."
                                  : youtubeTokens[url]?.title
                                  ? youtubeTokens[url].title
                                  : url}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {youtubeTokens[url]?.loading ? (
                                  "Obtendo informações do vídeo..."
                                ) : youtubeTokens[url]?.error ? (
                                  <span className="text-red-600 dark:text-red-400">
                                    {youtubeTokens[url].error}
                                  </span>
                                ) : youtubeTokens[url]?.tokens ? (
                                  `≈${Math.round(
                                    youtubeTokens[url].tokens * 0.75
                                  ).toLocaleString()} palavras • ${youtubeTokens[
                                    url
                                  ].tokens.toLocaleString()} tokens`
                                ) : (
                                  "Vídeo do YouTube"
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeYoutubeUrl(index)}
                            disabled={shouldDisableActions}
                            className="self-end sm:self-center flex-shrink-0 h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover URL</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200 items-start dark:bg-blue-950/50 dark:border-blue-800 rounded-xl">
        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
          Seu material será usado apenas para gerar questões da prova e não será
          compartilhado ou armazenado permanentemente.
        </AlertDescription>
      </Alert>

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinue}
          disabled={shouldDisableActions}
          className="h-11 px-6 rounded-xl font-medium w-full sm:w-auto"
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

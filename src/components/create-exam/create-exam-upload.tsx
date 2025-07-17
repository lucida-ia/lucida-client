"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { File, X, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadArea from "../ui/upload-area";
import { useSubscription } from "@/hooks/use-subscription";

const TOTAL_TOKEN_LIMIT = 500000; // máximo total de tokens para todos os arquivos

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

  React.useEffect(() => {
    setFiles(uploadedFiles);
  }, [uploadedFiles]);

  const validateAndAddFiles = useCallback(
    (newFiles: File[]) => {
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
    [subscription, files, toast]
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

    onFilesUploaded(files);
  };

  return (
    <div className="space-y-6">
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

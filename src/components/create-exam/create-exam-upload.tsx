"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { File, X, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadArea from "../ui/upload-area";

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        validateAndAddFiles(selectedFiles);
        // Clear the input value to allow re-uploading the same file
        e.target.value = '';
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  React.useEffect(() => {
    setFiles(uploadedFiles);
  }, [uploadedFiles]);

  const validateAndAddFiles = (newFiles: File[]) => {
    const validFileTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const maxFileSize = 100 * 1024 * 1024; // 100MB - increased limit for larger files
    const TOKEN_LIMIT = 500000; // máximo aproximado de tokens permitido por arquivo

    // Função utilitária simples para estimar tokens a partir do tamanho do arquivo
    // Assume-se ~4 bytes por token como aproximação
    const estimateTokens = (file: File) => Math.ceil(file.size / 4);

    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    newFiles.forEach((file) => {
      if (!validFileTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (tipo de arquivo inválido - aceita PDF, DOC, DOCX, TXT)`);
      } else if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name} (excede o limite de 100MB)`);
      } else if (estimateTokens(file) > TOKEN_LIMIT) {
        invalidFiles.push(`${file.name} (excede o limite de tokens – aprox. ${estimateTokens(file)} tokens > ${TOKEN_LIMIT})`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Arquivos inválidos",
        description: `Não foi possível adicionar: ${invalidFiles.join(", ")}`,
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast({
        title: "Arquivos adicionados",
        description: `${validFiles.length} arquivo(s) adicionado(s) com sucesso.`,
      });
    }
  };

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
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">
              Arquivos Enviados ({files.length})
            </h3>
            <ul className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
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

      <Alert className="bg-blue-50 border-blue-200 items-center dark:bg-blue-950 dark:border-blue-800">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          Seus arquivos serão usados apenas para gerar questões da prova e não
          serão compartilhados ou armazenados permanentemente.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continuar para Personalização
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

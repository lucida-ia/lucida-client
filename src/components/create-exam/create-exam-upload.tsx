"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { File, X, CheckCircle } from "lucide-react";
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
    const maxFileSize = 100 * 1024 * 1024; // 100MB

    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    newFiles.forEach((file) => {
      if (!validFileTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (invalid file type)`);
      } else if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name} (exceeds 100MB size limit)`);
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

    setFiles((prev) => [...prev, ...validFiles]);
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

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Seus arquivos serão usados apenas para gerar questões da prova e não
          serão compartilhados ou armazenados permanentemente.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>Continuar para Personalização</Button>
      </div>
    </div>
  );
}

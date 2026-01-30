"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraScanner } from "@/components/scan/camera-scanner";
import { ScanResultCard } from "@/components/scan/scan-result-card";
import { ExamSelector } from "@/components/scan/exam-selector";
import {
  Camera,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  BarChart3,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Exam {
  _id: string;
  title: string;
  questionCount: number;
}

interface ScanResult {
  scanId: string;
  studentId: string | null | { value: string | null; isValid?: boolean };
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  imageQuality: string;
  requiresReview: boolean;
  reviewReasons: string[];
  processingTimeMs: number;
}

export default function ScanPage() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);

  // Handle exam selection
  const handleExamSelect = useCallback((examId: string, exam: Exam) => {
    setSelectedExam(exam);
    setScanResults([]);
  }, []);

  // Handle image capture from camera
  const handleCapture = useCallback(
    async (imageBase64: string) => {
      if (!selectedExam) {
        toast.error("Selecione uma prova primeiro");
        return;
      }

      setIsProcessing(true);

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examId: selectedExam._id,
            imageBase64,
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          setScanResults((prev) => [data.scan, ...prev]);
          setShowCamera(false);
          toast.success("Folha de respostas processada com sucesso!");
        } else {
          toast.error(data.message || "Erro ao processar imagem");
        }
      } catch (error) {
        console.error("Scan error:", error);
        toast.error("Erro ao processar a folha de respostas");
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedExam]
  );

  // Handle file upload (alternative to camera)
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !selectedExam) return;

      setIsProcessing(true);

      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string)?.split(",")[1];
          if (!base64) {
            toast.error("Erro ao ler arquivo");
            setIsProcessing(false);
            return;
          }

          await handleCapture(base64);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Erro ao fazer upload da imagem");
        setIsProcessing(false);
      }
    },
    [selectedExam, handleCapture]
  );

  // Delete scan result
  const handleDeleteScan = useCallback((scanId: string) => {
    setScanResults((prev) => prev.filter((s) => s.scanId !== scanId));
    toast.success("Resultado removido");
  }, []);

  // View scan details
  const handleViewScan = useCallback((scanId: string) => {
    // TODO: Implement detail view modal
    toast.info("Detalhes em breve...");
  }, []);

  // Confirm and save all results
  const handleConfirmResults = useCallback(async () => {
    if (scanResults.length === 0) return;

    const approvedScans = scanResults.filter((s) => !s.requiresReview);
    if (approvedScans.length === 0) {
      toast.error("Nenhum resultado aprovado para salvar");
      return;
    }

    try {
      const response = await fetch("/api/scan/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scanIds: approvedScans.map((s) => s.scanId),
          createResults: true,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success(`${data.results.length} resultados salvos com sucesso!`);
        setScanResults([]);
      } else {
        toast.error(data.message || "Erro ao salvar resultados");
      }
    } catch (error) {
      console.error("Confirm error:", error);
      toast.error("Erro ao confirmar resultados");
    }
  }, [scanResults]);

  // Calculate session stats
  const sessionStats = {
    total: scanResults.length,
    approved: scanResults.filter((s) => !s.requiresReview).length,
    needsReview: scanResults.filter((s) => s.requiresReview).length,
    avgScore:
      scanResults.length > 0
        ? scanResults.reduce((sum, s) => sum + s.percentage, 0) / scanResults.length
        : 0,
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Scanner de Folhas de Respostas</h1>
        <p className="text-muted-foreground">
          Digitalize folhas de respostas usando a câmera do seu celular para corrigir provas automaticamente.
        </p>
      </div>

      {/* Exam Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Selecionar Prova
          </CardTitle>
          <CardDescription>
            Escolha a prova para associar às folhas de respostas digitalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamSelector
            selectedExamId={selectedExam?._id || null}
            onSelect={handleExamSelect}
            disabled={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Scan Actions */}
      {selectedExam && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Digitalizar Folhas
            </CardTitle>
            <CardDescription>
              Prova selecionada: <strong>{selectedExam.title}</strong> ({selectedExam.questionCount} questões)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowCamera(true)}
                disabled={isProcessing}
                className="flex-1"
              >
                <Camera className="w-5 h-5 mr-2" />
                Abrir Câmera
              </Button>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    disabled={isProcessing}
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="w-5 h-5 mr-2" />
                      Enviar Imagem
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      {scanResults.length > 0 && (
        <Card className="mb-6 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{sessionStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-apple-green">
                    {sessionStats.approved}
                  </p>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </div>
                {sessionStats.needsReview > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-apple-orange">
                      {sessionStats.needsReview}
                    </p>
                    <p className="text-xs text-muted-foreground">Para revisar</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold">{sessionStats.avgScore.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScanResults([])}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmResults}
                  disabled={sessionStats.approved === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Salvar Resultados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resultados da Sessão
          </h2>
          <div className="grid gap-4">
            {scanResults.map((scan) => (
              <ScanResultCard
                key={scan.scanId}
                scan={scan}
                onView={handleViewScan}
                onDelete={handleDeleteScan}
              />
            ))}
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {showCamera && (
        <CameraScanner
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Instructions */}
      <Card className="mt-8 bg-muted/30 border-none">
        <CardHeader>
          <CardTitle className="text-base">Como usar o scanner</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Selecione a prova que deseja corrigir</p>
          <p>2. Abra a câmera ou envie uma imagem da folha de respostas</p>
          <p>3. Alinhe a folha dentro do quadro de captura</p>
          <p>4. Tire a foto e aguarde o processamento</p>
          <p>5. Revise os resultados e salve quando estiver satisfeito</p>
          <p className="text-xs mt-4">
            <strong>Dica:</strong> Para melhores resultados, use boa iluminação e evite sombras na folha de respostas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

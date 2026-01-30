"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Save,
  User,
  Clock,
  ImageIcon,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuestionResult {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  confidence?: number;
}

interface ScanDetail {
  scanId: string;
  examId: string;
  examTitle: string;
  studentId: {
    value: string | null;
    confidence: number;
    isValid: boolean;
  };
  grading: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    invalidAnswers: number;
    score: number;
    percentage: number;
    questionResults: QuestionResult[];
  };
  answers: {
    questionNumber: number;
    selectedOption: string | null;
    multipleSelections: string[] | null;
    confidence: number;
    isValid: boolean;
  }[];
  imageQuality: string;
  alignmentSuccess: boolean;
  processingTimeMs: number;
  requiresReview: boolean;
  reviewReasons: string[];
  reviewStatus: string;
  scannedAt: string;
}

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;

  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [corrections, setCorrections] = useState<Record<number, string>>({});
  const [studentIdCorrection, setStudentIdCorrection] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Fetch scan details
  const fetchScan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scan/${scanId}`);
      const data = await response.json();

      if (data.status === "success") {
        setScan(data.scan);
        setStudentIdCorrection(data.scan.studentId?.value || "");
      } else {
        toast.error(data.message || "Erro ao carregar digitalização");
        router.push("/dashboard/scan/history");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Erro ao carregar digitalização");
    } finally {
      setLoading(false);
    }
  }, [scanId, router]);

  useEffect(() => {
    fetchScan();
  }, [fetchScan]);

  // Handle correction change
  const handleCorrectionChange = (questionNumber: number, value: string) => {
    setCorrections((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  // Save corrections
  const saveCorrections = async () => {
    if (!scan) return;

    const correctionsList = Object.entries(corrections).map(([qNum, answer]) => ({
      questionNumber: parseInt(qNum),
      correctedAnswer: answer,
    }));

    if (correctionsList.length === 0 && !studentIdCorrection && !reviewNotes) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/scan/${scanId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corrections: correctionsList.length > 0 ? correctionsList : undefined,
          studentIdCorrection:
            studentIdCorrection !== scan.studentId?.value
              ? studentIdCorrection
              : undefined,
          reviewStatus: "corrected",
          notes: reviewNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Correções salvas com sucesso");
        setEditMode(false);
        setCorrections({});
        fetchScan();
      } else {
        toast.error(data.message || "Erro ao salvar correções");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar correções");
    } finally {
      setSaving(false);
    }
  };

  // Get quality badge
  const getQualityBadge = (quality: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      excellent: { color: "bg-apple-green/10 text-apple-green", label: "Excelente" },
      good: { color: "bg-apple-blue/10 text-apple-blue", label: "Boa" },
      fair: { color: "bg-apple-orange/10 text-apple-orange", label: "Regular" },
      poor: { color: "bg-apple-red/10 text-apple-red", label: "Ruim" },
    };
    return variants[quality] || variants.fair;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96 mt-6" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Digitalização não encontrada</h2>
          <Button asChild>
            <Link href="/dashboard/scan/history">Voltar ao histórico</Link>
          </Button>
        </div>
      </div>
    );
  }

  const qualityBadge = getQualityBadge(scan.imageQuality);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/scan/history">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Detalhes da Digitalização</h1>
            <p className="text-sm text-muted-foreground">
              {scan.examTitle}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {scan.requiresReview && !editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Revisar
            </Button>
          )}
          {editMode && (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
              <Button onClick={saveCorrections} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Student Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Identificação do Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-2">
                <Input
                  value={studentIdCorrection}
                  onChange={(e) => setStudentIdCorrection(e.target.value)}
                  placeholder="ID do aluno (6 dígitos)"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Original: {scan.studentId?.value || "Não detectado"}
                  {scan.studentId?.confidence && (
                    <span> ({(scan.studentId.confidence * 100).toFixed(0)}% confiança)</span>
                  )}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold">
                  {scan.studentId?.value || (
                    <span className="text-muted-foreground">Não detectado</span>
                  )}
                </p>
                {scan.studentId?.confidence && (
                  <p className="text-sm text-muted-foreground">
                    {(scan.studentId.confidence * 100).toFixed(0)}% de confiança
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    scan.grading.percentage >= 70
                      ? "text-apple-green"
                      : scan.grading.percentage >= 50
                      ? "text-apple-orange"
                      : "text-apple-red"
                  )}
                >
                  {scan.grading.percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {scan.grading.score} de {scan.grading.totalQuestions} questões
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-apple-green">
                    {scan.grading.correctAnswers}
                  </p>
                  <p className="text-xs text-muted-foreground">Corretas</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-apple-red">
                    {scan.grading.incorrectAnswers}
                  </p>
                  <p className="text-xs text-muted-foreground">Erradas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Badge className={qualityBadge.color}>
                <ImageIcon className="w-3 h-3 mr-1" />
                Imagem {qualityBadge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Processado em {(scan.processingTimeMs / 1000).toFixed(1)}s
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {format(new Date(scan.scannedAt), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </div>
            {scan.requiresReview && (
              <Badge className="bg-apple-orange/10 text-apple-orange">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Requer revisão
              </Badge>
            )}
          </div>

          {scan.reviewReasons && scan.reviewReasons.length > 0 && (
            <div className="mt-4 p-3 bg-apple-orange/5 rounded-lg">
              <p className="text-sm font-medium text-apple-orange mb-1">
                Motivos para revisão:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {scan.reviewReasons.map((reason, i) => (
                  <li key={i}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          {editMode && (
            <div className="mt-4">
              <label className="text-sm font-medium">Notas da revisão</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Adicione notas sobre a revisão..."
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answers Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Respostas por Questão</CardTitle>
          <CardDescription>
            Clique em uma resposta para corrigi-la (modo de revisão)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {scan.grading.questionResults.map((result) => {
              const answer = scan.answers.find(
                (a) => a.questionNumber === result.questionNumber
              );
              const hasCorrected = corrections[result.questionNumber] !== undefined;
              const displayAnswer = hasCorrected
                ? corrections[result.questionNumber]
                : result.studentAnswer;

              return (
                <div
                  key={result.questionNumber}
                  className={cn(
                    "relative p-2 rounded-lg text-center border transition-all",
                    result.isCorrect
                      ? "bg-apple-green/10 border-apple-green/30"
                      : result.studentAnswer === null
                      ? "bg-muted border-muted-foreground/20"
                      : "bg-apple-red/10 border-apple-red/30",
                    hasCorrected && "ring-2 ring-apple-blue",
                    editMode && "cursor-pointer hover:ring-2 hover:ring-apple-blue/50"
                  )}
                  onClick={() => {
                    if (editMode && !result.isCorrect) {
                      // Open correction dialog or inline edit
                      const currentAnswer = corrections[result.questionNumber] || result.studentAnswer || "";
                      const newAnswer = prompt(
                        `Questão ${result.questionNumber}\nResposta correta: ${result.correctAnswer}\nDigite a resposta do aluno (A-E ou deixe vazio):`,
                        currentAnswer
                      );
                      if (newAnswer !== null) {
                        handleCorrectionChange(
                          result.questionNumber,
                          newAnswer.toUpperCase() || "null"
                        );
                      }
                    }
                  }}
                >
                  <span className="text-xs text-muted-foreground block">
                    {result.questionNumber}
                  </span>
                  <span className="font-semibold">
                    {displayAnswer || "—"}
                  </span>
                  {!result.isCorrect && result.studentAnswer !== null && (
                    <span className="text-xs text-apple-green block">
                      {result.correctAnswer}
                    </span>
                  )}
                  {answer && !answer.isValid && (
                    <AlertTriangle className="w-3 h-3 text-apple-orange absolute top-1 right-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-apple-green/10 border border-apple-green/30" />
              <span>Correta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-apple-red/10 border border-apple-red/30" />
              <span>Incorreta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border" />
              <span>Em branco</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-apple-orange" />
              <span>Múltipla seleção</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

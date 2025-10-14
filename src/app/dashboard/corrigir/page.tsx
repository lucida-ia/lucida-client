"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  Loader2,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AnswerDetail {
  questionIndex: number;
  answer: string | number;
  score?: number;
  needsReview: boolean;
  feedback?: string;
}

interface PendingResult {
  _id: string;
  examId: string;
  examTitle: string;
  email: string;
  score: number;
  percentage: number;
  examQuestionCount: number;
  answers: AnswerDetail[];
  createdAt: Date;
}

interface Question {
  question: string;
  context?: string;
  type?: string;
  rubric?: string;
}

export default function CorrigirPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<PendingResult | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [manualScore, setManualScore] = useState("");
  const [manualFeedback, setManualFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/exam/results/pending");
      setResults(response.data.results);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar avaliações pendentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectResult = async (result: PendingResult) => {
    try {
      // Fetch the exam details
      const examResponse = await axios.get(`/api/exam/${result.examId}`);
      setExam(examResponse.data.exam);
      setSelectedResult(result);
      
      // Find the first question that needs review
      const firstNeedsReview = result.answers.findIndex(a => a.needsReview);
      setCurrentQuestionIndex(firstNeedsReview !== -1 ? firstNeedsReview : 0);
      setManualScore("");
      setManualFeedback("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da prova",
        variant: "destructive",
      });
    }
  };

  const gradeQuestion = async (useAI: boolean) => {
    if (!selectedResult || !exam) return;

    if (!useAI && (manualScore === "" || parseFloat(manualScore) < 0 || parseFloat(manualScore) > 1)) {
      toast({
        title: "Nota inválida",
        description: "A nota deve estar entre 0 e 1",
        variant: "destructive",
      });
      return;
    }

    try {
      setGrading(true);
      const response = await axios.post("/api/exam/grade-short-answer", {
        resultId: selectedResult._id,
        questionIndex: currentQuestionIndex,
        score: useAI ? undefined : parseFloat(manualScore),
        feedback: useAI ? undefined : manualFeedback,
        useAI,
      });

      toast({
        title: "Questão corrigida!",
        description: useAI ? "A IA corrigiu a questão com sucesso" : "Nota salva com sucesso",
      });

      // Update local state
      const updatedResult = response.data.result;
      setSelectedResult(updatedResult);
      
      // Update results list
      setResults(prev => prev.map(r => r._id === updatedResult._id ? updatedResult : r));

      // Move to next question that needs review or close
      if (response.data.allGraded) {
        toast({
          title: "Avaliação completa!",
          description: "Todas as questões foram corrigidas",
        });
        setSelectedResult(null);
        setExam(null);
        fetchPendingResults(); // Refresh the list
      } else {
        const nextNeedsReview = updatedResult.answers.findIndex((a: AnswerDetail, idx: number) => 
          idx > currentQuestionIndex && a.needsReview
        );
        if (nextNeedsReview !== -1) {
          setCurrentQuestionIndex(nextNeedsReview);
        } else {
          // Check from the beginning
          const firstNeedsReview = updatedResult.answers.findIndex((a: AnswerDetail) => a.needsReview);
          if (firstNeedsReview !== -1) {
            setCurrentQuestionIndex(firstNeedsReview);
          }
        }
      }
      
      setManualScore("");
      setManualFeedback("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível corrigir a questão",
        variant: "destructive",
      });
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedResult && exam) {
    const currentAnswer = selectedResult.answers[currentQuestionIndex];
    const currentQuestion: Question = exam.questions[currentQuestionIndex];
    const questionsNeedingReview = selectedResult.answers.filter(a => a.needsReview).length;

    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedResult(null);
              setExam(null);
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <p className="text-muted-foreground">Aluno: {selectedResult.email}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {questionsNeedingReview} questões pendentes
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questão {currentQuestionIndex + 1}</CardTitle>
                  <CardDescription>Tipo: Resposta Curta</CardDescription>
                </div>
                {currentAnswer.needsReview && (
                  <Badge variant="destructive">Precisa Correção</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.context && (
                <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium mb-1">Contexto:</p>
                  <p className="text-sm leading-relaxed">{currentQuestion.context}</p>
                </div>
              )}
              
              <div>
                <p className="font-medium mb-2">Pergunta:</p>
                <p className="text-sm leading-relaxed">{currentQuestion.question}</p>
              </div>

              {currentQuestion.rubric && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Rubrica de Avaliação:
                  </p>
                  <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-200 whitespace-pre-wrap">
                    {currentQuestion.rubric}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="font-medium mb-2">Resposta do Aluno:</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {currentAnswer.answer as string || "(Sem resposta)"}
                  </p>
                </div>
              </div>

              {currentAnswer.feedback && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                    Feedback Anterior:
                  </p>
                  <p className="text-sm leading-relaxed text-green-700 dark:text-green-200">
                    {currentAnswer.feedback}
                  </p>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300 mt-2">
                    Nota: {currentAnswer.score} / 1
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grading Card */}
          {currentAnswer.needsReview && (
            <Card>
              <CardHeader>
                <CardTitle>Corrigir Questão</CardTitle>
                <CardDescription>
                  Atribua uma nota de 0 a 1 e forneça feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Nota (0 a 1)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value)}
                      placeholder="Ex: 0.8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Feedback (opcional)
                  </label>
                  <Textarea
                    value={manualFeedback}
                    onChange={(e) => setManualFeedback(e.target.value)}
                    placeholder="Forneça feedback sobre a resposta do aluno..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => gradeQuestion(false)}
                    disabled={grading || !manualScore}
                    className="flex-1"
                  >
                    {grading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar Nota
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => gradeQuestion(true)}
                    disabled={grading}
                    variant="outline"
                    className="flex-1"
                  >
                    {grading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Corrigindo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Corrigir com IA
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setManualScore("");
                  setManualFeedback("");
                }
              }}
              disabled={currentQuestionIndex === 0}
            >
              Questão Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestionIndex < selectedResult.answers.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setManualScore("");
                  setManualFeedback("");
                }
              }}
              disabled={currentQuestionIndex >= selectedResult.answers.length - 1}
            >
              Próxima Questão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Corrigir Avaliações</h1>
        <p className="text-muted-foreground">
          Avaliações com questões de resposta curta que precisam ser corrigidas
        </p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma avaliação pendente</h2>
            <p className="text-muted-foreground">
              Todas as avaliações com questões de resposta curta foram corrigidas!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {results.map((result) => {
            const questionsNeedingReview = result.answers.filter(a => a.needsReview).length;
            
            return (
              <Card key={result._id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {result.examTitle}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Aluno: {result.email} • Enviado em {new Date(result.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      {questionsNeedingReview} pendentes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Nota atual: {result.score.toFixed(1)} / {result.examQuestionCount} ({(result.percentage * 100).toFixed(1)}%)
                    </div>
                    <Button onClick={() => selectResult(result)}>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Corrigir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


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
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface AnswerDetail {
  questionIndex: number;
  answer: string | number;
  score?: number;
  needsReview: boolean;
  feedback?: string;
  gradedByAI?: boolean;
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
  const [aiFeedback, setAiFeedback] = useState<{score: number, feedback: string} | null>(null);
  const [showAiFeedback, setShowAiFeedback] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalScore, setOriginalScore] = useState<string>("");
  const [originalFeedback, setOriginalFeedback] = useState<string>("");

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
      
      // Initialize current question values
      const currentAnswer = result.answers[firstNeedsReview !== -1 ? firstNeedsReview : 0];
      setManualScore(currentAnswer.score?.toString() || "");
      setManualFeedback(currentAnswer.feedback || "");
      setOriginalScore(currentAnswer.score?.toString() || "");
      setOriginalFeedback(currentAnswer.feedback || "");
      setHasChanges(false);
      setAiFeedback(null);
      setShowAiFeedback(false);
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
      const currentAnswer = selectedResult.answers[currentQuestionIndex];
      const feedbackToSend = useAI ? undefined : (manualFeedback || currentAnswer.feedback || "");
      
      console.log("Sending feedback:", feedbackToSend);
      console.log("manualFeedback:", manualFeedback);
      console.log("currentAnswer.feedback:", currentAnswer.feedback);
      
      const response = await axios.post("/api/exam/grade-short-answer", {
        resultId: selectedResult._id,
        questionIndex: currentQuestionIndex,
        score: useAI ? undefined : parseFloat(manualScore),
        feedback: feedbackToSend,
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

      if (useAI) {
        // Show AI feedback first
        const gradedAnswer = updatedResult.answers[currentQuestionIndex];
        setAiFeedback({
          score: gradedAnswer.score || 0,
          feedback: gradedAnswer.feedback || ""
        });
        setShowAiFeedback(true);
      }
      
      // Check if all questions are graded
      if (response.data.allGraded) {
        toast({
          title: "Avaliação completa!",
          description: "Todas as questões foram corrigidas",
        });
        setSelectedResult(null);
        setExam(null);
        fetchPendingResults(); // Refresh the list
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

  const navigateToQuestion = (questionIndex: number) => {
    if (!selectedResult) return;
    setCurrentQuestionIndex(questionIndex);
    const answer = selectedResult.answers[questionIndex];
    setManualScore(answer.score?.toString() || "");
    setManualFeedback(answer.feedback || "");
    setOriginalScore(answer.score?.toString() || "");
    setOriginalFeedback(answer.feedback || "");
    setHasChanges(false);
    setAiFeedback(null);
    setShowAiFeedback(false);
  };

  // Track changes in score and feedback
  const handleScoreChange = (value: string) => {
    setManualScore(value);
    setHasChanges(value !== originalScore || manualFeedback !== originalFeedback);
  };

  const handleFeedbackChange = (value: string) => {
    setManualFeedback(value);
    setHasChanges(manualScore !== originalScore || value !== originalFeedback);
  };

  const saveChanges = async () => {
    if (!selectedResult || !exam) return;

    // Validate score if it's being changed
    if (manualScore !== originalScore && (manualScore === "" || parseFloat(manualScore) < 0 || parseFloat(manualScore) > 1)) {
      toast({
        title: "Nota inválida",
        description: "A nota deve estar entre 0 e 1",
        variant: "destructive",
      });
      return;
    }

    try {
      setGrading(true);
      const currentAnswer = selectedResult.answers[currentQuestionIndex];
      
      const response = await axios.post("/api/exam/grade-short-answer", {
        resultId: selectedResult._id,
        questionIndex: currentQuestionIndex,
        score: manualScore !== originalScore ? parseFloat(manualScore) : undefined,
        feedback: manualFeedback !== originalFeedback ? manualFeedback : undefined,
        useAI: false, // Manual grading - will set gradedByAI to false
      });

      toast({
        title: "Alterações salvas!",
        description: "As modificações foram salvas com sucesso",
      });

      // Update local state
      const updatedResult = response.data.result;
      setSelectedResult(updatedResult);
      
      // Update results list
      setResults(prev => prev.map(r => r._id === updatedResult._id ? updatedResult : r));

      // Update original values to reflect saved state
      const updatedAnswer = updatedResult.answers[currentQuestionIndex];
      setOriginalScore(updatedAnswer.score?.toString() || "");
      setOriginalFeedback(updatedAnswer.feedback || "");
      setHasChanges(false);

      // Check if all questions are graded
      const allGraded = updatedResult.answers.every((a: AnswerDetail) => !a.needsReview);
      if (allGraded) {
        toast({
          title: "Parabéns!",
          description: "Todas as questões foram corrigidas",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setGrading(false);
    }
  };

  const navigateToNextPending = () => {
    if (!selectedResult) return;
    
    const nextPending = selectedResult.answers.findIndex((a: AnswerDetail, idx: number) => 
      idx > currentQuestionIndex && a.needsReview
    );
    
    if (nextPending !== -1) {
      navigateToQuestion(nextPending);
    } else {
      // Check from the beginning
      const firstPending = selectedResult.answers.findIndex((a: AnswerDetail) => a.needsReview);
      if (firstPending !== -1) {
        navigateToQuestion(firstPending);
      }
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
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="text-sm">
                {questionsNeedingReview} questões pendentes
              </Badge>
              <div className="w-48">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{selectedResult.answers.length - questionsNeedingReview}/{selectedResult.answers.length}</span>
                </div>
                <Progress 
                  value={((selectedResult.answers.length - questionsNeedingReview) / selectedResult.answers.length) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Question Navigation */}
          <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-lg">Navegação das Questões</CardTitle>
              <CardDescription>
                Clique em uma questão para navegar diretamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedResult.answers.map((answer, index) => {
                  const isGraded = !answer.needsReview;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`
                        relative flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-300 group
                        ${isCurrent 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                          : isGraded 
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 text-green-700 dark:text-green-300 hover:border-green-600 hover:bg-gradient-to-br hover:from-green-100 hover:to-green-200 dark:hover:from-green-950/50 dark:hover:to-green-900/50 hover:shadow-md hover:shadow-green-500/10' 
                            : 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 text-orange-700 dark:text-orange-300 hover:border-orange-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-950/50 dark:hover:to-orange-900/50 hover:shadow-md hover:shadow-orange-500/10'
                        }
                      `}
                    >
                      <span className="text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div className="absolute -top-1 -right-1">
                        {isGraded ? (
                          <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shadow-sm">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-5 h-5 bg-orange-500 rounded-full shadow-sm">
                            <Clock className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-muted-foreground font-medium">Corrigida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 bg-orange-500 rounded-full shadow-sm">
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-muted-foreground font-medium">Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm border-2 border-blue-500"></div>
                  <span className="text-muted-foreground font-medium">Atual</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Feedback Display */}
          {showAiFeedback && aiFeedback && (
            <Card className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/60 dark:border-green-800/60 animate-in slide-in-from-top-2 duration-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800 dark:text-green-200">Feedback da IA</CardTitle>
                </div>
                <CardDescription className="text-green-700 dark:text-green-300">
                  A IA analisou a resposta e forneceu a seguinte avaliação:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Nota:</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                      {aiFeedback.score.toFixed(1)} / 1.0
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Porcentagem:</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                      {(aiFeedback.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Feedback:</p>
                  <p className="text-sm leading-relaxed text-green-700 dark:text-green-300">
                    {aiFeedback.feedback}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Questão corrigida pela IA. Revise o feedback acima.</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAiFeedback(false);
                        setAiFeedback(null);
                      }}
                      className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    >
                      Fechar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAiFeedback(false);
                        setAiFeedback(null);
                        navigateToNextPending();
                      }}
                      className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    >
                      Próxima Pendente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

              {currentAnswer.feedback !== undefined && currentAnswer.feedback !== null && currentAnswer.gradedByAI && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Feedback da IA:
                    </p>
                    <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Corrigida pela IA
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-green-700 dark:text-green-200">
                    {currentAnswer.feedback || "Sem feedback fornecido"}
                  </p>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300 mt-2">
                    Nota: {currentAnswer.score} / 1
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grading Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentAnswer.needsReview ? "Corrigir Questão" : "Editar Correção"}
              </CardTitle>
              <CardDescription>
                {currentAnswer.needsReview 
                  ? "Atribua uma nota de 0 a 1 e forneça feedback"
                  : "Esta questão já foi corrigida. Você pode editar a nota e feedback, ou atualizar apenas o feedback."
                }
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
                      onChange={(e) => handleScoreChange(e.target.value)}
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
                    onChange={(e) => handleFeedbackChange(e.target.value)}
                    placeholder="Forneça feedback sobre a resposta do aluno..."
                    className="min-h-[100px]"
                  />
                </div>

                {hasChanges && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Clock className="h-4 w-4" />
                    <span>Você tem alterações não salvas</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={saveChanges}
                    disabled={grading || !hasChanges}
                    className={`flex-1 ${hasChanges ? 'ring-2 ring-orange-500/20' : ''}`}
                  >
                    {grading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar Alterações
                        {hasChanges && (
                          <span className="ml-2 inline-flex items-center justify-center w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
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

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Questão Anterior
            </Button>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Questão {currentQuestionIndex + 1} de {selectedResult.answers.length}</span>
              </div>
              {questionsNeedingReview > 0 && (
                <Button
                  variant="tinted"
                  size="sm"
                  onClick={navigateToNextPending}
                  className="flex items-center gap-2 text-xs"
                >
                  <Clock className="h-3 w-3" />
                  Próxima Pendente
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex >= selectedResult.answers.length - 1}
              className="flex items-center gap-2"
            >
              Próxima Questão
              <ChevronRight className="h-4 w-4" />
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


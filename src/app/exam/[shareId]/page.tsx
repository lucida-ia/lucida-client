"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Clock,
  Loader2,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LucidaLogo from "@/components/lucida-logo";

interface Question {
  question: string;
  context?: string;
  options?: string[];
  correctAnswer: number;
  type?: "multipleChoice" | "trueFalse";
  difficulty?: "fácil" | "médio" | "difícil";
  subject?: string;
  explanation?: string;
}

interface Exam {
  title: string;
  description: string;
  duration: number;
  questions: Question[];
}

interface ExamResult {
  score: number;
  percentage: number;
  totalQuestions: number;
}

interface ExamSecurityConfig {
  allowConsultation: boolean;
  showScoreAtEnd: boolean;
  showCorrectAnswersAtEnd: boolean;
}

interface ExamSession {
  examId: string;
  startTime: number;
  duration: number;
  answers: number[];
  email: string;
}

// Cookie management utilities
const EXAM_SESSION_COOKIE = "examSession";

const setCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const saveExamSession = (
  examId: string,
  duration: number,
  email: string,
  answers: number[] = []
) => {
  const session: ExamSession = {
    examId,
    startTime: Date.now(),
    duration,
    answers,
    email,
  };
  setCookie(EXAM_SESSION_COOKIE, JSON.stringify(session));
};

const getExamSession = (): ExamSession | null => {
  try {
    const sessionData = getCookie(EXAM_SESSION_COOKIE);
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
};

const updateExamSessionAnswers = (answers: number[]) => {
  const session = getExamSession();
  if (session) {
    session.answers = answers;
    setCookie(EXAM_SESSION_COOKIE, JSON.stringify(session));
  }
};

const clearExamSession = () => {
  deleteCookie(EXAM_SESSION_COOKIE);
};

export default function PublicExamPage() {
  const { shareId } = useParams();
  const searchParams = useSearchParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [securityConfig, setSecurityConfig] = useState<ExamSecurityConfig>({
    allowConsultation: true, // Default to allowing consultation when no config
    showScoreAtEnd: true,
    showCorrectAnswersAtEnd: false,
  });
  const [hasSecurityConfig, setHasSecurityConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [violationDetected, setViolationDetected] = useState(false);
  const [examEndReason, setExamEndReason] = useState<
    "manual" | "time" | "violation" | null
  >(null);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  useEffect(() => {
    // Read security configuration from URL parameters
    const configParam = searchParams.get("c");
    if (configParam) {
      try {
        const decodedConfig = atob(configParam);
        const parsedConfig = JSON.parse(decodedConfig);
        setSecurityConfig(parsedConfig);
        setHasSecurityConfig(true);
      } catch (error) {
        console.error("Failed to parse security config:", error);
        setHasSecurityConfig(false);
      }
    } else {
      // No security config provided - allow consultation by default
      setHasSecurityConfig(false);
    }

    const fetchExam = async () => {
      try {
        const response = await axios.get(`/api/exam/public/${shareId}`);
        const examData = response.data.exam;

        // Validate exam data structure
        if (
          !examData ||
          !examData.questions ||
          !Array.isArray(examData.questions)
        ) {
          throw new Error("Invalid exam data structure");
        }

        // Ensure all questions have the required fields
        const validatedQuestions = examData.questions.map((q: any) => ({
          question: q.question || "",
          context: q.context || "",
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer:
            typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
          type: q.type || "multipleChoice",
          difficulty: q.difficulty,
          subject: q.subject,
          explanation: q.explanation,
        }));

        const examWithValidatedQuestions = {
          ...examData,
          questions: validatedQuestions,
        };

        setExam(examWithValidatedQuestions);

        // Check for existing exam session
        const existingSession = getExamSession();

        if (existingSession) {
          // If different exam ID, clear the session
          if (existingSession.examId !== shareId) {
            clearExamSession();
            setTimeLeft(examData.duration * 60);
            setAnswers(new Array(validatedQuestions.length).fill(-1));
          } else {
            // Resume existing session
            const elapsed = Math.floor(
              (Date.now() - existingSession.startTime) / 1000
            );
            const totalDuration = existingSession.duration * 60;
            const remainingTime = totalDuration - elapsed;

            if (remainingTime <= 0) {
              // Time expired
              setTimeExpired(true);
              setExamEndReason("time");
              setTimeLeft(0);
              setEmail(existingSession.email);
              setAnswers(existingSession.answers);
              setIsStarted(true);
              // Auto-submit the exam
              setTimeout(() => {
                handleSubmitExpired(
                  existingSession.answers,
                  existingSession.email
                );
              }, 100);
            } else {
              // Resume with remaining time
              setTimeLeft(remainingTime);
              setAnswers(existingSession.answers);
              setEmail(existingSession.email);
              setIsStarted(true);
              toast({
                title: "Prova Retomada",
                description: "Sua prova foi retomada de onde parou.",
              });
            }
          }
        } else {
          setTimeLeft(examData.duration * 60);
          setAnswers(new Array(validatedQuestions.length).fill(-1));
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load exam",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  useEffect(() => {
    if (isStarted && timeLeft > 0 && !isSubmitted && !timeExpired) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setTimeExpired(true);
            setExamEndReason("time");
            // Auto-submit when time runs out
            setTimeout(() => {
              const session = getExamSession();
              if (session) {
                handleSubmitExpired(session.answers, session.email);
              } else {
                handleSubmit();
              }
            }, 100);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted, isStarted, timeExpired]);

  // Update session answers when answers change
  useEffect(() => {
    if (isStarted && !isSubmitted) {
      updateExamSessionAnswers(answers);
    }
  }, [answers, isStarted, isSubmitted]);

  // Scroll to top when question changes
  useEffect(() => {
    if (isStarted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestion, isStarted]);

  const handleStartExam = () => {
    if (!exam || !email) return;

    // Save exam session to cookies
    saveExamSession(shareId as string, exam.duration, email, answers);

    setIsStarted(true);

    toast({
      title: "Prova Iniciada",
      description: "Sua prova foi salva e pode ser retomada se necessário.",
    });
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted || !isStarted || !exam || timeExpired) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmitExpired = async (
    finalAnswers: number[],
    emailAddress: string
  ) => {
    if (isSubmitted || !exam || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(`/api/exam/public/${shareId}/submit`, {
        answers: finalAnswers,
        email: emailAddress,
      });

      setResult(response.data);
      setIsSubmitted(true);
      clearExamSession(); // Clear session after successful submission

      toast({
        title: "Tempo Esgotado",
        description:
          "Sua prova foi enviada automaticamente pois o tempo expirou.",
        variant: "destructive",
      });
    } catch (error: any) {
      // Check if it's a duplicate submission error
      if (error.response?.status === 409 && error.response?.data?.code === "DUPLICATE_SUBMISSION") {
        toast({
          variant: "destructive",
          title: "Prova já enviada",
          description: "Esta prova já foi enviada anteriormente por este e-mail.",
        });
        setIsSubmitted(true); // Mark as submitted to prevent further attempts
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao enviar a prova automaticamente",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    setExamEndReason("manual");
    setShowSubmitConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitConfirmation(false);
    await handleSubmit();
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || !isStarted || !exam || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(`/api/exam/public/${shareId}/submit`, {
        answers,
        email,
      });

      setResult(response.data);
      setIsSubmitted(true);
      clearExamSession(); // Clear session after successful submission

      if (violationDetected) {
        toast({
          title: "Exame Finalizado por Violação",
          description:
            "Sua prova foi enviada automaticamente devido à violação das regras.",
          variant: "destructive",
        });
      } else if (timeExpired) {
        toast({
          title: "Tempo Esgotado",
          description:
            "Sua prova foi enviada automaticamente pois o tempo expirou.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Sua prova foi enviada com sucesso",
        });
      }
    } catch (error: any) {
      // Check if it's a duplicate submission error
      if (error.response?.status === 409 && error.response?.data?.code === "DUPLICATE_SUBMISSION") {
        toast({
          variant: "destructive",
          title: "Prova já enviada",
          description: "Esta prova já foi enviada anteriormente por este e-mail.",
        });
        setIsSubmitted(true); // Mark as submitted to prevent further attempts
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao enviar a prova",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitted,
    isStarted,
    exam,
    shareId,
    answers,
    email,
    violationDetected,
    timeExpired,
    toast,
    isSubmitting,
  ]);

  // Anti-cheating detection when consultation is not allowed and security config exists
  useEffect(() => {
    if (
      !isStarted ||
      isSubmitted ||
      !hasSecurityConfig ||
      securityConfig.allowConsultation ||
      timeExpired
    ) {
      return;
    }

    let warningShown = false;

    const handleViolation = () => {
      if (violationDetected || isSubmitted) return;

      setViolationDetected(true);
      setExamEndReason("violation");
      toast({
        title: "Violação Detectada",
        description:
          "Você saiu da tela da prova. O exame será finalizado automaticamente.",
        variant: "destructive",
      });

      // Auto-submit the exam after a short delay
      setTimeout(() => {
        handleSubmit();
      }, 1000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !warningShown) {
        warningShown = true;
        handleViolation();
      }
    };

    const handleWindowBlur = () => {
      if (!warningShown) {
        warningShown = true;
        handleViolation();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Você tem certeza que deseja sair da prova?";
      handleViolation();
      return e.returnValue;
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup on unmount or when exam ends
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    isStarted,
    isSubmitted,
    hasSecurityConfig,
    securityConfig.allowConsultation,
    violationDetected,
    timeExpired,
    handleSubmit,
    toast,
  ]);

  const getTimerColor = () => {
    if (timeLeft <= 60) return "text-destructive"; // Last minute
    if (timeLeft <= 300) return "text-yellow-600"; // Last 5 minutes
    return "text-muted-foreground";
  };

  const getAnsweredCount = () => {
    return answers.filter((answer) => answer !== -1).length;
  };

  const getProgressPercentage = () => {
    if (!exam) return 0;
    return (getAnsweredCount() / exam.questions.length) * 100;
  };

  const navigateQuestion = (direction: "prev" | "next") => {
    if (!exam) return;

    if (direction === "prev" && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (
      direction === "next" &&
      currentQuestion < exam.questions.length - 1
    ) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Carregando prova...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-auto">
            <LucidaLogo />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Prova não encontrada</h2>
            <p className="text-muted-foreground">
              A prova não foi encontrada ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show time expired message if time has run out
  if (timeExpired && !isSubmitted) {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-auto">
            <LucidaLogo />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tempo Expirado</h2>
            <p className="text-muted-foreground mb-4">
              O tempo limite para esta prova foi ultrapassado. Suas respostas
              estão sendo enviadas automaticamente.
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Enviando respostas...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-auto">
            <LucidaLogo />
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-6 w-6" />
                  {exam.title}
                </CardTitle>
                <CardDescription>{exam.description}</CardDescription>
              </div>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="text-2xl font-bold">{exam.duration} min</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Questões</p>
                <p className="text-2xl font-bold">{exam.questions.length}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Instruções
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Você terá {exam.duration} minutos para completar a prova
                </li>
                <li>
                  • O cronômetro começará assim que você clicar em &quot;Iniciar
                  Prova&quot;
                </li>
                <li>• Você não pode pausar a prova uma vez iniciada</li>
                <li>
                  • Certifique-se de enviar suas respostas antes que o tempo
                  acabe
                </li>
                <li className="text-green-600 dark:text-green-400 font-medium">
                  • ✅ Sua sessão será salva automaticamente - você pode retomar
                  se fechar acidentalmente
                </li>
                {hasSecurityConfig &&
                  (securityConfig.allowConsultation ? (
                    <li className="text-blue-600 dark:text-blue-400 font-medium">
                      • Consulta permitida: Você pode consultar materiais
                      durante esta prova
                    </li>
                  ) : (
                    <li className="text-red-600 dark:text-red-400 font-medium">
                      • ⚠️ ATENÇÃO: Não é permitido sair desta tela, trocar de
                      aba ou minimizar a janela durante a prova. Qualquer
                      tentativa resultará no encerramento automático do exame.
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail para receber o resultado:
              </label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              onClick={handleStartExam}
              disabled={!email || !email.includes("@")}
              className="w-full"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Iniciar Prova
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && result) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex justify-center mb-6">
          <div className="w-32 h-auto">
            <LucidaLogo />
          </div>
        </div>
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6" />
                  Prova Completada
                </CardTitle>
                <CardDescription>
                  Resultado enviado para: {email}
                </CardDescription>
              </div>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            {/* Exam completion message */}
            {examEndReason && (
              <div
                className={`p-4 rounded-lg border ${
                  examEndReason === "manual"
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : examEndReason === "time"
                    ? "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"
                    : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {examEndReason === "manual" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : examEndReason === "time" ? (
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        examEndReason === "manual"
                          ? "text-green-800 dark:text-green-200"
                          : examEndReason === "time"
                          ? "text-orange-800 dark:text-orange-200"
                          : "text-red-800 dark:text-red-200"
                      }`}
                    >
                      {examEndReason === "manual" &&
                        "Prova Finalizada Manualmente"}
                      {examEndReason === "time" &&
                        "Prova Finalizada - Tempo Esgotado"}
                      {examEndReason === "violation" &&
                        "Prova Finalizada - Violação de Segurança"}
                    </p>
                    <p
                      className={`text-sm ${
                        examEndReason === "manual"
                          ? "text-green-600 dark:text-green-400"
                          : examEndReason === "time"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {examEndReason === "manual" &&
                        "Você completou a prova e a enviou com sucesso."}
                      {examEndReason === "time" &&
                        "O tempo limite foi alcançado e a prova foi enviada automaticamente."}
                      {examEndReason === "violation" &&
                        "A prova foi finalizada devido a uma violação das regras de segurança."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {securityConfig.showScoreAtEnd ? (
              <div className="text-center p-6 bg-muted rounded-lg">
                <div className="text-4xl font-bold mb-2">
                  {result.percentage.toFixed(1)}%
                </div>
                <p className="text-muted-foreground">
                  {result.score} de {result.totalQuestions} questões corretas
                </p>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted rounded-lg">
                <div className="text-lg font-semibold mb-2">
                  Prova Concluída com Sucesso!
                </div>
                <p className="text-muted-foreground">
                  Suas respostas foram enviadas. O resultado será
                  disponibilizado pelo professor.
                </p>
              </div>
            )}

            {securityConfig.showCorrectAnswersAtEnd && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Revisão das Respostas</h3>
                {exam.questions.map((question, index) => (
                  <Card key={index} className="">
                    <CardContent className="pt-4 px-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="text-sm">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 space-y-3">
                          <h4 className="font-medium whitespace-pre-wrap leading-relaxed">
                            {question.context || question.question}
                            {question.context && `\n${question.question}`}
                          </h4>
                          <div className="space-y-2">
                            {question.type === "trueFalse" ? (
                              <>
                                <div
                                  className={`p-3 sm:p-2 rounded ${
                                    1 === question.correctAnswer
                                      ? "bg-green-100 text-green-800 dark:bg-green-500/30 dark:text-white"
                                      : answers[index] === 1
                                      ? "bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-white"
                                      : "bg-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      checked={answers[index] === 1}
                                      disabled
                                      className="h-4 w-4"
                                    />
                                    <span className="text-sm sm:text-base">Verdadeiro</span>
                                    {1 === question.correctAnswer && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-white" />
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`p-3 sm:p-2 rounded ${
                                    0 === question.correctAnswer
                                      ? "bg-green-100 text-green-800 dark:bg-green-500/30 dark:text-white"
                                      : answers[index] === 0
                                      ? "bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-white"
                                      : "bg-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      checked={answers[index] === 0}
                                      disabled
                                      className="h-4 w-4"
                                    />
                                    <span className="text-sm sm:text-base">Falso</span>
                                    {0 === question.correctAnswer && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-white" />
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              question.options?.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className={`p-3 sm:p-2 rounded ${
                                    optionIndex === question.correctAnswer
                                      ? "bg-green-100 text-green-800 dark:bg-green-500/30 dark:text-white"
                                      : answers[index] === optionIndex
                                      ? "bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-white"
                                      : "bg-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      checked={answers[index] === optionIndex}
                                      disabled
                                      className="h-4 w-4"
                                    />
                                    <span className="text-sm sm:text-base break-words">{option}</span>
                                    {optionIndex === question.correctAnswer && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-white" />
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Envio da Prova
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar e enviar sua prova? Esta ação não pode ser desfeita.
              <br />
              <br />
              <strong>Questões respondidas:</strong> {getAnsweredCount()} de {exam?.questions.length}
              <br />
              <strong>Tempo restante:</strong> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Sim, Finalizar Prova
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Header with Timer and Progress */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">{exam.title}</h1>
              {hasSecurityConfig && !securityConfig.allowConsultation && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Modo Anti-Fraude Ativo
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTimerHidden(!isTimerHidden)}
                className="flex items-center gap-2"
              >
                {isTimerHidden ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {isTimerHidden ? "Mostrar Timer" : "Ocultar Timer"}
              </Button>
              {!isTimerHidden && (
                <div className="text-right">
                  <div
                    className={`text-xl font-mono font-bold ${getTimerColor()}`}
                  >
                    {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    tempo restante
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Questão {currentQuestion + 1} de {exam.questions.length}
              </span>
              <span>{getAnsweredCount()} respondidas</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 lg:container lg:mx-auto lg:max-w-5xl">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6 space-y-6 lg:space-y-0">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-28">
              <CardHeader className="pb-3 cursor-pointer lg:cursor-default" onClick={() => setIsNavigationExpanded(!isNavigationExpanded)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Navegação</CardTitle>
                  <button
                    className="lg:hidden text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNavigationExpanded(!isNavigationExpanded);
                    }}
                  >
                    {isNavigationExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 lg:hidden">
                  {getAnsweredCount()} de {exam.questions.length} respondidas
                </p>
              </CardHeader>
              <CardContent className={`${isNavigationExpanded ? 'block' : 'hidden'} lg:block`}>
                <div className="grid grid-cols-5 lg:grid-cols-5 gap-2">
                  {exam.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`aspect-square rounded border text-sm font-medium transition-colors ${
                        currentQuestion === index
                          ? "bg-primary text-primary-foreground border-primary"
                          : answers[index] !== -1
                          ? "dark:bg-blue-500/60 bg-blue-500/60 text-white dark:text-white border-muted hover:bg-muted/80"
                          : "bg-background border-border hover:bg-muted/50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Questão {currentQuestion + 1}
                    </CardTitle>
                    {(exam.questions[currentQuestion].difficulty || exam.questions[currentQuestion].subject) && (
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {exam.questions[currentQuestion].difficulty && (
                          <span>Dificuldade: {exam.questions[currentQuestion].difficulty}</span>
                        )}
                        {exam.questions[currentQuestion].subject && (
                          <span>• {exam.questions[currentQuestion].subject}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="self-start sm:self-center">
                    {exam.questions[currentQuestion].type === "trueFalse"
                      ? "Verdadeiro/Falso"
                      : "Múltipla Escolha"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {exam.questions[currentQuestion].context ||
                      exam.questions[currentQuestion].question}
                    {exam.questions[currentQuestion].context &&
                      `\n${exam.questions[currentQuestion].question}`}
                  </p>
                </div>

                <div className="space-y-3">
                  {exam.questions[currentQuestion].type === "trueFalse" ? (
                    <>
                      <button
                        onClick={() => handleAnswerSelect(currentQuestion, 1)}
                        className={`w-full p-4 text-left rounded-lg border transition-colors ${
                          answers[currentQuestion] === 1
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={answers[currentQuestion] === 1}
                            onChange={() =>
                              handleAnswerSelect(currentQuestion, 1)
                            }
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Verdadeiro</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleAnswerSelect(currentQuestion, 0)}
                        className={`w-full p-4 text-left rounded-lg border transition-colors ${
                          answers[currentQuestion] === 0
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={answers[currentQuestion] === 0}
                            onChange={() =>
                              handleAnswerSelect(currentQuestion, 0)
                            }
                            className="h-4 w-4"
                          />
                          <span className="text-sm">Falso</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    exam.questions[currentQuestion].options?.map(
                      (option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() =>
                            handleAnswerSelect(currentQuestion, optionIndex)
                          }
                          className={`w-full p-4 text-left rounded-lg border transition-colors ${
                            answers[currentQuestion] === optionIndex
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={answers[currentQuestion] === optionIndex}
                              onChange={() =>
                                handleAnswerSelect(currentQuestion, optionIndex)
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm break-words">{option}</span>
                          </div>
                        </button>
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator className="my-6" />

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigateQuestion("prev")}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {currentQuestion < exam.questions.length - 1 ? (
                  <Button onClick={() => navigateQuestion("next")}>
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleManualSubmit}
                    disabled={timeLeft === 0 || isSubmitted || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Finalizar Prova
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Lucida Logo */}
            <div className="flex justify-center mt-8 mb-4">
              <div className="w-24 h-auto opacity-60">
                <LucidaLogo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

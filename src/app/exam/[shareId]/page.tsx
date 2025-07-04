"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Question {
  question: string;
  context?: string;
  options?: string[];
  correctAnswer: number;
  type?: "multipleChoice" | "trueFalse";
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

export default function PublicExamPage() {
  const { shareId } = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
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
        }));

        setExam({
          ...examData,
          questions: validatedQuestions,
        });
        setTimeLeft(examData.duration * 60); // Convert minutes to seconds
        setAnswers(new Array(validatedQuestions.length).fill(-1));
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
    if (isStarted && timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (isStarted && timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted, isStarted]);

  // Scroll to top when question changes
  useEffect(() => {
    if (isStarted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestion, isStarted]);

  const handleStartExam = () => {
    setIsStarted(true);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted || !isStarted || !exam) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (isSubmitted || !isStarted || !exam) return;

    try {
      const response = await axios.post(`/api/exam/public/${shareId}/submit`, {
        answers,
        email,
      });

      setResult(response.data);
      setIsSubmitted(true);

      toast({
        title: "Sucesso",
        description: "Sua prova foi enviada com sucesso",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao enviar a prova",
      });
    }
  };

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

  if (!isStarted) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-6 w-6" />
              {exam.title}
            </CardTitle>
            <CardDescription>{exam.description}</CardDescription>
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
                  • O cronômetro começará assim que você clicar em "Iniciar
                  Prova"
                </li>
                <li>• Você não pode pausar a prova uma vez iniciada</li>
                <li>
                  • Certifique-se de enviar suas respostas antes que o tempo
                  acabe
                </li>
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
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Prova Completada
            </CardTitle>
            <CardDescription>Resultado enviado para: {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="text-4xl font-bold mb-2">
                {result.percentage.toFixed(1)}%
              </div>
              <p className="text-muted-foreground">
                {result.score} de {result.totalQuestions} questões corretas
              </p>
              <Badge
                variant={result.percentage >= 70 ? "default" : "secondary"}
                className="mt-2"
              >
                {result.percentage >= 70 ? "Aprovado" : "Reprovado"}
              </Badge>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Revisão das Respostas</h3>
              {exam.questions.map((question, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="text-sm">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 space-y-3">
                        <h4 className="font-medium whitespace-pre-wrap">
                          {question.context || question.question}
                          {question.context && `\n${question.question}`}
                        </h4>
                        <div className="space-y-2">
                          {question.type === "trueFalse" ? (
                            <>
                              <div
                                className={`p-2 rounded ${
                                  1 === question.correctAnswer
                                    ? "bg-green-100 text-green-800"
                                    : answers[index] === 1
                                    ? "bg-red-100 text-red-800"
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
                                  <span>Verdadeiro</span>
                                  {1 === question.correctAnswer && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                              <div
                                className={`p-2 rounded ${
                                  0 === question.correctAnswer
                                    ? "bg-green-100 text-green-800"
                                    : answers[index] === 0
                                    ? "bg-red-100 text-red-800"
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
                                  <span>Falso</span>
                                  {0 === question.correctAnswer && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            question.options?.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded ${
                                  optionIndex === question.correctAnswer
                                    ? "bg-green-100 text-green-800"
                                    : answers[index] === optionIndex
                                    ? "bg-red-100 text-red-800"
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
                                  <span>{option}</span>
                                  {optionIndex === question.correctAnswer && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Timer and Progress */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">{exam.title}</h1>
              <p className="text-sm text-muted-foreground">
                {exam.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
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

      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-28">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Navegação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-5 gap-2">
                  {exam.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`aspect-square rounded border text-sm font-medium transition-colors ${
                        currentQuestion === index
                          ? "bg-primary text-primary-foreground border-primary"
                          : answers[index] !== -1
                          ? "bg-muted text-muted-foreground border-muted hover:bg-muted/80"
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Questão {currentQuestion + 1}
                  </CardTitle>
                  <Badge variant="outline">
                    {exam.questions[currentQuestion].type === "trueFalse"
                      ? "Verdadeiro/Falso"
                      : "Múltipla Escolha"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-[12-pt] whitespace-pre-wrap">
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
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
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
                          <span>Verdadeiro</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleAnswerSelect(currentQuestion, 0)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
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
                          <span>Falso</span>
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
                          className={`w-full p-3 text-left rounded-lg border transition-colors ${
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
                            <span>{option}</span>
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
                    onClick={handleSubmit}
                    disabled={timeLeft === 0 || isSubmitted}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finalizar Prova
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

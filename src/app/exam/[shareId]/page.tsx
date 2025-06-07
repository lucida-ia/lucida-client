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
import { Clock, Loader2, CheckCircle2, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Question {
  question: string;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Prova não encontrada ou expirada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-6 w-6" />
              {exam.title}
            </CardTitle>
            <CardDescription>{exam.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h3 className="font-medium">Duração</h3>
                  <p className="text-2xl font-bold">{exam.duration} minutos</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h3 className="font-medium">Questões</h3>
                  <p className="text-2xl font-bold">{exam.questions.length}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Instruções:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    Você terá {exam.duration} minutos para completar a prova
                  </li>
                  <li>
                    O cronômetro começará assim que você clicar em &quot;Iniciar
                    Prova&quot;
                  </li>
                  <li>Você não pode pausar a prova uma vez iniciada</li>
                  <li>
                    Certifique-se de enviar suas respostas antes que o tempo
                    acabe
                  </li>
                  <li>You can review your answers before submitting</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <span>Confirme seu e-mail antes de prosseguir:</span>
                <Input
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button size="lg" onClick={handleStartExam} disabled={!email}>
                  Iniciar Prova
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted && result) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Prova Completada - {email}
            </CardTitle>
            <CardDescription>Seus resultados estão prontos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-primary">
                  {result.percentage.toFixed(1)}%
                </h2>
                <p className="text-muted-foreground mt-2">
                  {result.score} de {result.totalQuestions} questões corretas
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Suas Respostas</h3>
                {exam.questions.map((question, index) => (
                  <div key={index} className="space-y-2 p-4 rounded-lg border">
                    <p className="font-medium">{question.question}</p>
                    <div className="space-y-1">
                      {question.type === "trueFalse" ? (
                        <>
                          <div
                            className={`flex items-center space-x-2 ${
                              1 === question.correctAnswer
                                ? "text-green-600"
                                : answers[index] === 1
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={answers[index] === 1}
                              disabled
                              className="h-4 w-4"
                            />
                            <label>Verdadeiro</label>
                            {1 === question.correctAnswer && (
                              <span className="text-sm text-green-600">
                                (Resposta Correta)
                              </span>
                            )}
                          </div>
                          <div
                            className={`flex items-center space-x-2 ${
                              0 === question.correctAnswer
                                ? "text-green-600"
                                : answers[index] === 0
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={answers[index] === 0}
                              disabled
                              className="h-4 w-4"
                            />
                            <label>Falso</label>
                            {0 === question.correctAnswer && (
                              <span className="text-sm text-green-600">
                                (Resposta Correta)
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        question.options?.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`flex items-center space-x-2 ${
                              optionIndex === question.correctAnswer
                                ? "text-green-600"
                                : answers[index] === optionIndex
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              checked={answers[index] === optionIndex}
                              disabled
                              className="h-4 w-4"
                            />
                            <label>{option}</label>
                            {optionIndex === question.correctAnswer && (
                              <span className="text-sm text-green-600">
                                (Resposta Correta)
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>{exam.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {exam.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="space-y-4">
                <h3 className="text-lg font-medium">
                  {questionIndex + 1}. {question.question}
                </h3>
                <div className="space-y-2">
                  {question.type === "trueFalse" ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={answers[questionIndex] === 1}
                          onChange={() => handleAnswerSelect(questionIndex, 1)}
                          className="h-4 w-4"
                        />
                        <label>Verdadeiro</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={answers[questionIndex] === 0}
                          onChange={() => handleAnswerSelect(questionIndex, 0)}
                          className="h-4 w-4"
                        />
                        <label>Falso</label>
                      </div>
                    </>
                  ) : (
                    question.options?.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={answers[questionIndex] === optionIndex}
                          onChange={() =>
                            handleAnswerSelect(questionIndex, optionIndex)
                          }
                          className="h-4 w-4"
                        />
                        <label>{option}</label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={timeLeft === 0 || isSubmitted}
            >
              Enviar Prova
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

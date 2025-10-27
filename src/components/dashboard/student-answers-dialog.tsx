"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bot,
  UserCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudentAnswersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string | null;
}

interface AnswerWithQuestion {
  questionIndex: number;
  question: string;
  context?: string;
  type: string;
  options?: string[];
  correctAnswer: any;
  rubric?: string;
  studentAnswer: any;
  score?: number;
  needsReview: boolean;
  feedback?: string;
  gradedByAI: boolean;
}

interface StudentAnswersData {
  result: {
    _id: string;
    email: string;
    score: number;
    percentage: number;
    examQuestionCount: number;
    needsGrading: boolean;
    createdAt: string;
  };
  exam: {
    _id: string;
    title: string;
    description?: string;
  };
  answersWithQuestions: AnswerWithQuestion[];
}

export function StudentAnswersDialog({
  isOpen,
  onClose,
  resultId,
}: StudentAnswersDialogProps) {
  const [data, setData] = useState<StudentAnswersData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && resultId) {
      fetchStudentAnswers();
    }
  }, [isOpen, resultId]);

  const fetchStudentAnswers = async () => {
    if (!resultId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/exam/student-answers?resultId=${resultId}`
      );

      if (response.data.status === "success") {
        setData(response.data.data);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar respostas do aluno",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching student answers:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar respostas do aluno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 dark:text-green-400";
    if (score >= 0.7) return "text-blue-600 dark:text-blue-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.9) return "default";
    if (score >= 0.7) return "secondary";
    if (score >= 0.6) return "outline";
    return "destructive";
  };

  const formatAnswer = (answer: any, type: string, options?: string[]) => {
    if (type === "shortAnswer") {
      return answer || "Sem resposta";
    } else if (type === "multipleChoice" || type === "trueFalse") {
      if (typeof answer === "number" && options) {
        return options[answer] || "Resposta inválida";
      }
      return answer;
    }
    return answer;
  };

  const formatCorrectAnswer = (correctAnswer: any, type: string, options?: string[]) => {
    if (type === "shortAnswer") {
      return "Resposta discursiva";
    } else if (type === "multipleChoice" || type === "trueFalse") {
      if (typeof correctAnswer === "number" && options) {
        return options[correctAnswer] || "Resposta inválida";
      }
      return correctAnswer;
    }
    return correctAnswer;
  };

  const isCorrect = (studentAnswer: any, correctAnswer: any, type: string) => {
    if (type === "shortAnswer") return null; // Can't determine for short answers
    return studentAnswer === correctAnswer;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Respostas do Aluno
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Student Info Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{data.result.email}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(data.result.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {data.result.score}/{data.result.examQuestionCount}
                      </div>
                      <div className={`text-lg font-semibold ${getScoreColor(data.result.percentage)}`}>
                        {(data.result.percentage * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exam Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {data.exam.title}
                  </CardTitle>
                </CardHeader>
                {data.exam.description && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">{data.exam.description}</p>
                  </CardContent>
                )}
              </Card>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Respostas</h3>
                {data.answersWithQuestions.map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            Questão {item.questionIndex + 1}
                            <Badge variant={getScoreBadgeVariant(item.score || 0)}>
                              {item.type === "shortAnswer" ? "Discursiva" : 
                               item.type === "multipleChoice" ? "Múltipla Escolha" : 
                               "Verdadeiro/Falso"}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.question}
                          </p>
                          {item.context && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Contexto: {item.context}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {item.score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getScoreColor(item.score)}`}>
                                {item.score.toFixed(2)}
                              </span>
                              {item.gradedByAI ? (
                                <Bot className="h-4 w-4 text-blue-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Student Answer */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Resposta do Aluno:</h4>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {formatAnswer(item.studentAnswer, item.type, item.options)}
                          </p>
                        </div>
                      </div>

                      {/* Correct Answer (for MC/TF) */}
                      {item.type !== "shortAnswer" && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Resposta Correta:</h4>
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm">
                              {formatCorrectAnswer(item.correctAnswer, item.type, item.options)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Rubric (for short answers) */}
                      {item.type === "shortAnswer" && item.rubric && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Critério de Correção:</h4>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm">{item.rubric}</p>
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {item.feedback && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Feedback:
                          </h4>
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm">{item.feedback}</p>
                          </div>
                        </div>
                      )}

                      {/* Correct/Incorrect indicator for MC/TF */}
                      {item.type !== "shortAnswer" && (
                        <div className="flex items-center gap-2">
                          {isCorrect(item.studentAnswer, item.correctAnswer, item.type) ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">
                                Resposta correta
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600 dark:text-red-400">
                                Resposta incorreta
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Não foi possível carregar as respostas do aluno.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

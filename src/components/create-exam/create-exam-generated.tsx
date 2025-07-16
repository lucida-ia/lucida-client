"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Loader2,
  FileCheck,
  ArrowLeft,
  CheckCircle,
  Clock,
  Target,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface CreateExamGeneratedProps {
  generatedExam: any;
  onBack: () => void;
}

export function CreateExamGenerated({
  generatedExam,
  onBack,
}: CreateExamGeneratedProps) {
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [examData, setExamData] = useState(generatedExam);
  const [editedQuestion, setEditedQuestion] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateExam = async () => {
    setIsSavingExam(true);
    try {
      await axios("/api/exam", {
        method: "POST",
        data: examData,
      });
      router.push("/dashboard/exams");
    } catch (error: any) {
      if (
        error.response?.status === 402 &&
        error.response?.data?.code === "USAGE_LIMIT_REACHED"
      ) {
        toast({
          title: "Limite de Provas Atingido",
          description:
            "Você atingiu o limite de provas do seu plano. Faça upgrade para criar mais provas.",
          variant: "destructive",
        });
        // Redirect to billing page after a short delay
        setTimeout(() => {
          router.push("/dashboard/billing");
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao salvar a prova. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSavingExam(false);
    }
  };

  const startEditingQuestion = (index: number) => {
    setEditingQuestion(index);
    setEditedQuestion({ ...examData.questions[index] });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
    setEditedQuestion(null);
  };

  const saveEditedQuestion = () => {
    if (editingQuestion !== null && editedQuestion) {
      const updatedQuestions = [...examData.questions];
      updatedQuestions[editingQuestion] = editedQuestion;
      setExamData({
        ...examData,
        questions: updatedQuestions,
      });
      setEditingQuestion(null);
      setEditedQuestion(null);
      toast({
        title: "Questão atualizada",
        description: "A questão foi salva com sucesso.",
      });
    }
  };

  const updateEditedQuestion = (field: string, value: any) => {
    setEditedQuestion({
      ...editedQuestion,
      [field]: value,
    });
  };

  const updateEditedOption = (optionIndex: number, value: string) => {
    const updatedOptions = [...editedQuestion.options];
    updatedOptions[optionIndex] = value;
    setEditedQuestion({
      ...editedQuestion,
      options: updatedOptions,
    });
  };

  const addOption = () => {
    setEditedQuestion({
      ...editedQuestion,
      options: [...editedQuestion.options, "Nova opção"],
    });
  };

  const removeOption = (optionIndex: number) => {
    if (editedQuestion.options.length > 2) {
      const updatedOptions = editedQuestion.options.filter(
        (_: any, index: number) => index !== optionIndex
      );
      setEditedQuestion({
        ...editedQuestion,
        options: updatedOptions,
        correctAnswer:
          editedQuestion.correctAnswer > optionIndex
            ? editedQuestion.correctAnswer - 1
            : editedQuestion.correctAnswer,
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "fácil":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "médio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "difícil":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "misto":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
  };

  const capitalizeDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "fácil":
        return "Fácil";
      case "médio":
        return "Médio";
      case "difícil":
        return "Difícil";
      case "misto":
        return "Misto";
      default:
        return difficulty || "Não definido";
    }
  };

  return (
    <div className="space-y-8">
      {/* Exam Header Card */}
      <Card className="hover:border-primary/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{examData.config.title}</CardTitle>
              <CardDescription>
                {examData.config.description || "Prova gerada com sucesso"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Questões
                </p>
                <p className="text-lg font-semibold">
                  {examData.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tempo Limite
                </p>
                <p className="text-lg font-semibold">
                  {examData.config.timeLimit} min
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dificuldade
                </p>
                <Badge
                  className={`${getDifficultyColor(
                    examData.config.difficulty
                  )} font-medium text-xs border`}
                >
                  {capitalizeDifficulty(examData.config.difficulty)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Card */}
      <Card className="hover:border-primary/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Prova Completa</CardTitle>
              <CardDescription>
                Questões com respostas corretas destacadas - Clique em
                &ldquo;Editar&rdquo; para modificar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 md:space-y-8">
            {examData.questions.map((question: any, index: number) => (
              <div
                key={index}
                className={`p-3 md:p-4 border rounded-lg transition-colors ${
                  editingQuestion === index
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                      <Badge
                        variant="outline"
                        className="px-2 py-1 text-xs font-medium flex-shrink-0"
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1 space-y-2 min-w-0">
                        {/* Question metadata */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {question.difficulty && (
                            <Badge
                              className={`${getDifficultyColor(
                                question.difficulty
                              )} text-xs border`}
                            >
                              {capitalizeDifficulty(question.difficulty)}
                            </Badge>
                          )}
                          {question.subject && (
                            <Badge variant="outline" className="text-xs">
                              {question.subject}
                            </Badge>
                          )}
                        </div>
                        {editingQuestion === index ? (
                          <div className="space-y-4">
                            {editedQuestion.context && (
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Contexto:
                                </label>
                                <Textarea
                                  value={editedQuestion.context}
                                  onChange={(e) =>
                                    updateEditedQuestion(
                                      "context",
                                      e.target.value
                                    )
                                  }
                                  className="min-h-[80px]"
                                  placeholder="Contexto da questão (opcional)"
                                />
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Pergunta:
                              </label>
                              <Textarea
                                value={editedQuestion.question}
                                onChange={(e) =>
                                  updateEditedQuestion(
                                    "question",
                                    e.target.value
                                  )
                                }
                                className="min-h-[60px]"
                                placeholder="Texto da pergunta"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {question.context && (
                              <div className="p-3 bg-muted/50 rounded border-l-4 border-primary">
                                <p className="text-sm text-muted-foreground font-medium mb-1">
                                  Contexto:
                                </p>
                                <p className="text-sm leading-relaxed break-words">{question.context}</p>
                              </div>
                            )}
                            <h3 className="font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                              {question.question}
                            </h3>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingQuestion === index ? (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={saveEditedQuestion}
                          className="gap-1 touch-manipulation"
                        >
                          <Save className="h-3 w-3" />
                          <span className="hidden sm:inline">Salvar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingQuestion}
                          className="gap-1 touch-manipulation"
                        >
                          <X className="h-3 w-3" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingQuestion(index)}
                        className="gap-1 w-full sm:w-auto touch-manipulation"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                    )}
                  </div>

                  <div className="ml-4 md:ml-8 space-y-2">
                    {editingQuestion === index ? (
                      <div className="space-y-4">
                        {editedQuestion.type === "multipleChoice" ? (
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <label className="text-sm font-medium">
                                Opções:
                              </label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addOption}
                                className="gap-1 w-full sm:w-auto"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar Opção
                              </Button>
                            </div>
                            {editedQuestion.options.map(
                              (option: string, optionIndex: number) => (
                                <div
                                  key={optionIndex}
                                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 border rounded"
                                >
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                      type="radio"
                                      name={`correct-${index}`}
                                      checked={
                                        editedQuestion.correctAnswer ===
                                        optionIndex
                                      }
                                      onChange={() =>
                                        updateEditedQuestion(
                                          "correctAnswer",
                                          optionIndex
                                        )
                                      }
                                      className="touch-manipulation"
                                    />
                                  </div>
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      updateEditedOption(
                                        optionIndex,
                                        e.target.value
                                      )
                                    }
                                    className="flex-1"
                                    placeholder={`Opção ${optionIndex + 1}`}
                                  />
                                  {editedQuestion.options.length > 2 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeOption(optionIndex)}
                                      className="px-2 touch-manipulation"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Resposta correta:
                            </label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 p-2 border rounded">
                                <input
                                  type="radio"
                                  name={`tf-correct-${index}`}
                                  checked={editedQuestion.correctAnswer === 0}
                                  onChange={() =>
                                    updateEditedQuestion("correctAnswer", 0)
                                  }
                                  className="touch-manipulation"
                                />
                                <span className="text-sm">Verdadeiro</span>
                              </div>
                              <div className="flex items-center gap-3 p-2 border rounded">
                                <input
                                  type="radio"
                                  name={`tf-correct-${index}`}
                                  checked={editedQuestion.correctAnswer === 1}
                                  onChange={() =>
                                    updateEditedQuestion("correctAnswer", 1)
                                  }
                                  className="touch-manipulation"
                                />
                                <span className="text-sm">Falso</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {question.type === "multipleChoice" ? (
                          <div className="space-y-2">
                            {question.options.map(
                              (option: string, optionIndex: number) => {
                                const isCorrect =
                                  question.correctAnswer === optionIndex;
                                return (
                                  <div
                                    key={optionIndex}
                                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded transition-colors ${
                                      isCorrect
                                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                        : "hover:bg-muted/30"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div
                                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                          isCorrect
                                            ? "border-green-500 bg-green-500"
                                            : "border-muted-foreground"
                                        }`}
                                      >
                                        {isCorrect && (
                                          <CheckCircle className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-sm break-words min-w-0 ${
                                          isCorrect
                                            ? "font-medium text-green-700 dark:text-green-300"
                                            : ""
                                        }`}
                                      >
                                        {option}
                                      </span>
                                    </div>
                                    {isCorrect && (
                                      <Badge className="self-start sm:self-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                        Resposta Correta
                                      </Badge>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div
                              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded transition-colors ${
                                question.correctAnswer === 0
                                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    question.correctAnswer === 0
                                      ? "border-green-500 bg-green-500"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {question.correctAnswer === 0 && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span
                                  className={`text-sm ${
                                    question.correctAnswer === 0
                                      ? "font-medium text-green-700 dark:text-green-300"
                                      : ""
                                  }`}
                                >
                                  Verdadeiro
                                </span>
                              </div>
                              {question.correctAnswer === 0 && (
                                <Badge className="self-start sm:self-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                  Resposta Correta
                                </Badge>
                              )}
                            </div>

                            <div
                              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded transition-colors ${
                                question.correctAnswer === 1
                                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    question.correctAnswer === 1
                                      ? "border-green-500 bg-green-500"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {question.correctAnswer === 1 && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span
                                  className={`text-sm ${
                                    question.correctAnswer === 1
                                      ? "font-medium text-green-700 dark:text-green-300"
                                      : ""
                                  }`}
                                >
                                  Falso
                                </span>
                              </div>
                              {question.correctAnswer === 1 && (
                                <Badge className="self-start sm:self-center bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                  Resposta Correta
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Explanation section */}
                        {question.explanation && (
                          <div className="mt-3 md:mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                              Explicação:
                            </h4>
                            <p className="text-sm leading-relaxed text-blue-700 dark:text-blue-200 break-words">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2 w-full sm:w-auto touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Visualização</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <Button
            onClick={handleCreateExam}
            disabled={isSavingExam}
            className="gap-2 w-full sm:w-auto touch-manipulation"
          >
            {isSavingExam ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Salvando...</span>
                <span className="sm:hidden">Salvando...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Salvar Prova</span>
                <span className="sm:hidden">Salvar</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

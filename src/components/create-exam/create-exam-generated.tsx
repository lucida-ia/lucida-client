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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar a prova. Tente novamente.",
        variant: "destructive",
      });
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
                  )} font-medium text-xs`}
                >
                  {examData.config.difficulty === "fácil" ? "Fácil" :
                   examData.config.difficulty === "médio" ? "Médio" :
                   examData.config.difficulty === "difícil" ? "Difícil" :
                   examData.config.difficulty === "misto" ? "Misto" :
                   examData.config.difficulty || "Não definido"}
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
                Questões com respostas corretas destacadas - Clique em "Editar"
                para modificar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {examData.questions.map((question: any, index: number) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-colors ${
                  editingQuestion === index
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Badge
                        variant="outline"
                        className="px-2 py-1 text-xs font-medium"
                      >
                        {index + 1}
                      </Badge>
                      <div className="flex-1 space-y-2">
                        {/* Question metadata */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {question.difficulty && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                question.difficulty === "fácil" ? "bg-green-100 text-green-800" :
                                question.difficulty === "médio" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}
                            >
                              {question.difficulty}
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
                          <h3 className="font-medium text-base leading-relaxed whitespace-pre-wrap">
                            {question.context && (
                              <div className="mb-3 p-3 bg-muted/50 rounded border-l-4 border-primary">
                                <p className="text-sm text-muted-foreground font-medium mb-1">
                                  Contexto:
                                </p>
                                <p className="text-sm">{question.context}</p>
                              </div>
                            )}
                            {question.question}
                          </h3>
                        )}
                      </div>
                    </div>

                    {editingQuestion === index ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveEditedQuestion}
                          className="gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingQuestion}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingQuestion(index)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                    )}
                  </div>

                  <div className="ml-8 space-y-2">
                    {editingQuestion === index ? (
                      <div className="space-y-4">
                        {editedQuestion.type === "multipleChoice" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">
                                Opções:
                              </label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={addOption}
                                className="gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar Opção
                              </Button>
                            </div>
                            {editedQuestion.options.map(
                              (option: string, optionIndex: number) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center gap-2 p-2 border rounded"
                                >
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
                                    className="mr-2"
                                  />
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
                                      className="px-2"
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
                                    className={`flex items-center gap-3 p-2 rounded transition-colors ${
                                      isCorrect
                                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                        : "hover:bg-muted/30"
                                    }`}
                                  >
                                    <div
                                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
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
                                      className={`text-sm ${
                                        isCorrect
                                          ? "font-medium text-green-700 dark:text-green-300"
                                          : ""
                                      }`}
                                    >
                                      {option}
                                    </span>
                                    {isCorrect && (
                                      <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
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
                              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                                question.correctAnswer === 0
                                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
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
                              {question.correctAnswer === 0 && (
                                <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Resposta Correta
                                </Badge>
                              )}
                            </div>

                            <div
                              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                                question.correctAnswer === 1
                                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
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
                              {question.correctAnswer === 1 && (
                                <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Resposta Correta
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Explanation section */}
                        {question.explanation && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                              Explicação:
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200">
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
        <CardFooter className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Visualização
          </Button>
          <Button
            onClick={handleCreateExam}
            disabled={isSavingExam}
            className="gap-2"
          >
            {isSavingExam ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Salvar Prova
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

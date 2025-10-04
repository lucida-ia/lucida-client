"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileCheck,
  Clock,
  Target,
  CheckCircle,
  Calendar,
  Hash,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { DBExam } from "@/types/exam";
import { ExamExportButton } from "@/components/exam/exam-export-button";
import { useToast } from "@/hooks/use-toast";

export default function ExamPreviewPage() {
  const params = useParams();
  const [exam, setExam] = useState<DBExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Add state for editing exam metadata
  const [editingExamDetails, setEditingExamDetails] = useState(false);
  const [editedExamTitle, setEditedExamTitle] = useState("");
  const [editedExamDescription, setEditedExamDescription] = useState("");
  const [isSavingExamDetails, setIsSavingExamDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await axios.get(`/api/exam/${params.id}`);
        setExam(response.data.exam);
        // Initialize edited values with current exam data
        setEditedExamTitle(response.data.exam.title);
        setEditedExamDescription(response.data.exam.description || "");
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [params.id]);

  const startEditingQuestion = (index: number) => {
    if (!exam) return;
    setEditingQuestion(index);
    setEditedQuestion({ ...exam.questions[index] });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
    setEditedQuestion(null);
  };

  const saveEditedQuestion = async () => {
    if (editingQuestion !== null && editedQuestion && exam) {
      setIsSaving(true);
      try {
        const updatedQuestions = [...exam.questions];
        updatedQuestions[editingQuestion] = editedQuestion;
        const updatedExam = {
          ...exam,
          questions: updatedQuestions,
        };

        await axios.put(`/api/exam/${params.id}`, updatedExam);
        setExam(updatedExam);
        setEditingQuestion(null);
        setEditedQuestion(null);
        toast({
          title: "Questão atualizada",
          description: "A questão foi salva com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao salvar a questão. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
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
        return "bg-apple-green/10 dark:bg-apple-green/15 text-apple-green dark:text-apple-green border-apple-green/20 dark:border-apple-green/30 hover:bg-apple-green/20 dark:hover:bg-apple-green/25 apple-transition";
      case "médio":
        return "bg-apple-orange/10 dark:bg-apple-orange/15 text-apple-orange dark:text-apple-orange border-apple-orange/20 dark:border-apple-orange/30 hover:bg-apple-orange/20 dark:hover:bg-apple-orange/25 apple-transition";
      case "difícil":
        return "bg-apple-red/10 dark:bg-apple-red/15 text-apple-red dark:text-apple-red border-apple-red/20 dark:border-apple-red/30 hover:bg-apple-red/20 dark:hover:bg-apple-red/25 apple-transition";
      case "misto":
        return "bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light border-apple-blue/20 dark:border-apple-blue/30 hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition";
      default:
        return "bg-apple-gray-5/50 dark:bg-apple-gray-5/30 text-apple-gray-1 dark:text-apple-gray-6 border-apple-gray-4 dark:border-apple-gray-3 hover:bg-apple-gray-5/70 dark:hover:bg-apple-gray-5/40 apple-transition";
    }
  };

  // Add functions for exam details editing
  const startEditingExamDetails = () => {
    if (!exam) return;
    setEditedExamTitle(exam.title);
    setEditedExamDescription(exam.description || "");
    setEditingExamDetails(true);
  };

  const cancelEditingExamDetails = () => {
    setEditingExamDetails(false);
    if (exam) {
      setEditedExamTitle(exam.title);
      setEditedExamDescription(exam.description || "");
    }
  };

  const saveExamDetails = async () => {
    if (!exam) return;

    setIsSavingExamDetails(true);
    try {
      const updatedExam = {
        ...exam,
        title: editedExamTitle.trim(),
        description: editedExamDescription.trim(),
      };

      await axios.put(`/api/exam/${params.id}`, updatedExam);
      setExam(updatedExam);
      setEditingExamDetails(false);
      toast({
        title: "Prova atualizada",
        description: "O título e descrição foram salvos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSavingExamDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center animate-apple-fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-apple-blue/20 border-t-apple-blue mx-auto"></div>
          <p className="text-body text-muted-foreground">Carregando prova...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex h-[50vh] items-center justify-center animate-apple-fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-title-2 font-bold text-foreground">
            Prova não encontrada
          </h2>
          <p className="text-body text-muted-foreground max-w-md">
            A prova que você está procurando não existe ou foi removida.
          </p>
          <Button asChild variant="tinted" className="mt-6">
            <Link href="/dashboard/overview">
              Voltar para Minhas Avaliações
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader
        heading={editingExamDetails ? "Editando Prova" : exam.title}
        text={
          editingExamDetails
            ? "Edite o título e descrição da sua prova"
            : exam.description || "Visualize e edite os detalhes da sua prova."
        }
      >
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 text-footnote text-muted-foreground">
            <span className="font-medium">
              {exam.questions.length} questões
            </span>
            <div className="h-4 w-px bg-border"></div>
            <span className="font-medium">
              {new Date(exam.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="h-6 w-px bg-border hidden md:block"></div>

          {!editingExamDetails && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/overview">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          )}
          {editingExamDetails ? (
            <>
              <Button
                size="default"
                variant="tinted"
                onClick={saveExamDetails}
                disabled={isSavingExamDetails || !editedExamTitle.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSavingExamDetails ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                size="default"
                variant="destructive"
                onClick={cancelEditingExamDetails}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="default"
                variant="outline"
                onClick={startEditingExamDetails}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <ExamExportButton exam={exam} />
            </>
          )}
        </div>
      </DashboardHeader>

      <div className="space-y-6 animate-apple-fade-in">
        {/* Exam Edit Form */}
        {editingExamDetails && (
          <Card className="hover:apple-shadow apple-transition">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-subhead font-medium mb-2 block text-foreground">
                    Título da Prova:
                  </label>
                  <Input
                    value={editedExamTitle}
                    onChange={(e) => setEditedExamTitle(e.target.value)}
                    placeholder="Digite o título da prova"
                    className="text-headline font-semibold"
                  />
                </div>
                <div>
                  <label className="text-subhead font-medium mb-2 block text-foreground">
                    Descrição:
                  </label>
                  <Textarea
                    value={editedExamDescription}
                    onChange={(e) => setEditedExamDescription(e.target.value)}
                    placeholder="Digite a descrição da prova (opcional)"
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions Display Card */}
        <Card className="hover:apple-shadow apple-transition">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-apple-blue/10 dark:bg-apple-blue/20 rounded-apple">
                <CheckCircle className="h-5 w-5 text-apple-blue" />
              </div>
              <div>
                <CardTitle className="text-title-3 font-bold text-foreground">
                  Questões da Prova
                </CardTitle>
                <CardDescription className="text-body text-muted-foreground">
                  Visualize e edite as questões com respostas corretas
                  destacadas
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {exam.questions.map((question, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-apple apple-transition ${
                    editingQuestion === index
                      ? "bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 dark:border-apple-blue/30 apple-shadow"
                      : "bg-apple-secondary-system-background hover:bg-apple-gray-5/30 apple-shadow-sm hover:apple-shadow"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Badge
                          variant="outline"
                          className="px-3 py-1.5 text-footnote font-semibold bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue border-apple-blue/20 dark:border-apple-blue/30"
                        >
                          {index + 1}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          {/* Question metadata */}
                          {editingQuestion !== index && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {question.difficulty && (
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs font-medium ${getDifficultyColor(
                                      question.difficulty
                                    )}`}
                                  >
                                    {question.difficulty}
                                  </Badge>
                                )}
                                {question.subject && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-medium bg-apple-gray-5/30 dark:bg-apple-gray-5/20 text-muted-foreground border-apple-gray-4 dark:border-apple-gray-3 hover:bg-apple-gray-5/50 dark:hover:bg-apple-gray-5/30 apple-transition"
                                  >
                                    {question.subject}
                                  </Badge>
                                )}
                              </div>
                              {/* Mobile Edit Button */}
                              <div className="sm:hidden">
                                <Button
                                  size="sm"
                                  variant="gray"
                                  onClick={() => startEditingQuestion(index)}
                                  className="p-1.5"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {editingQuestion === index && (
                            <div className="sm:hidden flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="tinted"
                                onClick={saveEditedQuestion}
                                disabled={isSaving}
                                className="p-1.5"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="gray"
                                onClick={cancelEditingQuestion}
                                className="p-1.5"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {editingQuestion === index ? (
                            <div className="space-y-4">
                              {editedQuestion.context && (
                                <div>
                                  <label className="text-subhead font-medium mb-2 block text-foreground">
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
                                <label className="text-subhead font-medium mb-2 block text-foreground">
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
                              <div>
                                <label className="text-subhead font-medium mb-2 block text-foreground">
                                  Matéria:
                                </label>
                                <Input
                                  value={editedQuestion.subject || ""}
                                  onChange={(e) =>
                                    updateEditedQuestion(
                                      "subject",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Matéria ou tópico da questão (opcional)"
                                />
                              </div>
                              <div>
                                <label className="text-subhead font-medium mb-2 block text-foreground">
                                  Explicação:
                                </label>
                                <Textarea
                                  value={editedQuestion.explanation || ""}
                                  onChange={(e) =>
                                    updateEditedQuestion(
                                      "explanation",
                                      e.target.value
                                    )
                                  }
                                  className="min-h-[80px]"
                                  placeholder="Explicação da resposta correta (opcional)"
                                />
                              </div>
                            </div>
                          ) : (
                            <h3
                              className="font-medium text-subhead leading-relaxed whitespace-pre-wrap text-foreground"
                              style={{ fontSize: "14px" }}
                            >
                              {question.context && (
                                <div className="mb-4 p-4 bg-apple-blue/5 dark:bg-apple-blue/10 rounded-apple border-l-4 border-apple-blue">
                                  <p className="text-subhead text-apple-blue font-semibold mb-2">
                                    Contexto:
                                  </p>
                                  <p
                                    className="text-subhead text-foreground"
                                    style={{ fontSize: "14px" }}
                                  >
                                    {question.context}
                                  </p>
                                </div>
                              )}
                              {question.question}
                            </h3>
                          )}
                        </div>
                      </div>

                      <div className="sm:block hidden">
                        {editingQuestion === index ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="tinted"
                              onClick={saveEditedQuestion}
                              disabled={isSaving}
                              className="gap-2"
                            >
                              <Save className="h-3 w-3" />
                              {isSaving ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="gray"
                              onClick={cancelEditingQuestion}
                              className="gap-2"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="gray"
                            onClick={() => startEditingQuestion(index)}
                            className="gap-2"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="ml-0 sm:ml-8 space-y-2">
                      {editingQuestion === index ? (
                        <div className="space-y-4">
                          {editedQuestion.options ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-subhead font-medium text-foreground">
                                  Opções:
                                </label>
                                <Button
                                  size="sm"
                                  variant="gray"
                                  onClick={addOption}
                                  className="gap-2"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar Opção
                                </Button>
                              </div>
                              {editedQuestion.options.map(
                                (option: string, optionIndex: number) => (
                                  <div
                                    key={optionIndex}
                                    className="flex items-center gap-3 p-3 bg-apple-secondary-system-background rounded-apple border border-apple-gray-4 dark:border-apple-gray-3"
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
                                        variant="destructive"
                                        onClick={() =>
                                          removeOption(optionIndex)
                                        }
                                        className="px-2 hover:bg-apple-red/90"
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
                              <label className="text-subhead font-medium text-foreground">
                                Resposta correta:
                              </label>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-apple-secondary-system-background rounded-apple border border-apple-gray-4 dark:border-apple-gray-3">
                                  <input
                                    type="radio"
                                    name={`tf-correct-${index}`}
                                    checked={editedQuestion.correctAnswer === 0}
                                    onChange={() =>
                                      updateEditedQuestion("correctAnswer", 0)
                                    }
                                    className="text-apple-blue focus:ring-apple-blue"
                                  />
                                  <span className="text-body text-foreground">
                                    Verdadeiro
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-apple-secondary-system-background rounded-apple border border-apple-gray-4 dark:border-apple-gray-3">
                                  <input
                                    type="radio"
                                    name={`tf-correct-${index}`}
                                    checked={editedQuestion.correctAnswer === 1}
                                    onChange={() =>
                                      updateEditedQuestion("correctAnswer", 1)
                                    }
                                    className="text-apple-blue focus:ring-apple-blue"
                                  />
                                  <span className="text-body text-foreground">
                                    Falso
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {question.options ? (
                            <div className="space-y-2">
                              {question.options.map(
                                (option: string, optionIndex: number) => {
                                  const isCorrect =
                                    question.correctAnswer === optionIndex;
                                  return (
                                    <div
                                      key={optionIndex}
                                      className={`flex items-center gap-3 p-3 rounded-apple apple-transition ${
                                        isCorrect
                                          ? "bg-apple-green/10 dark:bg-apple-green/15 border border-apple-green/20 dark:border-apple-green/30"
                                          : "bg-apple-secondary-system-background hover:bg-apple-gray-5/30"
                                      }`}
                                    >
                                      <div
                                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                          isCorrect
                                            ? "border-apple-green bg-apple-green"
                                            : "border-apple-gray-4 dark:border-apple-gray-3"
                                        }`}
                                      >
                                        {isCorrect && (
                                          <CheckCircle className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      <span
                                        className={`text-body ${
                                          isCorrect
                                            ? "font-semibold text-apple-green text-sm"
                                            : "text-sm"
                                        }`}
                                      >
                                        {option}
                                      </span>
                                      {isCorrect && (
                                        <Badge className="ml-auto bg-apple-green/10 dark:bg-apple-green/15 text-apple-green border-apple-green/20 dark:border-apple-green/30 text-footnote font-semibold">
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
                                className={`flex items-center gap-3 p-3 rounded-apple apple-transition ${
                                  question.correctAnswer === 0
                                    ? "bg-apple-green/10 dark:bg-apple-green/15 border border-apple-green/20 dark:border-apple-green/30"
                                    : "bg-apple-secondary-system-background hover:bg-apple-gray-5/30"
                                }`}
                              >
                                <div
                                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                    question.correctAnswer === 0
                                      ? "border-apple-green bg-apple-green"
                                      : "border-apple-gray-4 dark:border-apple-gray-3"
                                  }`}
                                >
                                  {question.correctAnswer === 0 && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span
                                  className={`text-body ${
                                    question.correctAnswer === 0
                                      ? "font-semibold text-apple-green"
                                      : "text-foreground"
                                  }`}
                                >
                                  Verdadeiro
                                </span>
                                {question.correctAnswer === 0 && (
                                  <Badge className="ml-auto bg-apple-green/10 dark:bg-apple-green/15 text-apple-green border-apple-green/20 dark:border-apple-green/30 text-footnote font-semibold">
                                    Resposta Correta
                                  </Badge>
                                )}
                              </div>

                              <div
                                className={`flex items-center gap-3 p-3 rounded-apple apple-transition ${
                                  question.correctAnswer === 1
                                    ? "bg-apple-green/10 dark:bg-apple-green/15 border border-apple-green/20 dark:border-apple-green/30"
                                    : "bg-apple-secondary-system-background hover:bg-apple-gray-5/30"
                                }`}
                              >
                                <div
                                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                    question.correctAnswer === 1
                                      ? "border-apple-green bg-apple-green"
                                      : "border-apple-gray-4 dark:border-apple-gray-3"
                                  }`}
                                >
                                  {question.correctAnswer === 1 && (
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span
                                  className={`text-body ${
                                    question.correctAnswer === 1
                                      ? "font-semibold text-apple-green"
                                      : "text-foreground"
                                  }`}
                                >
                                  Falso
                                </span>
                                {question.correctAnswer === 1 && (
                                  <Badge className="ml-auto bg-apple-green/10 dark:bg-apple-green/15 text-apple-green border-apple-green/20 dark:border-apple-green/30 text-footnote font-semibold">
                                    Resposta Correta
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Explanation section */}
                          {question.explanation && (
                            <div className="mt-6 p-4 bg-apple-blue/5 dark:bg-apple-blue/10 rounded-apple border border-apple-blue/20 dark:border-apple-blue/30">
                              <h4 className="text-subhead font-semibold text-apple-blue mb-3">
                                Explicação:
                              </h4>
                              <p
                                className="text-subhead text-foreground leading-relaxed"
                                style={{ fontSize: "14px" }}
                              >
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
        </Card>
      </div>
    </>
  );
}

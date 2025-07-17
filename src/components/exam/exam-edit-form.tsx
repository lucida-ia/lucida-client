"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { DBExam } from "@/types/exam";

interface ExamEditFormProps {
  exam: DBExam;
  onExamUpdated: (updatedExam: DBExam) => void;
}

export function ExamEditForm({ exam, onExamUpdated }: ExamEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExam, setEditedExam] = useState<DBExam>(exam);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`/api/exam/${exam._id}`, editedExam);
      onExamUpdated(response.data.exam);
      setIsEditing(false);
      toast({
        title: "Prova atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error updating exam:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao atualizar a prova. Tente novamente.",
      });
    }
  };

  const handleCancel = () => {
    setEditedExam(exam);
    setIsEditing(false);
  };

  const handleTitleChange = (value: string) => {
    setEditedExam({ ...editedExam, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setEditedExam({ ...editedExam, description: value });
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], question: value };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const handleContextChange = (index: number, value: string) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], context: value };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...editedExam.questions];
    const updatedOptions = [...updatedQuestions[questionIndex].options];
    updatedOptions[optionIndex] = value;
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedOptions,
    };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const handleCorrectAnswerChange = (questionIndex: number, value: number) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      correctAnswer: value,
    };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const handleSubjectChange = (index: number, value: string) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], subject: value };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const handleExplanationChange = (index: number, value: string) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      explanation: value,
    };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {isEditing ? (
              <Input
                value={editedExam.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            ) : (
              exam.title
            )}
          </h2>
          {isEditing ? (
            <Textarea
              value={editedExam.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Descrição da prova"
              className="mt-2"
            />
          ) : (
            <p className="text-muted-foreground">
              {exam.description || "Sem descrição"}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {(isEditing ? editedExam.questions : exam.questions).map(
            (question, index) => (
              <div key={index} className="space-y-2">
                {isEditing && (
                  <Textarea
                    value={question.context || ""}
                    onChange={(e) => handleContextChange(index, e.target.value)}
                    placeholder="Contexto da questão (opcional)"
                    className="text-sm text-muted-foreground"
                  />
                )}
                {isEditing ? (
                  <>
                    <Textarea
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(index, e.target.value)
                      }
                      className="font-medium"
                      placeholder="Enunciado da questão"
                    />
                    <Input
                      value={question.subject || ""}
                      onChange={(e) =>
                        handleSubjectChange(index, e.target.value)
                      }
                      placeholder="Matéria ou tópico da questão (opcional)"
                      className="text-sm"
                    />
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) =>
                        handleExplanationChange(index, e.target.value)
                      }
                      placeholder="Explicação da resposta correta (opcional)"
                      className="text-sm min-h-[60px]"
                    />
                  </>
                ) : (
                  <h3 className="font-medium whitespace-pre-wrap">
                    {index + 1}. {question.context || question.question}
                    {question.context && `\n${question.question}`}
                  </h3>
                )}
                {question.options ? (
                  <div className="ml-6 space-y-1">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          className="h-4 w-4"
                          disabled={!isEditing}
                          checked={
                            isEditing
                              ? optionIndex === question.correctAnswer
                              : false
                          }
                          onChange={() =>
                            handleCorrectAnswerChange(index, optionIndex)
                          }
                        />
                        {isEditing ? (
                          <Input
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(
                                index,
                                optionIndex,
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                        ) : (
                          <label>{option}</label>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        className="h-4 w-4"
                        disabled={!isEditing}
                        checked={
                          isEditing ? question.correctAnswer === 1 : false
                        }
                        onChange={() => handleCorrectAnswerChange(index, 1)}
                      />
                      <label>Verdadeiro</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        className="h-4 w-4"
                        disabled={!isEditing}
                        checked={
                          isEditing ? question.correctAnswer === 0 : false
                        }
                        onChange={() => handleCorrectAnswerChange(index, 0)}
                      />
                      <label>Falso</label>
                    </div>
                  </div>
                )}

                {/* Explanation display */}
                {!isEditing && question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Explicação:
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

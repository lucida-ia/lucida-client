"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Folder } from "lucide-react";

interface Exam {
  _id: string;
  title: string;
  questionCount: number;
  createdAt: string;
}

interface ClassWithExams {
  id: string;
  name: string;
  exams: Exam[];
}

interface ExamSelectorProps {
  selectedExamId: string | null;
  onSelect: (examId: string, exam: Exam) => void;
  disabled?: boolean;
  /** When set, selects this exam once the list has loaded (e.g. from ?examId= in the URL). */
  initialExamId?: string | null;
}

export function ExamSelector({
  selectedExamId,
  onSelect,
  disabled = false,
  initialExamId = null,
}: ExamSelectorProps) {
  const [classes, setClasses] = useState<ClassWithExams[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appliedInitialRef = useRef(false);

  useEffect(() => {
    appliedInitialRef.current = false;
  }, [initialExamId]);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (
      appliedInitialRef.current ||
      !initialExamId ||
      loading ||
      allExams.length === 0
    )
      return;
    const ex = allExams.find((e) => e._id === initialExamId);
    if (ex) {
      appliedInitialRef.current = true;
      onSelect(initialExamId, ex);
    }
  }, [initialExamId, loading, allExams, onSelect]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/exam/all");
      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.data)) {
        // data.data is an array of classes, each with exams
        const classesWithExams: ClassWithExams[] = data.data;
        
        // Flatten all exams and filter for multiple choice
        const flatExams: Exam[] = [];
        classesWithExams.forEach((cls: ClassWithExams) => {
          if (Array.isArray(cls.exams)) {
            cls.exams.forEach((exam: any) => {
              // Include exams that have multiple choice questions
              const hasMultipleChoice = exam.questions?.some((q: any) => 
                q.type === "multipleChoice" || !q.type
              );
              if (hasMultipleChoice !== false) {
                flatExams.push(exam);
              }
            });
          }
        });
        
        setClasses(classesWithExams);
        setAllExams(flatExams);
      } else {
        setError(data.message || "Erro ao carregar provas");
      }
    } catch (err) {
      setError("Erro ao carregar provas");
      console.error("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-11 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-apple-red bg-apple-red/10 p-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (allExams.length === 0) {
    return (
      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
        Nenhuma prova encontrada. Crie uma prova primeiro para usar o scanner.
      </div>
    );
  }

  return (
    <Select
      value={selectedExamId || ""}
      onValueChange={(value) => {
        const exam = allExams.find((e) => e._id === value);
        if (exam) onSelect(value, exam);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma prova">
          {selectedExamId && (
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {allExams.find((e) => e._id === selectedExamId)?.title || "Selecionar prova"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {classes.map((cls) => (
          cls.exams && cls.exams.length > 0 && (
            <SelectGroup key={cls.id}>
              <SelectLabel className="flex items-center gap-2">
                <Folder className="w-3 h-3" />
                {cls.name}
              </SelectLabel>
              {cls.exams.map((exam) => (
                <SelectItem key={exam._id} value={exam._id}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.questionCount} questões
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )
        ))}
      </SelectContent>
    </Select>
  );
}

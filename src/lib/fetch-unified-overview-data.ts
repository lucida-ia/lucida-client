import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import type { Question } from "@/types/exam";

export interface Result {
  _id: string;
  examId: string;
  classId: string;
  email: string;
  studentName?: string | null;
  score: number;
  percentage: number;
  examTitle: string;
  examQuestionCount: number;
  createdAt: Date;
}

export interface ExamData {
  _id: string;
  classId: string;
  title: string;
  description?: string;
  duration: number;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  results: Result[];
}

export interface ClassData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  studentCount: number;
  exams: ExamData[];
  totalResults: number;
  totalQuestions: number;
}

export interface UnifiedOverviewPayload {
  classes: ClassData[];
  summary: {
    classes: number;
    exams: number;
    results: number;
    questions: number;
  };
  userData: unknown;
}

/**
 * Loads the same structure as the unified overview (turmas + provas + resultados agregados).
 * Single round-trip to /api/overview — the server does the stitching.
 */
export async function fetchUnifiedOverviewData(): Promise<UnifiedOverviewPayload> {
  const asUser = getImpersonateUserId();
  const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
  const response = await axios.get("/api/overview" + qs);
  const data = response.data.data;

  return {
    classes: data.classes as ClassData[],
    summary: data.summary,
    userData: data.user,
  };
}

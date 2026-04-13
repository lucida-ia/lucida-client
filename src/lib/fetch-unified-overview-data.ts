import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";

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
  title: string;
  description?: string;
  duration: number;
  questions: unknown[];
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
 */
export async function fetchUnifiedOverviewData(): Promise<UnifiedOverviewPayload> {
  const asUser = getImpersonateUserId();
  const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
  const [examsResponse, resultsResponse, userResponse] = await Promise.all([
    axios.get("/api/exam/all" + qs),
    axios.get("/api/class" + qs),
    axios.get("/api/user" + qs),
  ]);

  const classesData = examsResponse.data.data;
  const classResults = resultsResponse.data.data;

  const userData = userResponse.data.data;

  const classes: ClassData[] = [];
  let totalExams = 0;
  let totalResults = 0;
  let totalQuestions = 0;

  classesData.forEach((classItem: Record<string, unknown>) => {
    const classResultsData = classResults.find(
      (cr: { id?: unknown }) => String(cr.id) === String(classItem.id)
    );

    const examsWithResults: ExamData[] = (classItem.exams as Record<string, unknown>[]).map(
      (exam: Record<string, unknown>) => {
        const examResults =
          classResultsData?.results?.filter(
            (result: Result) => result.examId === exam._id
          ) || [];

        return {
          ...exam,
          results: examResults,
        } as ExamData;
      }
    );

    const classData: ClassData = {
      id: classItem.id as string,
      name: classItem.name as string,
      description: classResultsData?.description || "",
      createdAt: classResultsData?.createdAt || new Date(),
      updatedAt: classResultsData?.updatedAt || new Date(),
      exams: examsWithResults,
      totalResults: examsWithResults.reduce(
        (acc, exam) => acc + exam.results.length,
        0
      ),
      totalQuestions: examsWithResults.reduce(
        (acc, exam) => acc + exam.questions.length,
        0
      ),
    };

    classes.push(classData);
    totalExams += examsWithResults.length;
    totalResults += classData.totalResults;
    totalQuestions += classData.totalQuestions;
  });

  return {
    classes,
    summary: {
      classes: classes.length,
      exams: totalExams,
      results: totalResults,
      questions: totalQuestions,
    },
    userData,
  };
}

import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string; key: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();
    const { examId, key } = await params;
    const email = decodeURIComponent(key);

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");

    const requesterUser = await User.findOne({ id: userId });
    const isAdmin = requesterUser?.subscription?.plan === "admin";

    const exam = await Exam.findById(examId).lean<{
      _id: any;
      title: string;
      questionCount: number;
      classId: string;
      userId: string;
      questions: Array<{
        question?: string;
        subject?: string;
        difficulty?: string;
        type?: string;
        options?: string[];
        correctAnswer?: any;
        maxValue?: number;
      }>;
    }>();

    if (!exam) {
      return NextResponse.json(
        { status: "error", message: "Prova não encontrada" },
        { status: 404 }
      );
    }

    if (!(isAdmin && asUser && exam.userId === asUser) && exam.userId !== userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Acesso negado" },
        { status: 403 }
      );
    }

    const klass = await Class.findById(exam.classId)
      .select("name")
      .lean<{ _id: any; name: string } | null>();

    const [studentResult, history, studentDoc] = await Promise.all([
      Result.findOne({ examId, email }).lean<any>(),
      Result.find({ classId: exam.classId, email })
        .sort({ createdAt: 1 })
        .select("examId examTitle percentage score createdAt")
        .lean<any[]>(),
      Student.findOne({
        classId: exam.classId,
        $or: [{ email }, { matricula: email }],
      })
        .select("name email code matricula")
        .lean<any>(),
    ]);

    if (!studentResult) {
      return NextResponse.json(
        { status: "error", message: "Submissão do aluno não encontrada" },
        { status: 404 }
      );
    }

    const answers = exam.questions.map((q, index) => {
      const given = studentResult.answers?.find(
        (a: any) => a.questionIndex === index
      );
      const score = given?.score ?? 0;
      const maxValue = q.maxValue ?? 1;
      const isCorrect = score >= maxValue && maxValue > 0;
      return {
        questionIndex: index,
        question: q.question || "",
        subject: q.subject || "",
        difficulty: q.difficulty || "",
        type: q.type || "",
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        answer: given?.answer,
        score,
        maxValue,
        isCorrect,
        needsReview: given?.needsReview || false,
        feedback: given?.feedback || "",
      };
    });

    const topicMap = new Map<
      string,
      { correct: number; total: number; sumScore: number; sumMax: number }
    >();
    for (const a of answers) {
      if (!a.subject) continue;
      const current = topicMap.get(a.subject) || {
        correct: 0,
        total: 0,
        sumScore: 0,
        sumMax: 0,
      };
      current.total += 1;
      if (a.isCorrect) current.correct += 1;
      current.sumScore += a.score || 0;
      current.sumMax += a.maxValue || 0;
      topicMap.set(a.subject, current);
    }
    const byTopic = Array.from(topicMap.entries())
      .map(([subject, v]) => ({
        subject,
        correct: v.correct,
        total: v.total,
        accuracy:
          v.sumMax > 0 ? Number(((v.sumScore / v.sumMax) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const historyOut = history.map((h) => ({
      examId: h.examId,
      examTitle: h.examTitle,
      percentage: Number((h.percentage * 100).toFixed(2)),
      score: h.score,
      submittedAt: h.createdAt,
      isCurrent: String(h.examId) === String(exam._id),
    }));

    const totalExamsInClass = historyOut.length;
    const avgPercentageInClass =
      totalExamsInClass > 0
        ? Number(
            (
              historyOut.reduce((sum, h) => sum + h.percentage, 0) /
              totalExamsInClass
            ).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      status: "success",
      data: {
        student: {
          email,
          name: studentDoc?.name || studentResult.studentName || null,
          code: studentDoc?.code || null,
          matricula: studentDoc?.matricula || null,
          totalExamsInClass,
          avgPercentageInClass,
        },
        exam: {
          id: String(exam._id),
          title: exam.title,
          questionCount: exam.questionCount,
          classId: exam.classId,
          className: klass?.name || "Turma",
        },
        examResult: {
          score: studentResult.score,
          percentage: Number((studentResult.percentage * 100).toFixed(2)),
          submittedAt: studentResult.createdAt,
          needsGrading: studentResult.needsGrading || false,
          answers,
        },
        byTopic,
        history: historyOut,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS_STUDENT_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar dados do aluno" },
      { status: 500 }
    );
  }
}

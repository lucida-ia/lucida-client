import { connectToDB } from "@/lib/mongodb";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
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
    const { examId } = await params;

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");

    // Resolve requester and admin impersonation
    // If admin and asUser provided, allow access if exam belongs to asUser
    let requester = await Exam.db?.collection; // dummy to keep type satisfied
    const requesterUser = await (await import("@/models/User")).User.findOne({ id: userId });

    const isAdmin = requesterUser?.subscription?.plan === "admin";

    // First verify that the exam exists
    const exam = await Exam.findById(examId);
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

    // Get all results for this exam
    const results = await Result.find({ examId }).sort({ createdAt: -1 });

    if (results.length === 0) {
      return NextResponse.json({
        status: "success",
        data: {
          exam: {
            title: exam.title,
            questionCount: exam.questionCount,
            totalSubmissions: 0,
          },
          analytics: {
            media: 0,
            notaMinima: 0,
            notaMaxima: 0,
            totalSubmissions: 0,
            scoreDistribution: [],
            gradeRanges: {
              excellent: 0, // 90-100%
              good: 0, // 80-89%
              satisfactory: 0, // 70-79%
              needsImprovement: 0, // 60-69%
              unsatisfactory: 0, // 0-59%
            },
            recentSubmissions: [],
          },
        },
      });
    }

    // Calculate analytics - Fix: Convert 0-1 percentage to 0-100
    const percentages = results.map((r) => r.percentage * 100);
    const media = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const notaMinima = Math.min(...percentages);
    const notaMaxima = Math.max(...percentages);

    // Calculate score distribution (grouped by 10% ranges)
    const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
      const rangeStart = i * 10;
      const rangeEnd = (i + 1) * 10;
      const count = percentages.filter(
        (p) => p >= rangeStart && (i === 9 ? p <= rangeEnd : p < rangeEnd)
      ).length;
      return {
        range: `${rangeStart}-${rangeEnd}%`,
        count,
        percentage: (count / results.length) * 100,
      };
    });

    // Calculate grade ranges
    const gradeRanges = {
      excellent: percentages.filter((p) => p >= 90).length,
      good: percentages.filter((p) => p >= 80 && p < 90).length,
      satisfactory: percentages.filter((p) => p >= 70 && p < 80).length,
      needsImprovement: percentages.filter((p) => p >= 60 && p < 70).length,
      unsatisfactory: percentages.filter((p) => p < 60).length,
    };

    // Get recent submissions (last 10) - Keep original percentage values for display
    const recentSubmissions = results.slice(0, 10).map((result) => ({
      email: result.email,
      score: result.score,
      percentage: result.percentage * 100, // Convert for display
      submittedAt: result.createdAt,
    }));

    return NextResponse.json({
      status: "success",
      data: {
        exam: {
          title: exam.title,
          questionCount: exam.questionCount,
          totalSubmissions: results.length,
        },
        analytics: {
          media: Number(media.toFixed(2)),
          notaMinima: Number(notaMinima.toFixed(2)),
          notaMaxima: Number(notaMaxima.toFixed(2)),
          totalSubmissions: results.length,
          scoreDistribution,
          gradeRanges,
          recentSubmissions,
        },
      },
    });
  } catch (error) {
    console.error("[ANALYTICS_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar dados de análise" },
      { status: 500 }
    );
  }
}
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

    const [statsAgg, recentResults] = await Promise.all([
      Result.aggregate<{
        _id: null;
        total: number;
        media: number;
        notaMinima: number;
        notaMaxima: number;
        ranges: {
          excellent: number;
          good: number;
          satisfactory: number;
          needsImprovement: number;
          unsatisfactory: number;
        };
        distribution: { range: string; count: number }[];
      }>([
        { $match: { examId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sumPct: { $sum: "$percentage" },
            minPct: { $min: "$percentage" },
            maxPct: { $max: "$percentage" },
            d0: { $sum: { $cond: [{ $lt: ["$percentage", 0.1] }, 1, 0] } },
            d1: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.1] }, { $lt: ["$percentage", 0.2] }] }, 1, 0] } },
            d2: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.2] }, { $lt: ["$percentage", 0.3] }] }, 1, 0] } },
            d3: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.3] }, { $lt: ["$percentage", 0.4] }] }, 1, 0] } },
            d4: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.4] }, { $lt: ["$percentage", 0.5] }] }, 1, 0] } },
            d5: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.5] }, { $lt: ["$percentage", 0.6] }] }, 1, 0] } },
            d6: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.6] }, { $lt: ["$percentage", 0.7] }] }, 1, 0] } },
            d7: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.7] }, { $lt: ["$percentage", 0.8] }] }, 1, 0] } },
            d8: { $sum: { $cond: [{ $and: [{ $gte: ["$percentage", 0.8] }, { $lt: ["$percentage", 0.9] }] }, 1, 0] } },
            d9: { $sum: { $cond: [{ $gte: ["$percentage", 0.9] }, 1, 0] } },
          },
        },
        {
          $project: {
            total: 1,
            media: { $multiply: [{ $divide: ["$sumPct", "$total"] }, 100] },
            notaMinima: { $multiply: ["$minPct", 100] },
            notaMaxima: { $multiply: ["$maxPct", 100] },
            ranges: {
              excellent: "$d9",
              good: "$d8",
              satisfactory: "$d7",
              needsImprovement: "$d6",
              unsatisfactory: { $add: ["$d0", "$d1", "$d2", "$d3", "$d4", "$d5"] },
            },
            distribution: [
              { range: "0-10%", count: "$d0" },
              { range: "10-20%", count: "$d1" },
              { range: "20-30%", count: "$d2" },
              { range: "30-40%", count: "$d3" },
              { range: "40-50%", count: "$d4" },
              { range: "50-60%", count: "$d5" },
              { range: "60-70%", count: "$d6" },
              { range: "70-80%", count: "$d7" },
              { range: "80-90%", count: "$d8" },
              { range: "90-100%", count: "$d9" },
            ],
          },
        },
      ]),
      Result.find({ examId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("email score percentage createdAt")
        .lean(),
    ]);

    const stats = statsAgg[0];

    if (!stats || stats.total === 0) {
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
              excellent: 0,
              good: 0,
              satisfactory: 0,
              needsImprovement: 0,
              unsatisfactory: 0,
            },
            recentSubmissions: [],
          },
        },
      });
    }

    const scoreDistribution = stats.distribution.map((d) => ({
      range: d.range,
      count: d.count,
      percentage: (d.count / stats.total) * 100,
    }));

    const recentSubmissions = recentResults.map((result: any) => ({
      email: result.email,
      score: result.score,
      percentage: result.percentage * 100,
      submittedAt: result.createdAt,
    }));

    return NextResponse.json({
      status: "success",
      data: {
        exam: {
          title: exam.title,
          questionCount: exam.questionCount,
          totalSubmissions: stats.total,
        },
        analytics: {
          media: Number(stats.media.toFixed(2)),
          notaMinima: Number(stats.notaMinima.toFixed(2)),
          notaMaxima: Number(stats.notaMaxima.toFixed(2)),
          totalSubmissions: stats.total,
          scoreDistribution,
          gradeRanges: stats.ranges,
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
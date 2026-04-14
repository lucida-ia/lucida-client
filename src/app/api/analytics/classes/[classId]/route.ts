import { connectToDB } from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
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
    const { classId } = await params;

    if (!mongoose.isValidObjectId(classId)) {
      return NextResponse.json(
        { status: "error", message: "ID de turma inválido" },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");

    const requester = await User.findOne({ id: userId });
    const isAdmin = requester?.subscription?.plan === "admin";

    const klass = await Class.findById(classId).lean<{
      _id: mongoose.Types.ObjectId;
      name: string;
      description?: string;
      userId: string;
    }>();

    if (!klass) {
      return NextResponse.json(
        { status: "error", message: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const ownerMatches =
      klass.userId === userId || (isAdmin && asUser && klass.userId === asUser);

    if (!ownerMatches) {
      return NextResponse.json(
        { status: "unauthorized", message: "Acesso negado" },
        { status: 403 }
      );
    }

    const classIdStr = String(klass._id);

    const [exams, studentCount, summaryAgg, examStats, rankingAgg] =
      await Promise.all([
        Exam.find({ classId: classIdStr })
          .sort({ createdAt: 1 })
          .select("title questionCount createdAt")
          .lean(),
        Student.countDocuments({ classId: klass._id }),
        Result.aggregate<{
          _id: null;
          total: number;
          avgPct: number;
          minPct: number;
          maxPct: number;
          excellent: number;
          good: number;
          satisfactory: number;
          needsImprovement: number;
          unsatisfactory: number;
        }>([
          { $match: { classId: classIdStr } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              avgPct: { $avg: "$percentage" },
              minPct: { $min: "$percentage" },
              maxPct: { $max: "$percentage" },
              excellent: {
                $sum: { $cond: [{ $gte: ["$percentage", 0.9] }, 1, 0] },
              },
              good: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$percentage", 0.8] },
                        { $lt: ["$percentage", 0.9] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              satisfactory: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$percentage", 0.7] },
                        { $lt: ["$percentage", 0.8] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              needsImprovement: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$percentage", 0.6] },
                        { $lt: ["$percentage", 0.7] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              unsatisfactory: {
                $sum: { $cond: [{ $lt: ["$percentage", 0.6] }, 1, 0] },
              },
            },
          },
        ]),
        Result.aggregate<{
          _id: string;
          submissionCount: number;
          avgPercentage: number;
        }>([
          { $match: { classId: classIdStr } },
          {
            $group: {
              _id: "$examId",
              submissionCount: { $sum: 1 },
              avgPercentage: { $avg: "$percentage" },
            },
          },
        ]),
        Result.aggregate<{
          _id: string;
          studentName: string | null;
          examsTaken: number;
          avgPercentage: number;
        }>([
          { $match: { classId: classIdStr } },
          {
            $group: {
              _id: "$email",
              studentName: { $last: "$studentName" },
              examsTaken: { $sum: 1 },
              avgPercentage: { $avg: "$percentage" },
            },
          },
          { $sort: { avgPercentage: -1 } },
        ]),
      ]);

    const summary = summaryAgg[0];
    const examStatsById = new Map(
      examStats.map((s) => [s._id, s])
    );

    const examsOut = exams.map((e) => {
      const id = String(e._id);
      const s = examStatsById.get(id);
      return {
        id,
        title: e.title,
        createdAt: e.createdAt,
        questionCount: e.questionCount,
        submissionCount: s?.submissionCount ?? 0,
        avgPercentage: s
          ? Number((s.avgPercentage * 100).toFixed(2))
          : 0,
      };
    });

    const trend = examsOut
      .filter((e) => e.submissionCount > 0)
      .map((e) => ({
        examId: e.id,
        title: e.title,
        createdAt: e.createdAt,
        avgPercentage: e.avgPercentage,
        submissionCount: e.submissionCount,
      }));

    const ranking = rankingAgg.map((r) => ({
      email: r._id,
      studentName: r.studentName || null,
      examsTaken: r.examsTaken,
      avgPercentage: Number((r.avgPercentage * 100).toFixed(2)),
    }));

    return NextResponse.json({
      status: "success",
      data: {
        class: {
          id: classIdStr,
          name: klass.name,
          description: klass.description || "",
          studentCount,
        },
        summary: summary
          ? {
              examCount: exams.length,
              submissionCount: summary.total,
              avgPercentage: Number((summary.avgPct * 100).toFixed(2)),
              minPercentage: Number((summary.minPct * 100).toFixed(2)),
              maxPercentage: Number((summary.maxPct * 100).toFixed(2)),
              gradeRanges: {
                excellent: summary.excellent,
                good: summary.good,
                satisfactory: summary.satisfactory,
                needsImprovement: summary.needsImprovement,
                unsatisfactory: summary.unsatisfactory,
              },
            }
          : {
              examCount: exams.length,
              submissionCount: 0,
              avgPercentage: 0,
              minPercentage: 0,
              maxPercentage: 0,
              gradeRanges: {
                excellent: 0,
                good: 0,
                satisfactory: 0,
                needsImprovement: 0,
                unsatisfactory: 0,
              },
            },
        exams: examsOut,
        trend,
        ranking,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS_CLASS_DETAIL_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar dados da turma" },
      { status: 500 }
    );
  }
}

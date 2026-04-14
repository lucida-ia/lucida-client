import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { ScanResult } from "@/models/ScanResult";
import { Result } from "@/models/Result";
import { Student } from "@/models/Student";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/scan/results
 * Confirm and save scan results as official exam results
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const body = await request.json();
    const { scanIds, createResults } = body;

    if (!scanIds || !Array.isArray(scanIds) || scanIds.length === 0) {
      return NextResponse.json(
        { status: "error", message: "IDs de digitalização são obrigatórios" },
        { status: 400 }
      );
    }

    // Get all scans
    const scans = await ScanResult.find({
      scanId: { $in: scanIds },
      userId,
    }).lean();

    if (scans.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Nenhuma digitalização encontrada" },
        { status: 404 }
      );
    }

    const results: any[] = [];
    const errors: { scanId: string; error: string }[] = [];

    // Process each scan
    for (const scan of scans) {
      try {
        // Skip if requires review and not approved
        if (
          (scan as any).requiresReview &&
          (scan as any).reviewStatus !== "approved" &&
          (scan as any).reviewStatus !== "corrected"
        ) {
          errors.push({
            scanId: (scan as any).scanId,
            error: "Digitalização requer revisão antes de confirmar",
          });
          continue;
        }

        // Get exam for title
        const exam = await Exam.findById((scan as any).examId)
          .select("title questionCount")
          .lean();
        const examDoc = exam && !Array.isArray(exam) ? exam : null;

        if (!examDoc) {
          errors.push({
            scanId: (scan as any).scanId,
            error: "Prova não encontrada",
          });
          continue;
        }

        // Create official result if requested
        if (createResults) {
          const studentCode = (scan as any).studentId?.value ?? null;
          const studentEmail = studentCode
            ? `${studentCode}@student.local`
            : `scan-${(scan as any).scanId}@student.local`;

          let studentName: string | null = null;
          if ((scan as any).studentRef) {
            const ref = await Student.findById((scan as any).studentRef).select("name").lean();
            const refDoc = ref && !Array.isArray(ref) ? ref : null;
            studentName = refDoc?.name ?? null;
          }
          if (!studentName && studentCode && (scan as any).classId) {
            const student = await Student.findOne({
              userId,
              classId: (scan as any).classId,
              code: String(studentCode).trim(),
            })
              .select("name")
              .lean();
            const studentDoc = student && !Array.isArray(student) ? student : null;
            studentName = studentDoc?.name ?? null;
          }

          const rawPercentage = (scan as any).grading?.percentage ?? 0;
          const percentage = rawPercentage > 1 ? rawPercentage / 100 : rawPercentage;

          const newResult = new Result({
            examId: (scan as any).examId,
            classId: (scan as any).classId,
            email: studentEmail,
            studentName: studentName ?? undefined,
            score: (scan as any).grading?.score || 0,
            percentage,
            examTitle: (examDoc as any).title,
            examQuestionCount: (examDoc as any).questionCount,
            createdAt: new Date(),
          });

          await newResult.save();

          results.push({
            scanId: (scan as any).scanId,
            resultId: newResult._id,
            studentId: (scan as any).studentId?.value,
            score: (scan as any).grading?.score || 0,
            percentage: (scan as any).grading?.percentage || 0,
          });
        } else {
          results.push({
            scanId: (scan as any).scanId,
            studentId: (scan as any).studentId?.value,
            score: (scan as any).grading?.score || 0,
            percentage: (scan as any).grading?.percentage || 0,
          });
        }

        // Mark scan as processed
        await ScanResult.updateOne(
          { scanId: (scan as any).scanId },
          {
            reviewStatus: "approved",
            requiresReview: false,
            reviewedBy: userId,
            reviewedAt: new Date(),
          }
        );
      } catch (error: any) {
        errors.push({
          scanId: (scan as any).scanId,
          error: error.message || "Erro ao processar digitalização",
        });
      }
    }

    return NextResponse.json({
      status: "success",
      message: `${results.length} resultados confirmados`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[SCAN_RESULTS_CONFIRM_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao confirmar resultados" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scan/results
 * Get aggregated scan statistics for an exam
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json(
        { status: "error", message: "ID da prova é obrigatório" },
        { status: 400 }
      );
    }

    // Verify exam ownership
    const exam = await Exam.findById(examId).lean();
    const examDoc = exam && !Array.isArray(exam) ? exam : null;

    if (!examDoc || (examDoc as any).userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Prova não encontrada ou acesso não autorizado" },
        { status: 404 }
      );
    }

    const facetResult = await ScanResult.aggregate<{
      counts: { total: number; pendingReview: number; approved: number }[];
      scores: { avg: number; max: number; min: number }[];
      imageQuality: { _id: string; count: number }[];
      distribution: { _id: number | string; count: number }[];
    }>([
      { $match: { examId, userId } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pendingReview: { $sum: { $cond: ["$requiresReview", 1, 0] } },
                approved: {
                  $sum: {
                    $cond: [
                      { $in: ["$reviewStatus", ["approved", "corrected"]] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          scores: [
            {
              $group: {
                _id: null,
                avg: { $avg: { $ifNull: ["$grading.percentage", 0] } },
                max: { $max: { $ifNull: ["$grading.percentage", 0] } },
                min: { $min: { $ifNull: ["$grading.percentage", 100] } },
              },
            },
          ],
          imageQuality: [
            { $group: { _id: "$imageQuality", count: { $sum: 1 } } },
          ],
          distribution: [
            {
              $bucket: {
                groupBy: { $ifNull: ["$grading.percentage", 0] },
                boundaries: [0, 21, 41, 61, 81, 101],
                default: "other",
                output: { count: { $sum: 1 } },
              },
            },
          ],
        },
      },
    ]);

    const facet = facetResult[0] || { counts: [], scores: [], imageQuality: [], distribution: [] };
    const counts = facet.counts[0] || { total: 0, pendingReview: 0, approved: 0 };
    const scores = facet.scores[0] || { avg: 0, max: 0, min: 0 };
    const imageQualityMap = new Map(
      facet.imageQuality.map((q) => [q._id, q.count])
    );
    const distributionMap = new Map<string, number>(
      facet.distribution.map((b) => [String(b._id), b.count])
    );

    const stats = {
      totalScans: counts.total,
      pendingReview: counts.pendingReview,
      approved: counts.approved,
      averageScore: counts.total > 0 ? scores.avg : 0,
      highestScore: counts.total > 0 ? scores.max : 0,
      lowestScore: counts.total > 0 ? scores.min : 0,
      imageQualityBreakdown: {
        excellent: imageQualityMap.get("excellent") || 0,
        good: imageQualityMap.get("good") || 0,
        fair: imageQualityMap.get("fair") || 0,
        poor: imageQualityMap.get("poor") || 0,
      },
      scoreDistribution: {
        "0-20": distributionMap.get("0") || 0,
        "21-40": distributionMap.get("21") || 0,
        "41-60": distributionMap.get("41") || 0,
        "61-80": distributionMap.get("61") || 0,
        "81-100": distributionMap.get("81") || 0,
      },
    };

    return NextResponse.json({
      status: "success",
      examId,
      examTitle: (exam as any).title,
      stats,
    });
  } catch (error) {
    console.error("[SCAN_RESULTS_STATS_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}


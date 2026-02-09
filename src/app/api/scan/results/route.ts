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

        if (!exam) {
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

          let studentName: string | null = (scan as any).studentRef
            ? (await Student.findById((scan as any).studentRef).select("name").lean())?.name ?? null
            : null;
          if (!studentName && studentCode && (scan as any).classId) {
            const student = await Student.findOne({
              userId,
              classId: (scan as any).classId,
              code: String(studentCode).trim(),
            })
              .select("name")
              .lean();
            studentName = student?.name ?? null;
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
            examTitle: (exam as any).title,
            examQuestionCount: (exam as any).questionCount,
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

    if (!exam || (exam as any).userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Prova não encontrada ou acesso não autorizado" },
        { status: 404 }
      );
    }

    // Get all scans for this exam
    const scans = await ScanResult.find({ examId, userId }).lean();

    // Calculate statistics
    const stats = {
      totalScans: scans.length,
      pendingReview: scans.filter((s: any) => s.requiresReview).length,
      approved: scans.filter(
        (s: any) => s.reviewStatus === "approved" || s.reviewStatus === "corrected"
      ).length,
      averageScore:
        scans.length > 0
          ? scans.reduce((sum: number, s: any) => sum + (s.grading?.percentage || 0), 0) /
            scans.length
          : 0,
      highestScore: Math.max(
        ...scans.map((s: any) => s.grading?.percentage || 0),
        0
      ),
      lowestScore:
        scans.length > 0
          ? Math.min(...scans.map((s: any) => s.grading?.percentage || 100))
          : 0,
      imageQualityBreakdown: {
        excellent: scans.filter((s: any) => s.imageQuality === "excellent").length,
        good: scans.filter((s: any) => s.imageQuality === "good").length,
        fair: scans.filter((s: any) => s.imageQuality === "fair").length,
        poor: scans.filter((s: any) => s.imageQuality === "poor").length,
      },
      scoreDistribution: calculateScoreDistribution(scans),
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

function calculateScoreDistribution(scans: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0,
  };

  for (const scan of scans) {
    const percentage = scan.grading?.percentage || 0;
    if (percentage <= 20) distribution["0-20"]++;
    else if (percentage <= 40) distribution["21-40"]++;
    else if (percentage <= 60) distribution["41-60"]++;
    else if (percentage <= 80) distribution["61-80"]++;
    else distribution["81-100"]++;
  }

  return distribution;
}

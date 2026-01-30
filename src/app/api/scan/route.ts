import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { ScanResult } from "@/models/ScanResult";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// For App Router - set max duration and body size
export const maxDuration = 60; // 60 seconds timeout

// API URL for the OMR service (lucida-api)
const OMR_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Build answer key from exam questions
 */
function buildAnswerKey(
  questions: { correctAnswer: number | string }[]
): Record<number, string> {
  const answerKey: Record<number, string> = {};
  const optionLetters = ["A", "B", "C", "D", "E"];

  questions.forEach((q, index) => {
    const questionNumber = index + 1;
    if (typeof q.correctAnswer === "number") {
      answerKey[questionNumber] = optionLetters[q.correctAnswer] || "A";
    } else if (typeof q.correctAnswer === "string") {
      answerKey[questionNumber] = q.correctAnswer.toUpperCase();
    }
  });

  return answerKey;
}

/**
 * POST /api/scan
 * Process and grade a scanned answer sheet
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
    const { examId, imageBase64 } = body;

    if (!examId) {
      return NextResponse.json(
        { status: "error", message: "ID da prova é obrigatório" },
        { status: 400 }
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { status: "error", message: "Imagem é obrigatória" },
        { status: 400 }
      );
    }

    // Get exam and build answer key
    const exam = await Exam.findById(examId);

    if (!exam) {
      return NextResponse.json(
        { status: "error", message: "Prova não encontrada" },
        { status: 404 }
      );
    }

    // Verify user owns this exam
    if (exam.userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Acesso não autorizado a esta prova" },
        { status: 403 }
      );
    }

    // Build answer key from exam questions
    const answerKey = buildAnswerKey(exam.questions);
    
    // Call OMR processing API (always uses ENEM service)
    const omrResponse = await fetch(`${OMR_API_URL}/omr/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        examId,
        imageBase64,
        userId,
        answerKey,
        totalQuestions: exam.questions.length,
      }),
    });

    if (!omrResponse.ok) {
      const errorData = await omrResponse.json().catch(() => ({}));
      console.error("[SCAN_OMR_ERROR]", errorData);
      return NextResponse.json(
        {
          status: "error",
          message: "Falha ao processar a folha de respostas",
          details: errorData,
        },
        { status: 500 }
      );
    }

    const omrResult = await omrResponse.json();

    // Debug logging
    console.log("[SCAN_OMR_RESULT]", {
      success: omrResult.success,
      hasResult: !!omrResult.result,
      studentId: omrResult.result?.studentId?.value,
      grading: omrResult.result?.grading ? {
        score: omrResult.result.grading.score,
        percentage: omrResult.result.grading.percentage,
        totalQuestions: omrResult.result.grading.totalQuestions,
        unanswered: omrResult.result.grading.unanswered,
      } : null,
      imageQuality: omrResult.result?.imageQuality,
      requiresReview: omrResult.result?.requiresReview,
      reviewReasons: omrResult.result?.reviewReasons,
    });

    if (!omrResult.success || !omrResult.result) {
      console.error("[SCAN_OMR_FAILED]", omrResult);
      return NextResponse.json(
        {
          status: "error",
          message: omrResult.error || "Falha no processamento OMR",
        },
        { status: 500 }
      );
    }

    // Save scan result to database
    // Map the result to match ScanResult schema
    const scanData = {
      scanId: omrResult.result.scanId || omrResult.result.id || `scan_${Date.now()}`,
      examId: omrResult.result.examId,
      classId: exam.classId,
      userId,
      studentId: (() => {
        // Handle different studentId formats from different services
        const studentIdData = omrResult.result.studentId;
        let value: string | null = null;
        let isValid = false;
        
        if (studentIdData) {
          if (typeof studentIdData === 'string') {
            value = studentIdData;
            isValid = true;
          } else if (typeof studentIdData === 'object' && studentIdData !== null) {
            value = studentIdData.value || null;
            isValid = studentIdData.isValid === true && value !== null;
          }
        }
        
        return {
          value,
          isValid,
          digits: [],
          confidence: value ? 0.9 : 0,
        };
      })(),
      answers: (omrResult.result.answers || []).map((a: any) => ({
        questionNumber: a.questionNumber,
        selectedOption: a.selectedOption,
        confidence: a.confidence || 0.9,
        isValid: a.isValid !== false,
      })),
      grading: {
        totalQuestions: omrResult.result.grading?.totalQuestions || exam.questions.length,
        correctAnswers: omrResult.result.grading?.correct || omrResult.result.grading?.correctAnswers || 0,
        incorrectAnswers: omrResult.result.grading?.incorrect || omrResult.result.grading?.incorrectAnswers || 0,
        unanswered: omrResult.result.grading?.unanswered || 0,
        invalidAnswers: omrResult.result.grading?.invalidAnswers || 0,
        score: omrResult.result.grading?.score || 0,
        percentage: omrResult.result.grading?.percentage || 0,
        questionResults: [], // Can be populated later if needed
      },
      imageQuality: omrResult.result.imageQuality || 'good',
      alignmentSuccess: true,
      processingTimeMs: omrResult.result.processingTimeMs || 0,
      requiresReview: omrResult.result.requiresReview || false,
      reviewReasons: omrResult.result.reviewReasons || [],
      reviewStatus: omrResult.result.requiresReview ? 'pending' : 'approved',
      scannedAt: omrResult.result.scannedAt || new Date(),
    };

    const savedScan = new ScanResult(scanData);
    await savedScan.save();

    return NextResponse.json({
      status: "success",
      message: "Folha de respostas processada com sucesso",
      scan: {
        scanId: omrResult.result.scanId || omrResult.result.id,
        studentId: (() => {
          const studentIdData = omrResult.result.studentId;
          if (!studentIdData) return null;
          if (typeof studentIdData === 'string') return studentIdData;
          if (typeof studentIdData === 'object' && studentIdData !== null) {
            return studentIdData.value || null;
          }
          return null;
        })(),
        score: omrResult.result.grading?.score || 0,
        percentage: omrResult.result.grading?.percentage || 0,
        totalQuestions: omrResult.result.grading?.totalQuestions || exam.questions.length,
        correctAnswers: omrResult.result.grading?.correct || omrResult.result.grading?.correctAnswers || 0,
        incorrectAnswers: omrResult.result.grading?.incorrect || omrResult.result.grading?.incorrectAnswers || 0,
        unanswered: omrResult.result.grading?.unanswered || 0,
        imageQuality: omrResult.result.imageQuality,
        requiresReview: omrResult.result.requiresReview,
        reviewReasons: omrResult.result.reviewReasons,
        processingTimeMs: omrResult.result.processingTimeMs,
      },
      debug: omrResult.debug,
    });
  } catch (error) {
    console.error("[SCAN_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao processar digitalização" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scan
 * Get scan results for a specific exam
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
    const requiresReview = searchParams.get("requiresReview");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    const query: Record<string, any> = { userId };

    if (examId) {
      query.examId = examId;
    }

    if (requiresReview !== null) {
      query.requiresReview = requiresReview === "true";
    }

    // Get total count
    const total = await ScanResult.countDocuments(query);

    // Get paginated results
    const scans = await ScanResult.find(query)
      .sort({ scannedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get exam titles for display
    const examIds = [...new Set(scans.map((s: any) => s.examId))];
    const exams = await Exam.find({ _id: { $in: examIds } })
      .select("title")
      .lean();
    const examMap = new Map(exams.map((e: any) => [e._id.toString(), e.title]));

    // Format response
    const formattedScans = scans.map((scan: any) => ({
      scanId: scan.scanId,
      examId: scan.examId,
      examTitle: examMap.get(scan.examId) || "Prova não encontrada",
      studentId: scan.studentId?.value,
      score: scan.grading?.score || 0,
      percentage: scan.grading?.percentage || 0,
      totalQuestions: scan.grading?.totalQuestions || 0,
      scannedAt: scan.scannedAt,
      imageQuality: scan.imageQuality,
      requiresReview: scan.requiresReview,
      reviewReasons: scan.reviewReasons,
      reviewStatus: scan.reviewStatus,
    }));

    return NextResponse.json({
      status: "success",
      scans: formattedScans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[SCAN_LIST_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao buscar digitalizações" },
      { status: 500 }
    );
  }
}

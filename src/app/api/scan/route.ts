import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { ScanResult } from "@/models/ScanResult";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { resolveStudentsByCodeBatch } from "@/lib/student-resolve";
import { Student } from "@/models/Student";

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
// Optional: call Python OMR service directly (e.g. https://lucida-omr-production.up.railway.app)
const OMR_DIRECT_URL = process.env.NEXT_PUBLIC_OMR_DIRECT_URL;

/**
 * Map Python /process response to the shape expected by this route (lucida-api /omr/scan format).
 */
function mapDirectOmrToResult(
  direct: {
    success: boolean;
    studentId?: string | null;
    studentCodeValid?: boolean;
    studentCodeInvalidReason?: string | null;
    answers?: Record<number, string | null>;
    score?: number;
    percentage?: number;
    correct?: number;
    incorrect?: number;
    unanswered?: number;
    processingTimeMs?: number;
    requiresReview?: boolean;
    reviewReasons?: string[];
    multi_marked_questions?: string[];
    unmarked_questions?: string[];
    responses?: Record<string, string>;
  },
  examId: string,
  totalQuestions: number
): { success: boolean; result: any } {
  const answersMap = direct.answers ?? {};
  const answersArray = Object.entries(answersMap).map(([num, opt]) => ({
    questionNumber: parseInt(num, 10),
    selectedOption: opt ?? "",
    confidence: 0.9,
    isValid: opt != null && opt !== "",
  }));

  return {
    success: direct.success,
    result: {
      scanId: `scan_${Date.now()}`,
      examId,
      studentId: direct.studentId ?? null,
      studentCodeValid: direct.studentCodeValid !== false,
      studentCodeInvalidReason: direct.studentCodeInvalidReason ?? undefined,
      grading: {
        totalQuestions,
        correct: direct.correct ?? 0,
        correctAnswers: direct.correct ?? 0,
        incorrect: direct.incorrect ?? 0,
        incorrectAnswers: direct.incorrect ?? 0,
        unanswered: direct.unanswered ?? 0,
        score: direct.score ?? 0,
        percentage: direct.percentage ?? 0,
      },
      answers: answersArray,
      imageQuality: "good",
      processingTimeMs: direct.processingTimeMs ?? 0,
      multi_marked_questions: direct.multi_marked_questions ?? [],
      unmarked_questions: direct.unmarked_questions ?? [],
      reviewReasons: direct.reviewReasons ?? [],
      responses: direct.responses ?? {},
      scannedAt: new Date(),
    },
  };
}

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
    const totalQuestions = exam.questions.length;

    let omrResult: { success: boolean; result?: any; error?: string; debug?: any };

    if (OMR_DIRECT_URL) {
      // Call Python OMR service directly (e.g. Railway deployment)
      const directResponse = await fetch(`${OMR_DIRECT_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          examId,
          answerKey,
          totalQuestions,
        }),
      });

      if (!directResponse.ok) {
        const errorData = await directResponse.json().catch(() => ({}));
        console.error("[SCAN_OMR_DIRECT_ERROR]", errorData);
        return NextResponse.json(
          {
            status: "error",
            message: "Falha ao processar a folha de respostas (OMR direto)",
            details: errorData,
          },
          { status: 500 }
        );
      }

      const directData = await directResponse.json();
      omrResult = mapDirectOmrToResult(directData, examId, totalQuestions);
    } else {
      // Call OMR via lucida-api (default)
      const omrResponse = await fetch(`${OMR_API_URL}/omr/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          imageBase64,
          userId,
          answerKey,
          totalQuestions,
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

      omrResult = await omrResponse.json();
    }

    // Only consider questions within this exam's range (1..examTotal); OMR may return q1-q100 from template
    const examTotal = exam.questions.length;
    const inExamRange = (q: string) => {
      const m = String(q).match(/^q(\d+)$/i);
      if (!m) return false;
      const n = parseInt(m[1], 10);
      return n >= 1 && n <= examTotal;
    };
    const multiMarkedInRange = (omrResult.result?.multi_marked_questions ?? []).filter(inExamRange);
    const unmarkedInRange = (omrResult.result?.unmarked_questions ?? []).filter(inExamRange);

    // Derive requiresReview and reviewReasons only from in-range questions (OMR may return full template e.g. q95 for a 5-question exam)
    const qToNum = (q: string) => {
      const m = String(q).match(/^q?(\d+)$/i);
      return m ? m[1] : q;
    };
    const reviewReasonsFromRange: string[] = [];
    if (multiMarkedInRange.length > 0) {
      reviewReasonsFromRange.push(
        "Questões com mais de uma marca: " + multiMarkedInRange.map(qToNum).join(", ")
      );
    }
    if (unmarkedInRange.length > 0) {
      reviewReasonsFromRange.push(
        "Questões não marcadas: " + unmarkedInRange.map(qToNum).join(", ")
      );
    }
    const otherReasons = (omrResult.result?.reviewReasons ?? []).filter(
      (r: string) =>
        !/Questões com mais de uma marca/i.test(r) &&
        !/Questões não marcadas/i.test(r) &&
        !/não marcadas/i.test(r)
    );
    const reviewReasonsFiltered = [...reviewReasonsFromRange, ...otherReasons];
    const requiresReviewFiltered =
      reviewReasonsFiltered.length > 0;

    // Debug logging (filtered by exam range)
    console.log("[SCAN_OMR_RESULT]", {
      success: omrResult.success,
      hasResult: !!omrResult.result,
      examTotal,
      studentId: omrResult.result?.studentId?.value,
      grading: omrResult.result?.grading ? {
        score: omrResult.result.grading.score,
        percentage: omrResult.result.grading.percentage,
        totalQuestions: omrResult.result.grading.totalQuestions,
        unanswered: omrResult.result.grading.unanswered,
      } : null,
      imageQuality: omrResult.result?.imageQuality,
      requiresReview: requiresReviewFiltered,
      reviewReasons: reviewReasonsFiltered,
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
        const studentCodeValid = omrResult.result.studentCodeValid !== false;
        let value: string | null = null;
        
        if (studentIdData) {
          if (typeof studentIdData === 'string') {
            value = studentIdData;
          } else if (typeof studentIdData === 'object' && studentIdData !== null) {
            value = studentIdData.value || null;
          }
        }
        const isValid = studentCodeValid && value != null;
        
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
      requiresReview: requiresReviewFiltered,
      reviewReasons: reviewReasonsFiltered,
      multi_marked_questions: multiMarkedInRange,
      unmarked_questions: unmarkedInRange,
      responses: omrResult.result.responses && typeof omrResult.result.responses === 'object' ? omrResult.result.responses : null,
      reviewStatus: requiresReviewFiltered ? 'pending' : 'approved',
      scannedAt: omrResult.result.scannedAt || new Date(),
    };

    const studentCodeValue = (scanData as any).studentId?.value;
    if (studentCodeValue && /^[0-9]{7}$/.test(String(studentCodeValue))) {
      const student = await Student.findOne({
        userId,
        classId: exam.classId,
        code: String(studentCodeValue).trim(),
      })
        .select("_id email")
        .lean() as { _id: unknown; email?: string | null } | null;
      if (student && !Array.isArray(student)) {
        (scanData as any).studentEmail = student.email ?? null;
        (scanData as any).studentRef = student._id;
      }
    }

    const savedScan = new ScanResult(scanData);
    await savedScan.save();

    const studentDoc = (savedScan as any).studentRef
      ? (await Student.findById((savedScan as any).studentRef).select("name").lean() as { name: string } | null | undefined)
      : null;
    const resolvedName = studentDoc && !Array.isArray(studentDoc) ? studentDoc.name ?? null : null;

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
            return studentIdData.value ?? null;
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
        requiresReview: requiresReviewFiltered,
        reviewReasons: reviewReasonsFiltered,
        multiMarked: multiMarkedInRange.length,
        multi_marked_questions: multiMarkedInRange,
        unmarked_questions: unmarkedInRange,
        responses: omrResult.result.responses ?? {},
        processingTimeMs: omrResult.result.processingTimeMs,
        studentCodeValid: omrResult.result.studentCodeValid,
        studentCodeInvalidReason: omrResult.result.studentCodeInvalidReason ?? undefined,
        studentName: resolvedName ?? undefined,
        studentEmail: (savedScan as any).studentEmail ?? undefined,
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
    const examIds = Array.from(new Set(scans.map((s: any) => s.examId)));
    const exams = await Exam.find({ _id: { $in: examIds } })
      .select("title")
      .lean();
    const examMap = new Map(exams.map((e: any) => [e._id.toString(), e.title]));

    // Resolve student names from (classId, code)
    const pairs = scans
      .filter((s: any) => s.classId && s.studentId?.value)
      .map((s: any) => ({ classId: String(s.classId), code: String(s.studentId.value) }));
    const studentMap = await resolveStudentsByCodeBatch(userId, pairs);

    // Format response
    const formattedScans = scans.map((scan: any) => {
      const code = scan.studentId?.value;
      const key = code && scan.classId ? `${scan.classId}:${code}` : "";
      const resolved = key ? studentMap.get(key) : null;
      return {
        scanId: scan.scanId,
        examId: scan.examId,
        examTitle: examMap.get(scan.examId) || "Prova não encontrada",
        studentId: code,
        studentName: resolved?.name ?? null,
        studentEmail: resolved?.email ?? null,
        score: scan.grading?.score || 0,
        percentage: scan.grading?.percentage || 0,
        totalQuestions: scan.grading?.totalQuestions || 0,
        scannedAt: scan.scannedAt,
        imageQuality: scan.imageQuality,
        requiresReview: scan.requiresReview,
        reviewReasons: scan.reviewReasons,
        reviewStatus: scan.reviewStatus,
      };
    });

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

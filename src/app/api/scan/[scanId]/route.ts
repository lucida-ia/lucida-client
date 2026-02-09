import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { ScanResult } from "@/models/ScanResult";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { resolveStudentByCode } from "@/lib/student-resolve";

/**
 * GET /api/scan/[scanId]
 * Get detailed scan result by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ scanId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { scanId } = await context.params;

    const scan = await ScanResult.findOne({ scanId }).lean();

    if (!scan) {
      return NextResponse.json(
        { status: "error", message: "Digitalização não encontrada" },
        { status: 404 }
      );
    }

    // Verify user owns this scan
    if ((scan as any).userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Get exam details
    const exam = await Exam.findById((scan as any).examId)
      .select("title questions")
      .lean();

    const scanData = scan as any;
    const grading = scanData.grading || {};
    let questionResults = grading.questionResults;

    // Populate questionResults from answers + exam answer key when missing (e.g. scans saved with questionResults: [])
    if ((!questionResults || questionResults.length === 0) && exam?.questions?.length && scanData.answers?.length) {
      const answerKey = buildAnswerKey((exam as any).questions);
      const totalQuestions = (exam as any).questions.length;
      questionResults = [];
      for (let qNum = 1; qNum <= totalQuestions; qNum++) {
        const answer = scanData.answers.find((a: any) => a.questionNumber === qNum);
        const studentAnswer = answer?.selectedOption ?? null;
        const correctAnswer = answerKey[qNum] ?? null;
        const isCorrect = correctAnswer != null && studentAnswer === correctAnswer;
        questionResults.push({
          questionNumber: qNum,
          studentAnswer,
          correctAnswer,
          isCorrect,
          pointsEarned: isCorrect ? 1 : 0,
          pointsPossible: 1,
        });
      }
    }

    // Normalize and derive multi_marked_questions and unmarked_questions
    const normalizeToQIds = (raw: unknown): string[] => {
      if (Array.isArray(raw)) {
        return raw.map((q) => {
          if (typeof q === "number") return `q${q}`;
          const s = String(q).trim();
          if (/^\d+$/.test(s)) return `q${s}`;
          return s;
        }).filter((s) => /^q\d+$/i.test(s));
      }
      if (typeof raw === "string" && raw) {
        return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean).map((s) => (/^\d+$/.test(s) ? `q${s}` : s)).filter((s) => /^q\d+$/i.test(s));
      }
      return [];
    };

    let multi_marked_questions = normalizeToQIds(scanData.multi_marked_questions);
    let unmarked_questions = normalizeToQIds(scanData.unmarked_questions);
    const responses = scanData.responses && typeof scanData.responses === "object" ? scanData.responses : null;

    if (responses && (multi_marked_questions.length === 0 || unmarked_questions.length === 0)) {
      const questionKey = /^q(\d+)$/i;
      if (multi_marked_questions.length === 0) {
        multi_marked_questions = Object.keys(responses).filter(
          (k) => questionKey.test(k) && responses[k] != null && String(responses[k]).trim().length > 1
        );
      }
      if (unmarked_questions.length === 0) {
        unmarked_questions = Object.keys(responses).filter(
          (k) =>
            questionKey.test(k) &&
            (responses[k] == null || responses[k] === "" || String(responses[k]).trim() === "")
        );
      }
    }

    const multiSet = new Set(multi_marked_questions.map((q) => String(q).toLowerCase()));
    const unmarkedSet = new Set(unmarked_questions.map((q) => String(q).toLowerCase()));

    const questionResultsWithFlags = (questionResults || []).map((r: any) => {
      const qNum = r.questionNumber != null ? Number(r.questionNumber) : null;
      const qKey = qNum != null ? `q${qNum}` : null;
      const isMultiMarked = qKey != null && multiSet.has(qKey.toLowerCase());
      const isUnmarked = qKey != null && unmarkedSet.has(qKey.toLowerCase());
      return {
        ...r,
        questionNumber: qNum ?? r.questionNumber,
        isMultiMarked,
        isUnmarked,
      };
    });

    const resolvedStudent = await resolveStudentByCode(
      userId,
      scanData.classId,
      scanData.studentId?.value
    );

    return NextResponse.json({
      status: "success",
      scan: {
        ...scanData,
        examTitle: exam ? (exam as any).title : "Prova não encontrada",
        studentName: resolvedStudent?.name ?? null,
        studentEmail: resolvedStudent?.email ?? null,
        multi_marked_questions,
        unmarked_questions,
        grading: {
          ...grading,
          questionResults: questionResultsWithFlags,
        },
      },
    });
  } catch (error) {
    console.error("[SCAN_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao buscar digitalização" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scan/[scanId]
 * Update scan result (manual corrections)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ scanId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { scanId } = await context.params;
    const body = await request.json();
    const { corrections, studentIdCorrection, reviewStatus, notes } = body;

    const scan = await ScanResult.findOne({ scanId });

    if (!scan) {
      return NextResponse.json(
        { status: "error", message: "Digitalização não encontrada" },
        { status: 404 }
      );
    }

    // Verify user owns this scan
    if (scan.userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Apply corrections
    if (corrections && Array.isArray(corrections)) {
      for (const correction of corrections) {
        const { questionNumber, correctedAnswer } = correction;

        // Find the answer to correct
        const answerIndex = scan.answers.findIndex(
          (a: any) => a.questionNumber === questionNumber
        );

        if (answerIndex >= 0) {
          const originalAnswer = scan.answers[answerIndex].selectedOption;

          // Update the answer (blank = null)
          const blank =
            correctedAnswer == null ||
            correctedAnswer === "null" ||
            String(correctedAnswer).trim() === "";
          scan.answers[answerIndex].selectedOption = blank ? null : correctedAnswer;
          scan.answers[answerIndex].isValid = true;
          scan.answers[answerIndex].multipleSelections = null;

          // Record the correction
          scan.corrections.push({
            questionNumber,
            originalAnswer,
            correctedAnswer: correctedAnswer === "null" ? null : correctedAnswer,
            correctedAt: new Date(),
            correctedBy: userId,
          });
        }
      }

      // Recalculate grading after corrections
      if (scan.grading) {
        const exam = await Exam.findById(scan.examId).lean();
        if (exam) {
          const answerKey = buildAnswerKey((exam as any).questions);
          scan.grading = recalculateGrading(scan.answers, answerKey);
        }
      }
    }

    // Update student ID if corrected
    if (studentIdCorrection) {
      scan.studentId.value = studentIdCorrection;
      scan.studentId.isValid = true;
    }

    // Update review status
    if (reviewStatus) {
      scan.reviewStatus = reviewStatus;
      scan.reviewedBy = userId;
      scan.reviewedAt = new Date();
      scan.reviewNotes = notes || null;

      // If approved or corrected, no longer requires review
      if (reviewStatus === "approved" || reviewStatus === "corrected") {
        scan.requiresReview = false;
      }
    }

    await scan.save();

    return NextResponse.json({
      status: "success",
      message: "Digitalização atualizada com sucesso",
      scan: {
        scanId: scan.scanId,
        studentId: scan.studentId?.value,
        score: scan.grading?.score || 0,
        percentage: scan.grading?.percentage || 0,
        reviewStatus: scan.reviewStatus,
        requiresReview: scan.requiresReview,
      },
    });
  } catch (error) {
    console.error("[SCAN_UPDATE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao atualizar digitalização" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scan/[scanId]
 * Delete a scan result
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ scanId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { scanId } = await context.params;

    const scan = await ScanResult.findOne({ scanId });

    if (!scan) {
      return NextResponse.json(
        { status: "error", message: "Digitalização não encontrada" },
        { status: 404 }
      );
    }

    // Verify user owns this scan
    if (scan.userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    await ScanResult.deleteOne({ scanId });

    return NextResponse.json({
      status: "success",
      message: "Digitalização deletada com sucesso",
    });
  } catch (error) {
    console.error("[SCAN_DELETE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Erro ao deletar digitalização" },
      { status: 500 }
    );
  }
}

// Helper functions
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

function recalculateGrading(
  answers: any[],
  answerKey: Record<number, string>
): any {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let invalid = 0;

  const questionResults = answers.map((answer) => {
    const correctAnswer = answerKey[answer.questionNumber];
    let isCorrect = false;
    let pointsEarned = 0;

    if (!answer.isValid) {
      invalid++;
    } else if (answer.selectedOption === null) {
      unanswered++;
    } else if (answer.selectedOption === correctAnswer) {
      isCorrect = true;
      pointsEarned = 1;
      correct++;
    } else {
      incorrect++;
    }

    return {
      questionNumber: answer.questionNumber,
      studentAnswer: answer.selectedOption,
      correctAnswer,
      isCorrect,
      pointsEarned,
      pointsPossible: 1,
    };
  });

  const totalQuestions = questionResults.length;
  const score = correct;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 10000) / 100 : 0;

  return {
    totalQuestions,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    unanswered,
    invalidAnswers: invalid,
    score,
    percentage,
    questionResults,
  };
}

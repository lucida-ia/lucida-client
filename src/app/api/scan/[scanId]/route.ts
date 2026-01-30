import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { ScanResult } from "@/models/ScanResult";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json({
      status: "success",
      scan: {
        ...(scan as any),
        examTitle: exam ? (exam as any).title : "Prova não encontrada",
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

          // Update the answer
          scan.answers[answerIndex].selectedOption =
            correctedAnswer === "null" ? null : correctedAnswer;
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

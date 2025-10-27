import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;

    const exam = await Exam.findOne({
      _id: id,
    });

    if (!exam) {
      return NextResponse.json({
        status: "error",
        message: "Exam not found or is not public",
      });
    }

    const { answers, email } = await request.json();

    // Check for existing submission by this email for this exam
    const existingResult = await Result.findOne({
      examId: exam._id.toString(),
      email: email,
    });

    if (existingResult) {
      return NextResponse.json({
        status: "error",
        message: "Exam already submitted by this email",
        code: "DUPLICATE_SUBMISSION",
      }, { status: 409 }); // 409 Conflict
    }

    // Process answers and calculate score
    let score = 0;
    let needsGrading = false;
    const answerDetails = exam.questions.map((question: any, index: number) => {
      const answer = answers[index];
      const isShortAnswer = question.type === "shortAnswer";
      
      if (isShortAnswer) {
        needsGrading = true;
        return {
          questionIndex: index,
          answer: answer, // text response
          score: undefined, // will be graded later
          needsReview: true,
          feedback: undefined,
        };
      } else {
        // MC/TF - auto-grade
        const isCorrect = answer === question.correctAnswer;
        if (isCorrect) {
          score++;
        }
        return {
          questionIndex: index,
          answer: answer, // number
          score: isCorrect ? 1 : 0,
          needsReview: false,
          feedback: undefined,
        };
      }
    });

    // Calculate percentage based on total questions (including ungraded)
    const percentage = (score / exam.questions.length) * 100;

    const result = await Result.create({
      examId: exam._id.toString(),
      classId: exam.classId,
      email,
      score,
      examTitle: exam.title,
      examQuestionCount: exam.questions.length,
      percentage: percentage / 100,
      answers: answerDetails,
      needsGrading,
      createdAt: new Date(),
    });

    return NextResponse.json({
      status: "success",
      message: "Exam submitted successfully",
      score,
      percentage,
      totalQuestions: exam.questions.length,
      result,
    });
  } catch (error) {
    console.error("[EXAM_SUBMIT_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to submit exam",
    });
  }
}

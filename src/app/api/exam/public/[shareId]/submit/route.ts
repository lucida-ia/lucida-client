import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    await connectToDB();

    const exam = await Exam.findOne({
      shareId: params.shareId,
      isPublic: true,
    });

    if (!exam) {
      return NextResponse.json({
        status: "error",
        message: "Exam not found or is not public",
      });
    }

    const { answers } = await request.json();

    // Calculate score
    let score = 0;
    exam.questions.forEach((question: any, index: number) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });

    const percentage = (score / exam.questions.length) * 100;

    // Here you might want to save the submission to a database
    // For now, we'll just return the score

    return NextResponse.json({
      status: "success",
      message: "Exam submitted successfully",
      score,
      percentage,
      totalQuestions: exam.questions.length,
    });
  } catch (error) {
    console.error("[EXAM_SUBMIT_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to submit exam",
    });
  }
} 
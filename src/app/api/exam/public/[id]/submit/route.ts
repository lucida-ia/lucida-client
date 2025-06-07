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

    const result = Result.create({
      examId: exam._id.toString(),
      email,
      score,
      percentage: percentage / 100,
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

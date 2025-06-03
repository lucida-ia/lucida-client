import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    // Ensure all questions have the required structure
    const sanitizedQuestions = exam.questions.map((q: any) => ({
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      type: q.type || (Array.isArray(q.options) && q.options.length > 0 ? 'multipleChoice' : 'trueFalse')
    }));

    // Remove sensitive information and ensure proper structure
    const sanitizedExam = {
      title: exam.title || "",
      description: exam.description || "",
      duration: typeof exam.duration === 'number' ? exam.duration : 60,
      questions: sanitizedQuestions,
    };

    return NextResponse.json({
      status: "success",
      exam: sanitizedExam,
    });
  } catch (error) {
    console.error("[EXAM_PUBLIC_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get exam",
    });
  }
} 
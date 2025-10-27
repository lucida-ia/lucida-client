import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get("resultId");

    if (!resultId) {
      return NextResponse.json(
        { error: "Result ID is required" },
        { status: 400 }
      );
    }

    // Get the result
    const result = await Result.findById(resultId);
    if (!result) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    // Get the exam to verify ownership and get question details
    const exam = await Exam.findById(result.examId);
    if (!exam || exam.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - not your exam" },
        { status: 403 }
      );
    }

    // Combine result answers with exam questions
    const answersWithQuestions = result.answers.map((answerDetail: any) => {
      const question = exam.questions[answerDetail.questionIndex];
      return {
        questionIndex: answerDetail.questionIndex,
        question: question.question,
        context: question.context,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        rubric: question.rubric,
        studentAnswer: answerDetail.answer,
        score: answerDetail.score,
        needsReview: answerDetail.needsReview,
        feedback: answerDetail.feedback,
        gradedByAI: answerDetail.gradedByAI,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        result: {
          _id: result._id,
          email: result.email,
          score: result.score,
          percentage: result.percentage,
          examQuestionCount: result.examQuestionCount,
          needsGrading: result.needsGrading,
          createdAt: result.createdAt,
        },
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
        },
        answersWithQuestions,
      },
    });
  } catch (error) {
    console.error("Error fetching student answers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

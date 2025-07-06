import { connectToDB } from "@/lib/mongodb";
import { Exam as ExamModel } from "@/models/Exam";
import { User } from "@/models/User";
import { Exam, Question } from "@/types/exam";
import { Result } from "@/models/Result";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Plan limits
const PLAN_LIMITS = {
  free: 3,
  pro: 50,
  custom: -1, // unlimited
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "User not authenticated" },
        { status: 401 }
      );
    }

    await connectToDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    // Get user and check subscription/usage
    const user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has reached their limit
    const planLimit =
      PLAN_LIMITS[user.subscription.plan as keyof typeof PLAN_LIMITS];

    if (planLimit !== -1 && user.usage.examsThisMonth >= planLimit) {
      return NextResponse.json(
        {
          status: "error",
          message: `You have reached your monthly limit of ${planLimit} exams for the ${user.subscription.plan} plan. Please upgrade to create more exams.`,
          code: "USAGE_LIMIT_REACHED",
        },
        { status: 402 } // Payment required
      );
    }

    // Check if usage count needs to be reset (monthly reset)
    const now = new Date();
    const lastReset = new Date(user.usage.examsThisMonthResetDate);

    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      user.usage.examsThisMonth = 0;
      user.usage.examsThisMonthResetDate = now;
      await user.save();
    }

    const examPayload: Exam = await request.json();

    const questionsPayload: Question[] = examPayload.questions.map(
      (question: Question) => ({
        question: question.question,
        context: question.context,
        options: question.options,
        correctAnswer: question.correctAnswer,
      })
    );

    const newExam = new ExamModel({
      title: examPayload.config.title,
      description: examPayload.config.description,
      duration: examPayload.config.timeLimit,
      questionCount: examPayload.config.questionCount,
      difficulty: examPayload.config.difficulty,
      type: examPayload.config.questionTypes,
      questions: questionsPayload,
      classId: examPayload.config.class._id,
      userId: userId,
    });

    const savedExam = await newExam.save();

    // Increment usage count
    user.usage.examsThisMonth += 1;
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "Exam created successfully",
      exam: savedExam,
      usage: {
        examsThisMonth: user.usage.examsThisMonth,
        limit: planLimit === -1 ? "unlimited" : planLimit,
        plan: user.subscription.plan,
      },
    });
  } catch (error) {
    console.error("[EXAM_CREATE_ERROR]", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create exam",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const { examId } = await request.json();

    // Delete related results first (they reference the examId)
    await Result.deleteMany({ examId: examId });

    // Then delete the exam
    const deletedExam = await ExamModel.findByIdAndDelete(examId);

    return NextResponse.json({
      status: "success",
      message: "Prova deletada com sucesso",
      exam: deletedExam,
    });
  } catch (error) {
    console.error("[EXAM_DELETE_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Falha ao deletar prova",
    });
  }
}

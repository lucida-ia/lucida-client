import { connectToDB } from "@/lib/mongodb";
import { Exam as ExamModel } from "@/models/Exam";
import { User } from "@/models/User";
import { Exam, Question } from "@/types/exam";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

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

    // Get user (we still need to verify they exist, but won't check usage limits for copying)
    const user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    const examPayload: Exam = await request.json();

    const questionsPayload: Question[] = examPayload.questions.map(
      (question: Question) => ({
        question: question.question,
        context: question.context,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        subject: question.subject,
        explanation: question.explanation,
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

    // NOTE: We deliberately DO NOT increment usage count for copied exams
    // since this is just duplicating existing content, not creating new content

    return NextResponse.json({
      status: "success",
      message: "Exam copied successfully",
      exam: savedExam,
      usage: {
        examsThisPeriod: user.usage.examsThisPeriod, // Return current count without incrementing
        limit: -1, // Indicate that this operation doesn't count against limits
        plan: user.subscription.plan,
      },
    });
  } catch (error) {
    console.error("[EXAM_COPY_ERROR]", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to copy exam",
      },
      { status: 500 }
    );
  }
}

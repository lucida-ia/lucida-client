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
    await connectToDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const examPayload: Exam = await request.json();

    const questionsPayload: Question[] = examPayload.questions.map(
      (question: Question) => ({
        question: question.question,
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

    return NextResponse.json({
      status: "success",
      message: "Exam created successfully",
      exam: savedExam,
    });
  } catch (error) {
    console.error("[EXAM_CREATE_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to create exam",
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const { examId } = await request.json();

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

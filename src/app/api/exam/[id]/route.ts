import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { id } = await context.params;
    const exam = await Exam.findById(id);

    if (!exam) {
      return NextResponse.json(
        { status: "error", message: "Prova não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Exam fetched successfully",
      exam,
    });
  } catch (error) {
    console.error("[EXAM_FETCH_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { id } = await context.params;
    const examData = await request.json();

    // Get user to check admin status
    const user = await User.findOne({ id: userId });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Check if exam has short answer questions and user is admin
    const hasShortAnswer = examData.questions?.some(
      (q: any) => q.type === "shortAnswer"
    );
    const isAdmin = user.subscription.plan === "admin";

    if (hasShortAnswer && !isAdmin) {
      return NextResponse.json(
        {
          status: "error",
          message: "Short answer questions are only available for admin users.",
          code: "ADMIN_FEATURE",
        },
        { status: 403 }
      );
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      {
        title: examData.title,
        description: examData.description,
        duration: examData.duration,
        questions: examData.questions,
      },
      { new: true }
    );

    if (!updatedExam) {
      return NextResponse.json(
        { status: "error", message: "Prova não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Exam updated successfully",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("[EXAM_UPDATE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update exam" },
      { status: 500 }
    );
  }
}

import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    let user = await User.findOne({ id: userId });

    if (!user) {
      user = await User.create({ id: userId });
    }

    const exams = await Exam.find({ _id: { $in: user?.exams } });
    const totalExams = exams.length;
    const totalExamsCreatedThisMonth = exams.filter((exam) => {
      const examDate = new Date(exam.createdAt);
      return (
        examDate.getMonth() === new Date().getMonth() &&
        examDate.getFullYear() === new Date().getFullYear()
      );
    });

    const totalQuestions = exams.reduce(
      (acc, exam) => acc + exam.questions.length,
      0
    );

    return NextResponse.json({
      status: "success",
      message: "User fetched successfully",
      user: {
        ...user,
        totalExams,
        totalQuestions,
        totalExamsCreatedThisMonth,
      },
    });
  } catch (error) {
    console.error("[AUTH_CHECK_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

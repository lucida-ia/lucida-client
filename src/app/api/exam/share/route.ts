import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    await connectToDB();

    const { examId } = await request.json();

    const exam = await Exam.findById(examId);

    if (!exam) {
      return NextResponse.json({
        status: "error",
        message: "Exam not found",
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Share link generated successfully",
      id: exam._id,
    });
  } catch (error) {
    console.error("[EXAM_SHARE_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to generate share link",
    });
  }
}

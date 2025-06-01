import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { auth } from "@clerk/nextjs/server";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    console.log("[DEBUG] userId:", userId);

    await connectToDB();

    const user = await User.findOne({ id: userId });

    const exams = await Exam.find({ _id: { $in: user?.exams } });

    return NextResponse.json({
      status: "success",
      message: "Exams fetched successfully",
      exams: exams,
    });
  } catch (error) {
    console.error("[EXAM_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get exams",
    });
  }
}

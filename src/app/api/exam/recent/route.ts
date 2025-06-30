import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { auth } from "@clerk/nextjs/server";

import { NextRequest, NextResponse } from "next/server";
import { Class } from "@/models/Class";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    await connectToDB();

    const user = await User.findOne({ id: userId });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const exams = await Exam.find({
      userId: user?.id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    return NextResponse.json({
      status: "success",
      message: "Exams fetched successfully",
      data: exams,
    });
  } catch (error) {
    console.error("[EXAM_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get exams",
    });
  }
}

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

    const classes = await Class.find({ userId: user?.id });

    const exams = await Exam.find({
      classId: { $in: classes.map((c) => c.id) },
    });

    const payload = classes.map((c) => ({
      name: c.name,
      id: c._id,
      exams: exams.filter((e) => e.classId === c.id),
    }));

    return NextResponse.json({
      status: "success",
      message: "Exams fetched successfully",
      data: payload,
    });
  } catch (error) {
    console.error("[EXAM_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get exams",
    });
  }
}

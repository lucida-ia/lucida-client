import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";

import { NextRequest, NextResponse } from "next/server";
import { Class } from "@/models/Class";

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

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");

    let requester = await User.findOne({ id: userId });
    if (!requester) {
      requester = new User({ id: userId });
      requester.subscription.plan = "trial";
      requester.subscription.status = "active";
      requester.usage.examsThisPeriod = 0;
      requester.usage.examsThisPeriodResetDate = new Date();
      const { username, email } = await getClerkIdentity(userId);
      if (username) requester.username = username;
      if (email) requester.email = email;
      await requester.save();
    }
    const isAdmin = requester.subscription?.plan === "admin";
    const targetUserId = isAdmin && asUser ? asUser : requester.id;

    const user = await User.findOne({ id: targetUserId });

    const classes = await Class.find({ userId: user?.id });

    const classIdStrings = classes.map((c) => String(c._id));
    const exams = await Exam.find({
      classId: { $in: classIdStrings },
    });

    const payload = classes.map((c) => {
      const cid = String(c._id);
      return {
        name: c.name,
        id: c._id,
        exams: exams.filter((e) => String(e.classId) === cid),
      };
    });

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

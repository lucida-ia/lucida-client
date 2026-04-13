import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { User } from "@/models/User";
import { getClerkIdentity } from "@/lib/clerk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const targetUserId = isAdmin && asUser ? asUser : userId;

    const professorExams = await Exam.find({ userId: targetUserId });
    const examIds = professorExams.map((e) => e._id.toString());

    const count = await Result.countDocuments({
      examId: { $in: examIds },
      needsGrading: true,
    });

    return NextResponse.json({
      status: "success",
      count,
    });
  } catch (error) {
    console.error("[PENDING_COUNT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to count pending results" },
      { status: 500 }
    );
  }
}

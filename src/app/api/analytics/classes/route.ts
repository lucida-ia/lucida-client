import { connectToDB } from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { getClerkIdentity } from "@/lib/clerk";
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

    const classes = await Class.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .lean();

    if (classes.length === 0) {
      return NextResponse.json({ status: "success", data: [] });
    }

    const classIds = classes.map((c) => String(c._id));

    const [examCounts, studentCounts, resultStats] = await Promise.all([
      Exam.aggregate<{ _id: string; n: number }>([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: "$classId", n: { $sum: 1 } } },
      ]),
      Student.aggregate<{ _id: string; n: number }>([
        { $match: { userId: targetUserId } },
        { $group: { _id: { $toString: "$classId" }, n: { $sum: 1 } } },
      ]),
      Result.aggregate<{
        _id: string;
        submissionCount: number;
        avgPercentage: number;
        lastActivityAt: Date;
      }>([
        { $match: { classId: { $in: classIds } } },
        {
          $group: {
            _id: "$classId",
            submissionCount: { $sum: 1 },
            avgPercentage: { $avg: "$percentage" },
            lastActivityAt: { $max: "$createdAt" },
          },
        },
      ]),
    ]);

    const examCountByClass = new Map(examCounts.map((r) => [r._id, r.n]));
    const studentCountByClass = new Map(
      studentCounts.map((r) => [r._id, r.n])
    );
    const resultStatsByClass = new Map(resultStats.map((r) => [r._id, r]));

    const data = classes.map((c) => {
      const id = String(c._id);
      const stats = resultStatsByClass.get(id);
      return {
        id,
        name: c.name,
        description: c.description || "",
        examCount: examCountByClass.get(id) ?? 0,
        studentCount: studentCountByClass.get(id) ?? 0,
        submissionCount: stats?.submissionCount ?? 0,
        avgPercentage: stats ? Number((stats.avgPercentage * 100).toFixed(2)) : 0,
        lastActivityAt: stats?.lastActivityAt ?? null,
      };
    });

    return NextResponse.json({ status: "success", data });
  } catch (error) {
    console.error("[ANALYTICS_CLASSES_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar turmas para análise" },
      { status: 500 }
    );
  }
}

import { connectToDB } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { User } from "@/models/User";
import { Class } from "@/models/Class";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";
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

    // Get requester's user and decide target
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

    // Get target user's classes
    const user = await User.findOne({ id: targetUserId });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const classes = await Class.find({ userId: user.id }).lean();
    const classIds = classes.map((c) => String(c._id));

    const exams = await Exam.find({
      classId: { $in: classIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const examIds = exams.map((e) => String(e._id));
    const submissionCounts = await Result.aggregate<{ _id: string; n: number }>([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: "$examId", n: { $sum: 1 } } },
    ]);
    const countByExamId = new Map(submissionCounts.map((r) => [r._id, r.n]));
    const classNameById = new Map(classes.map((c) => [String(c._id), c.name]));

    const examData = exams.map((exam) => {
      const submissionCount = countByExamId.get(String(exam._id)) ?? 0;
      return {
        id: exam._id,
        title: exam.title,
        className: classNameById.get(String(exam.classId)) || "Turma Desconhecida",
        classId: exam.classId,
        questionCount: exam.questionCount,
        submissionCount,
        createdAt: exam.createdAt,
        hasAnalytics: submissionCount > 0,
      };
    });

    return NextResponse.json({
      status: "success",
      data: examData,
    });
  } catch (error) {
    console.error("[ANALYTICS_EXAMS_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar provas para análise" },
      { status: 500 }
    );
  }
}

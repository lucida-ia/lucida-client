import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Student } from "@/models/Student";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";
import { resolveStudentsByCodeBatch } from "@/lib/student-resolve";
import mongoose from "mongoose";
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

    const user = await User.findOne({ id: targetUserId });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const classes = await Class.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    const classIdStrings = classes.map((c) => String(c._id));
    const classObjectIds = classes.map(
      (c) => new mongoose.Types.ObjectId(String(c._id))
    );

    const [exams, results, studentCountAgg] = await Promise.all([
      Exam.find({ classId: { $in: classIdStrings } })
        .sort({ createdAt: -1 })
        .lean(),
      Result.find({ classId: { $in: classIdStrings } }).lean(),
      Student.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
        { $match: { userId: user.id, classId: { $in: classObjectIds } } },
        { $group: { _id: "$classId", n: { $sum: 1 } } },
      ]),
    ]);

    const studentCountByClassId = new Map(
      studentCountAgg.map((s) => [String(s._id), s.n])
    );

    const needStudentName = results.filter(
      (r: any) =>
        !r.studentName &&
        r.email &&
        /^\d+@student\.local$/.test(String(r.email))
    );
    const pairs = needStudentName.map((r: any) => ({
      classId: String(r.classId),
      code: String(r.email).replace("@student.local", ""),
    }));
    const studentNameMap = await resolveStudentsByCodeBatch(
      targetUserId,
      pairs
    );

    const examsByClassId = new Map<string, any[]>();
    for (const exam of exams) {
      const key = String(exam.classId);
      const bucket = examsByClassId.get(key);
      if (bucket) bucket.push(exam);
      else examsByClassId.set(key, [exam]);
    }

    const resultsByExamId = new Map<string, any[]>();
    for (const r of results) {
      const plain: any = { ...r };
      if (
        !plain.studentName &&
        plain.email &&
        /^\d+@student\.local$/.test(String(plain.email))
      ) {
        const code = String(plain.email).replace("@student.local", "");
        const key = `${plain.classId}:${code}`;
        const resolved = studentNameMap.get(key);
        if (resolved) plain.studentName = resolved.name;
      }
      const examKey = String(plain.examId);
      const bucket = resultsByExamId.get(examKey);
      if (bucket) bucket.push(plain);
      else resultsByExamId.set(examKey, [plain]);
    }

    let totalExams = 0;
    let totalResults = 0;
    let totalQuestions = 0;

    const classesData = classes.map((c: any) => {
      const cidStr = String(c._id);
      const classExams = (examsByClassId.get(cidStr) ?? []).map((exam: any) => {
        const examResults = resultsByExamId.get(String(exam._id)) ?? [];
        return {
          ...exam,
          results: examResults,
        };
      });

      const classTotalResults = classExams.reduce(
        (acc, e) => acc + e.results.length,
        0
      );
      const classTotalQuestions = classExams.reduce(
        (acc, e) => acc + (Array.isArray(e.questions) ? e.questions.length : 0),
        0
      );

      totalExams += classExams.length;
      totalResults += classTotalResults;
      totalQuestions += classTotalQuestions;

      return {
        id: c._id,
        name: c.name,
        description: c.description || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        studentCount: studentCountByClassId.get(cidStr) ?? 0,
        exams: classExams,
        totalResults: classTotalResults,
        totalQuestions: classTotalQuestions,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        classes: classesData,
        summary: {
          classes: classes.length,
          exams: totalExams,
          results: totalResults,
          questions: totalQuestions,
        },
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          integrationId: user.integrationId,
          integratPartnerToken: user.integratPartnerToken,
          subscription: user.subscription,
          usage: user.usage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[OVERVIEW_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao carregar overview" },
      { status: 500 }
    );
  }
}

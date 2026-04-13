import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { Student } from "@/models/Student";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

/** Matches Class schema; explicit type fixes broken Mongoose lean() inference on this model. */
type ClassLeanDoc = {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ExamLastLean = {
  createdAt: Date;
  title: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return NextResponse.json(
        { status: "error", message: "ID de turma inválido" },
        { status: 400 }
      );
    }

    await connectToDB();

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

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");
    const isAdmin = requester.subscription?.plan === "admin";
    const targetUserId = isAdmin && asUser ? asUser : requester.id;

    const classDoc = await Class.findOne({
      _id: rawId,
      userId: targetUserId,
    }).lean<ClassLeanDoc | null>();

    if (!classDoc) {
      return NextResponse.json(
        { status: "error", message: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const idStr = rawId;
    const [examCount, studentCount, lastExam] = await Promise.all([
      Exam.countDocuments({ classId: idStr }),
      Student.countDocuments({
        classId: new mongoose.Types.ObjectId(idStr),
        userId: targetUserId,
      }),
      Exam.findOne({ classId: idStr })
        .sort({ createdAt: -1 })
        .select("createdAt title")
        .lean<ExamLastLean | null>(),
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        id: idStr,
        name: classDoc.name,
        description: classDoc.description ?? "",
        createdAt: classDoc.createdAt,
        updatedAt: classDoc.updatedAt,
        examCount,
        studentCount,
        lastExamAt: lastExam?.createdAt ?? null,
        lastExamTitle: lastExam?.title ?? null,
      },
    });
  } catch (error) {
    console.error("[CLASS_GET_ONE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao carregar turma" },
      { status: 500 }
    );
  }
}

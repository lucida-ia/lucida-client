import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { Student } from "@/models/Student";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
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

    const classDoc = await Class.findOne({
      _id: rawId,
      userId: requester.id,
    }).lean();

    if (!classDoc) {
      return NextResponse.json(
        { status: "error", message: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const idStr = String(classDoc._id);
    const [examCount, studentCount, lastExam] = await Promise.all([
      Exam.countDocuments({ classId: idStr }),
      Student.countDocuments({
        classId: new mongoose.Types.ObjectId(idStr),
        userId: requester.id,
      }),
      Exam.findOne({ classId: idStr }).sort({ createdAt: -1 }).select("createdAt title").lean(),
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

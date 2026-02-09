import { connectToDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Class } from "@/models/Class";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

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
    const code = url.searchParams.get("code")?.trim();
    const classId = url.searchParams.get("classId")?.trim();

    if (!code || !/^[0-9]{7}$/.test(code)) {
      return NextResponse.json(
        { status: "error", message: "Código inválido (deve ter 7 dígitos)" },
        { status: 400 }
      );
    }
    if (!classId) {
      return NextResponse.json(
        { status: "error", message: "classId é obrigatório" },
        { status: 400 }
      );
    }

    const classDoc = await Class.findOne({
      _id: classId,
      userId,
    });
    if (!classDoc) {
      return NextResponse.json(
        { status: "error", message: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const student = await Student.findOne({
      code,
      classId: new mongoose.Types.ObjectId(classId),
      userId,
    }).lean();

    if (!student) {
      return NextResponse.json({
        status: "success",
        data: { student: null },
      });
    }

    return NextResponse.json({
      status: "success",
      data: {
        student: {
          _id: student._id,
          code: student.code,
          name: student.name,
          email: student.email,
          classId: student.classId,
        },
      },
    });
  } catch (error) {
    console.error("[STUDENT_BY_CODE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar aluno por código" },
      { status: 500 }
    );
  }
}

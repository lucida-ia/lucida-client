import { connectToDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Class } from "@/models/Class";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateUniqueStudentCode } from "@/lib/student-code";
import mongoose from "mongoose";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
    const classId = url.searchParams.get("classId");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10))
    );

    const filter: { userId: string; classId?: mongoose.Types.ObjectId } = {
      userId,
    };
    if (classId) {
      const classExists = await Class.findOne({ _id: classId, userId });
      if (!classExists) {
        return NextResponse.json(
          { status: "error", message: "Turma não encontrada" },
          { status: 404 }
        );
      }
      filter.classId = new mongoose.Types.ObjectId(classId);
    }

    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    const classIds = [...new Set(students.map((s) => s.classId?.toString()).filter(Boolean))];
    const classes = await Class.find({ _id: { $in: classIds } }).lean();
    const classMap = Object.fromEntries(classes.map((c) => [c._id.toString(), c]));

    const payload = students.map((s) => ({
      _id: s._id,
      code: s.code,
      name: s.name,
      classId: s.classId,
      className: classMap[s.classId?.toString()]?.name ?? null,
      email: s.email ?? null,
      matricula: s.matricula ?? null,
      metadata: s.metadata ?? {},
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      status: "success",
      data: {
        students: payload,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[STUDENT_LIST_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao listar alunos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    const body = await request.json();
    const { name, classId, email, matricula, metadata } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nome é obrigatório" },
        { status: 400 }
      );
    }
    if (!classId) {
      return NextResponse.json(
        { status: "error", message: "Turma é obrigatória" },
        { status: 400 }
      );
    }

    const matriculaTrimmed = matricula != null && String(matricula).trim() ? String(matricula).trim() : null;
    if (!matriculaTrimmed) {
      return NextResponse.json(
        { status: "error", message: "Matrícula é obrigatória" },
        { status: 400 }
      );
    }

    const classDoc = await Class.findOne({ _id: classId, userId });
    if (!classDoc) {
      return NextResponse.json(
        { status: "error", message: "Turma não encontrada" },
        { status: 404 }
      );
    }

    const existingMatricula = await Student.findOne({ userId, matricula: matriculaTrimmed });
    if (existingMatricula) {
      return NextResponse.json(
        { status: "error", message: "Já existe um aluno com esta matrícula" },
        { status: 400 }
      );
    }

    const code = await generateUniqueStudentCode(new mongoose.Types.ObjectId(classId));

    const student = await Student.create({
      code,
      name: name.trim(),
      classId: new mongoose.Types.ObjectId(classId),
      userId,
      email: email?.trim() || null,
      matricula: matriculaTrimmed,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });

    return NextResponse.json({
      status: "success",
      message: "Aluno cadastrado com sucesso",
      data: {
        _id: student._id,
        code: student.code,
        name: student.name,
        classId: student.classId,
        className: classDoc.name,
        email: student.email,
        matricula: student.matricula,
        metadata: student.metadata,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    });
  } catch (error) {
    console.error("[STUDENT_CREATE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao cadastrar aluno" },
      { status: 500 }
    );
  }
}

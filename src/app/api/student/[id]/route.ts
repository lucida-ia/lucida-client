import { connectToDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Class } from "@/models/Class";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

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

    await connectToDB();
    const { id } = await context.params;

    const student = await Student.findById(id).lean();
    const studentDoc = student && !Array.isArray(student) ? student : null;
    if (!studentDoc || studentDoc.userId !== userId) {
      return NextResponse.json(
        { status: "error", message: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const classRaw = await Class.findById(studentDoc.classId).lean();
    const classDoc = classRaw && !Array.isArray(classRaw) ? classRaw : null;
    return NextResponse.json({
      status: "success",
      data: {
        ...studentDoc,
        className: classDoc?.name ?? null,
      },
    });
  } catch (error) {
    console.error("[STUDENT_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao buscar aluno" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    await connectToDB();
    const { id } = await context.params;
    const body = await request.json();
    const { name, email, matricula, metadata } = body;

    const existing = await Student.findOne({ _id: id, userId });
    if (!existing) {
      return NextResponse.json(
        { status: "error", message: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const matriculaTrimmed =
      matricula !== undefined
        ? (matricula != null && String(matricula).trim() ? String(matricula).trim() : null)
        : undefined;
    if (matriculaTrimmed !== undefined) {
      if (!matriculaTrimmed) {
        return NextResponse.json(
          { status: "error", message: "Matrícula é obrigatória" },
          { status: 400 }
        );
      }
      const duplicate = await Student.findOne({
        userId,
        matricula: matriculaTrimmed,
        _id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          { status: "error", message: "Já existe um aluno com esta matrícula" },
          { status: 400 }
        );
      }
    }

    const update: { name?: string; email?: string | null; matricula?: string | null; metadata?: Record<string, unknown>; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (name !== undefined) update.name = name?.trim() ?? existing.name;
    if (email !== undefined) update.email = email?.trim() || null;
    if (matriculaTrimmed !== undefined) update.matricula = matriculaTrimmed;
    if (metadata !== undefined && typeof metadata === "object") update.metadata = metadata;

    const updated = await Student.findByIdAndUpdate(id, update, { new: true }).lean();
    const updatedDoc = updated && !Array.isArray(updated) ? updated : null;
    const classRaw = updatedDoc
      ? await Class.findById(updatedDoc.classId).lean()
      : null;
    const classDoc = classRaw && !Array.isArray(classRaw) ? classRaw : null;

    return NextResponse.json({
      status: "success",
      message: "Aluno atualizado com sucesso",
      data: {
        ...updatedDoc,
        className: classDoc?.name ?? null,
      },
    });
  } catch (error) {
    console.error("[STUDENT_UPDATE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao atualizar aluno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await connectToDB();
    const { id } = await context.params;

    const existing = await Student.findOne({ _id: id, userId });
    if (!existing) {
      return NextResponse.json(
        { status: "error", message: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    await Student.findByIdAndDelete(id);

    return NextResponse.json({
      status: "success",
      message: "Aluno excluído com sucesso",
    });
  } catch (error) {
    console.error("[STUDENT_DELETE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao excluir aluno" },
      { status: 500 }
    );
  }
}

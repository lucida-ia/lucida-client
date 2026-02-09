import { connectToDB } from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Class } from "@/models/Class";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateUniqueStudentCode } from "@/lib/student-code";
import { parseCSV, mapStudentHeaders } from "@/lib/csv-parse";
import mongoose from "mongoose";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 1000;

interface RowError {
  row: number;
  message: string;
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { status: "error", message: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { status: "error", message: "Arquivo muito grande (máximo 2 MB)" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      return NextResponse.json(
        { status: "error", message: "CSV vazio ou inválido" },
        { status: 400 }
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { status: "error", message: `Máximo de ${MAX_ROWS} linhas por importação` },
        { status: 400 }
      );
    }

    const headers = rows[0];
    let columnMap: ReturnType<typeof mapStudentHeaders>;
    try {
      columnMap = mapStudentHeaders(headers);
    } catch (err) {
      return NextResponse.json(
        { status: "error", message: (err as Error).message },
        { status: 400 }
      );
    }
    if (columnMap.extra["matricula"] === undefined) {
      return NextResponse.json(
        { status: "error", message: "Coluna obrigatória: matricula" },
        { status: 400 }
      );
    }

    const userClasses = await Class.find({ userId }).lean();
    const classByName: Record<string, { _id: mongoose.Types.ObjectId; name: string }> = {};
    for (const c of userClasses) {
      const key = c.name.trim().toLowerCase();
      if (!classByName[key]) classByName[key] = { _id: c._id, name: c.name };
    }

    const dataRows = rows.slice(1);
    const errors: RowError[] = [];
    const skipped: RowError[] = [];
    const created: Array<{
      _id: mongoose.Types.ObjectId;
      code: string;
      name: string;
      classId: mongoose.Types.ObjectId;
      className: string;
      email: string | null;
      matricula: string | null;
    }> = [];
    const seenInFile = new Set<string>();
    const seenMatriculaInFile = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2;
      const row = dataRows[i];
      const name = (row[columnMap.nameIndex] ?? "").trim();
      const turmaRaw = (row[columnMap.turmaIndex] ?? "").trim();
      const email = columnMap.extra["email"] !== undefined
        ? (row[columnMap.extra["email"]] ?? "").trim() || null
        : null;
      const matriculaRaw = (columnMap.extra["matricula"] !== undefined && row[columnMap.extra["matricula"]])
        ? String(row[columnMap.extra["matricula"]]).trim()
        : "";

      if (!name) {
        errors.push({ row: rowIndex, message: "Nome vazio" });
        continue;
      }
      if (!turmaRaw) {
        errors.push({ row: rowIndex, message: "Turma vazia" });
        continue;
      }
      if (!matriculaRaw) {
        errors.push({ row: rowIndex, message: "Matrícula obrigatória" });
        continue;
      }

      const turmaKey = turmaRaw.toLowerCase();
      let classDoc = classByName[turmaKey];
      if (!classDoc) {
        const newClass = await Class.create({
          name: turmaRaw,
          description: "",
          userId,
        });
        classDoc = { _id: newClass._id, name: newClass.name };
        classByName[turmaKey] = classDoc;
      }

      const duplicateKey = `${classDoc._id}:${name.toLowerCase()}`;
      if (seenInFile.has(duplicateKey)) {
        errors.push({ row: rowIndex, message: "Duplicata (mesmo nome e turma no arquivo)" });
        continue;
      }
      seenInFile.add(duplicateKey);

      const classId = new mongoose.Types.ObjectId(classDoc._id.toString());
      const existingStudent = await Student.findOne({
        classId,
        name,
        userId,
      });
      if (existingStudent) {
        skipped.push({ row: rowIndex, message: "Aluno já cadastrado nesta turma" });
        continue;
      }

      const matricula = matriculaRaw;
      if (seenMatriculaInFile.has(matricula)) {
        errors.push({ row: rowIndex, message: "Matrícula duplicada no arquivo" });
        continue;
      }
      const existingMatricula = await Student.findOne({ userId, matricula });
      if (existingMatricula) {
        errors.push({ row: rowIndex, message: "Matrícula já cadastrada para outro aluno" });
        continue;
      }
      seenMatriculaInFile.add(matricula);

      const metadata: Record<string, string> = {};
      if (columnMap.extra["sala"] !== undefined && row[columnMap.extra["sala"]])
        metadata.sala = String(row[columnMap.extra["sala"]]).trim();
      Object.entries(columnMap.extra).forEach(([key, idx]) => {
        if (!["email", "matricula", "sala"].includes(key) && row[idx])
          metadata[key] = String(row[idx]).trim();
      });

      try {
        const code = await generateUniqueStudentCode(classId);
        const student = await Student.create({
          code,
          name,
          classId,
          userId,
          email: email || null,
          matricula,
          metadata,
        });
        created.push({
          _id: student._id,
          code: student.code,
          name: student.name,
          classId: student.classId,
          className: classDoc.name,
          email: student.email,
          matricula: student.matricula,
        });
      } catch (err) {
        errors.push({
          row: rowIndex,
          message: (err as Error).message || "Erro ao criar aluno",
        });
      }
    }

    return NextResponse.json({
      status: "success",
      data: {
        created: created.length,
        failed: errors.length,
        skipped: skipped.length,
        errors,
        skippedDetails: skipped,
        students: created,
      },
    });
  } catch (error) {
    console.error("[STUDENT_IMPORT_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Falha ao importar CSV" },
      { status: 500 }
    );
  }
}

import { Student } from "@/models/Student";
import mongoose from "mongoose";

export interface ResolvedStudent {
  name: string;
  email: string | null;
}

/**
 * Resolve (userId, classId, code) to student name and email.
 * Returns null if not found or code is invalid.
 */
export async function resolveStudentByCode(
  userId: string,
  classId: string,
  code: string | null | undefined
): Promise<ResolvedStudent | null> {
  if (!code || !/^[0-9]{7}$/.test(String(code).trim())) return null;
  const student = await Student.findOne({
    userId,
    classId: new mongoose.Types.ObjectId(classId),
    code: String(code).trim(),
  })
    .select("name email")
    .lean();
  if (!student) return null;
  return {
    name: student.name,
    email: student.email ?? null,
  };
}

/**
 * Batch resolve multiple (classId, code) pairs for a user.
 * Returns a Map keyed by `${classId}:${code}` -> { name, email }.
 */
export async function resolveStudentsByCodeBatch(
  userId: string,
  pairs: { classId: string; code: string }[]
): Promise<Map<string, ResolvedStudent>> {
  const valid = pairs.filter(
    (p) => p.classId && p.code && /^[0-9]{7}$/.test(String(p.code).trim())
  );
  if (valid.length === 0) return new Map();

  const $or = valid.map((p) => ({
    classId: new mongoose.Types.ObjectId(p.classId),
    code: String(p.code).trim(),
  }));

  const students = await Student.find({ userId, $or })
    .select("classId code name email")
    .lean();

  const map = new Map<string, ResolvedStudent>();
  for (const s of students) {
    const key = `${s.classId}:${s.code}`;
    map.set(key, { name: s.name, email: s.email ?? null });
  }
  return map;
}

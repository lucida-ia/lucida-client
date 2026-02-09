import { Student } from "@/models/Student";
import mongoose from "mongoose";

const MAX_RETRIES = 20;

/**
 * Generate a random 7-digit string (leading zeros preserved).
 */
function randomCode(): string {
  const n = Math.floor(Math.random() * 10_000_000);
  return n.toString().padStart(7, "0");
}

/**
 * Generate a unique 7-digit code for the given class.
 * Retries up to MAX_RETRIES on (classId, code) collision.
 */
export async function generateUniqueStudentCode(
  classId: mongoose.Types.ObjectId
): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = randomCode();
    const exists = await Student.findOne({ classId, code });
    if (!exists) return code;
  }
  throw new Error(
    "Não foi possível gerar um código único. Tente novamente."
  );
}

export function isValidStudentCode(code: string): boolean {
  return /^[0-9]{7}$/.test(code);
}

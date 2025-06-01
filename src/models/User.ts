import mongoose from "mongoose";
import { ExamSchema } from "./Exam";

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  exams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }],
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

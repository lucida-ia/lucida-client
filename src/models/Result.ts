import mongoose from "mongoose";

const ResultScheema = new mongoose.Schema({
  examId: {
    type: String,
    required: true,
  },
  classId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  examTitle: {
    type: String,
    required: true,
  },
  examQuestionCount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Result =
  mongoose.models.Result || mongoose.model("Result", ResultScheema);

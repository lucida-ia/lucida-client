import mongoose from "mongoose";

const AnswerDetailSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be number (for MC/TF) or string (for shortAnswer)
  },
  score: {
    type: Number, // null/undefined for ungraded shortAnswer
  },
  needsReview: {
    type: Boolean,
    default: false,
  },
  feedback: {
    type: String,
  },
});

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
  answers: {
    type: [AnswerDetailSchema],
    default: [],
  },
  needsGrading: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Result =
  mongoose.models.Result || mongoose.model("Result", ResultScheema);

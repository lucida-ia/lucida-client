import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  context: {
    type: String,
  },
  options: {
    type: [String],
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['fácil', 'médio', 'difícil'],
    default: 'médio',
  },
  subject: {
    type: String,
    default: '',
  },
  explanation: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['multipleChoice', 'trueFalse', 'shortAnswer'],
    default: 'multipleChoice',
  },
  rubric: {
    type: String,
    default: '',
  },
  maxValue: {
    type: Number,
    default: 1,
  },
});

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  classId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  questionCount: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  type: {
    type: Object,
    required: true,
  },
  questions: [QuestionSchema],
  shareId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Exam = mongoose.models.Exam || mongoose.model("Exam", ExamSchema);
export { ExamSchema };

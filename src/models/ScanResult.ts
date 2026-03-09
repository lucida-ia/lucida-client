import mongoose from "mongoose";

// Schema for individual answer detection
const DetectedAnswerSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
  },
  selectedOption: {
    type: String,
    enum: ["A", "B", "C", "D", "E", null],
    default: null,
  },
  multipleSelections: {
    type: [String],
    default: null,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
});

// Schema for question grading result
const QuestionResultSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
  },
  studentAnswer: {
    type: String,
    enum: ["A", "B", "C", "D", "E", null],
    default: null,
  },
  correctAnswer: {
    type: String,
    enum: ["A", "B", "C", "D", "E"],
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  pointsPossible: {
    type: Number,
    default: 1,
  },
});

// Schema for student ID detection
const DetectedStudentIdSchema = new mongoose.Schema({
  value: {
    type: String,
    default: null,
  },
  digits: [
    {
      position: Number,
      value: Number,
      confidence: Number,
    },
  ],
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  isValid: {
    type: Boolean,
    default: false,
  },
});

// Schema for grading results
const GradingResultSchema = new mongoose.Schema({
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  incorrectAnswers: {
    type: Number,
    required: true,
  },
  unanswered: {
    type: Number,
    default: 0,
  },
  invalidAnswers: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  questionResults: [QuestionResultSchema],
});

// Main ScanResult schema
const ScanResultSchema = new mongoose.Schema({
  // Unique scan identifier
  scanId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Reference to the exam
  examId: {
    type: String,
    required: true,
    index: true,
  },

  // Reference to the class
  classId: {
    type: String,
    required: true,
    index: true,
  },

  // Teacher who scanned
  userId: {
    type: String,
    required: true,
    index: true,
  },

  // Detected student ID
  studentId: DetectedStudentIdSchema,

  // Student email (if matched to a student record)
  studentEmail: {
    type: String,
    default: null,
  },

  // Reference to Student document when matched by (classId, code)
  studentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    default: null,
  },

  // All detected answers
  answers: [DetectedAnswerSchema],

  // Grading results
  grading: GradingResultSchema,

  // Image quality assessment
  imageQuality: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    required: true,
  },

  // Whether alignment succeeded
  alignmentSuccess: {
    type: Boolean,
    default: false,
  },

  // Processing time in milliseconds
  processingTimeMs: {
    type: Number,
    required: true,
  },

  // Whether manual review is required
  requiresReview: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Reasons for requiring review
  reviewReasons: {
    type: [String],
    default: [],
  },

  // Question IDs with more than one option marked (e.g. ["q2", "q3"])
  multi_marked_questions: {
    type: [String],
    default: [],
  },

  // Question IDs with no option marked (e.g. ["q10", "q15"])
  unmarked_questions: {
    type: [String],
    default: [],
  },

  // Raw OMR response per question (e.g. { q1: "B", q2: "BC", StudentCode: "123" }) — used to derive multi_marked_questions / unmarked_questions when missing
  responses: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  // Review status
  reviewStatus: {
    type: String,
    enum: ["pending", "approved", "corrected", "rejected"],
    default: "pending",
  },

  // Review metadata
  reviewedBy: {
    type: String,
    default: null,
  },

  reviewedAt: {
    type: Date,
    default: null,
  },

  reviewNotes: {
    type: String,
    default: null,
  },

  // Manual corrections applied
  corrections: [
    {
      questionNumber: Number,
      originalAnswer: String,
      correctedAnswer: String,
      correctedAt: Date,
      correctedBy: String,
    },
  ],

  // Original image URL (if stored)
  imageUrl: {
    type: String,
    default: null,
  },

  // Timestamps
  scannedAt: {
    type: Date,
    default: Date.now,
    index: true,
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

// Update timestamp on save
ScanResultSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for common queries
ScanResultSchema.index({ examId: 1, studentId: 1 });
ScanResultSchema.index({ classId: 1, scannedAt: -1 });
ScanResultSchema.index({ userId: 1, scannedAt: -1 });
ScanResultSchema.index({ requiresReview: 1, reviewStatus: 1 });

export const ScanResult =
  mongoose.models.ScanResult ||
  mongoose.model("ScanResult", ScanResultSchema);

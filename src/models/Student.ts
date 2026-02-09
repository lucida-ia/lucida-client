import mongoose from "mongoose";

const CODE_REGEX = /^[0-9]{7}$/;

const StudentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => CODE_REGEX.test(v),
        message: "code must be exactly 7 digits",
      },
    },
    name: {
      type: String,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: null,
    },
    matricula: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Unique per class: same code can exist in another class
StudentSchema.index({ classId: 1, code: 1 }, { unique: true });
// Matrícula must be unique per user when set (sparse allows existing nulls)
StudentSchema.index({ userId: 1, matricula: 1 }, { unique: true, sparse: true });
StudentSchema.index({ userId: 1 });
StudentSchema.index({ classId: 1 });

export const Student =
  mongoose.models.Student || mongoose.model("Student", StudentSchema);
export { StudentSchema, CODE_REGEX };

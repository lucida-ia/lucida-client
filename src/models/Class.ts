import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  userId: {
    type: String,
    required: true,
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

ClassSchema.index({ userId: 1, createdAt: -1 });

export const Class =
  mongoose.models.Class || mongoose.model("Class", ClassSchema);
export { ClassSchema };

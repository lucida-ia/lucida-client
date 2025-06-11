import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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

export const Class =
  mongoose.models.Class || mongoose.model("Class", ClassSchema);
export { ClassSchema };

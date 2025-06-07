import mongoose from "mongoose";

const ResultScheema = new mongoose.Schema({
  examId: {
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
});

export const Result =
  mongoose.models.Result || mongoose.model("Result", ResultScheema);

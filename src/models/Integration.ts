import mongoose from "mongoose";
import { randomUUID } from "crypto";

const IntegrationSchema = new mongoose.Schema({
  integrationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
  integrationName: {
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

// Update the updatedAt field on save
IntegrationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Integration =
  mongoose.models.Integration ||
  mongoose.model("Integration", IntegrationSchema);
export { IntegrationSchema };


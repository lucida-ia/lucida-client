import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  // Subscription information
  subscription: {
    plan: {
      type: String,
      enum: ["free", "pro", "custom"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "incomplete"],
      default: "active",
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    trialEnd: {
      type: Date,
      default: null,
    },
  },
  // Usage tracking
  usage: {
    examsThisMonth: {
      type: Number,
      default: 0,
    },
    examsThisMonthResetDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  // Metadata
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
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

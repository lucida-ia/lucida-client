import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  // Optional integration link
  integrationId: {
    type: String,
    default: null,
  },
  // Integrat things
  integratPartnerToken: {
    type: String,
    default: null,
  },
  // Subscription information
  subscription: {
    plan: {
      type: String,
      enum: ["trial", "monthly", "semi-annual", "annual", "admin", "custom"],
      default: "trial",
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
    examsThisPeriod: {
      type: Number,
      default: 0,
    },
    examsThisPeriodResetDate: {
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

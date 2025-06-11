import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

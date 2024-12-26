import mongoose from "mongoose";

// Define the user state schema
const userStateSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  step: { type: String, default: null, required: false },
  photoUrls: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 * 4 } },
});
// Create the user state model
export const UserStateModel = mongoose.model("user_states", userStateSchema);
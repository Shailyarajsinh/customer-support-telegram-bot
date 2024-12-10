import mongoose from "mongoose";

// Define the User State Schema
const userStateSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  step: { type: String, default: null },
  photoUrls: { type: [String], default: [] },
});

// Create the User State Model
export const UserStateModel = mongoose.model("UserState", userStateSchema);
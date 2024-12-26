import mongoose from "mongoose";

const profileVerificationSchema = new mongoose.Schema(
  {
    userId: { type: Number , required: true},
    profileImage: { type: String, default: "No Image" },
    tonTransactionImage: { type: String, default: "No Image" },
    tonTransactionHash: String,
    userFeedback: { type: String, default: "No Feedback" },
    createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 * 24 * 7 } },
  },
  { timestamps: true }
);

export const ImageModel = mongoose.model("profile_verification", profileVerificationSchema);

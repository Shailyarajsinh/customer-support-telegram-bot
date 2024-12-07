import mongoose from "mongoose";

const ProfileVarification = new mongoose.Schema({
  UserId: String,
  Profile_Image: { type: String, default: "No Image" },
  TonTransactionImage: { type: String, default: "No Image" },
  TonTransactionHash: String,
  UserFeedback: { type: String, default: "No Feedback" },
},
  { timestamps: true });

export const ImageModel = mongoose.model("Support_bot", ProfileVarification);

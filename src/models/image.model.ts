import mongoose from "mongoose";

const ProfileVarification = new mongoose.Schema({
  UserId: String,
  UserName: String,
  Profile_Image: String,
  TonTransactionImage: String,
  TonTransactionHash: String,
  UserFeedback: { type: String, default: "No Feedback" },
});

export const ImageModel = mongoose.model("Support_Chat_Bot", ProfileVarification);

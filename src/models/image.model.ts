import mongoose from "mongoose";

const ProfileVarification = new mongoose.Schema({
  UserId:String,
  UserName: String,
  Profile_Image: String,
  TonTransactionImage: String,
  TonTransactionHash: String,
});

export const ImageModel = mongoose.model("Image", ProfileVarification);

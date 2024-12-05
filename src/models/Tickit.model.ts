// raise a ticket model

import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  UserId: String,
  TickitId: String,
  IssueDetails: { type: String, default: "No Details" },
  Issue_Image: { type: String, default: "No Image" },
});


export const TicketModel = mongoose.model("ticket_schema", TicketSchema);
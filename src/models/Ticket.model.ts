// Raise a ticket model

import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  ticketId: {type: Number, required: true},
  issueDetails: { type: String, default: "No details" },
  issueImage: { type: String, default: "No image" },
  // createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 * 24 * 7 } },
},
{ timestamps: true,});

export const TicketModel = mongoose.model("raise_ticket", ticketSchema);

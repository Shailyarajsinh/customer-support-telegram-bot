import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true }, // User's Telegram ID
  lastInteraction: { type: Date, default: Date.now },     // Last message timestamp
  ignoreUntil: { type: Date, default: null },             // Time until the user is ignored
});

export const RateLimitModel = mongoose.model('RateLimit', RateLimitSchema);

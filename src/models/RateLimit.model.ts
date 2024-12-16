import mongoose, { Schema } from 'mongoose';

const RateLimitSchema = new Schema({
  userId: { type: String, required: true },
  lastInteraction: { type: Date, default: new Date() },
  ignoreUntil: { type: Date, default: null },
  blockedUntil: { type: Date, default: null, required: false },
  commandCount: { type: Number, default: 0 },
  lastNotification: { type: Date, default: null, required: false }, // Track the last notification time
});

export const RateLimitModel = mongoose.model('RateLimit', RateLimitSchema);


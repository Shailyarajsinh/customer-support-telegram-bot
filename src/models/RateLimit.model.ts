import mongoose, { Schema } from 'mongoose';

const rateLimitSchema = new Schema(
  {
    userId: { type: Number, required: true },
    lastInteraction: { type: Date, default: new Date() },
    ignoreUntil: { type: Date, default: null },
    blockedUntil: { type: Date, default: null, required: false },
    commandCount: { type: Number, default: 0 },
    lastNotification: { type: Date, default: null, required: false }, // Track the last notification time
    createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 } }, // Auto-delete after 1 hour
  },
);

export const RateLimitModel = mongoose.model('rate_limits', rateLimitSchema);

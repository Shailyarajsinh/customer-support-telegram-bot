import { RateLimitModel } from './models/RateLimit.model'; // Adjust the path to your model file


export const isRateLimited = async (userId: string, cooldown: number) => {
  const now = new Date();

  // Fetch user's rate limit record
  let record = await RateLimitModel.findOne({ userId });

  if (record) {
    // Check if the user is in the ignore period
    if (record.ignoreUntil && now < record.ignoreUntil) {
      return true; // User is still in cooldown
    }

    // Check if the user is rate-limited
    const timeSinceLastInteraction = now.getTime() - new Date(record.lastInteraction).getTime();
    if (timeSinceLastInteraction < cooldown) {
      // Update ignoreUntil and save
      record.ignoreUntil = new Date(now.getTime() + cooldown);
      await record.save();
      return true;
    }
  } else {
    // Create a new record if the user doesn't exist
    record = new RateLimitModel({ userId, lastInteraction: now });
    await record.save();
  }

  // Update last interaction timestamp
  record.lastInteraction = now;
  const defaultCooldown = new Date(now.getTime() + cooldown);
  record.ignoreUntil = defaultCooldown;
  await record.save();

  return false; // User is not rate-limited
};
